'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Web Speech API の型定義
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

export interface SpeechRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: string | null;
  isInitializing: boolean;
  audioLevel: number;
  hasPermission: boolean;
}

export interface SpeechRecognitionConfig {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  autoRestart?: boolean;
  timeoutMs?: number;
  noiseThreshold?: number;
}

export interface SpeechRecognitionActions {
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  requestPermission: () => Promise<boolean>;
  updateConfig: (config: Partial<SpeechRecognitionConfig>) => void;
}

export type UseSpeechRecognitionReturn = SpeechRecognitionState & SpeechRecognitionActions;

/**
 * 高度な音声認識機能を提供するカスタムフック
 * Web Speech API を基盤として、小学生向けの使いやすさを重視
 */
export function useSpeechRecognition(
  initialConfig: SpeechRecognitionConfig = {}
): UseSpeechRecognitionReturn {
  const defaultConfig: SpeechRecognitionConfig = {
    lang: 'ja-JP',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1,
    autoRestart: false,
    timeoutMs: 30000, // 30秒
    noiseThreshold: 0.1,
    ...initialConfig,
  };

  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    confidence: 0,
    error: null,
    isInitializing: false,
    audioLevel: 0,
    hasPermission: false,
  });

  const [config, setConfig] = useState<SpeechRecognitionConfig>(defaultConfig);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // 音声レベルの監視
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1);
    
    setState(prev => ({ ...prev, audioLevel: normalizedLevel }));
    
    if (state.isListening) {
      animationRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  }, [state.isListening]);

  // 音声監視の初期化
  const initializeAudioMonitoring = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('MediaDevices API not supported');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      
      monitorAudioLevel();
    } catch (error) {
      console.error('Failed to initialize audio monitoring:', error);
    }
  }, [monitorAudioLevel]);

  // Web Speech API サポート確認
  useEffect(() => {
    const isSupported = !!(
      typeof window !== 'undefined' && 
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
    
    setState(prev => ({ ...prev, isSupported }));
  }, []);

  // 権限確認
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // ストリームを即座に停止（権限確認のみ）
      stream.getTracks().forEach(track => track.stop());
      
      setState(prev => ({ ...prev, hasPermission: true }));
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setState(prev => ({ 
        ...prev, 
        hasPermission: false,
        error: 'マイクの使用許可が必要です。ブラウザの設定を確認してください。'
      }));
      return false;
    }
  }, []);

  // 音声認識の初期化
  const initializeRecognition = useCallback(() => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'お使いのブラウザは音声認識に対応していません。Chrome、Safari、Edgeをお試しください。'
      }));
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // 基本設定
    recognition.lang = config.lang || 'ja-JP';
    recognition.continuous = config.continuous || false;
    recognition.interimResults = config.interimResults || false;
    recognition.maxAlternatives = config.maxAlternatives || 1;

    // イベントハンドラー
    recognition.onstart = () => {
      console.log('Speech recognition started');
      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null,
        isInitializing: false 
      }));
      initializeAudioMonitoring();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0;

        if (result.isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        transcript: prev.transcript + finalTranscript,
        interimTranscript,
        confidence: maxConfidence,
        error: null
      }));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      
      let errorMessage = '';
      switch (event.error) {
        case 'no-speech':
          errorMessage = '音声が検出されませんでした。もう一度お話しください。';
          break;
        case 'audio-capture':
          errorMessage = 'マイクにアクセスできません。デバイスの設定を確認してください。';
          break;
        case 'not-allowed':
          errorMessage = 'マイクの使用が許可されていません。ブラウザの設定を確認してください。';
          break;
        case 'network':
          errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
          break;
        case 'service-not-allowed':
          errorMessage = '音声認識サービスが利用できません。';
          break;
        default:
          errorMessage = `音声認識エラー: ${event.error}`;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isListening: false,
        isInitializing: false
      }));
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setState(prev => ({ 
        ...prev, 
        isListening: false,
        isInitializing: false,
        audioLevel: 0
      }));

      // 音声監視の停止
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      // ストリームの停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // AudioContextの停止
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // 自動再開
      if (config.autoRestart && !state.error) {
        setTimeout(() => {
          startListening();
        }, 100);
      }
    };

    return recognition;
  }, [state.isSupported, config, state.error, initializeAudioMonitoring]);

  // 音声認識開始
  const startListening = useCallback(async () => {
    try {
      setState(prev => ({ 
        ...prev, 
        isInitializing: true, 
        error: null 
      }));

      // 権限確認
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState(prev => ({ ...prev, isInitializing: false }));
        return;
      }

      // 既存の認識を停止
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      // 新しい認識インスタンスを作成
      const recognition = initializeRecognition();
      if (!recognition) {
        setState(prev => ({ ...prev, isInitializing: false }));
        return;
      }

      recognitionRef.current = recognition;

      // タイムアウト設定
      if (config.timeoutMs) {
        timeoutRef.current = setTimeout(() => {
          stopListening();
        }, config.timeoutMs);
      }

      // 認識開始
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setState(prev => ({
        ...prev,
        error: '音声認識の開始に失敗しました。しばらく待ってから再度お試しください。',
        isInitializing: false
      }));
    }
  }, [requestPermission, initializeRecognition, config.timeoutMs]);

  // 音声認識停止
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isListening: false,
      isInitializing: false,
      audioLevel: 0
    }));
  }, []);

  // 転写テキストリセット
  const resetTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      confidence: 0,
      error: null
    }));
  }, []);

  // 設定更新
  const updateConfig = useCallback((newConfig: Partial<SpeechRecognitionConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    // State
    isListening: state.isListening,
    isSupported: state.isSupported,
    transcript: state.transcript,
    interimTranscript: state.interimTranscript,
    confidence: state.confidence,
    error: state.error,
    isInitializing: state.isInitializing,
    audioLevel: state.audioLevel,
    hasPermission: state.hasPermission,

    // Actions
    startListening,
    stopListening,
    resetTranscript,
    requestPermission,
    updateConfig,
  };
}

