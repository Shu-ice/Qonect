'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Star, Trophy, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningProgressProps {
  progress: number; // 0-100
  streak: number;
  level: number;
  exp: number;
  nextLevelExp: number;
  achievements: Achievement[];
  className?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedAt?: Date;
}

export function LearningProgress({
  progress,
  streak,
  level,
  exp,
  nextLevelExp,
  achievements,
  className
}: LearningProgressProps) {
  const expProgress = (exp / nextLevelExp) * 100;

  return (
    <div className={cn('space-y-6', className)}>
      {/* メインプログレス */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-premium p-6"
      >
        <h3 className="text-lg font-semibold text-premium-900 mb-4">学習進捗</h3>
        
        {/* 円形プログレス */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-premium-200"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-primary-500"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                strokeDasharray: `${2 * Math.PI * 88}`,
                strokeDashoffset: `${2 * Math.PI * 88 * (1 - progress / 100)}`
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-premium-900">{progress}%</span>
            <span className="text-sm text-premium-600">完了</span>
          </div>
        </div>

        {/* ストリーク */}
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-3"
          >
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="font-semibold text-orange-800">{streak}日連続学習中！</span>
          </motion.div>
        )}
      </motion.div>

      {/* レベル＆経験値 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-premium p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-premium-900">レベル {level}</h3>
          <span className="text-sm text-premium-600">{exp} / {nextLevelExp} EXP</span>
        </div>
        
        <div className="relative h-6 bg-premium-200 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-400 to-primary-600"
            initial={{ width: 0 }}
            animate={{ width: `${expProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white drop-shadow">
              {Math.round(expProgress)}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* アチーブメント */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-premium p-6"
      >
        <h3 className="text-lg font-semibold text-premium-900 mb-4">実績</h3>
        
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {achievements.slice(0, 8).map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className={cn(
                'relative aspect-square rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300',
                achievement.unlocked
                  ? 'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-800 shadow-md hover:shadow-lg'
                  : 'bg-premium-100 text-premium-400'
              )}
            >
              <div className={cn(
                'w-8 h-8 mb-1',
                achievement.unlocked ? 'text-primary-600' : 'text-premium-400'
              )}>
                {achievement.icon}
              </div>
              <span className="text-xs font-medium line-clamp-2">
                {achievement.title}
              </span>
              {achievement.unlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
                >
                  <Star className="w-3 h-3 text-yellow-900 fill-current" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// 達成アニメーション
export function AchievementUnlock({ achievement }: { achievement: Achievement }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -50 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="fixed inset-x-0 top-20 z-50 mx-auto max-w-sm"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-20 h-20 mx-auto mb-4 text-primary-600"
          >
            {achievement.icon}
          </motion.div>
          <h3 className="text-xl font-bold text-premium-900 mb-2">
            実績解除！
          </h3>
          <p className="text-lg font-semibold text-primary-600 mb-1">
            {achievement.title}
          </p>
          <p className="text-sm text-premium-600">
            {achievement.description}
          </p>
          
          {/* 紙吹雪エフェクト */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: 0,
                  y: 0,
                  rotate: 0,
                  opacity: 1
                }}
                animate={{
                  x: (Math.random() - 0.5) * 300,
                  y: Math.random() * 400 + 100,
                  rotate: Math.random() * 720,
                  opacity: 0
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
                className="absolute top-1/2 left-1/2 w-2 h-2"
                style={{
                  backgroundColor: ['#3B82F6', '#EAB308', '#22C55E', '#F472B6'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}