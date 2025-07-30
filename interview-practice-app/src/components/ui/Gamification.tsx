'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Zap,
  Target,
  Medal,
  Award,
  Gift,
  Sparkles,
  Heart,
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned: boolean;
  progress?: number;
  maxProgress?: number;
}

export function Badge({ badge, size = 'default' }: { badge: BadgeProps; size?: 'sm' | 'default' | 'lg' }) {
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600'
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    default: 'w-20 h-20',
    lg: 'w-24 h-24'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative rounded-2xl p-4 cursor-pointer transition-all duration-300',
        badge.earned
          ? `bg-gradient-to-br ${rarityColors[badge.rarity]} text-white shadow-lg`
          : 'bg-gray-100 text-gray-400'
      )}
    >
      <div className={cn('mx-auto mb-2', sizeClasses[size])}>
        {badge.icon}
      </div>
      <h4 className="font-semibold text-sm text-center">{badge.name}</h4>
      {badge.progress !== undefined && badge.maxProgress && !badge.earned && (
        <div className="mt-2">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
              initial={{ width: 0 }}
              animate={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
            />
          </div>
          <p className="text-xs text-center mt-1">
            {badge.progress} / {badge.maxProgress}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ポイント獲得アニメーション
export function PointsAnimation({ points, type = 'exp' }: { points: number; type?: 'exp' | 'coin' | 'star' }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const icons = {
    exp: <Zap className="w-6 h-6" />,
    coin: <Gift className="w-6 h-6" />,
    star: <Star className="w-6 h-6" />
  };

  const colors = {
    exp: 'text-blue-500',
    coin: 'text-yellow-500',
    star: 'text-purple-500'
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -50 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className={cn(
            'flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg',
            colors[type]
          )}>
            {icons[type]}
            <span className="font-bold text-lg">+{points}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ランキング表示
interface RankingItem {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
  isCurrentUser?: boolean;
}

export function Ranking({ items, currentUserId }: { items: RankingItem[]; currentUserId?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-premium p-6">
      <h3 className="text-xl font-bold text-premium-900 mb-4 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-500" />
        週間ランキング
      </h3>
      
      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'flex items-center gap-4 p-3 rounded-xl transition-all duration-300',
              item.isCurrentUser
                ? 'bg-primary-50 border-2 border-primary-300'
                : 'hover:bg-gray-50'
            )}
          >
            {/* ランク */}
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center font-bold',
              item.rank === 1 && 'bg-yellow-100 text-yellow-700',
              item.rank === 2 && 'bg-gray-100 text-gray-700',
              item.rank === 3 && 'bg-orange-100 text-orange-700',
              item.rank > 3 && 'bg-gray-50 text-gray-600'
            )}>
              {item.rank}
            </div>
            
            {/* ユーザー情報 */}
            <div className="flex-1">
              <p className={cn(
                'font-semibold',
                item.isCurrentUser && 'text-primary-700'
              )}>
                {item.name}
              </p>
            </div>
            
            {/* スコア */}
            <div className="text-right">
              <p className="font-bold text-lg text-premium-900">{item.score.toLocaleString()}</p>
              <p className="text-xs text-premium-600">ポイント</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// デイリーチャレンジ
interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
}

export function DailyChallenges({ challenges }: { challenges: Challenge[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-premium p-6">
      <h3 className="text-xl font-bold text-premium-900 mb-4 flex items-center gap-2">
        <Target className="w-6 h-6 text-primary-500" />
        今日のチャレンジ
      </h3>
      
      <div className="space-y-3">
        {challenges.map((challenge) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'p-4 rounded-xl border-2 transition-all duration-300',
              challenge.completed
                ? 'bg-green-50 border-green-300'
                : 'bg-white border-gray-200 hover:border-primary-300'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className={cn(
                  'font-semibold',
                  challenge.completed && 'text-green-700'
                )}>
                  {challenge.title}
                </h4>
                <p className="text-sm text-premium-600">{challenge.description}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-yellow-600">
                  <Gift className="w-4 h-4" />
                  <span className="font-bold">{challenge.reward}</span>
                </div>
              </div>
            </div>
            
            {/* プログレスバー */}
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full',
                    challenge.completed
                      ? 'bg-green-500'
                      : 'bg-gradient-to-r from-primary-400 to-primary-600'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${(challenge.progress / challenge.maxProgress) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-premium-600 mt-1">
                {challenge.progress} / {challenge.maxProgress}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}