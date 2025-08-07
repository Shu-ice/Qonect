'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// 面接チャットコンポーネントをlazy load
const OptimizedInterviewChat = lazy(() => 
  import('@/components/features/interview/OptimizedInterviewChat').then(module => ({
    default: module.OptimizedInterviewChat
  }))
);
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EssayContent {
  motivation: string;
  research: string;
  schoolLife: string;
  future: string;
  inquiryLearning: string;
}

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

export default function InterviewDirectPage() {
  const router = useRouter();
  const [essayContent, setEssayContent] = useState<EssayContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [interviewStarted, setInterviewStarted] = useState(false);

  useEffect(() => {
    console.log('認証なし面接ページ初期化中...');
    loadDemoEssay();
  }, []);

  const loadDemoEssay = async () => {
    console.log('デモデータ読み込み中...');
    try {
      setLoading(true);

      // デモ用の志願理由書データ
      const demoEssay = {
        motivation: '明和高校附属中学校の探究学習に興味があります。特に理科実験や研究活動を通じて、自分の疑問を深く追求したいと思っています。',
        research: '環境問題について研究したいと思っています。特に地球温暖化と生態系への影響について詳しく調べたいです。',
        schoolLife: '部活動と勉強を両立したいです。サッカー部に入って体力をつけながら、学習にも真剣に取り組みたいです。',
        future: '将来は環境科学者になりたいです。地球環境を守る研究をして、多くの人々の役に立ちたいです。',
        inquiryLearning: '小学4年生から学校の環境委員会で校内緑化活動に取り組み、植物の育成過程を観察記録しています。特にメダカの水槽管理では水質と生態の関係性について探究し、pH値の変化が及ぼす影響を継続的に調べています。また、ペットボトルを使ったリサイクル実験も行い、資源の有効活用について研究しました。'
      };

      setEssayContent(demoEssay);
      console.log('デモデータ設定完了:', demoEssay);
    } catch (error) {
      console.error('デモデータ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionEnd = (messages: Message[]) => {
    console.log('面接セッション終了:', messages);
    router.push('/dashboard');
  };

  const startInterview = () => {
    setInterviewStarted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center shadow-2xl"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-blue-400" />
          <p className="text-white/90 text-xl">面接準備中...</p>
        </motion.div>
      </div>
    );
  }

  if (interviewStarted && essayContent) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center shadow-2xl"
          >
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-blue-400" />
            <p className="text-white/90 text-xl">面接システム起動中...</p>
          </motion.div>
        </div>
      }>
        <OptimizedInterviewChat
          essayContent={essayContent}
          onSessionEnd={handleSessionEnd}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-semibold tracking-tight text-white hover:text-white/90 transition-colors duration-300">
              Qonect
            </Link>
            <div className="text-sm font-medium text-white/60 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm">
              面接練習
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-12 shadow-2xl">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8 leading-tight">
              🎤 面接練習を始めましょう
            </h1>
            
            <p className="text-xl md:text-2xl font-light text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              明和高校附属中学校の面接官との
              <br />
              <span className="text-white/60">自然な会話練習を行います</span>
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-400/30 rounded-3xl p-8 mb-12"
            >
              <h3 className="text-2xl font-bold text-white mb-6">✨ 練習の特徴</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-white/90">来校時の交通機関から自然に開始</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-white/90">音声入力とキーボード入力に対応</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white/90">AIによる高度な質問生成</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-white/90">リアルタイムフィードバック</span>
                </div>
              </div>
            </motion.div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.button
                onClick={startInterview}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-white text-black text-xl font-semibold rounded-full hover:bg-gray-50 transition-all duration-500 shadow-2xl hover:shadow-white/30 border border-white/20"
              >
                🚀 面接練習を開始
              </motion.button>
              
              <motion.button
                onClick={() => router.push('/')}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-3 px-10 py-5 border border-white/20 text-white text-lg font-medium rounded-full hover:bg-white/5 hover:border-white/30 transition-all duration-500 backdrop-blur-xl"
              >
                <ArrowLeft className="w-5 h-5" />
                戻る
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}