'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Download, RefreshCw, Home, FileText, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'interviewer' | 'student';
  content: string;
  timestamp: Date;
}

interface MeiwaResearchEvaluation {
  curiosity: number;              // 探究心
  empathy: number;                // 共感力
  tolerance: number;              // 寛容性
  persistence: number;            // 粘り強さ
  reflection: number;             // リフレクション力
  logicalExpression: number;      // 論理的表現力
  overallScore: number;
  overallGrade: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
}

interface EvaluationData {
  evaluation: MeiwaResearchEvaluation;
  summary: string;
  explorationHighlight: string;
  impressiveAnswers: string[];
  sessionInfo: {
    duration: number;
    conversationCount: number;
  };
}

interface InterviewEvaluationScreenProps {
  messages: Message[];
  sessionDuration: number;
  onRetry: () => void;
  onBackToDashboard: () => void;
}

export function InterviewEvaluationScreen({
  messages,
  sessionDuration,
  onRetry,
  onBackToDashboard
}: InterviewEvaluationScreenProps) {
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConversation, setShowConversation] = useState(false);

  // 評価データの取得
  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setIsLoading(true);
        console.log('📊 面接評価を取得中...');
        
        const response = await fetch('/api/interview/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationHistory: messages.map(m => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp
            })),
            sessionDuration
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ 評価データ取得成功:', data);
        setEvaluationData(data);
        
      } catch (error) {
        console.error('❌ 評価取得エラー:', error);
        // エラー時はフォールバックデータを表示（6軸）
        setEvaluationData({
          evaluation: {
            curiosity: 3,
            empathy: 3,
            tolerance: 3,
            persistence: 3,
            reflection: 3,
            logicalExpression: 3,
            overallScore: 3.0,
            overallGrade: 'C',
            strengths: ['面接に真剣に取り組まれました'],
            improvements: ['より具体的な体験談があるとよいでしょう'],
            suggestions: ['次回は探究活動について詳しく準備しましょう']
          },
          summary: '面接お疲れさまでした。',
          explorationHighlight: '探究活動について話していただきました。',
          impressiveAnswers: ['誠実にお答えいただきました。'],
          sessionInfo: { duration: sessionDuration, conversationCount: messages.length }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluation();
  }, [messages, sessionDuration]);

  // レーダーチャートデータの準備（6軸）
  const getRadarData = () => {
    if (!evaluationData) return [];
    
    const { evaluation } = evaluationData;
    return [
      { subject: '探究心', score: evaluation.curiosity, fullMark: 5 },
      { subject: '共感力', score: evaluation.empathy, fullMark: 5 },
      { subject: '寛容性', score: evaluation.tolerance, fullMark: 5 },
      { subject: '粘り強さ', score: evaluation.persistence, fullMark: 5 },
      { subject: 'リフレクション力', score: evaluation.reflection, fullMark: 5 },
      { subject: '論理的表現力', score: evaluation.logicalExpression, fullMark: 5 },
    ];
  };

  // グレード色の取得
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-yellow-400';
      case 'D': return 'text-orange-400';
      case 'E': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
          <h2 className="text-2xl font-bold mb-2">評価分析中...</h2>
          <p className="text-white/60">AIが面接内容を詳しく分析しています</p>
        </motion.div>
      </div>
    );
  }

  if (showConversation) {
    return (
      <ConversationDetailScreen
        messages={messages}
        sessionDuration={sessionDuration}
        onBack={() => setShowConversation(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">面接評価結果</h1>
          <p className="text-white/60">明和中学校6軸評価システム（愛知県公式基準）</p>
        </motion.div>

        {evaluationData && (
          <div className="space-y-8">
            {/* 総合評価 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 rounded-3xl p-8 text-center border border-white/10"
            >
              <h2 className="text-2xl font-bold mb-4">総合評価</h2>
              <div className="flex items-center justify-center gap-6">
                <div className={`text-6xl font-bold ${getGradeColor(evaluationData.evaluation.overallGrade)}`}>
                  {evaluationData.evaluation.overallGrade}
                </div>
                <div className="text-left">
                  <div className="text-2xl font-semibold">
                    {evaluationData.evaluation.overallScore.toFixed(1)} / 5.0
                  </div>
                  <div className="text-white/60">
                    {Math.round(evaluationData.evaluation.overallScore * 20)}点 / 100点
                  </div>
                </div>
              </div>
            </motion.div>

            {/* レーダーチャート */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 rounded-3xl p-8 border border-white/10"
            >
              <h3 className="text-2xl font-bold mb-6 text-center">6軸詳細評価</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={getRadarData()}>
                    <PolarGrid gridType="polygon" radialLines={true} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#ffffff' }} />
                    <PolarRadiusAxis
                      domain={[0, 5]}
                      tick={{ fontSize: 10, fill: '#ffffff80' }}
                      angle={90}
                    />
                    <Radar
                      name="評価"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* 強み */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-green-500/10 rounded-3xl p-6 border border-green-500/20"
              >
                <h3 className="text-xl font-bold mb-4 text-green-400">✨ あなたの強み</h3>
                <ul className="space-y-2">
                  {evaluationData.evaluation.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* 改善点 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-500/10 rounded-3xl p-6 border border-blue-500/20"
              >
                <h3 className="text-xl font-bold mb-4 text-blue-400">🎯 さらなる成長のために</h3>
                <ul className="space-y-2">
                  {evaluationData.evaluation.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* 次回への提案 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-purple-500/10 rounded-3xl p-6 border border-purple-500/20"
            >
              <h3 className="text-xl font-bold mb-4 text-purple-400">🚀 次回に向けて</h3>
              <ul className="space-y-2">
                {evaluationData.evaluation.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* 総評 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 rounded-3xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold mb-4">📝 面接総評</h3>
              <p className="text-white/80 leading-relaxed">{evaluationData.summary}</p>
              
              {evaluationData.explorationHighlight && (
                <div className="mt-4 p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                  <h4 className="text-lg font-semibold text-yellow-400 mb-2">🔍 探究活動のハイライト</h4>
                  <p className="text-white/80">{evaluationData.explorationHighlight}</p>
                </div>
              )}
            </motion.div>

            {/* アクションボタン */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                もう一度面接を受ける
              </button>
              
              <button
                onClick={onBackToDashboard}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-colors"
              >
                <Home className="w-5 h-5" />
                ダッシュボードに戻る
              </button>
            </motion.div>

            {/* 復習リンク */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center border-t border-white/10 pt-6"
            >
              <button
                onClick={() => setShowConversation(true)}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <FileText className="w-4 h-4" />
                👀 面接のやりとりを全て見る（復習用）
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

// やりとり詳細画面コンポーネント
function ConversationDetailScreen({
  messages,
  sessionDuration,
  onBack
}: {
  messages: Message[];
  sessionDuration: number;
  onBack: () => void;
}) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs.toString().padStart(2, '0')}秒`;
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">📝 面接やりとり詳細</h1>
            <p className="text-white/60">
              ⏱️ 面接時間: {formatDuration(sessionDuration)} | 💬 やりとり回数: {messages.length}回
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            戻る
          </button>
        </motion.div>

        {/* 会話履歴 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`p-4 rounded-2xl border ${
                message.role === 'interviewer'
                  ? 'bg-blue-500/10 border-blue-500/20 ml-0 mr-8'
                  : 'bg-green-500/10 border-green-500/20 ml-8 mr-0'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-semibold ${
                  message.role === 'interviewer' ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {message.role === 'interviewer' ? '🤖 面接官' : '👤 あなた'}
                </span>
                <span className="text-xs text-white/40">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <p className="text-white/90 leading-relaxed">{message.content}</p>
            </div>
          ))}
        </motion.div>

        {/* アクション */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-4 mt-8 pt-8 border-t border-white/10"
        >
          <button className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl transition-colors">
            <Download className="w-5 h-5" />
            PDF形式で保存
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors"
          >
            評価画面に戻る
          </button>
        </motion.div>
      </div>
    </div>
  );
}