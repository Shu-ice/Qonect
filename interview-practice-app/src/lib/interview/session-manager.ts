/**
 * 面接セッション制御システム
 * 15分タイマー、質問管理、リアルタイム評価
 */

import { interviewService } from '@/lib/db/interview-service';
import { meiwaAIService } from '@/lib/meiwa-ai-service';
import { MeiwaQuestion, MeiwaQuestionType, MeiwaResearchEvaluation } from '@/types/meiwa-evaluation';

export interface SessionConfig {
  duration: number; // 秒（デフォルト900 = 15分）
  questionCount: number; // 質問数（デフォルト8-12問）
  difficultyLevel: number; // 1-5（デフォルト3）
  realTimeEvaluation: boolean;
  autoQuestionGeneration: boolean;
  sessionType: 'practice' | 'mock_exam' | 'final_prep';
}

export interface SessionState {
  id: string;
  userId: string;
  status: 'preparing' | 'intro' | 'questioning' | 'response' | 'transition' | 'complete' | 'paused' | 'error';
  currentPhase: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  timeElapsed: number;
  questions: MeiwaQuestion[];
  responses: SessionResponse[];
  realTimeMetrics: RealTimeMetrics;
}

export interface SessionResponse {
  questionId: string;
  responseText: string;
  responseType: 'voice' | 'text';
  duration: number;
  confidence: number;
  evaluation?: RealTimeEvaluation;
  timestamp: Date;
}

export interface RealTimeMetrics {
  averageResponseTime: number;
  averageConfidence: number;
  currentScore: number;
  progressPercentage: number;
  engagementLevel: number;
  stressLevel: number;
}

export interface RealTimeEvaluation {
  contentRelevance: number;    // 内容関連性 0-1
  specificity: number;         // 具体性 0-1  
  logicalStructure: number;    // 論理構成 0-1
  schoolAlignment: number;     // 学校適合性 0-1
  improvementTips: string[];   // 改善提案
  strengths: string[];         // 強み
}

export interface SessionCallbacks {
  onStatusChange?: (status: SessionState['status']) => void;
  onQuestionStart?: (question: MeiwaQuestion, index: number) => void;
  onResponseReceived?: (response: SessionResponse) => void;
  onTimeUpdate?: (timeRemaining: number, timeElapsed: number) => void;
  onEvaluationUpdate?: (evaluation: RealTimeEvaluation) => void;
  onSessionComplete?: (finalEvaluation: MeiwaResearchEvaluation) => void;
  onError?: (error: SessionError) => void;
}

export interface SessionError {
  code: string;
  message: string;
  details?: any;
  recovery?: 'retry' | 'skip' | 'end';
}