/**
 * 音声認識関連のユーティリティ関数
 */
export const SpeechRecognitionUtils = {
  /**
   * ブラウザサポート確認
   */
  checkSupport: (): { isSupported: boolean; browserInfo: string } => {
    if (typeof window === 'undefined') {
      return { isSupported: false, browserInfo: 'Server-side rendering' };
    }

    const hasWebSpeechAPI = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const userAgent = navigator.userAgent;
    
    let browserInfo = 'Unknown';
    if (userAgent.includes('Chrome')) {
      browserInfo = 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserInfo = 'Safari';
    } else if (userAgent.includes('Edge')) {
      browserInfo = 'Edge';
    } else if (userAgent.includes('Firefox')) {
      browserInfo = 'Firefox';
    }

    return {
      isSupported: hasWebSpeechAPI,
      browserInfo
    };
  },

  /**
   * 音声認識の精度を向上させるための前処理
   */
  preprocessTranscript: (text: string): string => {
    return text
      .trim()
      .replace(/\s+/g, ' ') // 複数スペースを1つに
      .replace(/[。、！？]/g, (match) => match + ' ') // 句読点後にスペース追加
      .trim();
  },

  /**
   * 日本語特有の音声認識エラーの修正
   */
  correctJapaneseRecognition: (text: string): string => {
    const corrections: Record<string, string> = {
      // よくある音声認識エラーの修正
      'わたくし': 'わたし',
      'あの': 'あの',
      'えーと': 'えーと',
      'そのー': 'その',
      // 数字の修正
      '１': '1',
      '２': '2',
      '３': '3',
      '４': '4',
      '５': '5',
      '６': '6',
      '７': '7',
      '８': '8',
      '９': '9',
      '０': '0',
    };

    let correctedText = text;
    for (const [error, correction] of Object.entries(corrections)) {
      correctedText = correctedText.replace(new RegExp(error, 'g'), correction);
    }

    return correctedText;
  },

  /**
   * 音声品質の評価
   */
  evaluateAudioQuality: (audioLevel: number, confidence: number): {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    suggestions: string[];
  } => {
    const suggestions: string[] = [];
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

    if (audioLevel < 0.1) {
      quality = 'poor';
      suggestions.push('マイクに近づいてお話しください');
      suggestions.push('周囲の騒音を減らしてください');
    } else if (audioLevel < 0.3) {
      quality = 'fair';
      suggestions.push('少し大きな声でお話しください');
    } else if (audioLevel > 0.8) {
      quality = 'fair';
      suggestions.push('マイクから少し離れてお話しください');
    }

    if (confidence < 0.5) {
      quality = quality === 'excellent' ? 'good' : 'poor';
      suggestions.push('はっきりとお話しください');
      suggestions.push('ゆっくりとお話しください');
    } else if (confidence < 0.7) {
      quality = quality === 'excellent' ? 'good' : quality;
      suggestions.push('もう少しはっきりとお話しください');
    }

    return { quality, suggestions };
  },

  /**
   * 最適な設定の提案
   */
  suggestOptimalConfig: (
    context: 'interview' | 'practice' | 'quick-answer'
  ): SpeechRecognitionConfig => {
    const baseConfig: SpeechRecognitionConfig = {
      lang: 'ja-JP',
      maxAlternatives: 1,
    };

    switch (context) {
      case 'interview':
        return {
          ...baseConfig,
          continuous: true,
          interimResults: true,
          timeoutMs: 180000, // 3分
          autoRestart: false,
        };
      
      case 'practice':
        return {
          ...baseConfig,
          continuous: true,
          interimResults: true,
          timeoutMs: 60000, // 1分
          autoRestart: true,
        };
      
      case 'quick-answer':
        return {
          ...baseConfig,
          continuous: false,
          interimResults: false,
          timeoutMs: 15000, // 15秒
          autoRestart: false,
        };
      
      default:
        return baseConfig;
    }
  }
};