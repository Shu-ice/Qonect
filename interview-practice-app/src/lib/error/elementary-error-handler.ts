/**
 * 🛡️ 小学6年生向けエラーハンドリングシステム
 * 優しく、分かりやすいエラーメッセージで不安を与えない
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  TIMEOUT = 'TIMEOUT',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN'
}

export interface FriendlyError {
  type: ErrorType;
  message: string;
  userMessage: string; // 小学生向けメッセージ
  suggestion: string;  // 解決方法の提案
  emoji: string;       // 親しみやすい絵文字
  recoverable: boolean;
}

export class ElementaryErrorHandler {
  /**
   * エラーを小学生向けに変換
   */
  static translateError(error: any): FriendlyError {
    console.error('🔍 元のエラー:', error);

    // ネットワークエラー
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return {
        type: ErrorType.NETWORK,
        message: error.message,
        userMessage: 'インターネットにつながっていないみたいです',
        suggestion: 'Wi-Fiの接続を確認してから、もう一度試してみてください',
        emoji: '📡',
        recoverable: true
      };
    }

    // タイムアウトエラー
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      return {
        type: ErrorType.TIMEOUT,
        message: error.message,
        userMessage: 'ちょっと時間がかかりすぎちゃいました',
        suggestion: '少し待ってから、もう一度ボタンを押してみてください',
        emoji: '⏰',
        recoverable: true
      };
    }

    // API制限エラー
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return {
        type: ErrorType.API,
        message: error.message,
        userMessage: 'たくさん練習してくれてありがとう！ちょっと休憩しましょう',
        suggestion: '5分くらい待ってから、また練習を続けてください',
        emoji: '☕',
        recoverable: true
      };
    }

    // 認証エラー
    if (error.status === 401 || error.status === 403) {
      return {
        type: ErrorType.PERMISSION,
        message: error.message,
        userMessage: 'ログインが必要みたいです',
        suggestion: 'もう一度ログインしてから試してみてください',
        emoji: '🔑',
        recoverable: true
      };
    }

    // 入力エラー
    if (error.type === ErrorType.VALIDATION) {
      return {
        type: ErrorType.VALIDATION,
        message: error.message,
        userMessage: '入力した内容を確認してみてください',
        suggestion: error.suggestion || '赤い枠の部分を直してから、もう一度試してください',
        emoji: '✏️',
        recoverable: true
      };
    }

    // その他のエラー
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || 'Unknown error',
      userMessage: 'なにか問題が起きちゃいました',
      suggestion: 'ページを更新してから、もう一度試してみてください',
      emoji: '🤔',
      recoverable: false
    };
  }

  /**
   * エラーリカバリー戦略
   */
  static async attemptRecovery(error: FriendlyError): Promise<boolean> {
    switch (error.type) {
      case ErrorType.NETWORK:
        // ネットワーク再接続待ち
        return await this.waitForConnection();
      
      case ErrorType.TIMEOUT:
        // 少し待ってリトライ
        await this.delay(3000);
        return true;
      
      case ErrorType.API:
        // レート制限の場合は長めに待つ
        await this.delay(10000);
        return true;
      
      default:
        return false;
    }
  }

  /**
   * ネットワーク接続を待つ
   */
  private static async waitForConnection(maxAttempts = 5): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      if (navigator.onLine) {
        return true;
      }
      await this.delay(2000);
    }
    return false;
  }

  /**
   * 遅延処理
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * リトライロジック（exponential backoff）
   */
  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const delay = baseDelay * Math.pow(2, i);
        console.log(`🔄 リトライ ${i + 1}/${maxRetries} (${delay}ms後)`);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * エラー通知（保護者向け）
   */
  static notifyParent(error: FriendlyError): void {
    if (!error.recoverable) {
      console.error('👨‍👩‍👧 保護者への通知:', {
        timestamp: new Date().toISOString(),
        error: error.message,
        type: error.type
      });
      
      // ローカルストレージに記録
      const errorLog = JSON.parse(
        localStorage.getItem('parentErrorLog') || '[]'
      );
      errorLog.push({
        timestamp: Date.now(),
        type: error.type,
        message: error.message
      });
      
      // 最新10件のみ保持
      if (errorLog.length > 10) {
        errorLog.shift();
      }
      
      localStorage.setItem('parentErrorLog', JSON.stringify(errorLog));
    }
  }
}

/**
 * グローバルエラーハンドラー設定
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window !== 'undefined') {
    // 未処理のPromiseエラー
    window.addEventListener('unhandledrejection', (event) => {
      console.error('⚠️ 未処理のPromiseエラー:', event.reason);
      const friendlyError = ElementaryErrorHandler.translateError(event.reason);
      
      // UIに通知（実装はコンポーネント側で）
      window.dispatchEvent(new CustomEvent('friendlyError', {
        detail: friendlyError
      }));
      
      event.preventDefault();
    });

    // 一般的なエラー
    window.addEventListener('error', (event) => {
      console.error('⚠️ グローバルエラー:', event.error);
      const friendlyError = ElementaryErrorHandler.translateError(event.error);
      
      window.dispatchEvent(new CustomEvent('friendlyError', {
        detail: friendlyError
      }));
      
      event.preventDefault();
    });
  }
}

/**
 * APIエラーレスポンスの標準化
 */
export class APIErrorResponse {
  static create(error: any): Response {
    const friendlyError = ElementaryErrorHandler.translateError(error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          type: friendlyError.type,
          message: friendlyError.userMessage,
          suggestion: friendlyError.suggestion,
          emoji: friendlyError.emoji,
          recoverable: friendlyError.recoverable
        }
      }),
      {
        status: this.getStatusCode(friendlyError.type),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  private static getStatusCode(type: ErrorType): number {
    switch (type) {
      case ErrorType.VALIDATION:
        return 400;
      case ErrorType.PERMISSION:
        return 403;
      case ErrorType.API:
        return 429;
      case ErrorType.TIMEOUT:
        return 504;
      case ErrorType.NETWORK:
        return 503;
      default:
        return 500;
    }
  }
}

/**
 * デバッグ用エラー情報（開発環境のみ）
 */
export class ErrorDebugger {
  private static errors: FriendlyError[] = [];
  private static readonly MAX_ERRORS = 50;

  static log(error: FriendlyError): void {
    if (process.env.NODE_ENV === 'development') {
      this.errors.push({
        ...error,
        timestamp: new Date().toISOString()
      } as any);

      if (this.errors.length > this.MAX_ERRORS) {
        this.errors.shift();
      }

      console.group(`🐛 エラーデバッグ情報 [${error.type}]`);
      console.log('ユーザー向けメッセージ:', error.userMessage);
      console.log('提案:', error.suggestion);
      console.log('技術的詳細:', error.message);
      console.log('リカバリー可能:', error.recoverable);
      console.groupEnd();
    }
  }

  static getErrorHistory(): FriendlyError[] {
    return this.errors;
  }

  static clearHistory(): void {
    this.errors = [];
  }
}