class InterviewSessionManager {
  private state: SessionState | null = null;
  private config: SessionConfig;
  private callbacks: SessionCallbacks = {};
  private timer: NodeJS.Timeout | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = {
      duration: 900, // 15分
      questionCount: 10,
      difficultyLevel: 3,
      realTimeEvaluation: true,
      autoQuestionGeneration: true,
      sessionType: 'practice',
    };
  }

  /**
   * セッション設定
   */
  public configure(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * コールバック設定
   */
  public setCallbacks(callbacks: SessionCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * セッション開始
   */
  public async startSession(
    userId: string, 
    essayId?: string, 
    researchTopic?: string
  ): Promise<string> {
    try {
      // 既存セッションのクリーンアップ
      if (this.state) {
        await this.endSession();
      }

      // 新規セッション作成
      const session = await interviewService.createSession({
        userId,
        essayId,
        sessionType: this.config.sessionType,
        researchTopic: researchTopic || '探究活動について',
        difficultyLevel: this.config.difficultyLevel,
        deviceInfo: this.getDeviceInfo(),
        networkQuality: await this.checkNetworkQuality(),
      });

      // セッション状態初期化
      this.state = {
        id: session.id,
        userId,
        status: 'preparing',
        currentPhase: 'intro',
        currentQuestionIndex: 0,
        totalQuestions: this.config.questionCount,
        timeRemaining: this.config.duration,
        timeElapsed: 0,
        questions: [],
        responses: [],
        realTimeMetrics: {
          averageResponseTime: 0,
          averageConfidence: 0,
          currentScore: 0,
          progressPercentage: 0,
          engagementLevel: 0.5,
          stressLevel: 0.3,
        },
      };

      // 質問生成
      if (this.config.autoQuestionGeneration) {
        await this.generateQuestions(researchTopic);
      }

      // タイマー開始
      this.startTimer();

      // 自動保存開始
      this.startAutoSave();

      this.updateStatus('intro');
      
      console.log(`Interview session started: ${session.id}`);
      return session.id;

    } catch (error) {
      const sessionError: SessionError = {
        code: 'SESSION_START_FAILED',
        message: 'セッションの開始に失敗しました',
        details: error,
        recovery: 'retry',
      };
      this.callbacks.onError?.(sessionError);
      throw error;
    }
  }

  /**
   * 次の質問に進む
   */
  public async nextQuestion(): Promise<MeiwaQuestion | null> {
    if (!this.state) {
      throw new Error('Session not started');
    }

    if (this.state.currentQuestionIndex >= this.state.questions.length) {
      // セッション完了
      await this.completeSession();
      return null;
    }

    const question = this.state.questions[this.state.currentQuestionIndex];
    
    this.updateStatus('questioning');
    this.callbacks.onQuestionStart?.(question, this.state.currentQuestionIndex);

    return question;
  }

  /**
   * 回答受信処理
   */
  public async receiveResponse(
    responseText: string,
    responseType: 'voice' | 'text',
    confidence: number = 1.0,
    duration: number = 0
  ): Promise<void> {
    if (!this.state) {
      throw new Error('Session not started');
    }

    const currentQuestion = this.state.questions[this.state.currentQuestionIndex];
    if (!currentQuestion) {
      throw new Error('No current question');
    }

    // 回答データ作成
    const response: SessionResponse = {
      questionId: currentQuestion.id,
      responseText,
      responseType,
      duration,
      confidence,
      timestamp: new Date(),
    };

    // リアルタイム評価実行
    if (this.config.realTimeEvaluation) {
      try {
        response.evaluation = await this.evaluateResponse(response, currentQuestion);
        this.callbacks.onEvaluationUpdate?.(response.evaluation);
      } catch (error) {
        console.warn('Real-time evaluation failed:', error);
      }
    }

    // データベースに保存
    await interviewService.addResponse({
      sessionId: this.state.id,
      questionId: currentQuestion.id,
      responseText,
      responseType,
      duration,
      audioTranscript: responseType === 'voice' ? responseText : undefined,
      transcriptConfidence: confidence,
      aiEvaluation: response.evaluation,
      realtimeAnalysis: this.state.realTimeMetrics,
    });

    // 状態更新
    this.state.responses.push(response);
    this.updateRealTimeMetrics(response);
    this.state.currentQuestionIndex++;

    this.callbacks.onResponseReceived?.(response);

    // 次の質問またはセッション完了
    if (this.state.currentQuestionIndex >= this.state.questions.length) {
      await this.completeSession();
    } else {
      this.updateStatus('transition');
      // 3秒後に次の質問
      setTimeout(() => {
        if (this.state) {
          this.nextQuestion();
        }
      }, 3000);
    }
  }

  /**
   * セッション一時停止
   */
  public pauseSession(): void {
    if (!this.state) return;

    this.updateStatus('paused');
    this.stopTimer();
  }

  /**
   * セッション再開
   */
  public resumeSession(): void {
    if (!this.state) return;

    this.updateStatus('questioning');
    this.startTimer();
  }

  /**
   * セッション終了
   */
  public async endSession(): Promise<void> {
    if (!this.state) return;

    this.stopTimer();
    this.stopAutoSave();

    if (this.state.status !== 'complete') {
      this.updateStatus('complete');
    }

    this.state = null;
  }

  /**
   * 現在のセッション状態取得
   */
  public getState(): SessionState | null {
    return this.state;
  }

  /**
   * 緊急停止
   */
  public emergencyStop(): void {
    this.stopTimer();
    this.stopAutoSave();
    
    if (this.state) {
      this.updateStatus('error');
      this.state = null;
    }
  }

  /**
   * プライベートメソッド
   */
  private async generateQuestions(researchTopic?: string): Promise<void> {
    if (!this.state) return;

    try {
      const questions = await meiwaAIService.generateQuestions(
        researchTopic || '探究活動について',
        this.config.questionCount,
        this.config.difficultyLevel
      );

      // データベースに質問を保存
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        await interviewService.addQuestion({
          sessionId: this.state.id,
          questionText: question.question,
          questionType: question.type,
          intent: question.intent,
          difficulty: question.difficulty,
          evaluationCriteria: question.evaluationCriteria,
          expectedElements: question.expectedResponse ? [question.expectedResponse] : [],
          orderIndex: i,
          aiProvider: 'meiwa-ai',
        });
      }

      this.state.questions = questions.map((q, index) => ({
        ...q,
        id: `${this.state!.id}-q${index}`,
      }));

    } catch (error) {
      console.error('Question generation failed:', error);
      
      // フォールバック質問を使用
      this.state.questions = this.getFallbackQuestions();
    }
  }

  private getFallbackQuestions(): MeiwaQuestion[] {
    return [
      {
        id: 'fallback-1',
        question: 'これまでに興味を持って調べたことについて教えてください。',
        type: 'research_depth' as MeiwaQuestionType,
        intent: '探究活動の実体験確認',
        difficulty: 3,
        evaluationCriteria: ['具体性', '体験性', '継続性'],
        expectedResponse: '具体的なテーマ、調べた方法、発見したことについて',
        followUpTriggers: ['具体的なテーマ', '調べた方法', '発見したこと'],
      },
      {
        id: 'fallback-2', 
        question: 'その調べ学習で一番印象に残ったことは何ですか？',
        type: 'personal_insight' as MeiwaQuestionType,
        intent: '個人的な気づき・感動の確認',
        difficulty: 3,
        evaluationCriteria: ['感情表現', '具体性', '独自性'],
        expectedResponse: '具体的なエピソード、感情の表現、学びについて',
        followUpTriggers: ['具体的なエピソード', '感情の表現', '学び'],
      },
    ];
  }

  private async evaluateResponse(
    response: SessionResponse,
    question: MeiwaQuestion
  ): Promise<RealTimeEvaluation> {
    try {
      const evaluation = await meiwaAIService.evaluateResponse(
        question,
        response.responseText,
        {
          researchTopic: '探究活動',
          previousResponses: this.state?.responses.map(r => r.responseText) || [],
        }
      );

      // MeiwaResearchEvaluationから簡易評価に変換
      const score = this.extractScoreFromEvaluation(evaluation);
      
      return {
        contentRelevance: score * 0.2,
        specificity: score * 0.15,
        logicalStructure: score * 0.15,
        schoolAlignment: score * 0.2,
        improvementTips: ['より具体的に話してみましょう'],
        strengths: ['話の内容が明確です'],
      };
    } catch (error) {
      console.warn('Response evaluation failed:', error);
      
      // フォールバック評価
      return {
        contentRelevance: 0.7,
        specificity: 0.6,
        logicalStructure: 0.7,
        schoolAlignment: 0.8,
        improvementTips: ['より具体的に話してみましょう'],
        strengths: ['話の内容が明確です'],
      };
    }
  }

  private updateRealTimeMetrics(response: SessionResponse): void {
    if (!this.state) return;

    const metrics = this.state.realTimeMetrics;
    const responses = this.state.responses;

    // 平均応答時間更新
    const totalDuration = responses.reduce((sum, r) => sum + r.duration, 0);
    metrics.averageResponseTime = totalDuration / responses.length;

    // 平均信頼度更新
    const totalConfidence = responses.reduce((sum, r) => sum + r.confidence, 0);
    metrics.averageConfidence = totalConfidence / responses.length;

    // 現在スコア更新
    if (response.evaluation) {
      const evaluationScore = (
        response.evaluation.contentRelevance +
        response.evaluation.specificity +
        response.evaluation.logicalStructure +
        response.evaluation.schoolAlignment
      ) / 4;
      
      const totalScore = responses
        .filter(r => r.evaluation)
        .reduce((sum, r) => sum + (
          (r.evaluation!.contentRelevance + r.evaluation!.specificity + 
           r.evaluation!.logicalStructure + r.evaluation!.schoolAlignment) / 4
        ), 0);
      
      metrics.currentScore = totalScore / responses.filter(r => r.evaluation).length;
    }

    // 進捗率更新
    metrics.progressPercentage = (this.state.currentQuestionIndex / this.state.totalQuestions) * 100;

    // エンゲージメント・ストレスレベル推定
    if (response.evaluation) {
      metrics.engagementLevel = Math.min(1, metrics.engagementLevel + 
        (response.evaluation.contentRelevance - 0.5) * 0.1);
      metrics.stressLevel = Math.max(0, metrics.stressLevel + 
        (0.5 - response.evaluation.logicalStructure) * 0.05);
    }
  }

  private async completeSession(): Promise<void> {
    if (!this.state) return;

    try {
      // 最終評価生成
      const finalEvaluation = await meiwaAIService.generateFinalEvaluation(
        '探究活動について',
        this.state.responses.map(r => r.responseText),
        this.state.responses.reduce((acc, r) => {
          if (r.evaluation) {
            // 個別評価を統合
            return { ...acc };
          }
          return acc;
        }, {} as Partial<MeiwaResearchEvaluation>)
      );

      // セッション完了処理
      await interviewService.completeSession(this.state.id, finalEvaluation);

      this.updateStatus('complete');
      this.callbacks.onSessionComplete?.(finalEvaluation);

    } catch (error) {
      console.error('Session completion failed:', error);
      this.updateStatus('error');
    }
  }

  private updateStatus(status: SessionState['status']): void {
    if (!this.state) return;

    this.state.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private startTimer(): void {
    this.stopTimer();
    
    this.timer = setInterval(() => {
      if (!this.state) return;

      this.state.timeElapsed++;
      this.state.timeRemaining = Math.max(0, this.config.duration - this.state.timeElapsed);

      this.callbacks.onTimeUpdate?.(this.state.timeRemaining, this.state.timeElapsed);

      // 時間切れチェック
      if (this.state.timeRemaining <= 0) {
        this.completeSession();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startAutoSave(): void {
    this.stopAutoSave();
    
    this.autoSaveInterval = setInterval(async () => {
      if (this.state) {
        try {
          await interviewService.updateSession(this.state.id, {
            currentPhase: this.state.currentPhase,
            questionCount: this.state.questions.length,
            completionPercentage: this.state.realTimeMetrics.progressPercentage,
          });
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }
    }, 30000); // 30秒ごと
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  private getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private async checkNetworkQuality(): Promise<string> {
    try {
      // @ts-ignore - 実験的API
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        return effectiveType || 'unknown';
      }
    } catch (error) {
      console.warn('Network quality check failed:', error);
    }
    return 'unknown';
  }

  /**
   * MeiwaResearchEvaluationから簡易スコアを抽出
   */
  private extractScoreFromEvaluation(evaluation: Partial<MeiwaResearchEvaluation>): number {
    // 各評価項目のスコアを平均化
    const scores: number[] = [];
    
    if (evaluation.genuineInterest?.score) scores.push(evaluation.genuineInterest.score);
    if (evaluation.experienceBase?.score) scores.push(evaluation.experienceBase.score);
    if (evaluation.socialConnection?.score) scores.push(evaluation.socialConnection.score);
    if (evaluation.noDefinitiveAnswer?.score) scores.push(evaluation.noDefinitiveAnswer.score);
    if (evaluation.otherUnderstanding?.score) scores.push(evaluation.otherUnderstanding.score);
    if (evaluation.selfTransformation?.score) scores.push(evaluation.selfTransformation.score);
    if (evaluation.originalExpression?.score) scores.push(evaluation.originalExpression.score);
    
    if (scores.length === 0) return 0.7; // デフォルト
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return averageScore / 5; // 5段階評価を0-1の範囲に正規化
  }
}

// シングルトンインスタンス
export const sessionManager = new InterviewSessionManager();