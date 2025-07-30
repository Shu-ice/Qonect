'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Award, Star, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Badge } from '@/lib/gamification';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  isEarned?: boolean;
  className?: string;
  onClick?: () => void;
}

export function BadgeDisplay({ 
  badge, 
  size = 'md', 
  showDetails = true,
  isEarned = !!badge.earnedAt,
  className,
  onClick 
}: BadgeDisplayProps) {
  const sizeClasses = {
    sm: {
      container: 'w-16 h-16 p-2',
      icon: 'w-8 h-8',
      text: 'text-xs',
      title: 'text-sm'
    },
    md: {
      container: 'w-20 h-20 p-3',
      icon: 'w-10 h-10',
      text: 'text-sm',
      title: 'text-base'
    },
    lg: {
      container: 'w-24 h-24 p-4',
      icon: 'w-12 h-12',
      text: 'text-base',
      title: 'text-lg'
    }
  };

  const rarityColors = {
    common: {
      bg: 'from-gray-400 to-gray-600',
      border: 'border-gray-400',
      glow: 'shadow-gray-400/30'
    },
    rare: {
      bg: 'from-blue-400 to-blue-600',
      border: 'border-blue-400',
      glow: 'shadow-blue-400/40'
    },
    epic: {
      bg: 'from-purple-400 to-purple-600',
      border: 'border-purple-400',
      glow: 'shadow-purple-400/50'
    },
    legendary: {
      bg: 'from-yellow-400 to-orange-500',
      border: 'border-yellow-400',
      glow: 'shadow-yellow-400/60'
    }
  };

  const classes = sizeClasses[size];
  const colors = rarityColors[badge.rarity];

  const getRarityIcon = () => {
    switch (badge.rarity) {
      case 'legendary': return Crown;
      case 'epic': return Trophy;
      case 'rare': return Award;
      default: return Star;
    }
  };

  const RarityIcon = getRarityIcon();

  return (
    <div className={cn("relative group", className)} onClick={onClick}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative rounded-full border-2 cursor-pointer transition-all duration-300",
          classes.container,
          isEarned ? colors.border : "border-gray-300",
          isEarned ? `bg-gradient-to-br ${colors.bg}` : "bg-gray-200",
          isEarned && `shadow-lg ${colors.glow}`,
          !isEarned && "opacity-50 grayscale"
        )}
      >
        {/* バッジアイコン */}
        <div className="flex items-center justify-center h-full">
          {isEarned ? (
            <span className={cn("text-white", classes.icon.replace('w-', 'text-'))}>
              {badge.icon}
            </span>
          ) : (
            <Lock className={cn("text-gray-500", classes.icon)} />
          )}
        </div>

        {/* レアリティインジケーター */}
        {isEarned && badge.rarity !== 'common' && (
          <div className="absolute -top-1 -right-1">
            <div className={cn(
              "rounded-full p-1 text-white shadow-lg",
              `bg-gradient-to-br ${colors.bg}`
            )}>
              <RarityIcon className="w-3 h-3" />
            </div>
          </div>
        )}

        {/* 獲得日表示 */}
        {isEarned && badge.earnedAt && size === 'lg' && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="bg-white text-gray-600 text-xs px-2 py-1 rounded-full shadow-sm">
              {new Date(badge.earnedAt).toLocaleDateString('ja-JP', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        )}

        {/* ホバー時の光るエフェクト */}
        {isEarned && (
          <motion.div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle, ${colors.bg.split(' ')[1]} 0%, transparent 70%)`
            }}
          />
        )}
      </motion.div>

      {/* 詳細情報（ツールチップ風） */}
      {showDetails && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <PremiumCard className="p-3 bg-white shadow-xl border max-w-xs">
            <div className="text-center space-y-1">
              <h4 className={cn("font-semibold text-gray-800", classes.title)}>
                {badge.name}
              </h4>
              <p className={cn("text-gray-600", classes.text)}>
                {badge.description}
              </p>
              
              {/* レアリティ表示 */}
              <div className="flex items-center justify-center gap-1 mt-2">
                <RarityIcon className="w-3 h-3 text-gray-500" />
                <span className={cn("text-gray-500 capitalize", classes.text)}>
                  {badge.rarity}
                </span>
              </div>

              {/* 獲得条件 */}
              {!isEarned && badge.requirements.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-1">獲得条件:</p>
                  {badge.requirements.map((req, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      {getRequirementText(req)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PremiumCard>
        </div>
      )}
    </div>
  );
}

// バッジコレクション表示
interface BadgeCollectionProps {
  badges: Badge[];
  availableBadges?: Badge[];
  title?: string;
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

export function BadgeCollection({ 
  badges, 
  availableBadges = [],
  title = "獲得バッジ",
  maxDisplay = 6,
  size = 'md',
  showProgress = true,
  className 
}: BadgeCollectionProps) {
  const earnedBadgeIds = new Set(badges.map(b => b.id));
  const displayBadges = [...badges];
  
  // 未獲得バッジも表示する場合
  if (availableBadges.length > 0) {
    const unearnedBadges = availableBadges.filter(b => !earnedBadgeIds.has(b.id));
    displayBadges.push(...unearnedBadges.slice(0, maxDisplay - badges.length));
  }

  const slicedBadges = displayBadges.slice(0, maxDisplay);
  const remainingCount = Math.max(displayBadges.length - maxDisplay, 0);

  return (
    <PremiumCard className={cn("p-4", className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          {title}
        </h3>
        {showProgress && (
          <div className="text-sm text-gray-600">
            {badges.length}/{availableBadges.length || badges.length}
          </div>
        )}
      </div>

      {/* バッジグリッド */}
      <div className="grid grid-cols-6 gap-3">
        {slicedBadges.map((badge) => (
          <BadgeDisplay
            key={badge.id}
            badge={badge}
            size={size}
            isEarned={earnedBadgeIds.has(badge.id)}
            showDetails={true}
          />
        ))}
        
        {/* 追加バッジがある場合の表示 */}
        {remainingCount > 0 && (
          <div className={cn(
            "rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors",
            size === 'sm' && 'w-16 h-16',
            size === 'md' && 'w-20 h-20',
            size === 'lg' && 'w-24 h-24'
          )}>
            <span className="text-gray-500 text-sm font-medium">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>

      {/* 進捗バー */}
      {showProgress && availableBadges.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>コレクション進捗</span>
            <span>{Math.round((badges.length / availableBadges.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(badges.length / availableBadges.length) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </PremiumCard>
  );
}

// バッジ獲得アニメーション
interface BadgeEarnedAnimationProps {
  badge: Badge;
  onComplete?: () => void;
  className?: string;
}

export function BadgeEarnedAnimation({ 
  badge, 
  onComplete,
  className 
}: BadgeEarnedAnimationProps) {
  const colors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500'
  };

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
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className={cn(
            "w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center text-6xl shadow-2xl",
            `bg-gradient-to-br ${colors[badge.rarity]}`
          )}
        >
          {badge.icon}
        </motion.div>
        
        <h2 className="text-3xl font-bold text-white mb-2">
          バッジ獲得！
        </h2>
        <h3 className="text-xl text-yellow-300 mb-2">
          {badge.name}
        </h3>
        <p className="text-gray-300 mb-4">
          {badge.description}
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-gray-400 text-sm capitalize">
            {badge.rarity} バッジ
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ヘルパー関数
function getRequirementText(requirement: Badge['requirements'][0]): string {
  const { type, target, current = 0 } = requirement;
  
  const progress = current > 0 ? ` (${current}/${target})` : '';
  
  switch (type) {
    case 'sessions_completed':
      return `${target}回の面接練習を完了${progress}`;
    case 'score_achieved':
      return `評価${target}点以上を獲得${progress}`;
    case 'streak_days':
      return `${target}日連続で練習${progress}`;
    case 'time_practiced':
      return `合計${target}時間の練習${progress}`;
    case 'improvement_rate':
      return `${target}%以上の改善率を達成${progress}`;
    default:
      return '条件を満たす';
  }
}