/**
 * API エラーハンドリング
 * fetch リクエストとAPIレスポンスのエラー処理
 */

import { logger } from './logger';

export class APIError extends Error {
  public status: number;
  public statusText: string;
  public response: Response | null;
  public context: Record<string, any>;

  constructor(
    message: string,
    status: number,
    statusText: string,
    response: Response | null = null,
    context: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.context = context;
  }
}

export class NetworkError extends Error {
  public context: Record<string, any>;

  constructor(message: string, context: Record<string, any> = {}) {
    super(message);
    this.name = 'NetworkError';
    this.context = context;
  }
}

export class TimeoutError extends Error {
  public timeout: number;
  public context: Record<string, any>;

  constructor(message: string, timeout: number, context: Record<string, any> = {}) {
    super(message);
    this.name = 'TimeoutError';
    this.timeout = timeout;
    this.context = context;
  }
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  retryCondition: (error: Error, attempt: number) => boolean;
}

interface RequestConfig {
  timeout: number;
  retry: RetryConfig;
  enableLogging: boolean;
  context: Record<string, any>;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBackoff: true,
  retryCondition: (error: Error, attempt: number) => {
    // ネットワークエラーとサーバーエラー（5xx）は再試行
    if (error instanceof NetworkError) return true;
    if (error instanceof APIError && error.status >= 500) return true;
    if (error instanceof TimeoutError) return true;
    return false;
  },
};

const defaultRequestConfig: RequestConfig = {
  timeout: 30000, // 30秒
  retry: defaultRetryConfig,
  enableLogging: true,
  context: {},
};

/**
 * 拡張fetch関数（エラーハンドリング、リトライ、ログ機能付き）
 */
