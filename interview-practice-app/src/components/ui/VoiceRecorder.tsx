'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle,
  Settings,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumButton } from './PremiumButton';
import { PremiumCard } from './PremiumCard';
import { useSpeechRecognition, SpeechRecognitionUtils } from '@/hooks/useSpeechRecognition';

interface VoiceRecorderProps {
  onTranscriptChange?: (transcript: string) => void;
  onRecordingComplete?: (transcript: string, confidence: number) => void;
  placeholder?: string;
  maxDuration?: number; // 秒
  autoStop?: boolean;
  showTranscript?: boolean;
  showAudioVisualization?: boolean;
  className?: string;
  disabled?: boolean;
  context?: 'interview' | 'practice' | 'quick-answer';
}

export function VoiceRecorder({
  onTranscriptChange,
  onRecordingComplete,
  placeholder = 'マイクボタンを押して音声入力を開始してください',
  maxDuration = 180, // 3分
  autoStop = true,
  showTranscript = true,
  showAudioVisualization = true,
  className,
  disabled = false,
  context = 'practice'
}: VoiceRecorderProps) {
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    confidence,
    error,
    isInitializing,
    audioLevel,
    hasPermission,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission,
    updateConfig
  } = useSpeechRecognition(SpeechRecognitionUtils.suggestOptimalConfig(context));

  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // 録音時間の計測
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (autoStop && newDuration >= maxDuration) {
            stopListening();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      setDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening, maxDuration, autoStop, stopListening]);

  // 転写テキストの変更を親に通知
  useEffect(() => {
    if (onTranscriptChange) {
      onTranscriptChange(transcript + interimTranscript);
    }
  }, [transcript, interimTranscript, onTranscriptChange]);

  // 録音完了時の処理
  useEffect(() => {
    if (!isListening && transcript && onRecordingComplete) {
      onRecordingComplete(transcript, confidence);
    }
  }, [isListening, transcript, confidence, onRecordingComplete]);

  const handleToggleRecording = async () => {
    if (disabled) return;

    if (isListening) {
      stopListening();
    } else {
      if (!hasPermission) {
        await requestPermission();
      }
      resetTranscript();
      startListening();
    }
  };

  const handleReset = () => {
    stopListening();
    resetTranscript();
    setDuration(0);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingButtonVariant = () => {
    if (error) return 'warning';
    if (isListening) return 'success';
    return 'default';
  };

  const getAudioQuality = () => {
    if (!isListening) return null;
    return SpeechRecognitionUtils.evaluateAudioQuality(audioLevel, confidence);
  };

  const audioQuality = getAudioQuality();

  if (!isSupported) {
    return (
      <PremiumCard variant="warning" className={cn('p-6', className)}>
        <div className="text-center space-y-4">
          <MicOff className="w-12 h-12 text-warning-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-warning-800">
              音声認識がサポートされていません
            </h3>
            <p className="text-sm text-warning-700 mt-2">
              Chrome、Safari、Edge の最新版をお使いください
            </p>
          </div>
        </div>
      </PremiumCard>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* メインコントロール */}
      <PremiumCard variant={error ? 'warning' : 'default'} className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* 音声可視化 */}
          {showAudioVisualization && (
            <div className="w-full h-16 flex items-center justify-center">
              <AudioVisualization 
                audioLevel={audioLevel} 
                isActive={isListening}
                className="w-32 h-8"
              />
            </div>
          )}

          {/* メイン録音ボタン */}
          <div className="relative">
            <PremiumButton
              size="xl"
              variant={getRecordingButtonVariant()}
              onClick={handleToggleRecording}
              disabled={disabled || isInitializing}
              loading={isInitializing}
              className={cn(
                'w-20 h-20 rounded-full transition-all duration-300',
                isListening && 'animate-pulse shadow-glow-success'
              )}
            >
              {isListening ? (
                <Square className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </PremiumButton>

            {/* 録音インジケーター */}
            {isListening && (
              <motion.div
                className="absolute -inset-2 border-2 border-success-500 rounded-full"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>

          {/* ステータステキスト */}
          <div className="text-center">
            {error ? (
              <div className="flex items-center space-x-2 text-warning-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            ) : isListening ? (
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-success-700">
                  <motion.div
                    className="w-2 h-2 bg-success-500 rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="font-medium">録音中</span>
                </div>
                <div className="text-sm text-premium-600">
                  {formatDuration(duration)} / {formatDuration(maxDuration)}
                </div>
              </div>
            ) : (
              <span className="text-premium-600">{placeholder}</span>
            )}
          </div>

          {/* 音声品質インジケーター */}
          {audioQuality && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {audioQuality.quality === 'excellent' && (
                  <CheckCircle className="w-4 h-4 text-success-500" />
                )}
                {audioQuality.quality === 'good' && (
                  <Volume2 className="w-4 h-4 text-primary-500" />
                )}
                {(audioQuality.quality === 'fair' || audioQuality.quality === 'poor') && (
                  <AlertCircle className="w-4 h-4 text-warning-500" />
                )}
                <span className="text-xs capitalize text-premium-600">
                  {audioQuality.quality}
                </span>
              </div>
              {confidence > 0 && (
                <div className="text-xs text-premium-500">
                  信頼度: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>
          )}

          {/* コントロールボタン */}
          <div className="flex space-x-2">
            <PremiumButton
              size="sm"
              variant="ghost"
              onClick={handleReset}
              disabled={disabled || (!transcript && !isListening)}
              title="リセット"
            >
              <RotateCcw className="w-4 h-4" />
            </PremiumButton>

            <PremiumButton
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
              title="設定"
            >
              <Settings className="w-4 h-4" />
            </PremiumButton>

            <PremiumButton
              size="sm"
              variant="ghost"
              onClick={() => setShowHelp(!showHelp)}
              title="ヘルプ"
            >
              <HelpCircle className="w-4 h-4" />
            </PremiumButton>
          </div>
        </div>
      </PremiumCard>

      {/* 転写テキスト表示 */}
      {showTranscript && (transcript || interimTranscript) && (
        <PremiumCard variant="glass" className="p-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-premium-700">
              認識されたテキスト
            </h4>
            <div className="min-h-[100px] p-3 bg-white rounded border border-premium-200">
              <p className="text-premium-800 leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-premium-500 italic">
                    {interimTranscript}
                  </span>
                )}
              </p>
            </div>
            {transcript && (
              <div className="flex justify-between items-center text-xs text-premium-500">
                <span>文字数: {transcript.length}</span>
                {confidence > 0 && (
                  <span>認識信頼度: {Math.round(confidence * 100)}%</span>
                )}
              </div>
            )}
          </div>
        </PremiumCard>
      )}

      {/* 音声品質の改善提案 */}
      {audioQuality && audioQuality.suggestions.length > 0 && (
        <PremiumCard variant="warning" size="sm" className="p-3">
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-warning-800 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              音声品質の改善提案
            </h5>
            <ul className="space-y-1">
              {audioQuality.suggestions.map((suggestion, index) => (
                <li key={index} className="text-xs text-warning-700 flex items-start">
                  <span className="w-1 h-1 bg-warning-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </PremiumCard>
      )}

      {/* 設定パネル */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <VoiceRecorderSettings
              onConfigChange={updateConfig}
              onClose={() => setShowSettings(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ヘルプパネル */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <VoiceRecorderHelp onClose={() => setShowHelp(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 音声可視化コンポーネント
interface AudioVisualizationProps {
  audioLevel: number;
  isActive: boolean;
  className?: string;
}

function AudioVisualization({ audioLevel, isActive, className }: AudioVisualizationProps) {
  const bars = Array.from({ length: 8 }, (_, i) => {
    const height = isActive 
      ? Math.max(0.1, audioLevel + (Math.random() - 0.5) * 0.3) 
      : 0.1;
    
    return (
      <motion.div
        key={i}
        className={cn(
          'bg-gradient-to-t rounded-full',
          isActive 
            ? 'from-primary-400 to-primary-600' 
            : 'from-premium-300 to-premium-400'
        )}
        style={{ width: '4px' }}
        animate={{ 
          height: `${Math.max(8, height * 100)}%`,
          opacity: isActive ? 1 : 0.3
        }}
        transition={{ 
          duration: 0.1,
          ease: 'easeOut' as const
        }}
      />
    );
  });

  return (
    <div className={cn('flex items-end justify-center space-x-1 h-full', className)}>
      {bars}
    </div>
  );
}

// 設定パネル
interface VoiceRecorderSettingsProps {
  onConfigChange: (config: any) => void;
  onClose: () => void;
}

function VoiceRecorderSettings({ onConfigChange, onClose }: VoiceRecorderSettingsProps) {
  return (
    <PremiumCard variant="elevated" className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-premium-800">音声認識設定</h4>
          <PremiumButton size="sm" variant="ghost" onClick={onClose}>
            ×
          </PremiumButton>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-premium-700 mb-1">
              言語
            </label>
            <select 
              className="w-full px-3 py-2 border border-premium-300 rounded-md text-sm"
              onChange={(e) => onConfigChange({ lang: e.target.value })}
              defaultValue="ja-JP"
            >
              <option value="ja-JP">日本語</option>
              <option value="en-US">English (US)</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="continuous"
              onChange={(e) => onConfigChange({ continuous: e.target.checked })}
              defaultChecked
            />
            <label htmlFor="continuous" className="text-sm text-premium-700">
              連続認識
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="interimResults"
              onChange={(e) => onConfigChange({ interimResults: e.target.checked })}
              defaultChecked
            />
            <label htmlFor="interimResults" className="text-sm text-premium-700">
              リアルタイム表示
            </label>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}

// ヘルプパネル
interface VoiceRecorderHelpProps {
  onClose: () => void;
}

function VoiceRecorderHelp({ onClose }: VoiceRecorderHelpProps) {
  return (
    <PremiumCard variant="glass" className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-premium-800">音声入力のコツ</h4>
          <PremiumButton size="sm" variant="ghost" onClick={onClose}>
            ×
          </PremiumButton>
        </div>
        
        <div className="space-y-3 text-sm text-premium-700">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
            <span>静かな環境で録音してください</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
            <span>マイクから30cm程度の距離で話してください</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
            <span>はっきりと、ゆっくりと話してください</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
            <span>句読点を意識して話してください</span>
          </div>
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-warning-500 mt-0.5 flex-shrink-0" />
            <span>認識が正しくない場合は、もう一度録音してください</span>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}