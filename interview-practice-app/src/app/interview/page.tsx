'use client';

import React, { useState, useEffect } from 'react';
// import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { OptimizedInterviewChat } from '@/components/features/interview/OptimizedInterviewChat';
import { InterviewEvaluationScreen } from '@/components/features/interview/evaluation/InterviewEvaluationScreen';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { MascotCharacter } from '@/components/ui/MascotCharacter';
import { Loader2, AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EssayContent {
  motivation: string;
  research: string;
  schoolLife: string;
  future: string;
  inquiryLearning: string; // 探究学習の実績・経験（300字程度）
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

export default function InterviewPage() {
  // const { data: session, status } = useSession();
  const router = useRouter();
  const [essayContent, setEssayContent] = useState<EssayContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ページの状態を管理する単一のstate
  const [pageState, setPageState] = useState<'start' | 'interview' | 'evaluation'>('start');
  const [interviewMessages, setInterviewMessages] = useState<Message[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // デバッグ用状態ログ
  React.useEffect(() => {
    console.log('📊 InterviewPage 状態更新:');
    console.log('  - loading:', loading);
    console.log('  - error:', error);
    console.log('  - pageState:', pageState);
    console.log('  - interviewMessages.length:', interviewMessages.length);
    console.log('  - sessionDuration:', sessionDuration);
    console.log('  - essayContent:', essayContent ? 'あり' : 'なし');
    
    // 評価画面表示状態の確認
    if (pageState === 'evaluation' && interviewMessages.length > 0) {
      console.log('✅ 評価画面表示条件が整っています');
    }
  }, [loading, error, pageState, interviewMessages, sessionDuration, essayContent]);

  useEffect(() => {
    // デバッグ用：認証をスキップしてデモデータを使用
    console.log('面接ページ初期化中...');
    loadUserEssayDemo();
  }, []);

  const loadUserEssayDemo = async () => {
    console.log('デモデータ読み込み中...');
    try {
      setLoading(true);
      setError(null);

      // デモ用の志願理由書データ
      const demoEssay = {
        motivation: '明和高校附属中学校の探究学習に興味があります。',
        research: '環境問題について研究したいと思っています。',
        schoolLife: '部活動と勉強を両立したいです。',
        future: '将来は環境科学者になりたいです。',
        inquiryLearning: '小学4年生から学校の環境委員会で校内緑化活動に取り組み、植物の育成過程を観察記録しています。特にメダカの水槽管理では水質と生態の関係性について探究し、pH値の変化が及ぼす影響を継続的に調べています。'
      };

      setEssayContent(demoEssay);
      console.log('デモデータ設定完了:', demoEssay);
    } catch (error) {
      console.error('デモデータ読み込みエラー:', error);
      setError('デモデータの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadUserEssay = async () => {
    try {
      setLoading(true);
      setError(null);

      // ユーザーの最新の志願理由書を取得
      const response = await fetch('/api/user/essays');
      
      if (!response.ok) {
        throw new Error('志願理由書の取得に失敗しました');
      }

      const essays = await response.json();
      
      if (essays.length === 0) {
        setError('志願理由書が見つかりません。先にエッセイページで志願理由書を作成してください。');
        return;
      }

      // 最新のエッセイを使用
      const latestEssay = essays[0];
      setEssayContent({
        motivation: latestEssay.motivation || '',
        research: latestEssay.research || '',
        schoolLife: latestEssay.schoolLife || '',
        future: latestEssay.future || '',
        inquiryLearning: latestEssay.inquiryLearning || '探究学習の経験をここに記載してください。'
      });

    } catch (error) {
      console.error('志願理由書読み込みエラー:', error);
      setError(error instanceof Error ? error.message : '志願理由書の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionEnd = React.useCallback((messages: Message[], duration?: number) => {
    console.log('🎯 [NEW] handleSessionEndが呼び出されました');
    console.log('📊 現在の状態:');
    console.log('  - pageState:', pageState);
    console.log('  - interviewMessages.length:', interviewMessages.length);
    
    // 二重実行防止
    if (pageState === 'evaluation') {
      console.log('⚠️ 既に評価画面表示中のためスキップ');
      return;
    }
    
    console.log('🎯 面接セッション終了処理開始');
    console.log('📊 受信データ:');
    console.log('  - メッセージ数:', messages.length);
    console.log('  - セッション時間:', duration, '秒');
    
    if (messages.length === 0) {
      console.error('❌ メッセージが空です！');
      return;
    }
    
    console.log('  - 最初のメッセージ:', messages[0]?.content?.substring(0, 50));
    console.log('  - 最後のメッセージ:', messages[messages.length - 1]?.content?.substring(0, 50));
    
    console.log('🔄 状態を更新中...');
    
    // メッセージとセッション時間を保存
    setInterviewMessages(messages);
    setSessionDuration(duration || 0);
    
    // ページ状態を評価画面に変更
    console.log('🎯 pageStateをevaluationに変更');
    setPageState('evaluation');
    
    console.log('✅ handleSessionEnd処理完了 - 評価画面表示に切り替え');
  }, [pageState, interviewMessages.length]);

  const startInterview = () => {
    console.log('🎯 面接開始');
    setPageState('interview');
  };

  console.log('🔍 [NEW] InterviewPage レンダリング状態チェック:');
  console.log('  - loading:', loading);
  console.log('  - error:', error);
  console.log('  - pageState:', pageState);
  console.log('  - interviewMessages.length:', interviewMessages.length);
  console.log('  - essayContent:', essayContent ? 'あり' : 'なし');

  if (loading) {
    console.log('📋 Loading画面を表示');
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center shadow-2xl"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-blue-400" />
          <p className="text-white/90 text-xl">読み込み中...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    console.log('❌ Error画面を表示:', error);
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Apple-style ナビゲーション */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-semibold tracking-tight text-white hover:text-white/90 transition-colors duration-300">
                Qonect
              </Link>
              <div className="text-sm font-medium text-white/60 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm">
                Interview
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-24 pb-20 px-6 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-12 shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-8">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <h1 className="text-3xl font-bold text-white">
                  エラーが発生しました
                </h1>
              </div>
              
              <p className="text-white/80 mb-10 text-lg leading-relaxed">
                {error}
              </p>
              
              <div className="flex gap-6 justify-center">
                <motion.button
                  onClick={() => router.push('/essay')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg font-semibold"
                >
                  <FileText className="w-5 h-5" />
                  志願理由書を作成
                </motion.button>
                
                <motion.button
                  onClick={() => router.push('/dashboard')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl transition-all duration-300 border border-white/20 backdrop-blur-sm font-semibold"
                >
                  <ArrowLeft className="w-5 h-5" />
                  ダッシュボードに戻る
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (pageState === 'start' && essayContent) {
    console.log('🚀 面接開始前画面を表示');
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Apple-style ナビゲーション */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-semibold tracking-tight text-white hover:text-white/90 transition-colors duration-300">
                Qonect
              </Link>
              <div className="text-sm font-medium text-white/60 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm">
                Interview
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
                面接練習を始めましょう
              </h1>
              
              <p className="text-xl md:text-2xl font-light text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
                あなたの志願理由書を基に、明和高校附属中学校の面接官との
                <br />
                <span className="text-white/60">自然な会話練習を行います</span>
              </p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-400/30 rounded-3xl p-8 mb-12"
              >
                <h3 className="text-2xl font-bold text-white mb-6">練習の特徴</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-white/90">志願理由書の内容に基づいた個別質問</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span className="text-white/90">音声入力とキーボード入力に対応</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-white/90">リアルタイムフィードバック</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-white/90">自然な会話の流れで面接練習</span>
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
                  面接練習を開始
                </motion.button>
                
                <motion.button
                  onClick={() => router.push('/dashboard')}
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

  // 評価画面の表示 - 最優先チェック
  if (pageState === 'evaluation' && interviewMessages.length > 0) {
    console.log('🎯 評価画面を表示中');
    console.log('  - pageState:', pageState);
    console.log('  - interviewMessages.length:', interviewMessages.length);
    console.log('  - sessionDuration:', sessionDuration);
    
    return (
      <InterviewEvaluationScreen
        messages={interviewMessages}
        sessionDuration={sessionDuration}
        onRetry={() => {
          console.log('🔄 面接をもう一度実行');
          
          // 状態をリセット
          setInterviewMessages([]);
          setSessionDuration(0);
          setPageState('interview');
          
          console.log('✅ 面接リトライ準備完了');
        }}
        onBackToDashboard={() => {
          console.log('🏠 ダッシュボードに戻る');
          router.push('/dashboard');
        }}
      />
    );
  }

  if (pageState === 'interview' && essayContent) {
    console.log('💬 面接チャット画面を表示');
    return (
      <OptimizedInterviewChat
        essayContent={essayContent}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  console.log('⚠️ どの条件にも該当しない - nullを返す');
  console.log('最終状態:', { 
    loading, 
    error, 
    pageState,
    interviewMessages: interviewMessages.length,
    essayContent: !!essayContent 
  });
  return null;
}