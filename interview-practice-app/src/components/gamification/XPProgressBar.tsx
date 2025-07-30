'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumCard } from '@/components/ui/PremiumCard';

interface XPProgressBarProps {
  currentXP: number;
  level: number;
  nextLevelXP: number;
  weeklyXP?: number;
  streak?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function XPProgressBar({ 
  currentXP, 
  level, 
  nextLevelXP, 
  weeklyXP = 0,
  streak = 0,
  className,
  size = 'md',
  showDetails = true
}: XPProgressBarProps) {
  const progress = Math.min((currentXP / nextLevelXP) * 100, 100);
  const remainingXP = Math.max(nextLevelXP - currentXP, 0);

  const sizeClasses = {
    sm: {
      container: 'p-3',
      bar: 'h-2',
      text: 'text-sm',
      level: 'text-lg',
      icon: 'w-4 h-4'
    },
    md: {
      container: 'p-4',
      bar: 'h-3',
      text: 'text-base',
      level: 'text-xl',
      icon: 'w-5 h-5'
    },
    lg: {
      container: 'p-6',
      bar: 'h-4',
      text: 'text-lg',
      level: 'text-2xl',
      icon: 'w-6 h-6'
    }
  };

  const classes = sizeClasses[size];

  return (
    <PremiumCard className={cn(
      "bg-gradient-to-r from-primary-500 to-secondary-500 text-white",
      classes.container,
      className
    )}>
      {/* レベル表示 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "bg-white/20 rounded-full p-2 backdrop-blur-sm",
            size === 'sm' && 'p-1.5',
            size === 'lg' && 'p-3'
          )}>
            <Star className={cn("text-yellow-300", classes.icon)} />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className={cn("font-bold", classes.level)}>
                レベル {level}
              </span>
            </div>
            <div className={cn("opacity-80", classes.text)}>
              {currentXP.toLocaleString()} XP
            </div>
          </div>
        </div>

        {/* 週間統計 */}
        {showDetails && (
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <TrendingUp className={classes.icon} />
              <span className={classes.text}>
                +{weeklyXP} <span className="opacity-70">今週</span>
              </span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 justify-end mt-1">
                <Flame className={cn(classes.icon, "text-orange-300")} />
                <span className={cn("text-orange-200", classes.text)}>
                  {streak}日連続
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* プログレスバー */}
      <div className="space-y-2">
        <div className={cn(
          "bg-white/20 rounded-full overflow-hidden backdrop-blur-sm",
          classes.bar
        )}>
          <motion.div
            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full shadow-lg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {showDetails && (
          <div className="flex justify-between items-center">
            <span className={cn("opacity-80", classes.text)}>
              次のレベルまで
            </span>
            <span className={cn("font-semibold", classes.text)}>
              {remainingXP.toLocaleString()} XP
            </span>
          </div>
        )}
      </div>

      {/* プログレス詳細 */}
      {showDetails && size !== 'sm' && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="flex justify-between text-xs opacity-70">
            <span>進捗: {progress.toFixed(1)}%</span>
            <span>次回: レベル {level + 1}</span>
          </div>
        </div>
      )}
    </PremiumCard>
  );
}

// XP獲得アニメーション用のコンポーネント
interface XPGainAnimationProps {
  amount: number;
  reason?: string;
  onComplete?: () => void;
  className?: string;
}

export function XPGainAnimation({ 
  amount, 
  reason = "XP獲得!", 
  onComplete,
  className 
}: XPGainAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: -20, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.6 }}
      transition={{ duration: 2, ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className={cn(
        "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50",
        className
      )}
    >
      <PremiumCard className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <Star className="w-8 h-8 text-yellow-200" />
          </motion.div>
          <div>
            <div className="text-2xl font-bold">
              +{amount} XP
            </div>
            <div className="text-sm opacity-90">
              {reason}
            </div>
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
}

// レベルアップアニメーション
interface LevelUpAnimationProps {
  newLevel: number;
  onComplete?: () => void;
  className?: string;
}

export function LevelUpAnimation({ 
  newLevel, 
  onComplete,
  className 
}: LevelUpAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className={cn(
        "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
        className
      )}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="mb-6"
        >
          <Star className="w-20 h-20 text-yellow-400 mx-auto" />
        </motion.div>
        
        <h2 className="text-4xl font-bold text-white mb-2">
          レベルアップ！
        </h2>
        <p className="text-2xl text-yellow-300 mb-4">
          レベル {newLevel} に到達
        </p>
        <p className="text-gray-300">
          素晴らしい成長です！🎉
        </p>
      </motion.div>
    </motion.div>
  );
}