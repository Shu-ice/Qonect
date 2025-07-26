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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-premium-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <PremiumButton variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  ホームに戻る
                </PremiumButton>
              </Link>
              <div className="h-6 w-px bg-premium-300" />
              <h1 className="text-xl font-bold text-premium-900">
                志願理由書アップロード
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-premium-800">準備段階</p>
                <p className="text-xs text-premium-600">Step 1 / 3</p>
              </div>
              <MascotCharacter
                type="wise-owl"
                size="sm"
                emotion="encouraging"
                animation="nodding"
              />
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 説明セクション */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <BookOpen className="w-8 h-8 text-primary-600" />
              <h2 className="text-3xl font-bold text-premium-900">
                志願理由書を読み込みましょう
              </h2>
            </div>
            
            <p className="text-lg text-premium-700 max-w-2xl mx-auto">
              あなたの志願理由書の内容を分析して、明和高校附属中学校の面接に特化した質問を生成します。
              探究活動の詳細について深く掘り下げた練習ができるようになります。
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="flex items-center space-x-2 bg-primary-50 px-3 py-2 rounded-full">
                <Target className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">明和中特化</span>
              </div>
              <div className="flex items-center space-x-2 bg-success-50 px-3 py-2 rounded-full">
                <BookOpen className="w-4 h-4 text-success-600" />
                <span className="text-sm font-medium text-success-800">4項目自動分析</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* アップローダー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <EssayUploader onEssayAnalyzed={handleEssayAnalyzed} />
        </motion.div>

        {/* 分析結果表示 */}
        {essayAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-xl p-6">
              <h3 className="text-xl font-bold mb-2">準備完了！</h3>
              <p className="mb-4 opacity-90">
                次は学校選択と面接設定を行います
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PremiumButton 
                  variant="premium" 
                  size="lg" 
                  className="bg-white text-primary-700 hover:bg-premium-50"
                  onClick={startMeiwaInterview}
                >
                  明和中面接を始める
                </PremiumButton>
                <Link href="/schools">
                  <PremiumButton variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    他校面接を選ぶ
                  </PremiumButton>
                </Link>
              </div>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-xl shadow-lg p-6"
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-premium-50 rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-premium-900 mb-4 text-center">
            志願理由書について
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-premium-800">含めるべき内容</h4>
              <ul className="space-y-2 text-sm text-premium-700">
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>明和高校附属中学校を志望する理由</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>小学校で取り組んだ探究活動や調べ学習</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>中学校・高校での学習や活動の目標</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>将来の夢や目標</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-premium-800">AI解析のポイント</h4>
              <ul className="space-y-2 text-sm text-premium-700">
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-success-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>明和中の教育理念との適合性を分析</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-success-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>探究活動の具体性と深さを評価</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-success-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>個別最適化された質問を自動生成</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-success-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>回答の改善点を具体的に提案</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}