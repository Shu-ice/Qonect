/**
 * エラーバウンダリコンポーネント
 * React エラーをキャッチして適切に処理
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from './logger';
import { ErrorFallback } from '@/components/ui/error-fallback';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    errorInfo: ErrorInfo;
    resetError: () => void;
    errorId?: string;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  level?: 'page' | 'component' | 'feature';
  context?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // エラーが発生したときに state を更新
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component', context } = this.props;
    const errorId = this.state.errorId || 'unknown';

    // エラーログを記録
    logger.error('React Error Boundary', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      context: {
        level,
        context,
        errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    });

    // カスタムエラーハンドラーを実行
    if (onError) {
      onError(error, errorInfo, errorId);
    }

    // エラー統計の更新
    this.updateErrorStats(error, level);

    // 自動回復の試行（コンポーネントレベルのみ）
    if (level === 'component') {
      this.scheduleAutoRecovery();
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private updateErrorStats(error: Error, level: string) {
    const stats = {
      errorType: error.name,
      errorLevel: level,
      timestamp: Date.now(),
    };

    // localStorage に統計を保存
    try {
      const existingStats = JSON.parse(localStorage.getItem('error_stats') || '[]');
      existingStats.push(stats);
      
      // 最新100件のみ保持
      if (existingStats.length > 100) {
        existingStats.splice(0, existingStats.length - 100);
      }
      
      localStorage.setItem('error_stats', JSON.stringify(existingStats));
    } catch (e) {
      // localStorage への書き込みに失敗しても継続
      logger.warn('Failed to save error stats', { error: e });
    }
  }

  private scheduleAutoRecovery() {
    // 5秒後に自動回復を試行
    this.resetTimeoutId = window.setTimeout(() => {
      logger.info('Attempting automatic error recovery');
      this.resetError();
    }, 5000);
  }

  resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    logger.info('Error boundary reset', {
      errorId: this.state.errorId,
      previousError: this.state.error?.message,
    });

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 特定のレベル用のエラーバウンダリ
 */
export function PageErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="page" {...props}>
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="component" {...props}>
      {children}
    </ErrorBoundary>
  );
}

export function FeatureErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="feature" {...props}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * 高次コンポーネント（HOC）としてエラーバウンダリを適用
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}