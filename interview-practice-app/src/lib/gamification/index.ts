/**
 * Duolingo Max型ゲーミフィケーションシステム
 * XPポイント、バッジ、リーグ、ストリーク管理
 */

export interface XPPoints {
  sessionCompletion: number;
  qualityImprovement: number;
  streakMaintenance: number;
  peerHelping: number;
  perfectScore: number;
  dailyGoal: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'skill' | 'progress' | 'special' | 'social';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: BadgeRequirement[];
  earnedAt?: Date;
}

export interface BadgeRequirement {
  type: 'sessions_completed' | 'score_achieved' | 'streak_days' | 'time_practiced' | 'improvement_rate';
  target: number;
  current?: number;
}

export interface League {
  id: string;
  name: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  minXP: number;
  maxXP: number;
  color: string;
  benefits: string[];
}

export interface UserProgress {
  userId: string;
  totalXP: number;
  level: number;
  currentLeague: League;
  streak: {
    current: number;
    longest: number;
    lastPracticeDate: Date;
  };
  badges: Badge[];
  weeklyXP: number;
  monthlyXP: number;
  rank: number;
}

export class GamificationEngine {
  private static instance: GamificationEngine;
  
  // XPポイント設定
  private readonly XP_RATES: XPPoints = {
    sessionCompletion: 100,
    qualityImprovement: 50,
    streakMaintenance: 25,
    peerHelping: 75,
    perfectScore: 200,
    dailyGoal: 150,
  };

  // マルチプライヤー
  private readonly MULTIPLIERS = {
    consecutiveDays: 1.5,
    difficultQuestions: 2.0,
    perfectScores: 3.0,
    weekendPractice: 1.2,
    earlyBird: 1.3, // 朝6-9時
    nightOwl: 1.1,  // 夜21-24時
  };

  // リーグ定義
  private readonly LEAGUES: League[] = [
    {
      id: 'bronze',
      name: 'Bronze',
      minXP: 0,
      maxXP: 999,
      color: '#CD7F32',
      benefits: ['基本機能利用', 'デイリーバッジ獲得']
    },
    {
      id: 'silver',
      name: 'Silver',
      minXP: 1000,
      maxXP: 2999,
      color: '#C0C0C0',
      benefits: ['詳細フィードバック', '週間レポート', 'カスタム面接官']
    },
    {
      id: 'gold',
      name: 'Gold',
      minXP: 3000,
      maxXP: 6999,
      color: '#FFD700',
      benefits: ['AI面接官選択', 'グループ練習', '優先サポート']
    },
    {
      id: 'platinum',
      name: 'Platinum',
      minXP: 7000,
      maxXP: 14999,
      color: '#E5E4E2',
      benefits: ['プレミアム機能', '個別指導', '専用コンテンツ']
    },
    {
      id: 'diamond',
      name: 'Diamond',
      minXP: 15000,
      maxXP: Infinity,
      color: '#B9F2FF',
      benefits: ['全機能アクセス', '優先カスタマーサポート', '限定バッジ']
    }
  ];

  // バッジ定義
  private readonly AVAILABLE_BADGES: Badge[] = [
    // スキルバッジ
    {
      id: 'eloquent-speaker',
      name: '雄弁家',
      description: '表現力豊かな回答で高評価を獲得',
      icon: '🎭',
      category: 'skill',
      rarity: 'rare',
      requirements: [
        { type: 'score_achieved', target: 4.5, current: 0 }
      ]
    },
    {
      id: 'confident-presenter',
      name: '自信満々',
      description: '堂々とした話し方をマスター',
      icon: '💪',
      category: 'skill',
      rarity: 'epic',
      requirements: [
        { type: 'score_achieved', target: 5.0, current: 0 },
        { type: 'sessions_completed', target: 10, current: 0 }
      ]
    },
    {
      id: 'story-teller',
      name: 'ストーリーテラー',
      description: '具体的で魅力的な体験談を話せる',
      icon: '📚',
      category: 'skill',
      rarity: 'rare',
      requirements: [
        { type: 'improvement_rate', target: 20, current: 0 }
      ]
    },

    // 進捗バッジ
    {
      id: 'first-session',
      name: 'はじめの一歩',
      description: '初回面接練習を完了',
      icon: '🚀',
      category: 'progress',
      rarity: 'common',
      requirements: [
        { type: 'sessions_completed', target: 1, current: 0 }
      ]
    },
    {
      id: '10-sessions',
      name: '継続は力なり',
      description: '10回の面接練習を完了',
      icon: '🏃‍♀️',
      category: 'progress',
      rarity: 'rare',
      requirements: [
        { type: 'sessions_completed', target: 10, current: 0 }
      ]
    },
    {
      id: 'month-streak',
      name: '30日チャレンジャー',
      description: '30日連続で練習を継続',
      icon: '🔥',
      category: 'progress',
      rarity: 'legendary',
      requirements: [
        { type: 'streak_days', target: 30, current: 0 }
      ]
    },

    // 特別バッジ
    {
      id: 'early-bird',
      name: '早起きの鳥',
      description: '朝の時間帯に練習',
      icon: '🌅',
      category: 'special',
      rarity: 'common',
      requirements: [
        { type: 'time_practiced', target: 10, current: 0 } // 朝6-9時に10回
      ]
    },
    {
      id: 'weekend-warrior',
      name: '週末戦士',
      description: '土日に集中練習',
      icon: '⚔️',
      category: 'special',
      rarity: 'rare',
      requirements: [
        { type: 'sessions_completed', target: 5, current: 0 } // 週末に5回
      ]
    }
  ];

