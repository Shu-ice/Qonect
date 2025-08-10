'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BookOpen, Mic, BarChart3, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* 高級感のあるナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-semibold tracking-tight text-white hover:text-white/90 transition-colors duration-300">
              Qonect
            </Link>
            
            <div className="text-sm font-medium text-white/60 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm">
              Dashboard
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* 美しいヘッダー */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center mb-24"
          >
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-8 leading-tight">
              学習を始めましょう
            </h1>
            <p className="text-xl md:text-2xl font-light text-white/80 max-w-3xl mx-auto leading-relaxed">
              あなたの成功への道のりを、
              <br className="hidden md:block" />
              <span className="text-white/60">一歩ずつサポートします</span>
            </p>
          </motion.div>

          {/* アクションカード */}
          <div className="grid lg:grid-cols-2 gap-8 mb-20">
            {/* 志願理由書 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Link href="/essay">
                <motion.div
                  whileHover={{ y: -12, scale: 1.03 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="group relative p-10 rounded-3xl bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-700 cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-blue-500/20"
                >
                  {/* 高級感のある背景グラデーション */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/25 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-blue-500/30">
                        <BookOpen className="w-10 h-10 text-white" />
                      </div>
                      <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-white/80 group-hover:translate-x-2 transition-all duration-300" />
                    </div>
                    
                    <h2 className="text-4xl font-bold text-white mb-6">
                      志願理由書
                    </h2>
                    <p className="text-white/80 leading-relaxed mb-8 text-lg">
                      あなたの志願理由書をアップロードして、
                      <br />
                      <span className="text-white/60">完全にパーソナライズされた面接練習を開始しましょう</span>
                    </p>
                    
                    <div className="flex items-center gap-2 text-blue-400">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-sm font-medium">未完了</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* 面接練習 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Link href="/interview">
                <motion.div
                  whileHover={{ y: -12, scale: 1.03 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="group relative p-10 rounded-3xl bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-700 cursor-pointer overflow-hidden hover:shadow-2xl hover:shadow-purple-500/20"
                >
                  {/* 高級感のある背景グラデーション */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent group-hover:from-purple-500/25 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-purple-500/30">
                        <Mic className="w-10 h-10 text-white" />
                      </div>
                      <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-white/80 group-hover:translate-x-2 transition-all duration-300" />
                    </div>
                    
                    <h2 className="text-4xl font-bold text-white mb-6">
                      音声練習
                    </h2>
                    <p className="text-white/80 leading-relaxed mb-8 text-lg">
                      最新のAI技術による音声認識で、
                      <br />
                      <span className="text-white/60">実際の面接官との対話を体験しましょう</span>
                    </p>
                    
                    <div className="flex items-center gap-2 text-purple-400">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-sm font-medium">0回の練習</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* 美しい進捗セクション */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative p-12 rounded-3xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 mb-20 hover:border-white/20 transition-all duration-700 hover:shadow-2xl hover:shadow-white/10"
          >
            <h2 className="text-4xl font-bold text-white mb-12 text-center">
              学習進捗
            </h2>
            
            <div className="grid md:grid-cols-3 gap-10">
              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                className="text-center group"
              >
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20 group-hover:border-blue-400/40 transition-all duration-500 shadow-lg group-hover:shadow-blue-500/30">
                  <BookOpen className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">志願理由書</h3>
                <p className="text-white/60 text-base">まずはここから始めましょう</p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                className="text-center group"
              >
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-purple-500/20 group-hover:border-purple-400/40 transition-all duration-500 shadow-lg group-hover:shadow-purple-500/30">
                  <Mic className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">面接練習</h3>
                <p className="text-white/60 text-base">0回完了</p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                className="text-center group"
              >
                <div className="w-24 h-24 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 group-hover:border-emerald-400/40 transition-all duration-500 shadow-lg group-hover:shadow-emerald-500/30">
                  <BarChart3 className="w-12 h-12 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">総合スコア</h3>
                <p className="text-white/60 text-base">練習を開始してください</p>
              </motion.div>
            </div>
          </motion.div>

          {/* 高級感のCTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center"
          >
            <Link href="/essay">
              <motion.button
                whileHover={{ scale: 1.05, y: -6 }}
                whileTap={{ scale: 0.95 }}
                className="px-16 py-6 bg-white text-black text-xl font-bold rounded-full hover:bg-gray-50 transition-all duration-500 shadow-2xl hover:shadow-white/40 border border-white/20"
              >
                今すぐ始める
                <ArrowRight className="inline ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}