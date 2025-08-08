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
  const finalTranscriptRef = useRef<string>(''); // 確定済みテキストを保持
  const isManuallyEditingRef = useRef<boolean>(false); // 手動編集中フラグ
  const lastRecognizedTextRef = useRef<string>(''); // 最後に認識されたテキスト
  const [isAutoVoiceMode, setIsAutoVoiceMode] = useState(true); // デフォルトで音声モード
  
  // 初期状態で音声入力を自動開始
  React.useEffect(() => {
    if (!disabled && !isLoading && isAutoVoiceMode) {
      const timer = setTimeout(() => {
        startVoiceRecording();
        console.log('🎤 初期音声入力開始');
      }, 1000); // 1秒後に開始
      
      return () => clearTimeout(timer);
    }
  }, [disabled, isLoading]); // disabled, isLoadingが変更されたら再実行

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
      // 録音開始時に既存の入力を確定済みテキストとして保存
      finalTranscriptRef.current = input;
      isManuallyEditingRef.current = false; // 手動編集フラグをリセット
      lastRecognizedTextRef.current = input; // 現在の入力を基準に設定
      console.log('🎤 音声認識開始、既存テキスト保持:', finalTranscriptRef.current);
    };

    recognition.onresult = (event) => {
      // 手動編集中は音声認識結果を無視
      if (isManuallyEditingRef.current) {
        console.log('🖊️ 手動編集中のため音声認識結果をスキップ');
        return;
      }

      let finalTranscript = '';
      let interimTranscript = '';
      
      // すべての結果を処理して、確定済みと暫定を分離
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // 確定済みテキストがある場合は追加
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        console.log('🎤 確定テキスト:', finalTranscript);
      }

      // 全体のテキストを更新（既存 + 確定済み + 暫定）
      const fullText = finalTranscriptRef.current + interimTranscript;
      lastRecognizedTextRef.current = fullText; // 最後の認識結果を保存
      setInput(fullText);
      setTranscript(interimTranscript); // 暫定テキストのみ表示用に保持
      
      console.log('🎤 全体テキスト:', fullText);
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
      
      // 音声認識を完全に停止
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        console.log('🎤 送信前に音声認識を停止');
      }
      
      // まず送信
      onSendMessage(messageToSend);
      
      // 送信成功後に完全クリア
      setTimeout(() => {
        setInput('');
        setTranscript('');
        finalTranscriptRef.current = ''; 
        isManuallyEditingRef.current = false; 
        lastRecognizedTextRef.current = ''; 
        console.log('✅ 入力フィールドを完全クリア');
        
        // デフォルト音声モードなら自動で音声入力開始
        if (isAutoVoiceMode && !disabled) {
          setTimeout(() => {
            startVoiceRecording();
            console.log('🎤 自動音声入力開始');
          }, 500); // 少し遅らせて確実にクリア後に開始
        }
      }, 100); // 送信処理後に確実にクリア
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
            onClick={() => {
              if (isListening) {
                stopVoiceRecording();
                setIsAutoVoiceMode(false); // 手動で停止した場合は自動モード解除
              } else {
                startVoiceRecording();
                setIsAutoVoiceMode(true); // 手動で開始した場合は自動モード有効
              }
            }}
            disabled={disabled || isLoading}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : isAutoVoiceMode 
                  ? 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed'
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
              onChange={(e) => {
                const newValue = e.target.value;
                setInput(newValue);
                
                // 手動編集を検出
                if (isListening && newValue !== lastRecognizedTextRef.current) {
                  isManuallyEditingRef.current = true;
                  console.log('🖊️ 手動編集検出');
                  
                  // 音声認識を停止
                  if (recognitionRef.current) {
                    recognitionRef.current.stop();
                    setIsListening(false);
                    console.log('🎤 手動編集のため音声認識を停止');
                  }
                }
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                // フォーカス時に手動モードに切り替え
                if (isAutoVoiceMode) {
                  setIsAutoVoiceMode(false);
                  console.log('🖊️ 手動モードに切り替え');
                }
                
                // 音声認識中なら停止
                if (isListening && recognitionRef.current) {
                  console.log('🖊️ テキストエリアフォーカス、音声認識停止');
                  recognitionRef.current.stop();
                  setIsListening(false);
                }
              }}
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