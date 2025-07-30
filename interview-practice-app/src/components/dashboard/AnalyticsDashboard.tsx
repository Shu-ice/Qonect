/**
 * 統計・分析ダッシュボード
 * 練習結果の可視化と分析レポート
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Clock,
  Award,
  Users,
  BookOpen,
  Zap,
  Download,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Star,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  totalSessions: number;
  totalQuestions: number;
  averageScore: number;
  improvementRate: number;
  practiceTime: number;
  strongestCategory: string;
  weakestCategory: string;
  recentSessions: SessionSummary[];
  categoryScores: CategoryScore[];
  progressOverTime: ProgressPoint[];
  difficultyDistribution: DifficultyStats[];
}

interface SessionSummary {
  id: string;
  date: Date;
  questionsCount: number;
  averageScore: number;
  duration: number;
  categories: string[];
}

interface CategoryScore {
  category: string;
  score: number;
  improvement: number;
  questionsCount: number;
}

interface ProgressPoint {
  date: string;
  score: number;
  sessionsCount: number;
}

interface DifficultyStats {
  level: 'basic' | 'intermediate' | 'advanced';
  count: number;
  averageScore: number;
}

interface AnalyticsDashboardProps {
  userId?: string;
  className?: string;
}

export function AnalyticsDashboard({ userId, className }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailed, setShowDetailed] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, userId]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    
    // 模擬データ（実際の実装では API から取得）
    const mockData: AnalyticsData = {
      totalSessions: 24,
      totalQuestions: 156,
      averageScore: 78.5,
      improvementRate: 12.3,
      practiceTime: 480, // minutes
      strongestCategory: '志望動機・学校理解',
      weakestCategory: '時事問題・社会への関心',
      recentSessions: [
        {
          id: '1',
          date: new Date('2024-01-15'),
          questionsCount: 8,
          averageScore: 82,
          duration: 25,
          categories: ['志望動機', '自己PR'],
        },
        {
          id: '2',
          date: new Date('2024-01-12'),
          questionsCount: 5,
          averageScore: 75,
          duration: 15,
          categories: ['学習・成績'],
        },
        {
          id: '3',
          date: new Date('2024-01-10'),
          questionsCount: 6,
          averageScore: 79,
          duration: 18,
          categories: ['小学校生活'],
        },
      ],
      categoryScores: [
        { category: '志望動機・学校理解', score: 85, improvement: 8, questionsCount: 32 },
        { category: '自己PR・将来目標', score: 82, improvement: 15, questionsCount: 28 },
        { category: '学習・成績・得意分野', score: 76, improvement: 5, questionsCount: 45 },
        { category: '小学校生活・活動', score: 78, improvement: 12, questionsCount: 25 },
        { category: '課外活動・趣味・特技', score: 74, improvement: 18, questionsCount: 18 },
        { category: '時事問題・社会への関心', score: 68, improvement: -2, questionsCount: 8 },
      ],
      progressOverTime: [
        { date: '2024-01-01', score: 65, sessionsCount: 2 },
        { date: '2024-01-08', score: 72, sessionsCount: 4 },
        { date: '2024-01-15', score: 78, sessionsCount: 6 },
        { date: '2024-01-22', score: 79, sessionsCount: 8 },
      ],
      difficultyDistribution: [
        { level: 'basic', count: 68, averageScore: 84 },
        { level: 'intermediate', count: 72, averageScore: 76 },
        { level: 'advanced', count: 16, averageScore: 65 },
      ],
    };

    setTimeout(() => {
      setAnalyticsData(mockData);
      setIsLoading(false);
    }, 1000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
  };

  const exportReport = () => {
    // レポートのエクスポート機能
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      ...analyticsData,
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-8 h-8 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={cn('text-center p-8', className)}>
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          データがありません
        </h3>
        <p className="text-gray-600">
          面接練習を開始すると、ここに統計データが表示されます。
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">練習統計</h2>
          <p className="text-gray-600">面接練習の進捗と分析結果</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 期間選択 */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">過去1週間</option>
            <option value="month">過去1ヶ月</option>
            <option value="quarter">過去3ヶ月</option>
            <option value="year">過去1年</option>
          </select>

          {/* 詳細表示切り替え */}
          <button
            onClick={() => setShowDetailed(!showDetailed)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {showDetailed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showDetailed ? '簡単表示' : '詳細表示'}</span>
          </button>

          {/* エクスポート */}
          <button
            onClick={exportReport}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>レポート出力</span>
          </button>
        </div>
      </div>

      {/* 概要カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">総練習回数</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalSessions}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {analyticsData.totalQuestions}問練習済み
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">平均スコア</p>
              <p className={cn('text-2xl font-bold', getScoreColor(analyticsData.averageScore))}>
                {analyticsData.averageScore.toFixed(1)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            {analyticsData.improvementRate > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
            )}
            <span className={getImprovementColor(analyticsData.improvementRate)}>
              {analyticsData.improvementRate > 0 ? '+' : ''}{analyticsData.improvementRate.toFixed(1)}%
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">練習時間</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(analyticsData.practiceTime)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            平均 {Math.round(analyticsData.practiceTime / analyticsData.totalSessions)}分/回
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">得意分野</p>
              <p className="text-lg font-semibold text-gray-900">
                {analyticsData.strongestCategory}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            改善点: {analyticsData.weakestCategory}
          </div>
        </motion.div>
      </div>

      {/* カテゴリ別スコア */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">カテゴリ別成績</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <BookOpen className="w-4 h-4" />
            <span>6カテゴリ</span>
          </div>
        </div>

        <div className="space-y-4">
          {analyticsData.categoryScores.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedCategory(
                selectedCategory === category.category ? null : category.category
              )}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{category.category}</h4>
                  <div className="flex items-center space-x-3">
                    <span className={cn('font-bold', getScoreColor(category.score))}>
                      {category.score}点
                    </span>
                    <div className="flex items-center space-x-1">
                      {category.improvement > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : category.improvement < 0 ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : null}
                      <span className={cn('text-sm', getImprovementColor(category.improvement))}>
                        {category.improvement > 0 ? '+' : ''}{category.improvement}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {category.questionsCount}問
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 進捗グラフと詳細統計 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 進捗グラフ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">スコア推移</h3>
          
          <div className="space-y-4">
            {analyticsData.progressOverTime.map((point, index) => (
              <div key={point.date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(point.date).toLocaleDateString('ja-JP')}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${point.score}%` }}
                    />
                  </div>
                  <span className={cn('font-medium', getScoreColor(point.score))}>
                    {point.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 難易度別統計 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">難易度別成績</h3>
          
          <div className="space-y-4">
            {analyticsData.difficultyDistribution.map((difficulty) => (
              <div key={difficulty.level} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <span className="font-medium text-gray-900 capitalize">
                    {difficulty.level === 'basic' ? '基本' : 
                     difficulty.level === 'intermediate' ? '中級' : '上級'}
                  </span>
                  <div className="text-sm text-gray-600">
                    {difficulty.count}問練習
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn('font-bold', getScoreColor(difficulty.averageScore))}>
                    {difficulty.averageScore}点
                  </div>
                  <div className="text-sm text-gray-600">
                    平均スコア
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 最近のセッション */}
      <AnimatePresence>
        {showDetailed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">最近の練習セッション</h3>
            
            <div className="space-y-4">
              {analyticsData.recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-medium text-gray-900">
                        {session.date.toLocaleDateString('ja-JP')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {session.questionsCount}問
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatDuration(session.duration)}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {session.categories.map((category) => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={cn('text-lg font-bold', getScoreColor(session.averageScore))}>
                      {session.averageScore}点
                    </div>
                    <div className="text-sm text-gray-600">平均スコア</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}