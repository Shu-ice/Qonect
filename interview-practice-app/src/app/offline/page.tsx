'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoOffline = () => {
    // オフラインモードでできることを案内
    window.location.href = '/practice/offline';
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-12 shadow-2xl"
        >
          {/* Apple-style オフラインアイコン */}
          <div className="mb-12">
            <motion.svg
              className="w-32 h-32 mx-auto text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </motion.svg>
          </div>

          {/* Apple-style メッセージ */}
          <motion.h1
            className="text-5xl md:text-6xl font-bold text-white mb-8 tracking-tighter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            オフラインです
          </motion.h1>

          <motion.p
            className="text-xl text-white/80 mb-12 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            インターネット接続が利用できません。
            <br />
            <span className="text-white/60">ネットワークを確認してから再試行してください。</span>
          </motion.p>

          {/* Apple-style オフライン機能案内 */}
          <motion.div
            className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-400/30 rounded-3xl p-8 mb-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              📱 オフラインでもできること
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-white/90">保存済みの面接練習セッションの確認</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <span className="text-white/90">過去の評価結果の閲覧</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-white/90">学習ガイドと面接のコツの確認</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-white/90">音声録音練習</span>
              </div>
            </div>
          </motion.div>

          {/* Apple-style アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <motion.button
              onClick={handleRetry}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="px-12 py-5 bg-white text-black text-xl font-semibold rounded-full hover:bg-gray-50 transition-all duration-500 shadow-2xl hover:shadow-white/30 border border-white/20"
            >
              🔄 再試行
            </motion.button>

            <motion.button
              onClick={handleGoOffline}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="px-10 py-5 border border-white/20 text-white text-lg font-medium rounded-full hover:bg-white/5 hover:border-white/30 transition-all duration-500 backdrop-blur-xl"
            >
              📚 オフライン機能を利用
            </motion.button>
          </div>

          {/* Apple-style 接続状態チェック */}
          <motion.div
            className="text-base text-white/70 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center space-x-3">
              <div 
                className="w-4 h-4 bg-red-400 rounded-full animate-pulse shadow-lg"
                title="オフライン状態"
              ></div>
              <span>接続状態を監視中...</span>
            </div>
          </motion.div>

          {/* Apple-style 緊急連絡先 */}
          <motion.div
            className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-400/30 rounded-3xl p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <h3 className="text-lg font-bold text-yellow-400 mb-3">
              ⚠️ 緊急時のご案内
            </h3>
            <p className="text-white/80">
              面接当日に接続できない場合は、
              <br />
              <span className="text-white/60">学校の先生または保護者にご相談ください。</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// 自動的にオンライン状態をチェック
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network is back online');
    // 自動的にリロードまたはホームページにリダイレクト
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  });

  window.addEventListener('offline', () => {
    console.log('Network went offline');
  });
}