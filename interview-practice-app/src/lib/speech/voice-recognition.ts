/**
 * 音声認識システム - Web Speech API + Google Cloud Speech統合
 * 小学生向け最適化と高精度音声認識
 */

export interface VoiceRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
  noiseSuppressionEnabled: boolean;
  echoCancellationEnabled: boolean;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
  processingTime: number;
  method: 'webspeech' | 'google-cloud' | 'fallback';
}

export interface VoiceRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: VoiceRecognitionError) => void;
  onEnd?: () => void;
  onVolumeChange?: (volume: number) => void;
}

export interface VoiceRecognitionError {
  code: string;
  message: string;
  details?: any;
  recovery?: 'retry' | 'fallback' | 'manual';
}

class VoiceRecognitionService {
  private recognition: any = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private volumeCallback: ((volume: number) => void) | null = null;
  private isRecording = false;
  private config: VoiceRecognitionConfig;
  private callbacks: VoiceRecognitionCallbacks = {};

  constructor() {
    this.config = {
      language: 'ja-JP',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.7,
      noiseSuppressionEnabled: true,
      echoCancellationEnabled: true,
    };
  }

  /**
   * 音声認識の利用可能性チェック
   */
  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 
           ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  /**
   * インスタンスメソッドとしての音声認識の利用可能性チェック
   */
  public isSupported(): boolean {
    return VoiceRecognitionService.isSupported();
  }

  /**
   * マイクアクセス許可確認
   */
  public async checkMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state === 'granted';
    } catch (error) {
      console.warn('Microphone permission check failed:', error);
      return false;
    }
  }

  /**
   * 音声認識設定
   */
  public configure(config: Partial<VoiceRecognitionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * コールバック設定
   */
  public setCallbacks(callbacks: VoiceRecognitionCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * 音声認識開始
   */
  public async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      // マイクアクセス要求
      await this.requestMicrophoneAccess();
      
      // 音声認識セットアップ
      await this.setupSpeechRecognition();
      
      // 音量監視セットアップ
      await this.setupVolumeMonitoring();

      this.isRecording = true;
      this.callbacks.onStart?.();

      console.log('Voice recognition started');
    } catch (error) {
      const voiceError: VoiceRecognitionError = {
        code: 'START_FAILED',
        message: error instanceof Error ? error.message : 'Failed to start voice recognition',
        details: error,
        recovery: 'retry'
      };
      this.callbacks.onError?.(voiceError);
      throw error;
    }
  }

  /**
   * 音声認識停止
   */
  public async stopRecording(): Promise<string> {
    if (!this.isRecording) {
      return '';
    }

    return new Promise((resolve) => {
      const cleanup = () => {
        this.isRecording = false;
        this.cleanup();
        this.callbacks.onEnd?.();
      };

      if (this.recognition) {
        this.recognition.addEventListener('end', () => {
          cleanup();
          resolve(''); // 最終結果は onResult で処理される
        }, { once: true });
        
        this.recognition.stop();
      } else {
        cleanup();
        resolve('');
      }
    });
  }

  /**
   * 録音状態確認
   */
  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * マイクアクセス要求
   */
  private async requestMicrophoneAccess(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.config.echoCancellationEnabled,
          noiseSuppression: this.config.noiseSuppressionEnabled,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
        }
      });
    } catch (error) {
      throw new Error(`Microphone access denied: ${error}`);
    }
  }

  /**
   * Web Speech API セットアップ
   */
  private async setupSpeechRecognition(): Promise<void> {
    if (!VoiceRecognitionService.isSupported()) {
      throw new Error('Speech recognition not supported');
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // 基本設定
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    // イベントハンドラ設定
    this.recognition.onresult = (event: any) => {
      const startTime = performance.now();
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const isFinal = result.isFinal;

        // 代替候補の収集
        const alternatives: Array<{ transcript: string; confidence: number }> = [];
        for (let j = 0; j < Math.min(result.length, this.config.maxAlternatives); j++) {
          alternatives.push({
            transcript: result[j].transcript,
            confidence: result[j].confidence,
          });
        }

        const voiceResult: VoiceRecognitionResult = {
          transcript,
          confidence,
          isFinal,
          alternatives,
          processingTime: performance.now() - startTime,
          method: 'webspeech',
        };

        // 信頼度フィルタリング
        if (confidence >= this.config.confidenceThreshold) {
          this.callbacks.onResult?.(voiceResult);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      const errorMap: Record<string, { message: string; recovery: 'retry' | 'fallback' | 'manual' }> = {
        'no-speech': { message: '音声が検出されませんでした', recovery: 'retry' },
        'audio-capture': { message: 'マイクにアクセスできません', recovery: 'manual' },
        'not-allowed': { message: 'マイクの使用が許可されていません', recovery: 'manual' },
        'network': { message: 'ネットワークエラーが発生しました', recovery: 'fallback' },
        'language-not-supported': { message: '言語がサポートされていません', recovery: 'fallback' },
      };

      const errorInfo = errorMap[event.error] || { 
        message: `音声認識エラー: ${event.error}`, 
        recovery: 'retry' as const
      };

      const voiceError: VoiceRecognitionError = {
        code: event.error,
        message: errorInfo.message,
        details: event,
        recovery: errorInfo.recovery,
      };

      this.callbacks.onError?.(voiceError);
    };

    this.recognition.onend = () => {
      // 継続録音モードの場合は自動再開
      if (this.isRecording && this.config.continuous) {
        setTimeout(() => {
          if (this.isRecording && this.recognition) {
            try {
              this.recognition.start();
            } catch (error) {
              console.warn('Failed to restart recognition:', error);
            }
          }
        }, 100);
      }
    };

    // 音声認識開始
    this.recognition.start();
  }

  /**
   * 音量監視セットアップ
   */
  private async setupVolumeMonitoring(): Promise<void> {
    if (!this.mediaStream) return;

    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);

      this.startVolumeMonitoring();
    } catch (error) {
      console.warn('Volume monitoring setup failed:', error);
    }
  }

  /**
   * 音量監視開始
   */
  private startVolumeMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      if (!this.isRecording || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      
      // RMS計算
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const volume = Math.min(1, rms / 128); // 0-1範囲に正規化

      this.callbacks.onVolumeChange?.(volume);
      
      requestAnimationFrame(updateVolume);
    };

    updateVolume();
  }

  /**
   * Google Cloud Speech API フォールバック（将来実装）
   */
  private async fallbackToGoogleCloudSpeech(audioBlob: Blob): Promise<VoiceRecognitionResult> {
    // TODO: Google Cloud Speech API統合
    // 現在はプレースホルダー
    return {
      transcript: '',
      confidence: 0,
      isFinal: true,
      alternatives: [],
      processingTime: 0,
      method: 'google-cloud',
    };
  }

  /**
   * リソースクリーンアップ
   */
  private cleanup(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
  }

  /**
   * デストラクタ
   */
  public destroy(): void {
    this.isRecording = false;
    this.cleanup();
    this.callbacks = {};
  }
}

// シングルトンインスタンス
export const voiceRecognitionService = new VoiceRecognitionService();

