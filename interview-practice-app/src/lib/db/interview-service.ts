/**
 * 面接セッション管理サービス
 * セッションの永続化と分析データの蓄積
 */

import { prisma } from '@/lib/prisma';
import { 
  InterviewSession, 
  InterviewQuestion, 
  InterviewResponse,
  RealtimeAnalytics,
  User 
} from '@/generated/prisma';
import { MeiwaResearchEvaluation, MeiwaQuestion, MeiwaQuestionType } from '@/types/meiwa-evaluation';

export interface CreateSessionData {
  userId: string;
  essayId?: string;
  sessionType: 'practice' | 'mock_exam' | 'final_prep';
  researchTopic: string;
  aiProvider?: string;
  difficultyLevel?: number;
  deviceInfo?: any;
  networkQuality?: string;
}

export interface SessionWithDetails extends InterviewSession {
  user: Pick<User, 'studentName' | 'grade'>;
  questions: (InterviewQuestion & {
    responses: InterviewResponse[];
  })[];
  responses: InterviewResponse[];
  realtimeAnalytics: RealtimeAnalytics[];
}

export interface CreateQuestionData {
  sessionId: string;
  questionText: string;
  questionType: MeiwaQuestionType;
  intent: string;
  difficulty: number;
  evaluationCriteria: string[];
  expectedElements?: string[];
  orderIndex: number;
  aiProvider: string;
}

export interface CreateResponseData {
  sessionId: string;
  questionId: string;
  responseText: string;
  responseType: 'voice' | 'text';
  duration?: number;
  audioTranscript?: string;
  transcriptConfidence?: number;
  speechQuality?: any;
  aiEvaluation?: any;
  realtimeAnalysis?: any;
  suggestions?: string[];
  strengths?: string[];
}

export class InterviewService {
  /**
   * 新規面接セッション作成
   */
  async createSession(data: CreateSessionData): Promise<InterviewSession> {
    const session = await prisma.interviewSession.create({
      data: {
        userId: data.userId,
        essayId: data.essayId,
        sessionType: data.sessionType,
        researchTopic: data.researchTopic,
        startTime: new Date(),
        currentPhase: 'intro',
        aiProvider: data.aiProvider || 'multi',
        difficultyLevel: data.difficultyLevel || 3,
        deviceInfo: data.deviceInfo,
        networkQuality: data.networkQuality,
      },
    });

    console.log(`新規面接セッション作成: ${session.id} (ユーザー: ${data.userId})`);
    return session;
  }

