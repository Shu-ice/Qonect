/**
 * 🛡️ Error Recovery System - 完全エラーリカバリー機構
 * 小学6年生が安心して使える障害復旧システム
 */

interface ErrorContext {
  component: string;
  action: string;
  userInput?: string;
  stage?: string;
  depth?: number;
  timestamp: number;
  sessionId: string;
}

interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'graceful_degradation' | 'user_guidance';
  maxAttempts: number;
  delayMs: number;
  fallbackValue?: any;
  userMessage: string;
  technicalInfo?: string;
}

interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  strategy: RecoveryStrategy;
  attempts: number;
  resolved: boolean;
  userImpact: 'none' | 'low' | 'medium' | 'high';
}

export class ErrorRecoverySystem {
  private static instance: ErrorRecoverySystem;
  private errorReports: Map<string, ErrorReport> = new Map();
  private sessionId: string;
  private retryAttempts: Map<string, number> = new Map();
  
  // 小学6年生向けエラーメッセージ
  private readonly FRIENDLY_MESSAGES = {
    network: {
      userMessage: '少し通信が不安定になっています。もう一度試してみてください。',
      guidance: '上の青いボタンをもう一度押してください'
    },
    ai_timeout: {
      userMessage: 'AIが考えるのに時間がかかっています。ちょっと待ってから再度お試しください。',
      guidance: '30秒ほど待ってから、もう一度お答えください'
    },
    invalid_input: {
      userMessage: '入力に少し問題があります。もう一度やり直してみましょう。',
      guidance: '質問に対して、具体的にお答えください'
    },
    system_error: {
      userMessage: 'システムに一時的な問題が起きました。すぐに解決しますので、少々お待ちください。',
      guidance: 'しばらく待ってから、もう一度お試しください'
    },
    memory_issue: {
      userMessage: 'たくさん練習してくれたので、システムが少し疲れました。リフレッシュしますね。',
      guidance: 'ページを再読み込みしていただけますか？'
    }
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeRecoverySystem();
  }

  static getInstance(): ErrorRecoverySystem {
    if (!ErrorRecoverySystem.instance) {
      ErrorRecoverySystem.instance = new ErrorRecoverySystem();
    }
    return ErrorRecoverySystem.instance;
  }

  /**
   * リカバリーシステム初期化
   */
  private initializeRecoverySystem(): void {
    // ブラウザ環境でのグローバルエラーハンドラー
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleGlobalError(event.error, {
          component: 'global',
          action: 'runtime_error',
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleGlobalError(new Error(event.reason), {
          component: 'global',
          action: 'unhandled_promise',
          timestamp: Date.now(),
          sessionId: this.sessionId
        });
      });
    }

