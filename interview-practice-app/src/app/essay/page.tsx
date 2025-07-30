'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Target } from 'lucide-react';
import Link from 'next/link';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { MascotCharacter } from '@/components/ui/MascotCharacter';
import EssayUploader, { EssaySection } from '@/components/features/essay/EssayUploader';
import EssayAnalysisDisplay from '@/components/features/essay/EssayAnalysisDisplay';
import { MeiwaInterviewSession } from '@/components/features/interview/MeiwaInterviewSession';
import { MeiwaResearchEvaluation } from '@/types/meiwa-evaluation';
import { EssayAnalysis } from '@/lib/essay-processor';

export default function EssayPage() {
  const [analyzedEssay, setAnalyzedEssay] = useState<EssaySection | null>(null);
  const [essayAnalysis, setEssayAnalysis] = useState<EssayAnalysis | null>(null);
  const [showMeiwaInterview, setShowMeiwaInterview] = useState(false);
  const [finalEvaluation, setFinalEvaluation] = useState<MeiwaResearchEvaluation | null>(null);

  const handleEssayAnalyzed = (essay: EssaySection, analysis?: EssayAnalysis, ocrResult?: any) => {
    setAnalyzedEssay(essay);
    if (analysis) {
      setEssayAnalysis(analysis);
    }
    
    // OCR結果がある場合の処理（将来の拡張用）
    if (ocrResult) {
      console.log('OCR結果:', ocrResult);
    }
  };

  const startMeiwaInterview = () => {
    if (analyzedEssay?.research) {
      setShowMeiwaInterview(true);
    }
  };

  const handleInterviewComplete = (evaluation: MeiwaResearchEvaluation) => {
    setFinalEvaluation(evaluation);
    setShowMeiwaInterview(false);
  };

  const handleInterviewExit = () => {
    setShowMeiwaInterview(false);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Apple-style ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-2xl font-semibold tracking-tight text-white hover:text-white/90 transition-colors duration-300">
                Qonect
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-xl font-semibold text-white/90">
                志願理由書アップロード
              </h1>
            </div>
            
            <div className="text-sm font-medium text-white/60 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm">
              Step 1 / 3
            </div>
          </div>
        </div>
      </nav>

      {/* 動的な背景要素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* メインコンテンツ */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
        {/* 美しい説明セクション */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-20"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-8 leading-[0.9]"
          >
            <span className="block">
              Essay
            </span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              Upload
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl font-light text-white/90 max-w-4xl mx-auto leading-relaxed tracking-wide mb-8"
          >
            あなたの志願理由書の内容を最新AIで分析し、
            <br />
            <span className="text-white/70">明和高校附属中学校の面接に特化した質問を生成します</span>
          </motion.p>
            
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-6"
          >
            <motion.div 
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex items-center space-x-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-400/30 px-8 py-4 rounded-full shadow-lg"
            >
              <Target className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-semibold text-white">明和中特化AI</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex items-center space-x-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-400/30 px-8 py-4 rounded-full shadow-lg"
            >
              <BookOpen className="w-6 h-6 text-purple-400" />
              <span className="text-lg font-semibold text-white">4項目自動分析</span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* アップローダー */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-16"
        >
          <EssayUploader onEssayAnalyzed={handleEssayAnalyzed} />
        </motion.div>

        {/* 分析結果表示 */}
        {essayAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.25, 0.8, 0.25, 1] }}
            className="mb-16"
          >
            <EssayAnalysisDisplay 
              analysis={essayAnalysis}
              onStartInterview={startMeiwaInterview}
            />
          </motion.div>
        )}

        {/* 次のステップ案内（基本分析のみの場合） */}
        {analyzedEssay && !essayAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.8, 0.25, 1] }}
            className="mb-16 text-center"
          >
            <div className="card-luxury gradient-premium text-white rounded-2xl p-10 relative overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                animate={{ x: [-100, 400] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              
              <motion.h3 
                className="text-3xl font-display font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                準備完了！
              </motion.h3>
              <motion.p 
                className="mb-8 opacity-90 text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                次は学校選択と面接設定を行います
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-6 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PremiumButton 
                    variant="secondary" 
                    size="xl" 
                    className="bg-white text-primary-700 hover:bg-white/90 btn-premium ripple-effect py-4 px-8 text-lg font-semibold"
                    onClick={startMeiwaInterview}
                  >
                    明和中面接を始める
                  </PremiumButton>
                </motion.div>
                <Link href="/schools">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PremiumButton variant="outline" size="xl" className="border-2 border-white text-white hover:bg-white/20 py-4 px-8 text-lg font-semibold">
                      他校面接を選ぶ
                    </PremiumButton>
                  </motion.div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* 明和面接セッション */}
        {showMeiwaInterview && analyzedEssay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto"
          >
            <div className="min-h-screen p-4">
              <MeiwaInterviewSession
                researchTopic={analyzedEssay.research || "探究活動"}
                essayContent={{
                  motivation: analyzedEssay.motivation || "",
                  research: analyzedEssay.research || "",
                  schoolLife: analyzedEssay.schoolLife || "",
                  future: analyzedEssay.future || ""
                }}
                onSessionComplete={handleInterviewComplete}
                onSessionExit={handleInterviewExit}
              />
            </div>
          </motion.div>
        )}

        {/* 評価結果表示 */}
        {finalEvaluation && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.8, 0.25, 1] }}
            className="mb-16 card-luxury bg-white rounded-2xl shadow-premium-xl p-10 hover-lift"
          >
            <h3 className="text-xl font-bold text-premium-900 mb-4 text-center">
              明和中7項目評価結果
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-premium-700">真の興味・関心度</span>
                  <span className="font-bold text-primary-600">{finalEvaluation.genuineInterest.score}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-premium-700">体験・学び基盤性</span>
                  <span className="font-bold text-primary-600">{finalEvaluation.experienceBase.score}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-premium-700">社会・日常連結性</span>
                  <span className="font-bold text-primary-600">{finalEvaluation.socialConnection.score}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-premium-700">探究性・非正解性</span>
                  <span className="font-bold text-primary-600">{finalEvaluation.noDefinitiveAnswer.score}/5</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-premium-700">他者理解・共感可能性</span>
                  <span className="font-bold text-primary-600">{finalEvaluation.otherUnderstanding.score}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-premium-700">自己変容・成長実感</span>
                  <span className="font-bold text-primary-600">{finalEvaluation.selfTransformation.score}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-premium-700">自分の言葉表現力</span>
                  <span className="font-bold text-primary-600">{finalEvaluation.originalExpression.score}/5</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="font-medium text-premium-800">総合スコア</span>
                  <span className="font-bold text-xl text-primary-600">{finalEvaluation.overallScore}/5</span>
                </div>
              </div>
            </div>
            
            <div className="bg-primary-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-primary-800 mb-2">総合フィードバック</h4>
              <p className="text-sm text-primary-700">{finalEvaluation.overallFeedback}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-success-50 rounded-lg p-4">
                <h4 className="font-medium text-success-800 mb-2">主な強み</h4>
                <ul className="space-y-1">
                  {finalEvaluation.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-success-700 flex items-start space-x-2">
                      <span className="w-1 h-1 bg-success-600 rounded-full mt-2 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-warning-50 rounded-lg p-4">
                <h4 className="font-medium text-warning-800 mb-2">改善提案</h4>
                <ul className="space-y-1">
                  {finalEvaluation.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-warning-700 flex items-start space-x-2">
                      <span className="w-1 h-1 bg-warning-600 rounded-full mt-2 flex-shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* ヘルプセクション */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="glass-effect bg-premium-50/80 rounded-2xl p-10 hover-lift"
        >
          <motion.h3 
            className="text-3xl font-display font-bold text-premium-900 mb-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            志願理由書について
          </motion.h3>
          
          <div className="grid md:grid-cols-2 gap-10">
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <h4 className="text-xl font-bold text-premium-800 mb-4">含めるべき内容</h4>
              <ul className="space-y-4">
                <motion.li 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="w-3 h-3 bg-primary-500 rounded-full mt-2 flex-shrink-0 shadow-glow"></span>
                  <span className="text-premium-700 font-medium">明和高校附属中学校を志望する理由</span>
                </motion.li>
                <motion.li 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="w-3 h-3 bg-primary-500 rounded-full mt-2 flex-shrink-0 shadow-glow"></span>
                  <span className="text-premium-700 font-medium">小学校で取り組んだ探究活動や調べ学習</span>
                </motion.li>
                <motion.li 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="w-3 h-3 bg-primary-500 rounded-full mt-2 flex-shrink-0 shadow-glow"></span>
                  <span className="text-premium-700 font-medium">中学校・高校での学習や活動の目標</span>
                </motion.li>
                <motion.li 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="w-3 h-3 bg-primary-500 rounded-full mt-2 flex-shrink-0 shadow-glow"></span>
                  <span className="text-premium-700 font-medium">将来の夢や目標</span>
                </motion.li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              <h4 className="text-xl font-bold text-premium-800 mb-4">AI解析のポイント</h4>
              <ul className="space-y-4">
                <motion.li 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="w-3 h-3 bg-success-500 rounded-full mt-2 flex-shrink-0 shadow-glow-success"></span>
                  <span className="text-premium-700 font-medium">明和中の教育理念との適合性を分析</span>
                </motion.li>
                <motion.li 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="w-3 h-3 bg-success-500 rounded-full mt-2 flex-shrink-0 shadow-glow-success"></span>
                  <span className="text-premium-700 font-medium">探究活動の具体性と深さを評価</span>
                </motion.li>
                <motion.li 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="w-3 h-3 bg-success-500 rounded-full mt-2 flex-shrink-0 shadow-glow-success"></span>
                  <span className="text-premium-700 font-medium">個別最適化された質問を自動生成</span>
                </motion.li>
                <motion.li 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="w-3 h-3 bg-success-500 rounded-full mt-2 flex-shrink-0 shadow-glow-success"></span>
                  <span className="text-premium-700 font-medium">回答の改善点を具体的に提案</span>
                </motion.li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}