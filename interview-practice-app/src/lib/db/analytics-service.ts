/**
 * 統計・分析データ管理サービス
 * 学習進捗の追跡と洞察の提供
 */

import { prisma } from '@/lib/prisma';

export interface UserAnalytics {
  userId: string;
  totalSessions: number;
  totalPracticeTime: number; // 分
  averageScore: number;
  scoreProgression: Array<{
    date: Date;
    score: number;
    sessionType: string;
  }>;
  strengthAreas: string[];
  improvementAreas: string[];
  achievementCount: number;
  recentActivity: Array<{
    type: 'essay' | 'session' | 'achievement';
    date: Date;
    description: string;
  }>;
  weeklyProgress: Array<{
    week: string;
    sessionsCount: number;
    averageScore: number;
    timeSpent: number;
  }>;
}

export interface SystemAnalytics {
  totalUsers: number;
  activeUsers: number; // 過去7日間
  totalSessions: number;
  averageSessionDuration: number;
  popularResearchTopics: Array<{
    topic: string;
    count: number;
  }>;
  performanceMetrics: {
    averageScore: number;
    scoreDistribution: Record<string, number>;
    aiProviderUsage: Record<string, number>;
  };
  weeklyGrowth: Array<{
    week: string;
    newUsers: number;
    totalSessions: number;
  }>;
}

