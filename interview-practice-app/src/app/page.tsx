'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Mic, 
  BookOpen, 
  Target, 
  Users, 
  Sparkles,
  ArrowRight,
  Play,
  Star
} from 'lucide-react';
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from '@/components/ui/PremiumCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { MascotCharacter, MascotSelector } from '@/components/ui/MascotCharacter';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import type { MascotType } from '@/components/ui/MascotCharacter';

export default function HomePage() {
  const [selectedMascot, setSelectedMascot] = useState<MascotType>('friendly-bear');
  const [showDemo, setShowDemo] = useState(false);

  const features = useMemo(() => [
    {
      icon: <Target className="w-8 h-8" />,
      title: '明和高校附属中特化',
      description: '探究活動を重視した質問生成で、明和の面接傾向に完全対応',
      color: 'text-primary-600'
    },
    {
      icon: <Mic className="w-8 h-8" />,
      title: '音声入力対応',
      description: 'タブレット・スマホで簡単音声入力。本格的な面接練習が可能',
      color: 'text-success-600'
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: '志願理由書連動',
      description: 'あなたの志願理由書から個別最適化された質問を自動生成',
      color: 'text-secondary-600'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: '小学生特化設計',
      description: 'マスコットキャラクターと一緒に楽しく、安心して練習',
      color: 'text-accent-purple'
    }
  ], []);

  const schools = useMemo(() => [
    '明和高校附属中学校',
    '刈谷高校附属中学校', 
    '津島高校附属中学校',
    '半田高校附属中学校'
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* ヒーローセクション */}
      <section className="relative px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* メインタイトル */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-premium-900 mb-4">
              <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                面接練習アプリ
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-premium-700 mb-6">
              愛知県公立中高一貫校の面接に特化した
              <br className="hidden md:block" />
              小学6年生向け練習アプリ
            </p>
            
            {/* 対象校 */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {schools.map((school, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                >
                  {school}
                </span>
              ))}
            </div>
          </motion.div>

          {/* マスコットキャラクター */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <MascotCharacter
              type={selectedMascot}
              size="xl"
              emotion="happy"
              animation="floating"
              message="一緒に面接練習を頑張りましょう！"
            />
          </motion.div>

          {/* CTAボタン */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <PremiumButton
              size="xl"
              variant="premium"
              onClick={() => setShowDemo(true)}
              className="min-w-[200px]"
            >
              <Play className="w-5 h-5 mr-2" />
              デモを試す
            </PremiumButton>
            
            <Link href="/essay">
              <PremiumButton
                size="xl"
                variant="outline"
                className="min-w-[200px]"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                志願理由書アップロード
              </PremiumButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="px-4 py-16 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-premium-900 mb-4">
              なぜ選ばれるのか
            </h2>
            <p className="text-lg text-premium-600">
              他にはない特別な機能で、確実な合格をサポート
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <PremiumCard
                  variant="elevated"
                  className="h-full text-center p-6 hover:shadow-glow transition-all duration-300"
                >
                  <div className={`mb-4 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-premium-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-premium-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* マスコット選択セクション */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-premium-900 mb-4">
              お気に入りのキャラクターを選ぼう
            </h2>
            <p className="text-lg text-premium-600">
              一緒に練習してくれる、頼れるパートナー
            </p>
          </motion.div>

          <MascotSelector
            selected={selectedMascot}
            onSelect={setSelectedMascot}
          />
        </div>
      </section>

      {/* デモセクション */}
      {showDemo && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 py-16 bg-premium-50"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-premium-900 mb-4">
                音声認識デモ
              </h2>
              <p className="text-lg text-premium-600">
                実際の音声入力機能を体験してみましょう
              </p>
            </div>

            <PremiumCard variant="premium" className="p-8">
              <VoiceRecorder
                placeholder="マイクボタンを押して、自己紹介をしてみてください"
                onTranscriptChange={(transcript) => {
                  console.log('Transcript:', transcript);
                }}
                context="practice"
                maxDuration={60}
                showTranscript={true}
                showAudioVisualization={true}
              />
            </PremiumCard>

            <div className="text-center mt-6">
              <PremiumButton
                variant="ghost"
                onClick={() => setShowDemo(false)}
              >
                デモを閉じる
              </PremiumButton>
            </div>
          </div>
        </motion.section>
      )}

      {/* 評価・実績セクション */}
      <section className="px-4 py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              利用者の声
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-secondary-400 text-secondary-400" />
                  ))}
                </div>
                <p className="text-white/90 mb-4">
                  「マスコットキャラクターがいるから、緊張せずに練習できました！」
                </p>
                <p className="text-white/70 text-sm">
                  小学6年生 Aさん
                </p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-secondary-400 text-secondary-400" />
                  ))}
                </div>
                <p className="text-white/90 mb-4">
                  「明和の面接傾向に特化していて、本当に役立ちました。」
                </p>
                <p className="text-white/70 text-sm">
                  保護者 Bさん
                </p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-secondary-400 text-secondary-400" />
                  ))}
                </div>
                <p className="text-white/90 mb-4">
                  「音声入力が簡単で、家でも手軽に練習できます。」
                </p>
                <p className="text-white/70 text-sm">
                  小学6年生 Cさん
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="px-4 py-16 bg-gradient-to-br from-secondary-50 to-primary-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-premium-900 mb-4">
              今すぐ面接練習を始めよう
            </h2>
            <p className="text-lg text-premium-600 mb-8">
              2026年入試に向けて、今から準備を始めませんか？
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumButton
                size="xl" 
                variant="premium"
                className="min-w-[200px]"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                無料で始める
              </PremiumButton>
              
              <PremiumButton
                size="xl"
                variant="outline"
                className="min-w-[200px]"
              >
                資料をダウンロード
                <ArrowRight className="w-5 h-5 ml-2" />
              </PremiumButton>
            </div>
            
            <p className="text-sm text-premium-500 mt-4">
              ※ 保護者の同意が必要です
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}