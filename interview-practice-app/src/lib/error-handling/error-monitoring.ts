/**
 * エラー監視とアラート
 * リアルタイムエラー追跡と異常検知
 */

import { logger, LogEntry } from './logger';

export interface ErrorPattern {
  id: string;
  name: string;
  pattern: RegExp | string;
  threshold: number;
  timeWindow: number; // ms
  severity: 'low' | 'medium' | 'high' | 'critical';
  action?: (matches: LogEntry[]) => void;
}

export interface ErrorAlert {
  id: string;
  patternId: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  count: number;
  timeWindow: number;
  matchingLogs: LogEntry[];
  acknowledged: boolean;
}

export interface MonitoringStats {
  totalErrors: number;
  errorRate: number; // errors per minute
  topErrors: Array<{ type: string; count: number }>;
  severityBreakdown: Record<string, number>;
  recentAlerts: ErrorAlert[];
  systemHealth: 'healthy' | 'warning' | 'critical';
}

class ErrorMonitor {
  private patterns: Map<string, ErrorPattern> = new Map();
  private alerts: ErrorAlert[] = [];
  private errorCounts: Map<string, { count: number; timestamp: number }[]> = new Map();
  private monitoringInterval: number | null = null;
  private isMonitoring = false;

  constructor() {
    this.initializeDefaultPatterns();
    this.startMonitoring();
  }

  private initializeDefaultPatterns(): void {
    // デフォルトのエラーパターン定義
    const defaultPatterns: ErrorPattern[] = [
      {
        id: 'chunk_load_error',
        name: 'チャンク読み込みエラー',
        pattern: /ChunkLoadError|Loading chunk \d+ failed/i,
        threshold: 3,
        timeWindow: 5 * 60 * 1000, // 5分
        severity: 'high',
        action: (matches) => {
          logger.error('Chunk load error pattern detected', {
            count: matches.length,
            pattern: 'chunk_load_error',
            suggestion: 'Consider clearing cache or checking deployment',
          });
        },
      },
      {
        id: 'network_error',
        name: 'ネットワークエラー',
        pattern: /NetworkError|fetch.*failed|ERR_NETWORK/i,
        threshold: 5,
        timeWindow: 10 * 60 * 1000, // 10分
        severity: 'medium',
      },
      {
        id: 'ai_service_error',
        name: 'AI サービスエラー',
        pattern: /AI.*error|OpenAI.*error|Gemini.*error|anthropic.*error/i,
        threshold: 3,
        timeWindow: 15 * 60 * 1000, // 15分
        severity: 'high',
      },
      {
        id: 'database_error',
        name: 'データベースエラー',
        pattern: /Prisma.*error|Database.*error|connection.*failed/i,
        threshold: 2,
        timeWindow: 5 * 60 * 1000, // 5分
        severity: 'critical',
      },
      {
        id: 'memory_pressure',
        name: 'メモリ不足',
        pattern: /out of memory|memory.*exceeded|heap.*limit/i,
        threshold: 1,
        timeWindow: 1 * 60 * 1000, // 1分
        severity: 'critical',
      },
      {
        id: 'authentication_error',
        name: '認証エラー',
        pattern: /authentication.*failed|unauthorized|401|403/i,
        threshold: 10,
        timeWindow: 5 * 60 * 1000, // 5分
        severity: 'medium',
      },
      {
        id: 'rate_limit_error',
        name: 'レート制限エラー',
        pattern: /rate.*limit|429|too many requests/i,
        threshold: 5,
        timeWindow: 10 * 60 * 1000, // 10分
        severity: 'medium',
      },
    ];

    defaultPatterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  public addPattern(pattern: ErrorPattern): void {
    this.patterns.set(pattern.id, pattern);
    logger.info('Error pattern added', { patternId: pattern.id, name: pattern.name });
  }

  public removePattern(patternId: string): void {
    this.patterns.delete(patternId);
    logger.info('Error pattern removed', { patternId });
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.checkPatterns();
      this.cleanupOldData();
    }, 30000); // 30秒ごとにチェック

