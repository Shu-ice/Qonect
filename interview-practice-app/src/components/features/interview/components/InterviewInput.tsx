'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';

interface InterviewInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export function InterviewInput({ onSendMessage, isLoading, disabled }: InterviewInputProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('お使いのブラウザでは音声認識がサポートされていません');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP';

    recognition.onstart = () => {
      setIsListening(true);
      // 録音開始時は前の内容を保持（送信後のみクリア）
      console.log('🎤 音声認識開始');
    };

    recognition.onresult = (event) => {
      let latestResult = '';
      
      // 最新の結果のみを取得（累積を避ける）
      const lastResult = event.results[event.results.length - 1];
      if (lastResult) {
        latestResult = lastResult[0].transcript;
      }

      // 現在の入力に追加（新しい音声認識の場合）
      if (latestResult && latestResult !== transcript) {
        setTranscript(latestResult);
        setInput(prevInput => {
          // 前のテキストが空なら新しいテキストをそのまま設定
          if (!prevInput || prevInput === transcript) {
            return latestResult;
          }
          // 既存のテキストがある場合は置き換え
          return latestResult;
        });
      }
      
      console.log('🎤 音声認識結果:', latestResult);
    };

    recognition.onerror = (event) => {
      console.error('音声認識エラー:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('🎤 音声認識終了');
      // 音声認識終了時はテキストを保持（送信まで残す）
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      const messageToSend = input.trim();
      console.log('📤 送信メッセージ:', messageToSend);
      
      // まず送信
      onSendMessage(messageToSend);
      
      // 送信成功後にクリア
      setInput('');
      setTranscript('');
      console.log('✅ 入力フィールドをクリアしました');
      
      // 音声認識が動作中の場合も停止
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        console.log('🎤 音声認識を停止しました');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-end gap-4">
          {/* 音声入力ボタン */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isListening ? stopVoiceRecording : startVoiceRecording}
            disabled={disabled || isLoading}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed'
            }`}
          >
            {isListening ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </motion.button>

          {/* テキスト入力エリア */}
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? "面接が終了しました" : "回答を入力してください..."}
              disabled={disabled || isLoading}
              rows={Math.max(1, Math.ceil(input.length / 50))}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/50 resize-none focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-xl disabled:cursor-not-allowed disabled:opacity-50"
            />
            
            {/* 音声認識の表示 */}
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-400 font-medium">録音中...</span>
                </div>
                {transcript && (
                  <p className="text-sm text-white/80 mt-2">{transcript}</p>
                )}
              </motion.div>
            )}
          </div>

          {/* 送信ボタン */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || disabled || isLoading}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-all duration-300"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </motion.button>
        </div>

        {/* 入力ヒント */}
        {!disabled && (
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-white/40">
            <div className="flex items-center gap-1">
              <Mic className="w-3 h-3" />
              <span>音声入力</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white/10 rounded">Enter</kbd>
              <span>送信</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white/10 rounded">Shift</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-white/10 rounded">Enter</kbd>
              <span>改行</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}