export class AnalyticsService {
  /**
   * ユーザー個別統計取得
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const [user, sessions, essays, achievements] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          targetSchool: true,
        },
      }),
      prisma.interviewSession.findMany({
        where: { 
          userId,
          currentPhase: 'complete',
        },
        orderBy: { createdAt: 'asc' },
        select: {
          createdAt: true,
          sessionType: true,
          overallScore: true,
          duration: true,
          researchTopic: true,
        },
      }),
      prisma.essay.findMany({
        where: { userId },
        select: {
          createdAt: true,
          researchTopic: true,
          aiEvaluation: true,
        },
      }),
      prisma.achievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
        select: {
          type: true,
          title: true,
          unlockedAt: true,
        },
      }),
    ]);

    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // 基本統計計算
    const totalSessions = sessions.length;
    const totalPracticeTime = Math.round(
      sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
    );
    const averageScore = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / sessions.length
      : 0;

    // スコア推移
    const scoreProgression = sessions
      .filter(s => s.overallScore !== null)
      .map(s => ({
        date: s.createdAt,
        score: s.overallScore!,
        sessionType: s.sessionType,
      }));

    // 最近のアクティビティ
    const recentActivity = [
      ...sessions.slice(-5).map(s => ({
        type: 'session' as const,
        date: s.createdAt,
        description: `面接練習完了 (${s.researchTopic})`,
      })),
      ...essays.slice(-3).map(e => ({
        type: 'essay' as const,
        date: e.createdAt,
        description: `志願理由書作成 (${e.researchTopic})`,
      })),
      ...achievements.slice(-3).map(a => ({
        type: 'achievement' as const,
        date: a.unlockedAt,
        description: `実績解除: ${a.title}`,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);

    // 週次進捗（過去8週間）
    const weeklyProgress = await this.calculateWeeklyProgress(userId, 8);

    // 強み・改善点分析
    const { strengthAreas, improvementAreas } = await this.analyzeUserPerformance(userId);

    return {
      userId,
      totalSessions,
      totalPracticeTime,
      averageScore: Math.round(averageScore * 10) / 10,
      scoreProgression,
      strengthAreas,
      improvementAreas,
      achievementCount: achievements.length,
      recentActivity,
      weeklyProgress,
    };
  }

  /**
   * システム全体統計取得
   */
  async getSystemAnalytics(): Promise<SystemAnalytics> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      activeUsers,
      totalSessions,
      avgDuration,
      researchTopics,
      systemMetrics,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.interviewSession.count({
        where: {
          currentPhase: 'complete',
        },
      }),
      prisma.interviewSession.aggregate({
        where: {
          currentPhase: 'complete',
          duration: { not: null },
        },
        _avg: {
          duration: true,
        },
      }),
      this.getPopularResearchTopics(),
      this.getPerformanceMetrics(),
    ]);

    const weeklyGrowth = await this.calculateSystemWeeklyGrowth(8);

    return {
      totalUsers,
      activeUsers,
      totalSessions,
      averageSessionDuration: Math.round((avgDuration._avg.duration || 0) / 60), // 分
      popularResearchTopics: researchTopics,
      performanceMetrics: systemMetrics,
      weeklyGrowth,
    };
  }

  /**
   * リアルタイム分析データの集計
   */
  async aggregateRealtimeData(sessionId: string) {
    const analytics = await prisma.realtimeAnalytics.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    if (analytics.length === 0) {
      return null;
    }

    // 信頼度の時系列変化
    const confidenceTimeline = analytics
      .filter(a => a.analysisType === 'confidence')
      .map(a => ({
        timestamp: a.timestamp,
        value: a.metricsData?.confidence || 0,
      }));

    // エンゲージメントの変化
    const engagementTimeline = analytics
      .filter(a => a.analysisType === 'engagement')
      .map(a => ({
        timestamp: a.timestamp,
        value: a.metricsData?.engagement || 0,
      }));

    // AI処理パフォーマンス
    const processingPerformance = analytics.reduce((acc, a) => {
      const provider = a.aiProvider;
      if (!acc[provider]) {
        acc[provider] = {
          count: 0,
          totalTime: 0,
          averageTime: 0,
        };
      }
      acc[provider].count++;
      acc[provider].totalTime += a.processingTime;
      acc[provider].averageTime = acc[provider].totalTime / acc[provider].count;
      return acc;
    }, {} as Record<string, { count: number; totalTime: number; averageTime: number }>);

    return {
      sessionId,
      confidenceTimeline,
      engagementTimeline,
      processingPerformance,
      totalAnalytics: analytics.length,
      sessionDuration: analytics.length > 0 
        ? analytics[analytics.length - 1].timestamp.getTime() - analytics[0].timestamp.getTime()
        : 0,
    };
  }

  /**
   * 保護者向け進捗レポート生成
   */
  async generateParentReport(userId: string): Promise<{
    period: string;
    summary: string;
    progress: {
      sessionsCompleted: number;
      averageScore: number;
      timeSpent: number;
      improvement: number;
    };
    highlights: string[];
    recommendations: string[];
  }> {
    const analytics = await this.getUserAnalytics(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { studentName: true },
    });

    const lastWeekProgress = analytics.weeklyProgress[analytics.weeklyProgress.length - 1];
    const previousWeekProgress = analytics.weeklyProgress[analytics.weeklyProgress.length - 2];
    
    const improvement = previousWeekProgress 
      ? lastWeekProgress.averageScore - previousWeekProgress.averageScore
      : 0;

    const highlights = [];
    const recommendations = [];

    // ハイライト生成
    if (analytics.achievementCount > 0) {
      highlights.push(`新しい実績を${analytics.achievementCount}個解除しました`);
    }
    if (improvement > 0.5) {
      highlights.push(`前週比でスコアが${improvement.toFixed(1)}点向上しました`);
    }
    analytics.strengthAreas.slice(0, 2).forEach(area => {
      highlights.push(`${area}の分野で優秀な成果を示しています`);
    });

    // 推奨事項生成
    analytics.improvementAreas.slice(0, 2).forEach(area => {
      recommendations.push(`${area}の練習を重点的に行うことをお勧めします`);
    });
    if (analytics.totalPracticeTime < 30) {
      recommendations.push('練習時間を週30分以上確保することを目標にしましょう');
    }

    return {
      period: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月第${Math.ceil(new Date().getDate() / 7)}週`,
      summary: `${user?.studentName}さんは今週${lastWeekProgress.sessionsCount}回の面接練習を完了し、平均スコア${lastWeekProgress.averageScore.toFixed(1)}点の成果を残しました。`,
      progress: {
        sessionsCompleted: lastWeekProgress.sessionsCount,
        averageScore: lastWeekProgress.averageScore,
        timeSpent: lastWeekProgress.timeSpent,
        improvement,
      },
      highlights,
      recommendations,
    };
  }

  /**
   * プライベートヘルパーメソッド
   */
  private async calculateWeeklyProgress(userId: string, weeks: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const sessions = await prisma.interviewSession.findMany({
      where: {
        userId,
        currentPhase: 'complete',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        overallScore: true,
        duration: true,
      },
    });

    const weeklyData: Array<{
      week: string;
      sessionsCount: number;
      averageScore: number;
      timeSpent: number;
    }> = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekSessions = sessions.filter(s => 
        s.createdAt >= weekStart && s.createdAt <= weekEnd
      );

      const averageScore = weekSessions.length > 0
        ? weekSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / weekSessions.length
        : 0;

      const timeSpent = Math.round(
        weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60
      );

      weeklyData.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        sessionsCount: weekSessions.length,
        averageScore: Math.round(averageScore * 10) / 10,
        timeSpent,
      });
    }

    return weeklyData;
  }

  private async analyzeUserPerformance(userId: string) {
    const sessions = await prisma.interviewSession.findMany({
      where: { 
        userId,
        currentPhase: 'complete',
        finalEvaluation: { not: null },
      },
      select: {
        finalEvaluation: true,
      },
    });

    const strengthAreas: string[] = [];
    const improvementAreas: string[] = [];

    if (sessions.length === 0) {
      return { strengthAreas, improvementAreas };
    }

    // 明和中7項目の平均スコア計算
    const criteriaScores: Record<string, number[]> = {};

    sessions.forEach(session => {
      const evaluation = session.finalEvaluation as any;
      if (evaluation) {
        Object.keys(evaluation).forEach(key => {
          if (evaluation[key]?.score !== undefined) {
            if (!criteriaScores[key]) {
              criteriaScores[key] = [];
            }
            criteriaScores[key].push(evaluation[key].score);
          }
        });
      }
    });

    // 各項目の平均計算
    const averageScores = Object.entries(criteriaScores).map(([key, scores]) => ({
      criterion: key,
      average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    }));

    // 強み（平均4.0以上）と改善点（平均3.0未満）を特定
    averageScores.forEach(({ criterion, average }) => {
      const criterionMap: Record<string, string> = {
        genuineInterest: '探究への関心',
        experienceBase: '体験に基づく学び',
        socialConnection: '社会との関連性',
        noDefinitiveAnswer: '探究的思考',
        otherUnderstanding: '他者理解',
        selfTransformation: '自己の変容',
        originalExpression: '独自の表現',
      };

      const displayName = criterionMap[criterion] || criterion;

      if (average >= 4.0) {
        strengthAreas.push(displayName);
      } else if (average < 3.0) {
        improvementAreas.push(displayName);
      }
    });

    return { strengthAreas, improvementAreas };
  }

  private async getPopularResearchTopics() {
    const topics = await prisma.essay.groupBy({
      by: ['researchTopic'],
      _count: {
        researchTopic: true,
      },
      orderBy: {
        _count: {
          researchTopic: 'desc',
        },
      },
      take: 10,
    });

    return topics.map(topic => ({
      topic: topic.researchTopic,
      count: topic._count.researchTopic,
    }));
  }

  private async getPerformanceMetrics() {
    const sessions = await prisma.interviewSession.findMany({
      where: {
        currentPhase: 'complete',
        overallScore: { not: null },
      },
      select: {
        overallScore: true,
        aiProvider: true,
      },
    });

    const averageScore = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / sessions.length
      : 0;

    // スコア分布
    const scoreDistribution = sessions.reduce((acc, s) => {
      const score = s.overallScore || 0;
      const range = score >= 4.5 ? '4.5-5.0' :
                   score >= 4.0 ? '4.0-4.4' :
                   score >= 3.5 ? '3.5-3.9' :
                   score >= 3.0 ? '3.0-3.4' : '2.0-2.9';
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // AIプロバイダー使用率
    const aiProviderUsage = sessions.reduce((acc, s) => {
      acc[s.aiProvider] = (acc[s.aiProvider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      averageScore: Math.round(averageScore * 10) / 10,
      scoreDistribution,
      aiProviderUsage,
    };
  }

  private async calculateSystemWeeklyGrowth(weeks: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const weeklyData = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const [newUsers, totalSessions] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        }),
        prisma.interviewSession.count({
          where: {
            createdAt: {
              gte: weekStart,
              lte: weekEnd,
            },
            currentPhase: 'complete',
          },
        }),
      ]);

      weeklyData.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        newUsers,
        totalSessions,
      });
    }

    return weeklyData;
  }

  /**
   * データエクスポート機能
   */
  async exportUserData(userId: string, format: 'json' | 'csv' = 'json') {
    const analytics = await this.getUserAnalytics(userId);
    const sessions = await prisma.interviewSession.findMany({
      where: { userId },
      include: {
        questions: true,
        responses: true,
      },
    });

    const exportData = {
      userAnalytics: analytics,
      sessions,
      exportDate: new Date(),
      format,
    };

    if (format === 'csv') {
      // CSV形式の変換（簡易実装）
      return this.convertToCSV(exportData);
    }

    return exportData;
  }

  private convertToCSV(data: any): string {
    // 簡易CSV変換（実際の実装ではより詳細な変換が必要）
    const headers = ['Date', 'Type', 'Score', 'Topic'];
    const rows = data.sessions.map((session: any) => [
      session.createdAt.toISOString(),
      session.sessionType,
      session.overallScore || '',
      session.researchTopic,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// シングルトンインスタンス
export const analyticsService = new AnalyticsService();