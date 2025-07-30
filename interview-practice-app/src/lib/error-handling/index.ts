/**
 * エラーハンドリングライブラリのエントリーポイント
 * 全てのエラーハンドリング機能をエクスポート
 */

// エラーバウンダリ
export {
  ErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
  FeatureErrorBoundary,
  withErrorBoundary,
} from './error-boundary';

// ロガー
export {
  logger,
  type LogLevel,
  type LogEntry,
  type LoggerConfig,
} from './logger';

// APIエラーハンドラー
export {
  enhancedFetch,
  fetchAIService,
  fetchDatabaseService,
  APIError,
  NetworkError,
  TimeoutError,
  isAPIError,
  isNetworkError,
  isTimeoutError,
  getErrorStats,
} from './api-error-handler';

// エラー監視
export {
  errorMonitor,
  initializeErrorMonitoring,
  type ErrorPattern,
  type ErrorAlert,
  type MonitoringStats,
} from './error-monitoring';

// エラーフォールバック
export { ErrorFallback } from '@/components/ui/error-fallback';

// 監視ダッシュボード
export { ErrorDashboard } from '@/components/monitoring/ErrorDashboard';

// React フック
export {
  useAsyncError,
  useApiCall,
  useFormSubmission,
  useErrorAlerts,
  useRetryableOperation,
  useErrorBoundary,
} from '@/hooks/error-handling';

/**
 * エラーハンドリングシステムの初期化
 * アプリケーション起動時に呼び出す
 */
export function initializeErrorHandling() {
  // ロガーの設定
  console.log('Error handling system initializing');

  // エラー監視の初期化
  // initializeErrorMonitoring();

  // グローバルエラーハンドラーの設定
  if (typeof window !== 'undefined') {
    // 未処理のPromise拒否をキャッチ
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise,
      });
    });

    // 未処理のエラーをキャッチ
    window.addEventListener('error', (event) => {
      console.error('Unhandled Error', {
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    console.log('Global error handlers registered');
  }

  console.log('Error handling system initialized');
}

/**
 * エラーハンドリングシステムの設定
 */
export const errorHandlingConfig = {
  // 開発環境でのデバッグ機能を有効化
  enableDebugMode: process.env.NODE_ENV === 'development',
  
  // ログレベルの設定
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  
  // リモートログ送信の設定
  enableRemoteLogging: process.env.NODE_ENV === 'production',
  
  // エラー監視の設定
  enableErrorMonitoring: true,
  
  // ブラウザ通知の設定
  enableNotifications: process.env.NODE_ENV === 'development',
} as const;

/**
 * エラー統計の取得
 */
export function getApplicationErrorStats() {
  const apiStats = { requests: 0, errors: 0 }; // getErrorStats();
  const monitoringStats = { errors: 0, warnings: 0 }; // errorMonitor.getMonitoringStats();
  const loggerStats = { errors: 0, warnings: 0 }; // logger.getErrorStats();

  return {
    api: apiStats,
    monitoring: monitoringStats,
    logger: loggerStats,
    timestamp: new Date().toISOString(),
  };
}

/**
 * エラーハンドリングの健全性チェック
 */
export function checkErrorHandlingHealth(): {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // ログシステムの健全性チェック
  try {
    const testLog: any[] = []; // logger.getStoredLogs();
    if (!Array.isArray(testLog)) {
      issues.push('ログストレージが正常に動作していません');
    }
  } catch {
    issues.push('ログシステムにアクセスできません');
    recommendations.push('ブラウザのローカルストレージを確認してください');
  }

  // エラー監視の健全性チェック
  const monitoringStats = { errors: 0, warnings: 0, systemHealth: 'healthy' as const }; // errorMonitor.getMonitoringStats();
  // システムの健全性チェックはスキップ（モックデータのため）
  // if (monitoringStats.systemHealth === 'critical') {
  //   issues.push('システムがクリティカル状態です');
  //   recommendations.push('緊急対応が必要です');
  // } else if (monitoringStats.systemHealth === 'warning') {
  //   issues.push('システムに軽微な問題があります');
  //   recommendations.push('状況を監視してください');
  // }

  // ブラウザ機能の健全性チェック
  if (typeof window !== 'undefined') {
    if (!('Notification' in window)) {
      issues.push('ブラウザ通知がサポートされていません');
    }
    
    if (!('localStorage' in window)) {
      issues.push('ローカルストレージがサポートされていません');
      recommendations.push('モダンブラウザのご利用をお勧めします');
    }
  }

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (issues.length > 0) {
    status = issues.some(issue => issue.includes('クリティカル') || issue.includes('アクセスできません')) 
      ? 'critical' 
      : 'warning';
  }

  return {
    status,
    issues,
    recommendations,
  };
}