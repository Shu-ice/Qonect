'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-medium tracking-tight text-white"
            >
              Qonect
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link 
                href="/dashboard"
                className="text-white/70 hover:text-white transition-colors text-sm font-medium px-4 py-2 rounded-full hover:bg-white/10"
              >
                Dashboard
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="relative pt-24 pb-20 px-6 min-h-screen flex items-center">
        {/* 高級感のある背景グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        
        {/* 洗練された動的背景要素 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-8 leading-[0.9]">
              <span className="block">
                Interview
              </span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                Perfection
              </span>
            </h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl md:text-2xl font-light text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed tracking-wide"
            >
              明和高校附属中学校のための
              <br />
              <span className="text-white/70">次世代AI面接練習システム</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-10 py-5 bg-white text-black text-lg font-semibold rounded-full hover:bg-gray-50 transition-all duration-500 shadow-2xl hover:shadow-white/30 border border-white/10"
                >
                  始める
                  <ArrowRight className="inline ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.button>
              </Link>
              
              <Link href="/interview">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 border border-white/20 text-white text-lg font-medium rounded-full hover:bg-white/5 hover:border-white/30 transition-all duration-500 backdrop-blur-xl"
                >
                  音声練習を体験
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* スクロールインジケーター */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-3 bg-white/60 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </section>

      {/* 機能セクション */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8 text-white">
              革新的な学習体験
            </h2>
            <p className="text-xl font-light text-white/80 max-w-3xl mx-auto">
              最先端のAI技術があなたの面接スキルを
              <br />
              <span className="text-white/60">次のレベルへと導きます</span>
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                title: "パーソナライズ",
                description: "あなただけの志願理由書を分析し、完全にカスタマイズされた質問を生成",
                gradient: "from-blue-500 to-cyan-400"
              },
              {
                title: "リアルタイム",
                description: "最新の音声認識技術による、まるで本物の面接官との対話",
                gradient: "from-purple-500 to-pink-400"
              },
              {
                title: "成長分析",
                description: "AIによる詳細分析で、あなたの強みと改善点を明確に可視化",
                gradient: "from-emerald-500 to-teal-400"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -12, scale: 1.03 }}
                transition={{ 
                  delay: index * 0.2, 
                  duration: 0.6,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                viewport={{ once: true }}
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-700 hover:shadow-2xl hover:shadow-white/10"
              >
                <div className={`w-16 h-16 rounded-3xl bg-gradient-to-r ${feature.gradient} mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`} />
                <h3 className="text-2xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="relative py-32 px-6">
        {/* 美しいグラデーション背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-indigo-900/20 backdrop-blur-3xl" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8 text-white">
              今すぐ体験する
            </h2>
            <p className="text-xl font-light text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              志願理由書をアップロードするだけで
              <br />
              <span className="text-white/60">あなた専用の面接練習が始まります</span>
            </p>
            
            <Link href="/essay">
              <motion.button
                whileHover={{ scale: 1.05, y: -6 }}
                whileTap={{ scale: 0.95 }}
                className="px-16 py-6 bg-white text-black text-xl font-semibold rounded-full hover:bg-gray-50 transition-all duration-500 shadow-2xl hover:shadow-white/40 border border-white/20"
              >
                無料で始める
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* フッター */}
      <footer className="relative border-t border-white/5 bg-gradient-to-t from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-3xl font-medium tracking-tight text-white mb-8 md:mb-0"
            >
              Qonect
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-white/40 text-sm font-light text-center md:text-right"
            >
              © 2024 Qonect.
              <br className="md:hidden" />
              <span className="hidden md:inline"> </span>
              明和高校附属中学校面接練習システム
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
}