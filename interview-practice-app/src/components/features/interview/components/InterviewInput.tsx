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
  const [isAutoVoiceMode, setIsAutoVoiceMode] = useState(true); // デフォルトで音声モード（赤）
  const [isManualKeyboardMode, setIsManualKeyboardMode] = useState(false); // 手動キーボードモード（青）
  
  // コンポーネントアンマウント時のクリーンアップ
  React.useEffect(() => {
    return () => {
      // アンマウント時に音声認識を完全に停止
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onstart = null;
        } catch (e) {
          console.error('クリーンアップエラー:', e);
        }
        recognitionRef.current = null;
      }
      console.log('🧹 コンポーネントアンマウント - 音声認識クリーンアップ');
    };
  }, []);
  
  // 初期状態で音声入力を自動開始（キーボードモードでない場合のみ）
  React.useEffect(() => {
    if (!disabled && !isLoading && isAutoVoiceMode && !isManualKeyboardMode) {
      const timer = setTimeout(() => {
        // 初期開始時のみクリア（会話の最初だけ）
        if (!input) {
          setInput('');
          setTranscript('');
          finalTranscriptRef.current = '';
          lastRecognizedTextRef.current = '';
          isManuallyEditingRef.current = false;
          console.log('🧹 初期音声入力前にクリア');
        }
        
        startVoiceRecording();
        console.log('🎤 初期音声入力開始');
      }, 1000); // 1秒後に開始
      
      return () => clearTimeout(timer);
    } else if (isManualKeyboardMode) {
      console.log('📝 キーボードモードなので初期音声入力をスキップ');
    }
  }, [disabled, isLoading, isAutoVoiceMode, isManualKeyboardMode]);

  const startVoiceRecording = () => {
    // キーボードモードの場合は音声認識を開始しない
    if (isManualKeyboardMode) {
      console.log('📝 キーボードモードなので音声認識をスキップ');
      return;
    }

    // 既に音声認識が動作中なら停止してから再開
    if (recognitionRef.current && isListening) {
      console.log('⚠️ 既存の音声認識を停止してから再開');
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('既存の音声認識停止エラー:', e);
      }
      recognitionRef.current = null;
      setIsListening(false);
    }

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
      // 音声認識開始時、既存の入力は保持する
      // finalTranscriptRef.currentには既に入力内容が設定されている
      isManuallyEditingRef.current = false; // 手動編集フラグをリセット
      setTranscript(''); // 暫定テキストのみクリア
      console.log('🎤 音声認識開始 - 既存入力保持:', finalTranscriptRef.current);
    };

    recognition.onresult = (event) => {
      // キーボードモードまたは手動編集中は音声認識結果を無視
      if (isManualKeyboardMode || isManuallyEditingRef.current) {
        console.log('📝 キーボードモードまたは手動編集中のため音声認識結果をスキップ');
        // 音声認識を停止
        try {
          recognition.stop();
        } catch (e) {
          console.error('音声認識停止エラー:', e);
        }
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
        // 既存のテキストがある場合はスペースを追加してから音声認識結果を追加
        if (finalTranscriptRef.current && !finalTranscriptRef.current.endsWith(' ')) {
          finalTranscriptRef.current += ' ';
        }
        finalTranscriptRef.current += finalTranscript;
        console.log('🎤 確定テキスト追加:', finalTranscript);
      }

      // 全体のテキストを更新（既存テキスト + 新規音声認識結果）
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
      // 音声認識終了時に参照をクリア（重要）
      setTranscript('');
      // 音声モードでない場合は参照もクリア
      if (!isAutoVoiceMode || isManualKeyboardMode) {
        finalTranscriptRef.current = '';
        lastRecognizedTextRef.current = '';
        console.log('📝 音声モードでないため参照クリア');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.onresult = null; // イベントハンドラを解除
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onstart = null;
      } catch (e) {
        console.error('音声認識停止エラー:', e);
      }
      recognitionRef.current = null; // 参照を完全に削除
      setIsListening(false);
      // 停止時に参照をクリア
      finalTranscriptRef.current = '';
      lastRecognizedTextRef.current = '';
      isManuallyEditingRef.current = false;
      setTranscript('');
      console.log('🛑 音声認識停止 - 完全クリーンアップ実行');
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
      
      // 送信成功後に完全クリア（即座に実行）
      setInput('');
      setTranscript('');
      finalTranscriptRef.current = ''; 
      isManuallyEditingRef.current = false; 
      lastRecognizedTextRef.current = ''; 
      console.log('✅ 送信直後に入力フィールドを完全クリア');
      
      // デフォルト音声モードかつキーボードモードでない場合のみ自動再開
      if (isAutoVoiceMode && !isManualKeyboardMode && !disabled) {
        setTimeout(() => {
          // 再開前に再度クリア（念のため）
          setInput('');
          setTranscript('');
          finalTranscriptRef.current = '';
          lastRecognizedTextRef.current = '';
          isManuallyEditingRef.current = false;
          
          startVoiceRecording();
          console.log('🎤 自動音声入力開始（キーボードモードではない）');
        }, 500); // 少し遅らせて確実にクリア後に開始
      } else {
        console.log('📝 キーボードモードなので音声入力自動開始をスキップ');
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
            onClick={() => {
              if (isListening) {
                // 音声認識停止
                stopVoiceRecording();
                setIsAutoVoiceMode(false);
                setIsManualKeyboardMode(true);
                console.log('🎤 音声ボタンクリック - キーボードモードに切り替え');
              } else {
                // 音声認識開始（入力内容は保持）
                const currentInput = input; // 現在の入力内容を保存
                
                // 音声認識開始
                setIsAutoVoiceMode(true);
                setIsManualKeyboardMode(false);
                
                // 既存の入力内容を参照に設定（クリアしない）
                finalTranscriptRef.current = currentInput;
                lastRecognizedTextRef.current = currentInput;
                isManuallyEditingRef.current = false;
                
                console.log('🎤 音声ボタンクリック - 音声モードに切り替え（入力内容保持: ', currentInput, '）');
                
                // 音声認識を開始（入力はクリアしない）
                startVoiceRecording();
              }
            }}
            disabled={disabled || isLoading}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white' // 赤：音声認識中
                : isManualKeyboardMode || !isAutoVoiceMode
                  ? 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed' // 青：キーボードモード
                  : 'bg-red-400 hover:bg-red-500 text-white disabled:bg-gray-600 disabled:cursor-not-allowed' // 赤：音声モード待機
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
                
                // 手動編集を検出（キーボードモードに切り替え）
                if (isListening) {
                  isManuallyEditingRef.current = true;
                  setIsAutoVoiceMode(false);
                  setIsManualKeyboardMode(true);
                  console.log('🖊️ 手動編集検出 - キーボードモードに切り替え');
                  
                  // 音声認識を停止して参照をクリア
                  if (recognitionRef.current) {
                    recognitionRef.current.stop();
                    setIsListening(false);
                    // 参照を完全にクリア
                    finalTranscriptRef.current = '';
                    lastRecognizedTextRef.current = '';
                    setTranscript('');
                    console.log('🎤 手動編集のため音声認識を停止、参照クリア');
                  }
                }
                
                // 手動編集中は参照を更新しない
                if (!isListening) {
                  finalTranscriptRef.current = '';
                  lastRecognizedTextRef.current = newValue;
                }
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                console.log('📝 テキストエリアフォーカス - キーボードモードに切り替え');
                
                // フォーカス時にキーボードモードに切り替え
                setIsAutoVoiceMode(false);
                setIsManualKeyboardMode(true);
                
                // 音声認識中なら停止して参照をクリア
                if (isListening && recognitionRef.current) {
                  console.log('🔊️ キーボードモードに切り替え、音声認識停止');
                  recognitionRef.current.stop();
                  setIsListening(false);
                  // 参照をクリア（重要）
                  finalTranscriptRef.current = '';
                  lastRecognizedTextRef.current = '';
                  isManuallyEditingRef.current = false;
                  setTranscript('');
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
            
            {/* モード表示 */}
            <div className="mt-2 flex items-center justify-between text-xs text-white/60">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isListening ? 'bg-red-400 animate-pulse' :
                  isManualKeyboardMode ? 'bg-blue-400' : 'bg-red-400'
                }`} />
                <span>
                  {isListening ? '音声認識中' :
                   isManualKeyboardMode ? 'キーボードモード' : '音声モード'}
                </span>
              </div>
              <div className="text-right">
                {isManualKeyboardMode ? 
                  'マイクボタンで音声モードに戻る' :
                  'テキストエリアタップでキーボードモード'
                }
              </div>
            </div>
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