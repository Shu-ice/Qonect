'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { PremiumButton } from './PremiumButton';
import { PremiumCard, PremiumCardContent } from './PremiumCard';
import { MascotCharacter } from './MascotCharacter';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: null 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // エラーレポート（本番環境では外部サービスに送信）
    if (process.env.NODE_ENV === 'production') {
      // TODO: Sentryなどのエラー監視サービスに送信
    }
  }

  private handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl w-full"
          >
            <PremiumCard className="p-8 text-center">
              <PremiumCardContent className="space-y-6">
                {/* エラーアイコン */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200,
                    delay: 0.2 
                  }}
                  className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center"
                >
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </motion.div>

                {/* マスコット */}
                <MascotCharacter
                  type="wise-owl"
                  size="md"
                  emotion="concerned"
                  message="申し訳ございません。エラーが発生しました。"
                />

                {/* エラーメッセージ */}
                <div>
                  <h1 className="text-2xl font-bold text-premium-900 mb-2">
                    予期しないエラーが発生しました
                  </h1>
                  <p className="text-premium-600">
                    ご不便をおかけして申し訳ございません。
                    <br />
                    問題が続く場合は、ページを更新するか、ホームに戻ってください。
                  </p>
                </div>

                {/* エラー詳細（開発環境のみ） */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-left bg-gray-100 rounded-lg p-4">
                    <summary className="cursor-pointer font-semibold text-sm text-gray-700">
                      エラー詳細（開発者向け）
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                {/* アクションボタン */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <PremiumButton
                    onClick={this.handleReset}
                    variant="default"
                    size="lg"
                    className="min-w-[160px]"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    もう一度試す
                  </PremiumButton>
                  
                  <PremiumButton
                    onClick={this.handleGoHome}
                    variant="outline"
                    size="lg"
                    className="min-w-[160px]"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    ホームに戻る
                  </PremiumButton>
                </div>

                {/* サポート情報 */}
                <p className="text-sm text-premium-500">
                  エラーコード: {Date.now()}
                </p>
              </PremiumCardContent>
            </PremiumCard>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// フック版のエラーバウンダリー用ユーティリティ
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    resetError: () => setError(null),
    captureError: (error: Error) => setError(error)
  };
}