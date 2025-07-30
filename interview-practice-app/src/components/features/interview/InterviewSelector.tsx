/**
 * 面接練習選択コンポーネント
 * 面接パターンとセッションの選択UI
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Users,
  Target,
  Star,
  ChevronRight,
  Book,
  Zap,
  Award,
  Filter,
  Search,
  Play,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { meiwaInterviewPatterns, InterviewSession, InterviewCategory, InterviewQuestion } from '@/lib/interview-patterns/meiwa-patterns';

interface InterviewSelectorProps {
  onSessionSelect: (sessionId: string, questions: InterviewQuestion[]) => void;
  onCustomSelect: (questions: InterviewQuestion[]) => void;
  className?: string;
}

type ViewMode = 'sessions' | 'categories' | 'custom';

export function InterviewSelector({ onSessionSelect, onCustomSelect, className }: InterviewSelectorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('sessions');
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [categories, setCategories] = useState<InterviewCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'basic' | 'intermediate' | 'advanced' | 'mixed'>('mixed');
  const [questionCount, setQuestionCount] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    setSessions(meiwaInterviewPatterns.getSessions());
    setCategories(meiwaInterviewPatterns.getCategories());
  }, []);

  const handleSessionStart = (sessionId: string) => {
    const questions = meiwaInterviewPatterns.generateSessionQuestions(sessionId);
    onSessionSelect(sessionId, questions);
  };

  const handleCustomStart = () => {
    const questions = meiwaInterviewPatterns.generateQuestionSet({
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      difficulty,
      count: questionCount,
    });
    onCustomSelect(questions);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'practice': return 'text-green-600 bg-green-100';
      case 'mock': return 'text-blue-600 bg-blue-100';
      case 'intensive': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'practice': return <Book className="w-4 h-4" />;
      case 'mock': return <Target className="w-4 h-4" />;
      case 'intensive': return <Zap className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn('max-w-4xl mx-auto p-6', className)}>
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          明和中学校入試面接練習
        </h1>
        <p className="text-gray-600">
          AI技術を活用した本格的な面接シミュレーションで合格力を向上させましょう
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
        {[
          { id: 'sessions', label: 'おすすめセッション', icon: <Award className="w-4 h-4" /> },
          { id: 'categories', label: 'カテゴリ別練習', icon: <Book className="w-4 h-4" /> },
          { id: 'custom', label: 'カスタム練習', icon: <Filter className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as ViewMode)}
            className={cn(
              'flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-colors',
              viewMode === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 検索バー */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="セッションや質問を検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'sessions' && (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {session.title}
                        </h3>
                        <span className={cn(
                          'inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
                          getDifficultyColor(session.difficulty)
                        )}>
                          {getDifficultyIcon(session.difficulty)}
                          <span className="capitalize">{session.difficulty}</span>
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{session.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{session.totalTime}分</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="w-4 h-4" />
                          <span>{session.questionCount}問</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Book className="w-4 h-4" />
                          <span>{session.categories.length}カテゴリ</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setExpandedSession(
                          expandedSession === session.id ? null : session.id
                        )}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                      >
                        <ChevronRight className={cn(
                          'w-5 h-5 transition-transform',
                          expandedSession === session.id && 'rotate-90'
                        )} />
                      </button>
                      
                      <button
                        onClick={() => handleSessionStart(session.id)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        <span>開始</span>
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedSession === session.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <h4 className="font-medium text-gray-900 mb-2">含まれるカテゴリ:</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {session.categories.map((categoryId) => {
                            const category = categories.find(c => c.id === categoryId);
                            return category ? (
                              <span
                                key={categoryId}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                              >
                                {category.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p>このセッションでは、明和中学校入試面接の実際の形式に基づいて練習を行います。</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {viewMode === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {categories.map((category) => (
              <motion.div
                key={category.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const questions = meiwaInterviewPatterns.getQuestionsByCategory(category.id);
                  onCustomSelect(questions);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <div className="flex items-center space-x-1 text-sm text-blue-600">
                    <span>{category.questions.length}問</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">
                  {category.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    重要度: {Math.round(category.weight * 100)}%
                  </div>
                  
                  <div className="flex space-x-1">
                    {category.questions.slice(0, 3).map((_, index) => (
                      <div
                        key={index}
                        className="w-2 h-2 bg-blue-600 rounded-full"
                      />
                    ))}
                    {category.questions.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{category.questions.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {viewMode === 'custom' && (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              カスタム練習を作成
            </h3>
            
            <div className="space-y-6">
              {/* カテゴリ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  練習カテゴリ（複数選択可）
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 難易度選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  難易度
                </label>
                <div className="flex space-x-3">
                  {[
                    { value: 'basic', label: '基本', color: 'green' },
                    { value: 'intermediate', label: '中級', color: 'blue' },
                    { value: 'advanced', label: '上級', color: 'orange' },
                    { value: 'mixed', label: 'ミックス', color: 'gray' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="difficulty"
                        value={option.value}
                        checked={difficulty === option.value}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 質問数選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  質問数: {questionCount}問
                </label>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3問</span>
                  <span>15問</span>
                </div>
              </div>

              {/* 開始ボタン */}
              <div className="pt-4">
                <button
                  onClick={handleCustomStart}
                  disabled={selectedCategories.length === 0 && questionCount === 0}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>カスタム練習を開始</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}