/**
 * 構造化ログシステム
 * 開発・本番環境でのログ管理とエラー追跡
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  sessionId?: string;
  userId?: string;
  requestId?: string;
  source?: string;
  stackTrace?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxStorageEntries: number;
  includeSensitiveData: boolean;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private flushTimeout: number | null = null;

  constructor() {
    this.config = {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      enableConsole: true,
      enableStorage: true,
      enableRemote: process.env.NODE_ENV === 'production',
      remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
      maxStorageEntries: 1000,
      includeSensitiveData: process.env.NODE_ENV === 'development',
    };

    this.sessionId = this.generateSessionId();
    this.initializeLogger();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeLogger(): void {
    // グローバルエラーハンドラー
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Global Error Handler', {
          message: event.error?.message || event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', {
          reason: event.reason,
          promise: event.promise,
        });
      });

      // Performance Observer for Web Vitals logging
      this.initializePerformanceLogging();
    }
  }

  private initializePerformanceLogging(): void {
    if ('PerformanceObserver' in window) {
      // Long Task 監視
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // 50ms以上のタスク
            this.warn('Long Task Detected', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        });
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long Task API がサポートされていない場合は無視
      }

      // Navigation Timing
      const navigationObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          this.info('Navigation Timing', {
            type: entry.type,
            loadEventEnd: entry.loadEventEnd,
            domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
            responseEnd: entry.responseEnd,
            requestStart: entry.requestStart,
          });
        });
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= configLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      sessionId: this.sessionId,
      source: this.getSource(),
    };

    if (context) {
      entry.context = this.sanitizeContext(context);
    }

    // エラーレベルではスタックトレースを含める
    if (level === 'error' || level === 'fatal') {
      entry.stackTrace = new Error().stack;
    }

    return entry;
  }

  private getSource(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    // ログ関数自体を除外して呼び出し元を取得
    for (let i = 3; i < Math.min(lines.length, 6); i++) {
      const line = lines[i];
      if (line && !line.includes('logger.ts') && !line.includes('Logger.')) {
        const match = line.match(/\s+at\s+(.+)/);
        return match ? match[1] : 'unknown';
      }
    }
    return 'unknown';
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    if (!this.config.includeSensitiveData) {
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
      const sanitized = { ...context };

      const sanitizeObject = (obj: any): any => {
        if (obj === null || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
          return obj.map(sanitizeObject);
        }

        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitizeObject(value);
          }
        }
        return result;
      };

      return sanitizeObject(sanitized);
    }

    return context;
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const message = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    const contextData = entry.context ? [entry.context] : [];

    switch (entry.level) {
      case 'debug':
        console.debug(message, ...contextData);
        break;
      case 'info':
        console.info(message, ...contextData);
        break;
      case 'warn':
        console.warn(message, ...contextData);
        break;
      case 'error':
      case 'fatal':
        console.error(message, ...contextData);
        if (entry.stackTrace) {
          console.error('Stack trace:', entry.stackTrace);
        }
        break;
    }
  }

  private writeToStorage(entry: LogEntry): void {
    if (!this.config.enableStorage || typeof window === 'undefined') return;

    try {
      const key = 'app_logs';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(entry);

      // 最大エントリ数を制限
      if (existing.length > this.config.maxStorageEntries) {
        existing.splice(0, existing.length - this.config.maxStorageEntries);
      }

      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to write log to storage:', error);
    }
  }

  private bufferForRemote(entry: LogEntry): void {
    if (!this.config.enableRemote) return;

    this.logBuffer.push(entry);

    // バッファが一定サイズになったら、または重要なログの場合は即座にフラッシュ
    if (this.logBuffer.length >= 10 || entry.level === 'error' || entry.level === 'fatal') {
      this.flushLogs();
    } else {
      // 通常は5秒後にフラッシュ
      if (this.flushTimeout) {
        clearTimeout(this.flushTimeout);
      }
      this.flushTimeout = window.setTimeout(() => this.flushLogs(), 5000);
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.config.remoteEndpoint) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          metadata: {
            userAgent: navigator.userAgent,
            url: window.location.href,
            sessionId: this.sessionId,
          },
        }),
      });
    } catch (error) {
      // リモートログ送信に失敗した場合は、バッファに戻す（最大試行回数まで）
      console.warn('Failed to send logs to remote endpoint:', error);
      this.logBuffer.unshift(...logsToSend.slice(0, 50)); // 最大50件まで再試行
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context);

    this.writeToConsole(entry);
    this.writeToStorage(entry);
    this.bufferForRemote(entry);
  }

  // Public logging methods
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log('fatal', message, context);
  }

  // ユーティリティメソッド
  setUserId(userId: string): void {
    this.sessionId = `${this.sessionId}_user_${userId}`;
  }

  setRequestId(requestId: string): void {
    // 現在のリクエストコンテキスト用（将来の実装用）
  }

  // ログ設定の更新
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // ストレージからログを取得
  getStoredLogs(): LogEntry[] {
    if (typeof window === 'undefined') return [];
    
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  // ストレージのログをクリア
  clearStoredLogs(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('app_logs');
  }

  // 即座にリモートログをフラッシュ
  async flush(): Promise<void> {
    await this.flushLogs();
  }

  // パフォーマンス測定
  time(label: string): void {
    console.time(label);
  }

  timeEnd(label: string, context?: Record<string, any>): void {
    console.timeEnd(label);
    this.debug(`Timer: ${label}`, context);
  }

  // エラー統計の取得
  getErrorStats(): Record<string, number> {
    const logs = this.getStoredLogs();
    const stats: Record<string, number> = {};

    logs
      .filter(log => log.level === 'error' || log.level === 'fatal')
      .forEach(log => {
        const errorType = log.context?.error?.name || 'Unknown';
        stats[errorType] = (stats[errorType] || 0) + 1;
      });

    return stats;
  }
}

// シングルトンインスタンス
export const logger = new Logger();

// 型定義をエクスポート（コメントアウト - 重複エクスポートを避けるため）
// export type { LogEntry };