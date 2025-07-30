/**
 * エラーハンドリング用のReactフック
 * コンポーネント内でのエラー処理を簡単にする
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/error-handling/logger';
import { errorMonitor, ErrorAlert } from '@/lib/error-handling/error-monitoring';
import { 
  enhancedFetch, 
  fetchAIService, 
  fetchDatabaseService,
  APIError,
  NetworkError,
  TimeoutError,
} from '@/lib/error-handling/api-error-handler';

/**
 * 非同期処理用のエラーハンドリングフック
 */
export function useAsyncError() {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeAsync = useCallback(async <T>(
    asyncFunction: (signal?: AbortSignal) => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      context?: Record<string, any>;
      logErrors?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { onSuccess, onError, context = {}, logErrors = true } = options;

    // 既存のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFunction(signal);
      
      if (!signal.aborted) {
        setIsLoading(false);
        onSuccess?.(result);
        return result;
      }
      
      return null;
    } catch (err) {
      if (!signal.aborted) {
        const error = err as Error;
        setError(error);
        setIsLoading(false);

        if (logErrors) {
          logger.error('Async operation failed', {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
            context,
          });
        }

        onError?.(error);
      }
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  // コンポーネントアンマウント時にリクエストをキャンセル
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    error,
    isLoading,
    executeAsync,
    clearError,
    cancel,
  };
}

/**
 * API呼び出し用のエラーハンドリングフック
 */
export function useApiCall() {
  const { error, isLoading, executeAsync, clearError, cancel } = useAsyncError();

  const apiCall = useCallback(async <T>(
    url: string,
    options: RequestInit = {},
    config: {
      service?: 'ai' | 'database' | 'general';
      context?: Record<string, any>;
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      parseResponse?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { 
      service = 'general', 
      context = {}, 
      onSuccess, 
      onError, 
      parseResponse = true 
    } = config;

    return executeAsync(
      async (signal) => {
        const fetchFunction = service === 'ai' 
          ? fetchAIService 
          : service === 'database' 
            ? fetchDatabaseService 
            : enhancedFetch;

        const response = await fetchFunction(url, {
          ...options,
          signal,
        }, context);

        if (parseResponse) {
          const data = await response.json();
          return data as T;
        }

        return response as unknown as T;
      },
      {
        onSuccess,
        onError,
        context: {
          service,
          url,
          method: options.method || 'GET',
          ...context,
        },
      }
    );
  }, [executeAsync]);

  return {
    apiCall,
    error,
    isLoading,
    clearError,
    cancel,
  };
}

/**
 * フォーム送信用のエラーハンドリングフック
 */
export function useFormSubmission<T = any>() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const submitForm = useCallback(async (
    submitFunction: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      successMessage?: string;
      resetForm?: () => void;
      context?: Record<string, any>;
    } = {}
  ): Promise<boolean> => {
    const { onSuccess, onError, successMessage, resetForm, context = {} } = options;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const result = await submitFunction();
      
      setSubmitSuccess(true);
      setIsSubmitting(false);
      
      if (successMessage) {
        logger.info('Form submission successful', {
          message: successMessage,
          context,
        });
      }

      onSuccess?.(result);
      resetForm?.();
      
      // 成功メッセージを一定時間後にクリア
      setTimeout(() => setSubmitSuccess(false), 3000);
      
      return true;
    } catch (err) {
      const error = err as Error;
      let errorMessage = 'フォームの送信に失敗しました。';

      // エラータイプに応じたメッセージ
      if (error instanceof APIError) {
        if (error.status === 400) {
          errorMessage = '入力内容に問題があります。確認してください。';
        } else if (error.status === 401) {
          errorMessage = '認証が必要です。ログインしてください。';
        } else if (error.status === 403) {
          errorMessage = 'この操作を実行する権限がありません。';
        } else if (error.status >= 500) {
          errorMessage = 'サーバーエラーが発生しました。しばらく待ってから再度お試しください。';
        }
      } else if (error instanceof NetworkError) {
        errorMessage = 'ネットワーク接続に問題があります。インターネット接続を確認してください。';
      } else if (error instanceof TimeoutError) {
        errorMessage = 'リクエストがタイムアウトしました。しばらく待ってから再度お試しください。';
      }

      setSubmitError(errorMessage);
      setIsSubmitting(false);

      logger.error('Form submission failed', {
        error: {
          name: error.name,
          message: error.message,
        },
        context,
      });

      onError?.(error);
      return false;
    }
  }, []);

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const clearSubmitSuccess = useCallback(() => {
    setSubmitSuccess(false);
  }, []);

  return {
    submitForm,
    submitError,
    isSubmitting,
    submitSuccess,
    clearSubmitError,
    clearSubmitSuccess,
  };
}

