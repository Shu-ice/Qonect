'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { InterviewHeader } from './components/InterviewHeader';
import { InterviewMessages } from './components/InterviewMessages';
import { InterviewInput } from './components/InterviewInput';

interface Message {
  id: string;
  role: 'interviewer' | 'student';
  content: string;
  timestamp: Date;
  feedback?: {
    score: number;
    points: string[];
    suggestions: string[];
  };
}

interface EssayContent {
  motivation: string;
  research: string;
  schoolLife: string;
  future: string;
  inquiryLearning: string;
}

interface OptimizedInterviewChatProps {
  essayContent: EssayContent;
  onSessionEnd: (messages: Message[], duration?: number) => void;
}

export function OptimizedInterviewChat({ essayContent, onSessionEnd }: OptimizedInterviewChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionStartTime] = useState(new Date());
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [displayedContent, setDisplayedContent] = useState<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const studentAnswerCount = useRef(0);

  // タイプライター効果
  const typewriterEffect = useCallback((messageId: string, fullContent: string, speed: number = 50) => {
    setTypingMessageId(messageId);
    setDisplayedContent(prev => new Map(prev.set(messageId, '')));
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < fullContent.length) {
        setDisplayedContent(prev => {
          const newMap = new Map(prev);
          newMap.set(messageId, fullContent.slice(0, currentIndex + 1));
          return newMap;
        });
        currentIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setTypingMessageId(null);
        }, 1500);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, []);

  // 自動スクロール
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 初回質問の送信 - 固定セリフで開始
  useEffect(() => {
    const sendInitialQuestion = async () => {
      setIsTyping(true);
      
      // 初回挨拶は固定セリフを使用
      setTimeout(() => {
        const initialMessage: Message = {
          id: 'initial',
          role: 'interviewer',
          content: 'それでは面接を始めます。受検番号と名前を教えてください。',
          timestamp: new Date()
        };
        
        setMessages([initialMessage]);
        setIsTyping(false);
        
        // タイプライター効果を開始
        setTimeout(() => {
          typewriterEffect(initialMessage.id, initialMessage.content, 60);
        }, 500);
      }, 1000);
    };

    sendInitialQuestion();
  }, [typewriterEffect]);

  // 質問生成のAPI呼び出し
  const generateNextQuestion = useCallback(async (userMessage: string) => {
    try {
      setIsLoading(true);
      setIsTyping(true);

      // 真のAI面接エンドポイント - 受検生の発言を理解してリアクション
      const response = await fetch('/api/interview/ai-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // AI応答をメッセージに追加
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'interviewer',
        content: data.question || '申し訳ございませんが、質問の生成でエラーが発生しました。もう一度お答えいただけますか？',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // 面接終了チェック
      if (data.interviewEnded) {
        console.log('🏁 面接終了が検出されました');
        console.log('📊 AI最終メッセージ:', aiMessage.content);
        
        // タイプライター効果を考慮した遅延時間を計算
        const messageLength = aiMessage.content.length;
        const baseTypingDuration = Math.min(messageLength * 50, 5000); // 基本タイピング時間
        const bufferTime = 3000; // バッファー時間を増やして確実に待つ
        const totalDelay = baseTypingDuration + bufferTime;
        
        console.log(`⏱️ タイピング時間: ${baseTypingDuration}ms, バッファ: ${bufferTime}ms, 合計: ${totalDelay}ms`);
        console.log('🚀 評価画面への遷移をスケジュール');
        
        // セッション終了フラグを立てる（新しいメッセージの受け付けを停止）
        setSessionEnded(true);
        
        setTimeout(() => {
          console.log('📤 評価画面への遷移を実行中...');
          
          // セッション時間を計算
          const endTime = new Date();
          const sessionDurationInSeconds = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);
          
          // 最新のメッセージ配列を作成（AIメッセージを含む）
          const finalMessages = [...messages, aiMessage];
          
          console.log('📤 評価データ:');
          console.log('  - メッセージ数:', finalMessages.length);
          console.log('  - セッション時間:', sessionDurationInSeconds, '秒');
          console.log('  - 最終AIメッセージ:', aiMessage.content.substring(0, 50) + '...');
          
          // 親コンポーネントに終了を通知（評価画面表示）
          console.log('🚀 onSessionEndを呼び出し中...');
          console.log('📤 onSessionEndに渡すデータ:');
          console.log('  - finalMessages:', finalMessages);
          console.log('  - sessionDurationInSeconds:', sessionDurationInSeconds);
          
          try {
            onSessionEnd(finalMessages, sessionDurationInSeconds);
            console.log('✅ onSessionEnd呼び出し成功');
          } catch (error) {
            console.error('❌ onSessionEnd呼び出しエラー:', error);
          }
          
          console.log('✅ 評価画面遷移処理完了');
        }, totalDelay);
      }
      
      // タイプライター効果を開始
      setTimeout(() => {
        typewriterEffect(aiMessage.id, aiMessage.content, 50);
      }, 100);

    } catch (error) {
      console.error('質問生成エラー:', error);
      
      // フォールバック質問
      const fallbackMessage: Message = {
        id: `fallback-${Date.now()}`,
        role: 'interviewer',
        content: 'すみません、少し時間をいただけますか。もう一度お答えいただけますでしょうか？',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [essayContent, messages, typewriterEffect]);

  // ユーザーメッセージの処理
  const handleSendMessage = useCallback(async (content: string) => {
    if (sessionEnded) return;

    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'student',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // カウントを増やす（ユーザーが回答した後）
    studentAnswerCount.current += 1;

    // 次の質問を生成
    await generateNextQuestion(content);
  }, [sessionEnded, generateNextQuestion]);

  // セッション終了
  const handleEndSession = useCallback(() => {
    console.log('🔴 手動セッション終了がリクエストされました');
    
    setSessionEnded(true);
    
    // セッション時間を計算
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);
    
    console.log('📤 手動終了データ:');
    console.log('  - メッセージ数:', messages.length);
    console.log('  - セッション時間:', duration, '秒');
    
    console.log('🚀 手動終了のonSessionEndを呼び出し...');
    try {
      onSessionEnd(messages, duration);
      console.log('✅ 手動終了のonSessionEnd呼び出し成功');
    } catch (error) {
      console.error('❌ 手動終了のonSessionEnd呼び出しエラー:', error);
    }
  }, [messages, onSessionEnd, sessionStartTime]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* ヘッダー */}
      <InterviewHeader 
        sessionStartTime={sessionStartTime}
        onEndSession={handleEndSession}
      />

      {/* メインコンテンツ */}
      <main className="flex-1 pt-20 pb-6">
        <div className="max-w-4xl mx-auto px-6 h-full flex flex-col">
          {/* メッセージエリア */}
          <div className="flex-1 overflow-y-auto py-8 space-y-6">
            <InterviewMessages 
              messages={messages}
              isTyping={isTyping}
              typingMessageId={typingMessageId}
              displayedContent={displayedContent}
            />
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* 入力エリア */}
      <InterviewInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        disabled={sessionEnded}
      />

      {/* タイプライター効果のオーバーレイ - 元の全画面実装 */}
      {typingMessageId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-2xl mx-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <div className="w-6 h-6 text-white">🤖</div>
              </div>
              <div className="text-lg font-medium text-white">面接官</div>
            </div>
            <p className="text-xl leading-relaxed text-white font-light">
              {displayedContent.get(typingMessageId) || ''}
              <span className="animate-pulse text-white/60">|</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* 終了時のオーバーレイは削除（評価画面に直接遷移） */}
    </div>
  );
}