  static getInstance(): GamificationEngine {
    if (!GamificationEngine.instance) {
      GamificationEngine.instance = new GamificationEngine();
    }
    return GamificationEngine.instance;
  }

  /**
   * セッション完了時のXP計算
   */
  calculateSessionXP(sessionData: {
    completed: boolean;
    score: number;
    improvementFromLast?: number;
    isPerfectScore: boolean;
    isStreakDay: boolean;
    difficulty: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    isWeekend: boolean;
  }): number {
    let baseXP = 0;

    // 基本XP
    if (sessionData.completed) {
      baseXP += this.XP_RATES.sessionCompletion;
    }

    if (sessionData.improvementFromLast && sessionData.improvementFromLast > 0) {
      baseXP += this.XP_RATES.qualityImprovement * sessionData.improvementFromLast;
    }

    if (sessionData.isStreakDay) {
      baseXP += this.XP_RATES.streakMaintenance;
    }

    if (sessionData.isPerfectScore) {
      baseXP += this.XP_RATES.perfectScore;
    }

    // マルチプライヤー適用
    let finalXP = baseXP;

    if (sessionData.isStreakDay) {
      finalXP *= this.MULTIPLIERS.consecutiveDays;
    }

    if (sessionData.difficulty > 0.7) {
      finalXP *= this.MULTIPLIERS.difficultQuestions;
    }

    if (sessionData.isPerfectScore) {
      finalXP *= this.MULTIPLIERS.perfectScores;
    }

    if (sessionData.isWeekend) {
      finalXP *= this.MULTIPLIERS.weekendPractice;
    }

    if (sessionData.timeOfDay === 'morning') {
      finalXP *= this.MULTIPLIERS.earlyBird;
    } else if (sessionData.timeOfDay === 'night') {
      finalXP *= this.MULTIPLIERS.nightOwl;
    }

    return Math.round(finalXP);
  }

  /**
   * レベル計算
   */
  calculateLevel(totalXP: number): number {
    // レベル式: Level = floor(sqrt(XP / 100))
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
  }

  /**
   * 次のレベルまでのXP計算
   */
  calculateXPToNextLevel(currentXP: number): { current: number; required: number; progress: number } {
    const currentLevel = this.calculateLevel(currentXP);
    const nextLevelXP = Math.pow(currentLevel, 2) * 100;
    
    return {
      current: currentXP,
      required: nextLevelXP,
      progress: (currentXP / nextLevelXP) * 100
    };
  }

  /**
   * リーグ判定
   */
  determineLeague(totalXP: number): League {
    return this.LEAGUES.find(league => 
      totalXP >= league.minXP && totalXP <= league.maxXP
    ) || this.LEAGUES[0];
  }

  /**
   * バッジ獲得判定
   */
  checkBadgeEligibility(
    userStats: {
      sessionsCompleted: number;
      bestScore: number;
      currentStreak: number;
      totalPracticeTime: number;
      improvementRate: number;
      morningPracticeCount: number;
      weekendPracticeCount: number;
    },
    currentBadges: Badge[]
  ): Badge[] {
    const earnedBadgeIds = new Set(currentBadges.map(b => b.id));
    const newBadges: Badge[] = [];

    for (const badge of this.AVAILABLE_BADGES) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const isEligible = badge.requirements.every(req => {
        switch (req.type) {
          case 'sessions_completed':
            return userStats.sessionsCompleted >= req.target;
          case 'score_achieved':
            return userStats.bestScore >= req.target;
          case 'streak_days':
            return userStats.currentStreak >= req.target;
          case 'time_practiced':
            if (badge.id === 'early-bird') {
              return userStats.morningPracticeCount >= req.target;
            }
            return userStats.totalPracticeTime >= req.target;
          case 'improvement_rate':
            return userStats.improvementRate >= req.target;
          default:
            return false;
        }
      });

      if (isEligible) {
        newBadges.push({
          ...badge,
          earnedAt: new Date()
        });
      }
    }