/**
 * エラーアラート監視フック
 */
export function useErrorAlerts() {
  const [alerts, setAlerts] = useState<ErrorAlert[]>([]);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);

  useEffect(() => {
    const updateAlerts = () => {
      const currentAlerts = errorMonitor.getAlerts();
      const unacknowledged = errorMonitor.getUnacknowledgedAlerts();
      
      setAlerts(currentAlerts);
      setUnacknowledgedCount(unacknowledged.length);
    };

    // 初回更新
    updateAlerts();

    // 定期更新
    const interval = setInterval(updateAlerts, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    errorMonitor.acknowledgeAlert(alertId);
    
    // 状態を即座に更新
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
    
    setUnacknowledgedCount(prev => Math.max(0, prev - 1));
  }, []);

  const acknowledgeAllAlerts = useCallback(() => {
    alerts
      .filter(alert => !alert.acknowledged)
      .forEach(alert => errorMonitor.acknowledgeAlert(alert.id));
    
    setAlerts(prev => 
      prev.map(alert => ({ ...alert, acknowledged: true }))
    );
    
    setUnacknowledgedCount(0);
  }, [alerts]);

  return {
    alerts,
    unacknowledgedCount,
    acknowledgeAlert,
    acknowledgeAllAlerts,
  };
}

/**
 * リトライ機能付きフック
 */
export function useRetryableOperation<T>() {
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const { executeAsync, error, isLoading, clearError } = useAsyncError();

  const executeWithRetry = useCallback(async (
    operation: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error, attempt: number) => void;
      onMaxRetriesReached?: (error: Error) => void;
      retryDelay?: number;
      context?: Record<string, any>;
    } = {}
  ): Promise<T | null> => {
    const { onSuccess, onError, onMaxRetriesReached, retryDelay = 1000, context = {} } = options;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      setRetryCount(attempt);

      const result = await executeAsync(
        operation,
        {
          onSuccess: attempt === 0 ? onSuccess : undefined, // 最初の試行でのみ成功コールバックを実行
          onError: (error) => {
            onError?.(error, attempt + 1);
            
            if (attempt === maxRetries) {
              onMaxRetriesReached?.(error);
            }
          },
          context: {
            ...context,
            attempt: attempt + 1,
            isRetry: attempt > 0,
          },
        }
      );

      if (result !== null) {
        setRetryCount(0);
        return result;
      }

      // 最大リトライ回数に達していない場合は遅延後に再試行
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    return null;
  }, [executeAsync, maxRetries]);

  const reset = useCallback(() => {
    setRetryCount(0);
    clearError();
  }, [clearError]);

  return {
    executeWithRetry,
    retryCount,
    maxRetries,
    error,
    isLoading,
    reset,
  };
}

/**
 * エラー境界フック（関数コンポーネント用）
 */
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const captureError = useCallback((error: Error, context?: Record<string, any>) => {
    setError(error);
    
    logger.error('Error captured by boundary hook', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    });
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // グローバルエラーハンドラーとの連携
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      captureError(event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureError(new Error(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [captureError]);

  return {
    error,
    captureError,
    resetError,
    hasError: error !== null,
  };
}