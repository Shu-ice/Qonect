/**
 * 音声録音コンポーネント - 小学生向け最適化UI
 * 大型ボタン、視覚的フィードバック、リアルタイム波形表示
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  voiceRecognitionService, 
  VoiceRecognitionResult, 
  VoiceRecognitionError 
} from '@/lib/speech/voice-recognition';

interface VoiceRecorderProps {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: VoiceRecognitionError) => void;
  disabled?: boolean;
  maxDuration?: number; // 秒
  showWaveform?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

interface WaveformData {
  volume: number;
  timestamp: number;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  onStart,
  onStop,
  onError,
  disabled = false,
  maxDuration = 300, // 5分
  showWaveform = true,
  size = 'lg',
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<WaveformData[]>([]);
  const [error, setError] = useState<VoiceRecognitionError | null>(null);

  const durationTimer = useRef<NodeJS.Timeout | null>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);

  // サイズマッピング
  const sizeMap = {
    sm: { button: 'w-16 h-16', text: 'text-sm' },
    md: { button: 'w-20 h-20', text: 'text-base' },
    lg: { button: 'w-24 h-24', text: 'text-lg' },
    xl: { button: 'w-32 h-32', text: 'text-xl' },
  };

  const currentSize = sizeMap[size];

  // 初期化
  useEffect(() => {
    const checkSupport = async () => {
      const supported = voiceRecognitionService.isSupported();
      setIsSupported(supported);

      if (supported) {
        const permission = await voiceRecognitionService.checkMicrophonePermission();
        setHasPermission(permission);
      }
    };

    checkSupport();

    // コールバック設定
    voiceRecognitionService.setCallbacks({
      onStart: handleRecordingStart,
      onResult: handleRecognitionResult,
      onError: handleRecognitionError,
      onEnd: handleRecordingEnd,
      onVolumeChange: handleVolumeChange,
    });

    return () => {
      voiceRecognitionService.destroy();
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
      }
    };
  }, []);

  // 波形描画
  useEffect(() => {
    if (showWaveform && waveformRef.current && waveformData.length > 0) {
      drawWaveform();
    }
  }, [waveformData, showWaveform]);

  const handleRecordingStart = useCallback(() => {
    setIsRecording(true);
    setError(null);
    setDuration(0);
    setWaveformData([]);
    
    // 持続時間タイマー開始
    durationTimer.current = setInterval(() => {
      setDuration(prev => {
        const newDuration = prev + 1;
        if (newDuration >= maxDuration) {
          stopRecording();
        }
        return newDuration;
      });
    }, 1000);

    onStart?.();
  }, [maxDuration, onStart]);

  const handleRecognitionResult = useCallback((result: VoiceRecognitionResult) => {
    setCurrentTranscript(result.transcript);
    onTranscript?.(result.transcript, result.isFinal);
  }, [onTranscript]);

  const handleRecognitionError = useCallback((error: VoiceRecognitionError) => {
    setError(error);
    setIsRecording(false);
    
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }

    onError?.(error);
  }, [onError]);

  const handleRecordingEnd = useCallback(() => {
    setIsRecording(false);
    setVolume(0);
    
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }

    onStop?.();
  }, [onStop]);

  // トランスクリプトクリア用の公開メソッド
  const clearTranscript = useCallback(() => {
    setCurrentTranscript('');
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    
    if (showWaveform) {
      const timestamp = Date.now();
      setWaveformData(prev => {
        const newData = [...prev, { volume: newVolume, timestamp }];
        // 最大100データポイントを保持
        return newData.slice(-100);
      });
    }
  }, [showWaveform]);

  const startRecording = async () => {
    try {
      await voiceRecognitionService.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await voiceRecognitionService.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const drawWaveform = () => {
    const canvas = waveformRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    if (waveformData.length === 0) return;

    // 波形描画
    ctx.strokeStyle = isRecording ? '#10b981' : '#6b7280';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const barWidth = width / waveformData.length;
    
    waveformData.forEach((data, index) => {
      const barHeight = data.volume * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      
      if (index === 0) {
        ctx.moveTo(x, y + barHeight / 2);
      } else {
        ctx.lineTo(x, y + barHeight / 2);
      }
    });

    ctx.stroke();

    // 音量バー描画
    ctx.fillStyle = isRecording ? 
      `rgba(16, 185, 129, ${Math.min(volume * 2, 1)})` : 
      'rgba(107, 114, 128, 0.3)';
    
    waveformData.forEach((data, index) => {
      const barHeight = data.volume * height * 0.6;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      
      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // サポートされていない場合
  if (!isSupported) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-gray-600">
          お使いのブラウザは音声認識に対応していません
        </p>
      </div>
    );
  }

  // 権限がない場合
  if (hasPermission === false) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="text-orange-500 mb-2">
          <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">
          マイクの使用を許可してください
        </p>
        <button
          onClick={startRecording}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          マイクを許可
        </button>
      </div>
    );
  }

  return (
    <div className={`voice-recorder ${className}`}>
      {/* メイン録音ボタン */}
      <div className="flex flex-col items-center space-y-4">
        <motion.button
          onClick={toggleRecording}
          disabled={disabled}
          className={`
            ${currentSize.button}
            relative rounded-full flex items-center justify-center
            transition-all duration-200 focus:outline-none focus:ring-4
            ${isRecording 
              ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200 shadow-lg shadow-red-200' 
              : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-200 shadow-lg shadow-blue-200'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
        >
          {/* 録音アニメーション */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-red-300"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </AnimatePresence>

          {/* マイクアイコン */}
          <motion.svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
            animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.6, repeat: isRecording ? Infinity : 0 }}
          >
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </motion.svg>

          {/* 音量インジケーター */}
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full bg-white"
              initial={{ scale: 0, opacity: 0.3 }}
              animate={{ 
                scale: 0.3 + (volume * 0.7),
                opacity: 0.1 + (volume * 0.2)
              }}
              transition={{ duration: 0.1 }}
            />
          )}
        </motion.button>

        {/* 状態表示 */}
        <div className="text-center">
          <p className={`font-medium ${currentSize.text} ${
            isRecording ? 'text-red-600' : 'text-gray-600'
          }`}>
            {isRecording ? '録音中...' : 'タップして話す'}
          </p>
          
          {isRecording && (
            <p className="text-sm text-gray-500 mt-1">
              {formatDuration(duration)} / {formatDuration(maxDuration)}
            </p>
          )}
        </div>

        {/* 波形表示 */}
        {showWaveform && (
          <div className="w-full max-w-md">
            <canvas
              ref={waveformRef}
              width={300}
              height={60}
              className="w-full h-15 bg-gray-50 rounded-lg border"
            />
          </div>
        )}

        {/* トランスクリプト表示 */}
        {currentTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <p className="text-sm text-blue-800">
              {currentTranscript}
            </p>
          </motion.div>
        )}

        {/* エラー表示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-4 bg-red-50 rounded-lg border border-red-200"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">
                  {error.message}
                </p>
                {error.recovery === 'retry' && (
                  <button
                    onClick={startRecording}
                    className="text-sm text-red-600 hover:text-red-800 underline mt-1"
                  >
                    再試行
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 使い方ガイド */}
        {!isRecording && !currentTranscript && !error && (
          <div className="text-center max-w-md text-sm text-gray-500 space-y-1">
            <p>🎤 マイクボタンを押して話してください</p>
            <p>📱 はっきりと、ゆっくり話すと認識精度が向上します</p>
            <p>⏰ 最大{Math.floor(maxDuration / 60)}分まで録音できます</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;