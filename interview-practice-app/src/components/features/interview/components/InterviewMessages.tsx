'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

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

interface InterviewMessagesProps {
  messages: Message[];
  isTyping: boolean;
  typingMessageId?: string | null;
  displayedContent?: Map<string, string>;
}

export function InterviewMessages({ messages, isTyping, typingMessageId, displayedContent }: InterviewMessagesProps) {
  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-4 ${
            message.role === 'student' ? 'flex-row-reverse' : ''
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            message.role === 'interviewer'
              ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30'
              : 'bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-400/30'
          }`}>
            {message.role === 'interviewer' ? (
              <Bot className="w-6 h-6 text-blue-400" />
            ) : (
              <User className="w-6 h-6 text-green-400" />
            )}
          </div>

          <div className={`max-w-2xl ${message.role === 'student' ? 'text-right' : ''}`}>
            <div className={`inline-block p-6 rounded-3xl backdrop-blur-xl border ${
              message.role === 'interviewer'
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-400/20 text-white'
            }`}>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {typingMessageId === message.id 
                  ? (displayedContent?.get(message.id) || '')
                  : message.content}
                {typingMessageId === message.id && (
                  <span className="animate-pulse text-white/60">|</span>
                )}
              </p>
              
              <div className={`flex items-center gap-2 mt-4 text-xs text-white/60 ${
                message.role === 'student' ? 'justify-end' : ''
              }`}>
                <span>
                  {message.timestamp.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {message.role === 'interviewer' && (
                  <span className="px-2 py-1 bg-blue-500/20 rounded-full">
                    面接官
                  </span>
                )}
                {message.role === 'student' && (
                  <span className="px-2 py-1 bg-green-500/20 rounded-full">
                    あなた
                  </span>
                )}
              </div>
            </div>

            {/* フィードバック表示 */}
            {message.feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border border-yellow-400/20 rounded-2xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-400">
                    フィードバック (スコア: {message.feedback.score}/100)
                  </span>
                </div>
                
                {message.feedback.points.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-white/80 mb-1">良い点:</p>
                    <ul className="text-sm text-white/70 space-y-1">
                      {message.feedback.points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-400">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {message.feedback.suggestions.length > 0 && (
                  <div>
                    <p className="text-sm text-white/80 mb-1">改善提案:</p>
                    <ul className="text-sm text-white/70 space-y-1">
                      {message.feedback.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}

      {/* タイピングインジケーター */}
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-400" />
          </div>
          
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-white/60 ml-2">面接官が考えています...</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}