    return newBadges;
  }

  /**
   * ストリーク更新
   */
  updateStreak(lastPracticeDate: Date, currentDate: Date = new Date()): {
    current: number;
    isStreakDay: boolean;
    isStreakBroken: boolean;
  } {
    const daysDifference = Math.floor(
      (currentDate.getTime() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference === 0) {
      // 同じ日の練習
      return { current: 1, isStreakDay: true, isStreakBroken: false };
    } else if (daysDifference === 1) {
      // 連続日の練習
      return { current: 1, isStreakDay: true, isStreakBroken: false };
    } else {
      // ストリーク途切れ
      return { current: 1, isStreakDay: false, isStreakBroken: true };
    }
  }

  /**
   * 週間ランキング計算
   */
  calculateWeeklyRank(userXP: number, allUsersXP: number[]): number {
    const sortedXP = allUsersXP.sort((a, b) => b - a);
    const rank = sortedXP.findIndex(xp => xp <= userXP) + 1;
    return rank || sortedXP.length + 1;
  }

  /**
   * 達成感メッセージ生成
   */
  generateAchievementMessage(
    event: 'level_up' | 'badge_earned' | 'league_promotion' | 'streak_milestone',
    data: any
  ): string {
    const messages = {
      level_up: [
        `🎉 レベル${data.newLevel}に到達！素晴らしい成長です！`,
        `✨ レベルアップ！レベル${data.newLevel}になりました！`,
        `🚀 おめでとうございます！レベル${data.newLevel}達成！`
      ],
      badge_earned: [
        `🏆 新しいバッジ「${data.badgeName}」を獲得しました！`,
        `⭐ バッジ獲得！「${data.badgeName}」をアンロック！`,
        `🎖️ 素晴らしい！「${data.badgeName}」バッジを手に入れました！`
      ],
      league_promotion: [
        `👑 ${data.newLeague}リーグに昇格しました！`,
        `🎊 リーグ昇格！${data.newLeague}の仲間入り！`,
        `🏅 ${data.newLeague}リーグへようこそ！`
      ],
      streak_milestone: [
        `🔥 ${data.streakDays}日連続練習達成！燃えてますね！`,
        `💪 連続${data.streakDays}日の練習！継続は力なり！`,
        `⚡ ${data.streakDays}日ストリーク達成！調子いいですね！`
      ]
    };

    const messageList = messages[event];
    return messageList[Math.floor(Math.random() * messageList.length)];
  }

  /**
   * 今日の目標XP計算
   */
  calculateDailyGoalXP(currentLevel: number): number {
    // レベルに応じて目標XPを調整
    const baseGoal = 200;
    const levelMultiplier = Math.min(currentLevel * 0.1 + 1, 3); // 最大3倍
    return Math.round(baseGoal * levelMultiplier);
  }

  /**
   * モチベーションメッセージ生成
   */
  generateMotivationMessage(
    userProgress: UserProgress,
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  ): string {
    const { streak, currentLeague, weeklyXP } = userProgress;
    
    const morningMessages = [
      '🌅 おはようございます！今日も面接練習で一日をスタートしましょう！',
      '☀️ 朝の時間は集中力抜群！今日も頑張りましょう！',
      '🐦 早起きは三文の得！今日の練習で成長しましょう！'
    ];

    const afternoonMessages = [
      '🌞 こんにちは！午後の練習タイムですね！',
      '📚 学校の後は面接練習！継続が力になります！',
      '⭐ 今日の目標に向かって一歩ずつ進みましょう！'
    ];

    const eveningMessages = [
      '🌅 お疲れ様！夕方の練習で一日を締めくくりましょう！',
      '🏠 家に帰ったら面接練習！習慣化できていますね！',
      '💪 今日も最後まで頑張る気持ち、素晴らしいです！'
    ];

    const nightMessages = [
      '🌙 お疲れ様！今日最後の練習ですね！',
      '⭐ 夜の静かな時間での練習、集中できそうです！',
      '🦉 夜更かしは程々に！短時間でも効果的な練習を！'
    ];

    const messageMap = {
      morning: morningMessages,
      afternoon: afternoonMessages,
      evening: eveningMessages,
      night: nightMessages
    };

    const baseMessages = messageMap[timeOfDay];
    let selectedMessage = baseMessages[Math.floor(Math.random() * baseMessages.length)];

    // ストリークボーナスメッセージ
    if (streak.current >= 7) {
      selectedMessage += ` 🔥${streak.current}日連続練習中！`;
    }

    // リーグボーナスメッセージ
    if (currentLeague.name !== 'Bronze') {
      selectedMessage += ` 👑${currentLeague.name}リーグの実力を見せましょう！`;
    }

    return selectedMessage;
  }
}

export const gamificationEngine = GamificationEngine.getInstance();