    logger.info('Error monitoring started');
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('Error monitoring stopped');
  }

  private checkPatterns(): void {
    const logs = logger.getStoredLogs();
    const now = Date.now();

    this.patterns.forEach(pattern => {
      const matchingLogs = this.findMatchingLogs(logs, pattern, now);
      
      if (matchingLogs.length >= pattern.threshold) {
        this.createAlert(pattern, matchingLogs);
        
        // パターンのアクションを実行
        if (pattern.action) {
          pattern.action(matchingLogs);
        }
      }
    });
  }

  private findMatchingLogs(logs: LogEntry[], pattern: ErrorPattern, now: number): LogEntry[] {
    const cutoffTime = now - pattern.timeWindow;
    
    return logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      if (logTime < cutoffTime) return false;
      
      if (log.level !== 'error' && log.level !== 'fatal') return false;
      
      const searchText = `${log.message} ${JSON.stringify(log.context || {})}`;
      
      if (pattern.pattern instanceof RegExp) {
        return pattern.pattern.test(searchText);
      } else {
        return searchText.toLowerCase().includes(pattern.pattern.toLowerCase());
      }
    });
  }

  private createAlert(pattern: ErrorPattern, matchingLogs: LogEntry[]): void {
    const existingAlert = this.alerts.find(
      alert => alert.patternId === pattern.id && !alert.acknowledged
    );

    if (existingAlert) {
      // 既存のアラートを更新
      existingAlert.count = matchingLogs.length;
      existingAlert.matchingLogs = matchingLogs;
      existingAlert.timestamp = new Date().toISOString();
    } else {
      // 新しいアラートを作成
      const alert: ErrorAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patternId: pattern.id,
        timestamp: new Date().toISOString(),
        severity: pattern.severity,
        message: `${pattern.name}: ${matchingLogs.length}件のエラーが${pattern.timeWindow / 60000}分間で発生`,
        count: matchingLogs.length,
        timeWindow: pattern.timeWindow,
        matchingLogs,
        acknowledged: false,
      };

      this.alerts.push(alert);
      
      logger.error('Error alert created', {
        alertId: alert.id,
        patternId: pattern.id,
        severity: pattern.severity,
        count: matchingLogs.length,
      });

      // 重要度に応じた通知
      this.handleAlert(alert);
    }
  }

  private handleAlert(alert: ErrorAlert): void {
    switch (alert.severity) {
      case 'critical':
        // クリティカルアラートの処理
        this.sendCriticalNotification(alert);
        break;
      case 'high':
        // 高優先度アラートの処理
        this.sendHighPriorityNotification(alert);
        break;
      case 'medium':
      case 'low':
        // 通常のログ記録
        break;
    }
  }

  private sendCriticalNotification(alert: ErrorAlert): void {
    // ブラウザ通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('クリティカルエラー検出', {
        body: alert.message,
        icon: '/icons/error.png',
        tag: alert.id,
      });
    }

    // 開発環境ではコンソールに表示
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 CRITICAL ALERT:', alert.message);
    }
  }

  private sendHighPriorityNotification(alert: ErrorAlert): void {
    // 開発環境ではコンソールに表示
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ HIGH PRIORITY ALERT:', alert.message);
    }
  }

  private cleanupOldData(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24時間

    // 古いアラートを削除
    this.alerts = this.alerts.filter(alert => {
      const alertAge = now - new Date(alert.timestamp).getTime();
      return alertAge < maxAge;
    });

    // 古いエラーカウントを削除
    this.errorCounts.forEach((counts, key) => {
      const filteredCounts = counts.filter(count => {
        return now - count.timestamp < maxAge;
      });
      
      if (filteredCounts.length === 0) {
        this.errorCounts.delete(key);
      } else {
        this.errorCounts.set(key, filteredCounts);
      }
    });
  }

  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      logger.info('Alert acknowledged', { alertId });
    }
  }

  public getAlerts(): ErrorAlert[] {
    return [...this.alerts];
  }

  public getUnacknowledgedAlerts(): ErrorAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  public getMonitoringStats(): MonitoringStats {
    const logs = logger.getStoredLogs();
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentErrorLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime > oneHourAgo && (log.level === 'error' || log.level === 'fatal');
    });

    const errorRate = recentErrorLogs.length / 60; // errors per minute

    // エラータイプ別の集計
    const errorTypes: Record<string, number> = {};
    recentErrorLogs.forEach(log => {
      const errorType = log.context?.error?.name || 'Unknown';
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });

    const topErrors = Object.entries(errorTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // 重要度別の集計
    const severityBreakdown: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    this.alerts.forEach(alert => {
      if (!alert.acknowledged) {
        severityBreakdown[alert.severity]++;
      }
    });

    // システム健全性の判定
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (severityBreakdown.critical > 0) {
      systemHealth = 'critical';
    } else if (severityBreakdown.high > 2 || errorRate > 5) {
      systemHealth = 'warning';
    }

    return {
      totalErrors: recentErrorLogs.length,
      errorRate,
      topErrors,
      severityBreakdown,
      recentAlerts: this.alerts.slice(-10),
      systemHealth,
    };
  }

  public exportErrorReport(): string {
    const stats = this.getMonitoringStats();
    const alerts = this.getAlerts();
    
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      alerts,
      patterns: Array.from(this.patterns.values()),
    };

    return JSON.stringify(report, null, 2);
  }

  // ブラウザ通知の許可を要求
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logger.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      logger.warn('Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    
    logger.info('Notification permission requested', { granted });
    return granted;
  }
}

// シングルトンインスタンス
export const errorMonitor = new ErrorMonitor();

// 初期化時に通知許可を要求（ユーザーアクション後に呼び出す）
export function initializeErrorMonitoring(): void {
  errorMonitor.requestNotificationPermission();
  logger.info('Error monitoring initialized');
}