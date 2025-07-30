'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'こんにちは！面接練習のお手伝いをします。質問や相談があれば何でもお聞かせください。',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // AI応答のシミュレーション（実際のAPI呼び出しに置き換え可能）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI応答エラー:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '申し訳ありません。エラーが発生しました。もう一度お試しください。',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      'それは素晴らしい質問ですね。面接では具体的な経験を交えて答えることが重要です。',
      'その点について詳しく説明していただけますか？面接官は具体例を聞きたがります。',
      'とても良いポイントです。それをどのように学校生活で活かしたいか考えてみましょう。',
      '明和中学校では、そのような考え方を持つ学生を求めています。さらに発展させてみましょう。',
      'その経験から何を学びましたか？学びを今後どう活かしたいですか？',
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Apple-style ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-semibold tracking-tight text-white hover:text-white/90 transition-colors duration-300">
              Qonect
            </Link>
            <div className="text-sm font-medium text-white/60 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm">
              AI Chat
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-8 leading-tight">
              AI面接コーチ
            </h1>
            <p className="text-xl md:text-2xl font-light text-white/80 max-w-3xl mx-auto leading-relaxed">
              面接対策の質問や相談を
              <br className="hidden md:block" />
              <span className="text-white/60">お気軽にどうぞ</span>
            </p>
          </motion.div>

          {/* 高級感のあるチャットコンテナ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* メッセージ表示エリア */}
            <div className="h-[500px] overflow-y-auto p-8 space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-4 max-w-2xl ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse ml-auto' : ''
                  }`}>
                    {/* Apple-style アバター */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-r from-purple-500 to-purple-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-6 h-6 text-white" />
                      ) : (
                        <Bot className="w-6 h-6 text-white" />
                      )}
                    </div>
                    
                    {/* Apple-style メッセージバブル */}
                    <div className={`px-6 py-4 rounded-3xl backdrop-blur-xl border shadow-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white border-blue-400/30'
                        : 'bg-white/10 text-white border-white/20'
                    }`}>
                      <p className="text-base leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-white/50'
                      }`}>
                        {message.timestamp.toLocaleTimeString('ja-JP', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Apple-style ローディング表示 */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div className="px-6 py-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span className="text-base text-white">入力中...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Apple-style 入力エリア */}
            <div className="border-t border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <div className="flex space-x-4">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="面接に関する質問や相談を入力してください..."
                  className="flex-1 resize-none bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 backdrop-blur-xl transition-all duration-300"
                  rows={3}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-white/20 disabled:to-white/20 text-white px-6 py-4 rounded-2xl transition-all duration-300 shadow-lg disabled:cursor-not-allowed"
                >
                  <Send className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Apple-style サンプル質問 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-12 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-700"
          >
            <h3 className="text-2xl font-bold text-white mb-8 text-center">よくある質問例</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                '志望動機の効果的な伝え方は？',
                '緊張した時の対処法を教えて',
                '長所と短所の答え方のコツは？',
                '将来の夢をどう話せば良い？'
              ].map((question, index) => (
                <motion.button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-left text-white/90 hover:text-white bg-white/5 hover:bg-white/10 px-6 py-4 rounded-2xl transition-all duration-300 border border-white/10 hover:border-white/20 backdrop-blur-sm"
                >
                  {question}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}