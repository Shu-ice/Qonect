'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Award, Medal, Shield, TrendingUp, Users, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { League, UserProgress } from '@/lib/gamification';

interface LeagueDisplayProps {
  currentLeague: League;
  userProgress: UserProgress;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

export function LeagueDisplay({ 
  currentLeague, 
  userProgress,
  size = 'md',
  showProgress = true,
  className 
}: LeagueDisplayProps) {
  const getLeagueIcon = (leagueName: string) => {
    switch (leagueName) {
      case 'Diamond': return Crown;
      case 'Platinum': return Trophy;
      case 'Gold': return Award;
      case 'Silver': return Medal;
      default: return Shield;
    }
  };

  const LeagueIcon = getLeagueIcon(currentLeague.name);
  
  const progressToNext = currentLeague.maxXP === Infinity 
    ? 100 
    : Math.min(((userProgress.totalXP - currentLeague.minXP) / (currentLeague.maxXP - currentLeague.minXP)) * 100, 100);

  const nextLeagueName = getNextLeagueName(currentLeague.name);
  const isMaxLeague = currentLeague.maxXP === Infinity;

  const sizeClasses = {
    sm: {
      container: 'p-3',
      icon: 'w-8 h-8',
      title: 'text-lg',
      subtitle: 'text-sm'
    },
    md: {
      container: 'p-4',
      icon: 'w-12 h-12',
      title: 'text-xl',
      subtitle: 'text-base'
    },
    lg: {
      container: 'p-6',
      icon: 'w-16 h-16',
      title: 'text-2xl',
      subtitle: 'text-lg'
    }
  };

  const classes = sizeClasses[size];

  return (
    <PremiumCard 
      className={cn(
        "relative overflow-hidden",
        classes.container,
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${currentLeague.color}20 0%, ${currentLeague.color}40 100%)`
      }}
    >
      {/* 背景装飾 */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-10 transform rotate-12 translate-x-8 -translate-y-8"
        style={{ color: currentLeague.color }}
      >
        <LeagueIcon className="w-full h-full" />
      </div>

      <div className="relative z-10">
        {/* メインリーグ表示 */}
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="rounded-full p-3 shadow-lg"
            style={{ backgroundColor: currentLeague.color }}
          >
            <LeagueIcon className={cn("text-white", classes.icon)} />
          </div>
          
          <div>
            <h3 className={cn("font-bold", classes.title)} style={{ color: currentLeague.color }}>
              {currentLeague.name} リーグ
            </h3>
            <div className="flex items-center gap-2">
              <span className={cn("text-gray-600", classes.subtitle)}>
                ランク #{userProgress.rank}
              </span>
              {userProgress.streak.current > 0 && (
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-orange-600">
                    {userProgress.streak.current}日
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* プログレス表示 */}
        {showProgress && !isMaxLeague && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                次のリーグまで
              </span>
              <span className="text-sm font-semibold">
                {(currentLeague.maxXP - userProgress.totalXP).toLocaleString()} XP
              </span>
            </div>
            
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full shadow-sm"
                style={{ 
                  background: `linear-gradient(90deg, ${currentLeague.color}, ${currentLeague.color}CC)` 
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>{progressToNext.toFixed(1)}% 完了</span>
              {nextLeagueName && (
                <span>次: {nextLeagueName} リーグ</span>
              )}
            </div>
          </div>
        )}

        {/* 特典表示 */}
        {currentLeague.benefits.length > 0 && size !== 'sm' && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              リーグ特典
            </h4>
            <div className="space-y-1">
              {currentLeague.benefits.slice(0, size === 'md' ? 2 : 3).map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: currentLeague.color }}
                  />
                  <span className="text-sm text-gray-600">{benefit}</span>
                </div>
              ))}
              {currentLeague.benefits.length > (size === 'md' ? 2 : 3) && (
                <div className="text-xs text-gray-500 ml-4">
                  他 {currentLeague.benefits.length - (size === 'md' ? 2 : 3)} 個の特典
                </div>
              )}
            </div>
          </div>
        )}

        {/* 最高リーグ達成表示 */}
        {isMaxLeague && (
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-600">最高リーグ達成！</span>
            </div>
          </div>
        )}
      </div>
    </PremiumCard>
  );
}

// リーグランキング表示
interface LeagueRankingProps {
  userProgress: UserProgress;
  topUsers?: Array<{
    name: string;
    rank: number;
    totalXP: number;
    league: League;
    weeklyXP: number;
  }>;
  className?: string;
}

export function LeagueRanking({ 
  userProgress, 
  topUsers = [],
  className 
}: LeagueRankingProps) {
  return (
    <PremiumCard className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          {userProgress.currentLeague.name} リーグランキング
        </h3>
        <div className="text-sm text-gray-600">
          今週の順位
        </div>
      </div>

      {/* 自分の順位 */}
      <div className="mb-4 p-3 bg-primary-50 rounded-lg border-l-4 border-primary-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-primary-600">
              #{userProgress.rank}
            </div>
            <div>
              <div className="font-semibold">あなた</div>
              <div className="text-sm text-gray-600">
                {userProgress.totalXP.toLocaleString()} XP
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">+{userProgress.weeklyXP}</span>
            </div>
            <div className="text-xs text-gray-500">今週</div>
          </div>
        </div>
      </div>

      {/* トップユーザー */}
      <div className="space-y-2">
        {topUsers.slice(0, 5).map((user, index) => (
          <motion.div
            key={user.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              index < 3 ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                index === 0 && "bg-yellow-500 text-white",
                index === 1 && "bg-gray-400 text-white",
                index === 2 && "bg-amber-600 text-white",
                index > 2 && "bg-gray-200 text-gray-700"
              )}>
                {index < 3 ? (
                  <Crown className="w-4 h-4" />
                ) : (
                  user.rank
                )}
              </div>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-600">
                  {user.totalXP.toLocaleString()} XP
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span className="text-sm font-semibold">
                  +{user.weeklyXP}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ランキング更新情報 */}
      <div className="mt-4 pt-4 border-t text-center">
        <p className="text-xs text-gray-500">
          ランキングは毎時更新されます
        </p>
      </div>
    </PremiumCard>
  );
}

// リーグ昇格アニメーション
interface LeaguePromotionAnimationProps {
  newLeague: League;
  onComplete?: () => void;
  className?: string;
}

export function LeaguePromotionAnimation({ 
  newLeague, 
  onComplete,
  className 
}: LeaguePromotionAnimationProps) {
  const getLeagueIcon = (leagueName: string) => {
    switch (leagueName) {
      case 'Diamond': return Crown;
      case 'Platinum': return Trophy;
      case 'Gold': return Award;
      case 'Silver': return Medal;
      default: return Shield;
    }
  };

  const LeagueIcon = getLeagueIcon(newLeague.name);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 1, ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className={cn(
        "fixed inset-0 bg-black/60 flex items-center justify-center z-50",
        className
      )}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="text-center"
      >
        {/* メインアイコン */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="mb-8"
        >
          <div 
            className="w-32 h-32 rounded-full mx-auto flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: newLeague.color }}
          >
            <LeagueIcon className="w-16 h-16 text-white" />
          </div>
        </motion.div>
        
        {/* テキスト */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            リーグ昇格！
          </h2>
          <h3 
            className="text-3xl font-bold mb-4"
            style={{ color: newLeague.color }}
          >
            {newLeague.name} リーグ
          </h3>
          <p className="text-xl text-gray-300 mb-6">
            おめでとうございます！🎉
          </p>
          
          {/* 新しい特典 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
            <h4 className="text-lg font-semibold text-white mb-2">
              新しい特典がアンロック！
            </h4>
            <div className="space-y-1">
              {newLeague.benefits.slice(0, 3).map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.2 }}
                  className="flex items-center gap-2 text-gray-200"
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: newLeague.color }}
                  />
                  <span className="text-sm">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// リーグ概要表示
interface LeagueOverviewProps {
  allLeagues: League[];
  currentLeague: League;
  className?: string;
}

export function LeagueOverview({ 
  allLeagues, 
  currentLeague,
  className 
}: LeagueOverviewProps) {
  const getLeagueIcon = (leagueName: string) => {
    switch (leagueName) {
      case 'Diamond': return Crown;
      case 'Platinum': return Trophy;
      case 'Gold': return Award;
      case 'Silver': return Medal;
      default: return Shield;
    }
  };

  return (
    <PremiumCard className={cn("p-4", className)}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        リーグシステム
      </h3>

      <div className="space-y-3">
        {allLeagues.map((league) => {
          const LeagueIcon = getLeagueIcon(league.name);
          const isCurrent = league.id === currentLeague.id;
          
          return (
            <motion.div
              key={league.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                isCurrent 
                  ? "bg-primary-50 border-primary-200 shadow-sm" 
                  : "bg-gray-50 border-gray-200"
              )}
              whileHover={{ scale: 1.02 }}
            >
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isCurrent ? "shadow-md" : "opacity-60"
                )}
                style={{ backgroundColor: league.color }}
              >
                <LeagueIcon className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={cn(
                    "font-semibold",
                    isCurrent ? "text-primary-700" : "text-gray-700"
                  )}>
                    {league.name}
                  </h4>
                  {isCurrent && (
                    <span className="text-xs bg-primary-200 text-primary-800 px-2 py-1 rounded-full">
                      現在
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {league.minXP.toLocaleString()} - {
                    league.maxXP === Infinity 
                      ? '∞' 
                      : league.maxXP.toLocaleString()
                  } XP
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                {league.benefits.length} 個の特典
              </div>
            </motion.div>
          );
        })}
      </div>
    </PremiumCard>
  );
}

// ヘルパー関数
function getNextLeagueName(currentLeague: string): string | null {
  const leagues = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const currentIndex = leagues.indexOf(currentLeague);
  return currentIndex < leagues.length - 1 ? leagues[currentIndex + 1] : null;
}