    console.log('🛡️ Error Recovery System 初期化完了');
  }

  /**
   * メインエラーハンドリング
   */
  async handleError<T>(
    error: Error,
    context: ErrorContext,
    originalFunction?: () => Promise<T>
  ): Promise<T | null> {
    const errorId = this.generateErrorId();
    const strategy = this.determineRecoveryStrategy(error, context);
    
    const report: ErrorReport = {
      id: errorId,
      error,
      context,
      strategy,
      attempts: 0,
      resolved: false,
      userImpact: this.assessUserImpact(error, context)
    };

    this.errorReports.set(errorId, report);

    console.log(`🛡️ エラーリカバリー開始: ${error.message}`);
    console.log(`Strategy: ${strategy.type}, Max Attempts: ${strategy.maxAttempts}`);

    return this.executeRecoveryStrategy(report, originalFunction);
  }

  /**
   * リカバリー戦略決定
   */
  private determineRecoveryStrategy(error: Error, context: ErrorContext): RecoveryStrategy {
    const errorMessage = error.message.toLowerCase();

    // ネットワークエラー
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || error.name === 'TypeError') {
      return {
        type: 'retry',
        maxAttempts: 3,
        delayMs: 2000,
        userMessage: this.FRIENDLY_MESSAGES.network.userMessage,
        technicalInfo: 'Network connection issue detected'
      };
    }

    // AIタイムアウト
    if (errorMessage.includes('timeout') || errorMessage.includes('time')) {
      return {
        type: 'retry',
        maxAttempts: 2,
        delayMs: 5000,
        userMessage: this.FRIENDLY_MESSAGES.ai_timeout.userMessage,
        technicalInfo: 'AI response timeout'
      };
    }

    // 入力検証エラー
    if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
      return {
        type: 'user_guidance',
        maxAttempts: 1,
        delayMs: 0,
        userMessage: this.FRIENDLY_MESSAGES.invalid_input.userMessage,
        technicalInfo: 'Input validation failed'
      };
    }

    // メモリエラー
    if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      return {
        type: 'graceful_degradation',
        maxAttempts: 1,
        delayMs: 1000,
        userMessage: this.FRIENDLY_MESSAGES.memory_issue.userMessage,
        technicalInfo: 'Memory optimization required'
      };
    }

    // APIエラー
    if (errorMessage.includes('api') || errorMessage.includes('gemini') || errorMessage.includes('openai')) {
      return {
        type: 'fallback',
        maxAttempts: 2,
        delayMs: 3000,
        fallbackValue: this.createAPIFallback(context),
        userMessage: 'AIが少し忙しいようです。代替の質問を準備しますね。',
        technicalInfo: 'AI service unavailable'
      };
    }

    // デフォルト戦略
    return {
      type: 'graceful_degradation',
      maxAttempts: 1,
      delayMs: 1000,
      userMessage: this.FRIENDLY_MESSAGES.system_error.userMessage,
      technicalInfo: `Unknown error: ${error.message}`
    };
  }

  /**
   * リカバリー戦略実行
   */
  private async executeRecoveryStrategy<T>(
    report: ErrorReport,
    originalFunction?: () => Promise<T>
  ): Promise<T | null> {
    const { strategy } = report;

    switch (strategy.type) {
      case 'retry':
        return this.executeRetryStrategy(report, originalFunction);
        
      case 'fallback':
        return this.executeFallbackStrategy(report, originalFunction);
        
      case 'graceful_degradation':
        return this.executeGracefulDegradation(report);
        
      case 'user_guidance':
        return this.executeUserGuidance(report);
        
      default:
        console.warn(`未知のリカバリー戦略: ${strategy.type}`);
        return null;
    }
  }

  /**
   * リトライ戦略実行
   */
  private async executeRetryStrategy<T>(
    report: ErrorReport,
    originalFunction?: () => Promise<T>
  ): Promise<T | null> {
    const { strategy } = report;
    
    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      report.attempts = attempt;
      
      try {
        console.log(`🔄 リトライ実行 (${attempt}/${strategy.maxAttempts})`);
        
        if (originalFunction) {
          const result = await originalFunction();
          report.resolved = true;
          console.log('✅ リトライ成功');
          
          // ユーザー通知
          this.notifyUser('success', '復旧しました！続けて面接練習を行えます。');
          
          return result;
        }
        
      } catch (retryError) {
        console.warn(`⚠️ リトライ失敗 (${attempt}/${strategy.maxAttempts}):`, retryError);
        
        if (attempt < strategy.maxAttempts) {
          // 指数バックオフで待機
          const delay = strategy.delayMs * Math.pow(2, attempt - 1);
          console.log(`⏳ ${delay}ms 待機中...`);
          await this.delay(delay);
        }
      }
    }

    // 全リトライ失敗
    console.error('❌ 全リトライ失敗');
    this.notifyUser('error', strategy.userMessage);
    return this.createEmergencyFallback(report.context);
  }

  /**
   * フォールバック戦略実行
   */
  private async executeFallbackStrategy<T>(
    report: ErrorReport,
    originalFunction?: () => Promise<T>
  ): Promise<T | null> {
    console.log('🔄 フォールバック実行中...');
    
    try {
      // 1回だけオリジナル関数をリトライ
      if (originalFunction) {
        const result = await originalFunction();
        report.resolved = true;
        return result;
      }
    } catch (fallbackError) {
      console.warn('⚠️ フォールバック関数実行失敗:', fallbackError);
    }

    // フォールバック値を返す
    const fallbackValue = report.strategy.fallbackValue || this.createEmergencyFallback(report.context);
    
    report.resolved = true;
    this.notifyUser('warning', report.strategy.userMessage);
    
    console.log('✅ フォールバック完了');
    return fallbackValue as T;
  }

  /**
   * グレースフル・デグラデーション実行
   */
  private async executeGracefulDegradation<T>(report: ErrorReport): Promise<T | null> {
    console.log('🔧 グレースフル・デグラデーション実行中...');
    
    // システム最適化実行
    if (typeof window !== 'undefined') {
      try {
        // メモリクリーンアップ
        (window as any).memoryOptimizer?.performAggressiveOptimization();
        
        // キャッシュクリア
        (window as any).responseOptimizer?.reset();
        
        console.log('🧹 システム最適化完了');
        
      } catch (optimizationError) {
        console.warn('⚠️ システム最適化失敗:', optimizationError);
      }
    }

    const fallbackValue = this.createEmergencyFallback(report.context);
    
    report.resolved = true;
    this.notifyUser('info', report.strategy.userMessage);
    
    return fallbackValue as T;
  }

  /**
   * ユーザーガイダンス実行
   */
  private async executeUserGuidance<T>(report: ErrorReport): Promise<T | null> {
    console.log('👨‍🏫 ユーザーガイダンス実行中...');
    
    const guidance = this.createUserGuidance(report.error, report.context);
    
    this.notifyUser('guidance', report.strategy.userMessage, guidance);
    
    report.resolved = true;
    return null;
  }

  /**
   * 緊急時フォールバック作成
   */
  private createEmergencyFallback(context: ErrorContext): any {
    if (context.component === 'interview_api') {
      return {
        question: 'システムが一時的に不安定ですが、心配ありません。「受検番号と名前を教えてください」からもう一度始めましょう。',
        stageTransition: null,
        depth: context.depth || 1,
        emergency: true,
        errorRecovery: true,
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: false,
      message: 'システムを復旧中です。少々お待ちください。',
      errorRecovery: true
    };
  }

  /**
   * APIフォールバック作成
   */
  private createAPIFallback(context: ErrorContext): any {
    const fallbackQuestions = {
      opening: [
        'こんにちは。今日はお疲れさまです。',
        'お名前を教えてください。',
        'こちらまではどうやって来られましたか？'
      ],
      exploration: [
        'あなたが一番頑張っていることは何ですか？',
        'それはいつから始めましたか？',
        'どんなところが面白いと思いますか？',
        '困ったことはありませんか？'
      ],
      metacognition: [
        'その活動を通して、どんなことを学びましたか？',
        '他の勉強にも役立ちそうですか？'
      ],
      future: [
        'これからも続けていきたいですか？',
        'なぜそう思うのですか？'
      ]
    };

    const stage = context.stage || 'opening';
    const questions = fallbackQuestions[stage as keyof typeof fallbackQuestions] || fallbackQuestions.opening;
    const questionIndex = Math.min((context.depth || 1) - 1, questions.length - 1);

    return {
      question: questions[questionIndex],
      stageTransition: null,
      depth: context.depth || 1,
      fallbackMode: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ユーザーガイダンス作成
   */
  private createUserGuidance(error: Error, context: ErrorContext): string {
    const baseGuidance = '以下のことを試してみてください：';
    const suggestions = [
      '1. もう一度ゆっくりお答えください',
      '2. 具体的な例を含めて説明してください',
      '3. 分からない場合は「分からない」と素直にお答えください'
    ];

    if (context.component === 'voice_input') {
      suggestions.push('4. マイクボタンをもう一度押してください');
    }

    return `${baseGuidance}\n\n${suggestions.join('\n')}`;
  }

  /**
   * ユーザー通知
   */
  private notifyUser(
    type: 'success' | 'error' | 'warning' | 'info' | 'guidance',
    message: string,
    guidance?: string
  ): void {
    if (typeof window !== 'undefined') {
      const notification = {
        type,
        message,
        guidance,
        timestamp: Date.now(),
        autoClose: type === 'success' ? 3000 : 0
      };

      // カスタムイベントでUI通知
      const event = new CustomEvent('errorRecoveryNotification', {
        detail: notification
      });
      
      window.dispatchEvent(event);
    }

    // コンソールログ
    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      guidance: '👨‍🏫'
    }[type];

    console.log(`${emoji} ${message}`);
    if (guidance) {
      console.log(`📋 ${guidance}`);
    }
  }

  /**
   * グローバルエラーハンドラー
   */
  private handleGlobalError(error: Error, context: ErrorContext): void {
    console.error('🚨 グローバルエラー捕捉:', error);
    
    this.handleError(error, context).catch(recoveryError => {
      console.error('❌ エラーリカバリー自体が失敗:', recoveryError);
      
      // 最終手段：ページリロード推奨
      this.notifyUser('error', 
        'システムに予期しない問題が発生しました。ページを再読み込みしてください。',
        'ブラウザの更新ボタン（F5キー）を押してください'
      );
    });
  }

  /**
   * ユーザー影響度評価
   */
  private assessUserImpact(error: Error, context: ErrorContext): 'none' | 'low' | 'medium' | 'high' {
    const errorMessage = error.message.toLowerCase();
    
    // 高影響：面接が続行できない
    if (context.component === 'interview_api' || errorMessage.includes('critical')) {
      return 'high';
    }
    
    // 中影響：機能制限あり
    if (context.component === 'voice_input' || context.component === 'evaluation') {
      return 'medium';
    }
    
    // 低影響：一部機能のみ
    if (errorMessage.includes('cache') || errorMessage.includes('optimization')) {
      return 'low';
    }
    
    return 'none';
  }

  /**
   * ユーティリティメソッド
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 統計情報取得
   */
  getRecoveryStatistics() {
    const reports = Array.from(this.errorReports.values());
    const resolved = reports.filter(r => r.resolved);
    const byImpact = {
      none: reports.filter(r => r.userImpact === 'none').length,
      low: reports.filter(r => r.userImpact === 'low').length,
      medium: reports.filter(r => r.userImpact === 'medium').length,
      high: reports.filter(r => r.userImpact === 'high').length
    };

    return {
      totalErrors: reports.length,
      resolvedErrors: resolved.length,
      recoveryRate: reports.length > 0 ? resolved.length / reports.length : 0,
      impactDistribution: byImpact,
      sessionId: this.sessionId
    };
  }

  /**
   * レポート生成
   */
  generateRecoveryReport(): string {
    const stats = this.getRecoveryStatistics();
    
    return `
🛡️ エラーリカバリーレポート
==============================

📊 統計情報:
- 総エラー数: ${stats.totalErrors}
- 解決済み: ${stats.resolvedErrors}
- 復旧率: ${(stats.recoveryRate * 100).toFixed(1)}%

🎯 影響度別:
- 影響なし: ${stats.impactDistribution.none}
- 軽微: ${stats.impactDistribution.low}
- 中程度: ${stats.impactDistribution.medium}
- 重大: ${stats.impactDistribution.high}

🔧 システム状態: ${stats.recoveryRate > 0.8 ? '良好' : '要注意'}
    `;
  }
}

// シングルトンインスタンス
export const errorRecoverySystem = ErrorRecoverySystem.getInstance();

// ブラウザ環境でのグローバル登録
if (typeof window !== 'undefined') {
  (window as any).errorRecoverySystem = errorRecoverySystem;
}