export async function enhancedFetch(
  url: string,
  options: RequestInit = {},
  config: Partial<RequestConfig> = {}
): Promise<Response> {
  const mergedConfig = { ...defaultRequestConfig, ...config };
  const requestId = generateRequestId();

  if (mergedConfig.enableLogging) {
    logger.debug('API Request Start', {
      requestId,
      url,
      method: options.method || 'GET',
      context: mergedConfig.context,
    });
  }

  let lastError: Error = new Error('No attempts made');

  for (let attempt = 0; attempt <= mergedConfig.retry.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, mergedConfig.timeout, requestId);
      
      if (!response.ok) {
        const errorText = await response.clone().text();
        const apiError = new APIError(
          `API request failed: ${response.status} ${response.statusText}`,
          response.status,
          response.statusText,
          response,
          {
            requestId,
            url,
            method: options.method || 'GET',
            responseBody: errorText,
            attempt: attempt + 1,
            ...mergedConfig.context,
          }
        );

        if (mergedConfig.enableLogging) {
          logger.error('API Request Failed', {
            requestId,
            url,
            status: response.status,
            statusText: response.statusText,
            attempt: attempt + 1,
            responseBody: errorText,
            context: mergedConfig.context,
          });
        }

        lastError = apiError;

        // リトライ条件をチェック
        if (attempt < mergedConfig.retry.maxRetries && 
            mergedConfig.retry.retryCondition(apiError, attempt + 1)) {
          const delay = calculateDelay(mergedConfig.retry, attempt);
          
          if (mergedConfig.enableLogging) {
            logger.warn('API Request Retry', {
              requestId,
              url,
              attempt: attempt + 1,
              nextRetryIn: delay,
            });
          }

          await sleep(delay);
          continue;
        }

        throw apiError;
      }

      if (mergedConfig.enableLogging) {
        logger.info('API Request Success', {
          requestId,
          url,
          status: response.status,
          attempt: attempt + 1,
          context: mergedConfig.context,
        });
      }

      return response;

    } catch (error) {
      if (error instanceof APIError) {
        lastError = error;
      } else if (error instanceof TimeoutError) {
        lastError = error;
      } else {
        // ネットワークエラーや他の予期しないエラー
        const networkError = new NetworkError(
          `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            requestId,
            url,
            method: options.method || 'GET',
            attempt: attempt + 1,
            originalError: error,
            ...mergedConfig.context,
          }
        );

        if (mergedConfig.enableLogging) {
          logger.error('Network Error', {
            requestId,
            url,
            attempt: attempt + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
            context: mergedConfig.context,
          });
        }

        lastError = networkError;
      }

      // リトライ条件をチェック
      if (attempt < mergedConfig.retry.maxRetries && 
          mergedConfig.retry.retryCondition(lastError, attempt + 1)) {
        const delay = calculateDelay(mergedConfig.retry, attempt);
        
        if (mergedConfig.enableLogging) {
          logger.warn('Network Error Retry', {
            requestId,
            url,
            attempt: attempt + 1,
            nextRetryIn: delay,
            error: lastError.message,
          });
        }

        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError;
}

/**
 * タイムアウト付きfetch
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number,
  requestId: string
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if ((error as Error).name === 'AbortError') {
      throw new TimeoutError(
        `Request timeout after ${timeout}ms`,
        timeout,
        { requestId, url }
      );
    }
    
    throw error;
  }
}

/**
 * リトライ遅延の計算
 */
function calculateDelay(retryConfig: RetryConfig, attempt: number): number {
  if (!retryConfig.exponentialBackoff) {
    return retryConfig.baseDelay;
  }

  const exponentialDelay = retryConfig.baseDelay * Math.pow(2, attempt);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // ジッター追加
  
  return Math.min(jitteredDelay, retryConfig.maxDelay);
}

/**
 * スリープ関数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * リクエストID生成
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 特定のエラータイプ用のヘルパー関数
 */

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * AIサービス用の専用エラーハンドラー
 */
export async function fetchAIService(
  url: string,
  options: RequestInit = {},
  context: Record<string, any> = {}
): Promise<Response> {
  return enhancedFetch(url, options, {
    timeout: 60000, // AI処理は時間がかかる可能性があるため60秒
    retry: {
      maxRetries: 2, // AI処理の失敗は再試行回数を少なくする
      baseDelay: 2000,
      maxDelay: 10000,
      exponentialBackoff: true,
      retryCondition: (error: Error, attempt: number) => {
        // AI API のレート制限エラーは再試行
        if (error instanceof APIError && error.status === 429) return true;
        // サーバーエラーも再試行
        if (error instanceof APIError && error.status >= 500) return true;
        // ネットワークエラーも再試行
        if (error instanceof NetworkError) return true;
        return false;
      },
    },
    context: {
      service: 'AI',
      ...context,
    },
  });
}

/**
 * データベースAPI用の専用エラーハンドラー
 */
export async function fetchDatabaseService(
  url: string,
  options: RequestInit = {},
  context: Record<string, any> = {}
): Promise<Response> {
  return enhancedFetch(url, options, {
    timeout: 15000, // データベース操作は15秒
    retry: {
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 5000,
      exponentialBackoff: true,
      retryCondition: (error: Error, attempt: number) => {
        // データベース接続エラーは再試行
        if (error instanceof APIError && error.status >= 500) return true;
        if (error instanceof NetworkError) return true;
        if (error instanceof TimeoutError) return true;
        return false;
      },
    },
    context: {
      service: 'Database',
      ...context,
    },
  });
}

/**
 * エラーの要約統計を取得
 */
export function getErrorStats(): {
  apiErrors: number;
  networkErrors: number;
  timeoutErrors: number;
  recentErrors: Array<{ type: string; url: string; timestamp: string }>;
} {
  const logs = logger.getStoredLogs();
  const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'fatal');
  
  const stats = {
    apiErrors: 0,
    networkErrors: 0,
    timeoutErrors: 0,
    recentErrors: [] as Array<{ type: string; url: string; timestamp: string }>,
  };

  errorLogs.forEach(log => {
    const errorType = log.context?.error?.name || 'Unknown';
    const url = log.context?.url || 'Unknown';
    
    if (errorType === 'APIError') stats.apiErrors++;
    else if (errorType === 'NetworkError') stats.networkErrors++;
    else if (errorType === 'TimeoutError') stats.timeoutErrors++;
    
    stats.recentErrors.push({
      type: errorType,
      url,
      timestamp: log.timestamp,
    });
  });

  // 最新10件のエラーのみ保持
  stats.recentErrors = stats.recentErrors
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return stats;
}