  /**
   * セッション詳細取得
   */
  async getSessionDetails(sessionId: string): Promise<SessionWithDetails | null> {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            studentName: true,
            grade: true,
          },
        },
        questions: {
          include: {
            responses: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
        responses: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        realtimeAnalytics: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    return session as SessionWithDetails | null;
  }

  /**
   * ユーザーのセッション履歴取得
   */
  async getUserSessions(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    sessions: InterviewSession[];
    total: number;
  }> {
    const [sessions, total] = await Promise.all([
      prisma.interviewSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              questions: true,
              responses: true,
            },
          },
        },
      }),
      prisma.interviewSession.count({
        where: { userId },
      }),
    ]);

    return { sessions, total };
  }

  /**
   * セッション更新
   */
  async updateSession(
    sessionId: string,
    updates: {
      currentPhase?: string;
      questionCount?: number;
      completionPercentage?: number;
      finalEvaluation?: MeiwaResearchEvaluation;
      overallScore?: number;
      endTime?: Date;
      duration?: number;
    }
  ): Promise<InterviewSession> {
    return await prisma.interviewSession.update({
      where: { id: sessionId },
      data: updates,
    });
  }

  /**
   * 質問追加
   */
  async addQuestion(data: CreateQuestionData): Promise<InterviewQuestion> {
    const question = await prisma.interviewQuestion.create({
      data: {
        sessionId: data.sessionId,
        questionText: data.questionText,
        questionType: data.questionType,
        intent: data.intent,
        difficulty: data.difficulty,
        evaluationCriteria: data.evaluationCriteria,
        expectedElements: data.expectedElements,
        orderIndex: data.orderIndex,
        generateTime: new Date(),
        aiProvider: data.aiProvider,
      },
    });

    // セッションの質問数を更新
    await this.updateSessionQuestionCount(data.sessionId);

    return question;
  }

  /**
   * 回答追加
   */
  async addResponse(data: CreateResponseData): Promise<InterviewResponse> {
    const response = await prisma.interviewResponse.create({
      data: {
        sessionId: data.sessionId,
        questionId: data.questionId,
        responseText: data.responseText,
        responseType: data.responseType,
        duration: data.duration,
        audioTranscript: data.audioTranscript,
        transcriptConfidence: data.transcriptConfidence,
        speechQuality: data.speechQuality,
        aiEvaluation: data.aiEvaluation,
        realtimeAnalysis: data.realtimeAnalysis,
        suggestions: data.suggestions,
        strengths: data.strengths,
        evaluatedAt: new Date(),
      },
    });

    // セッションの進捗を更新
    await this.updateSessionProgress(data.sessionId);

    return response;
  }

  /**
   * リアルタイム分析データ記録
   */
  async recordRealtimeAnalytics(
    sessionId: string,
    analysisType: string,
    metricsData: any,
    processingTime: number,
    aiProvider: string
  ): Promise<RealtimeAnalytics> {
    return await prisma.realtimeAnalytics.create({
      data: {
        sessionId,
        timestamp: new Date(),
        analysisType,
        metricsData,
        processingTime,
        aiProvider,
      },
    });
  }

  /**
   * セッション完了処理
   */
  async completeSession(
    sessionId: string,
    finalEvaluation: MeiwaResearchEvaluation
  ): Promise<InterviewSession> {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        responses: true,
      },
    });

    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
    const overallScore = finalEvaluation.overallScore;

    const completedSession = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        currentPhase: 'complete',
        endTime,
        duration,
        finalEvaluation: finalEvaluation as any,
        overallScore,
        completionPercentage: 100,
      },
    });

    // 実績解除チェック
    await this.checkAndUnlockAchievements(session.userId, completedSession);

    console.log(`面接セッション完了: ${sessionId} (スコア: ${overallScore})`);
    return completedSession;
  }

  /**
   * セッション分析データ取得
   */
  async getSessionAnalytics(sessionId: string) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          include: {
            responses: {
              select: {
                responseText: true,
                duration: true,
                transcriptConfidence: true,
                aiEvaluation: true,
                realtimeAnalysis: true,
              },
            },
          },
        },
        realtimeAnalytics: true,
      },
    });

    if (!session) {
      return null;
    }

    // 分析データの集計
    const analytics = {
      sessionInfo: {
        id: session.id,
        duration: session.duration,
        questionCount: session.questionCount,
        overallScore: session.overallScore,
        completionPercentage: session.completionPercentage,
      },
      responseAnalytics: {
        averageResponseTime: this.calculateAverageResponseTime(session.questions),
        averageConfidence: this.calculateAverageConfidence(session.questions),
        responseQuality: this.analyzeResponseQuality(session.questions),
      },
      realtimeMetrics: {
        confidenceOverTime: this.extractConfidenceTimeline(session.realtimeAnalytics),
        engagementLevels: this.extractEngagementTimeline(session.realtimeAnalytics),
        processingTimes: this.extractProcessingTimes(session.realtimeAnalytics),
      },
      improvements: this.generateImprovementSuggestions(session),
    };

    return analytics;
  }

  /**
   * プライベートヘルパーメソッド
   */
  private async updateSessionQuestionCount(sessionId: string): Promise<void> {
    const questionCount = await prisma.interviewQuestion.count({
      where: { sessionId },
    });

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { questionCount },
    });
  }

  private async updateSessionProgress(sessionId: string): Promise<void> {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
      },
    });

    if (session && session._count.questions > 0) {
      const completionPercentage = (session._count.responses / session._count.questions) * 100;
      
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { completionPercentage: Math.min(completionPercentage, 100) },
      });
    }
  }

  private async checkAndUnlockAchievements(
    userId: string,
    session: InterviewSession
  ): Promise<void> {
    const achievements = [];

    // 初回セッション完了
    const sessionCount = await prisma.interviewSession.count({
      where: { userId, currentPhase: 'complete' },
    });

    if (sessionCount === 1) {
      achievements.push({
        userId,
        type: 'first_session_completed',
        title: '初回面接練習完了',
        description: '最初の面接練習を完了しました',
        category: 'interview',
        score: session.overallScore,
      });
    }

    // 高スコア達成
    if (session.overallScore && session.overallScore >= 4.5) {
      achievements.push({
        userId,
        type: 'high_score_achieved',
        title: '高評価獲得',
        description: '4.5点以上の高評価を獲得しました',
        category: 'interview',
        score: session.overallScore,
      });
    }

    // 実績を一括作成
    if (achievements.length > 0) {
      await prisma.achievement.createMany({
        data: achievements,
      });
    }
  }

  private calculateAverageResponseTime(questions: any[]): number {
    const allResponses = questions.flatMap(q => q.responses);
    const validDurations = allResponses
      .map(r => r.duration)
      .filter(d => d !== null && d !== undefined);
    
    return validDurations.length > 0
      ? validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length
      : 0;
  }

  private calculateAverageConfidence(questions: any[]): number {
    const allResponses = questions.flatMap(q => q.responses);
    const confidenceScores = allResponses
      .map(r => r.transcriptConfidence)
      .filter(c => c !== null && c !== undefined);
    
    return confidenceScores.length > 0
      ? confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length
      : 0;
  }

  private analyzeResponseQuality(questions: any[]): any {
    const allResponses = questions.flatMap(q => q.responses);
    
    return {
      totalResponses: allResponses.length,
      averageLength: allResponses.reduce((sum, r) => sum + r.responseText.length, 0) / allResponses.length,
      qualityMetrics: allResponses.map(r => r.aiEvaluation).filter(Boolean),
    };
  }

  private extractConfidenceTimeline(analytics: RealtimeAnalytics[]): any[] {
    return analytics
      .filter(a => a.analysisType === 'confidence')
      .map(a => ({
        timestamp: a.timestamp,
        confidence: a.metricsData?.confidence || 0,
      }));
  }

  private extractEngagementTimeline(analytics: RealtimeAnalytics[]): any[] {
    return analytics
      .filter(a => a.analysisType === 'engagement')
      .map(a => ({
        timestamp: a.timestamp,
        engagement: a.metricsData?.engagement || 0,
      }));
  }

  private extractProcessingTimes(analytics: RealtimeAnalytics[]): any[] {
    return analytics.map(a => ({
      analysisType: a.analysisType,
      processingTime: a.processingTime,
      aiProvider: a.aiProvider,
    }));
  }

  private generateImprovementSuggestions(session: any): string[] {
    const suggestions = [];
    
    if (session.overallScore && session.overallScore < 3.0) {
      suggestions.push('回答の具体性を高めましょう');
      suggestions.push('探究活動の体験をより詳しく説明してみてください');
    }
    
    if (session.duration && session.duration < 300) { // 5分未満
      suggestions.push('もう少し時間をかけて丁寧に回答してみましょう');
    }
    
    return suggestions;
  }

  /**
   * セッションデータ削除（プライバシー保護）
   */
  async deleteSession(sessionId: string): Promise<void> {
    await prisma.interviewSession.delete({
      where: { id: sessionId },
    });
    
    console.log(`面接セッションを削除: ${sessionId}`);
  }

  /**
   * 学習進捗サマリー取得
   */
  async getLearningProgress(userId: string) {
    const sessions = await prisma.interviewSession.findMany({
      where: { 
        userId,
        currentPhase: 'complete',
      },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        overallScore: true,
        sessionType: true,
        questionCount: true,
        duration: true,
      },
    });

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        improvement: 0,
        strengthAreas: [],
        improvementAreas: [],
      };
    }

    const scores = sessions.map(s => s.overallScore || 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // 最初と最後のセッションでの改善度
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    const improvement = lastScore - firstScore;

    return {
      totalSessions: sessions.length,
      averageScore: Math.round(averageScore * 10) / 10,
      improvement: Math.round(improvement * 10) / 10,
      recentTrend: scores.slice(-3), // 最近3回のスコア
      sessionHistory: sessions,
    };
  }
}

// シングルトンインスタンス
export const interviewService = new InterviewService();