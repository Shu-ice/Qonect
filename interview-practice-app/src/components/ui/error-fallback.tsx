/**
 * エラーフォールバックUI
 * エラーバウンダリで表示されるユーザーフレンドリーなエラー画面
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  MessageCircle, 
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/error-handling/logger';

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  errorId?: string;
}

export function ErrorFallback({ error, errorInfo, resetError, errorId }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const maxRetries = 3;
  const canRetry = retryCount < maxRetries;

  useEffect(() => {
    // エラー表示時にユーザビリティログを記録
    logger.info('Error fallback displayed', {
      errorId,
      errorMessage: error.message,
      retryCount,
    });
  }, [error.message, errorId, retryCount]);

  const handleRetry = () => {
    if (!canRetry) return;
    
    setRetryCount(prev => prev + 1);
    logger.info('User retried after error', {
      errorId,
      retryAttempt: retryCount + 1,
    });
    resetError();
  };

  const handleGoHome = () => {
    logger.info('User navigated home from error', { errorId });
    window.location.href = '/';
  };

  const handleReportError = () => {
    logger.info('User initiated error report', { errorId });
    
    // エラーレポート機能（メール送信やフィードバックフォーム）
    const subject = encodeURIComponent(`エラーレポート: ${error.name}`);
    const body = encodeURIComponent(`
エラーID: ${errorId}
エラー: ${error.message}
タイムスタンプ: ${new Date().toISOString()}
URL: ${window.location.href}
ユーザーエージェント: ${navigator.userAgent}

詳細:
${error.stack}

コンポーネントスタック:
${errorInfo.componentStack}
    `);
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  const copyErrorDetails = async () => {
    const errorDetails = `
エラーID: ${errorId}
エラー: ${error.message}
タイムスタンプ: ${new Date().toISOString()}
URL: ${window.location.href}

スタックトレース:
${error.stack}

コンポーネントスタック:
${errorInfo.componentStack}
    `;

    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      logger.info('Error details copied to clipboard', { errorId });
    } catch (err) {
      logger.warn('Failed to copy error details', { errorId, error: err });
    }
  };

  const getErrorMessage = (error: Error): string => {
    // ユーザーフレンドリーなエラーメッセージに変換
    if (error.message.includes('ChunkLoadError')) {
      return 'アプリケーションの読み込みに失敗しました。ページを更新してお試しください。';
    }
    
    if (error.message.includes('Network Error')) {
      return 'ネットワーク接続に問題があります。インターネット接続を確認してください。';
    }
    
    if (error.message.includes('AI') || error.message.includes('OpenAI') || error.message.includes('Gemini')) {
      return 'AI機能の処理中にエラーが発生しました。しばらく待ってから再度お試しください。';
    }
    
    if (error.message.includes('Database') || error.message.includes('Prisma')) {
      return 'データベース接続に問題があります。サポートまでお問い合わせください。';
    }
    
    // デフォルトメッセージ
    return '予期しないエラーが発生しました。ページを更新するか、しばらく待ってから再度お試しください。';
  };

  const getErrorIcon = (error: Error): React.ReactNode => {
    if (error.message.includes('Network')) {
      return <AlertTriangle className="w-16 h-16 text-orange-500" />;
    }
    
    return <AlertTriangle className="w-16 h-16 text-red-500" />;
  };

  const getSeverityColor = (error: Error): string => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Network')) {
      return 'border-orange-200 bg-orange-50';
    }
    
    return 'border-red-200 bg-red-50';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "max-w-md w-full bg-white rounded-lg shadow-lg border-2 overflow-hidden",
          getSeverityColor(error)
        )}
      >
        {/* エラーアイコンとメッセージ */}
        <div className="p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex justify-center mb-4"
          >
            {getErrorIcon(error)}
          </motion.div>
          
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            エラーが発生しました
          </h1>
          
          <p className="text-gray-600 mb-6">
            {getErrorMessage(error)}
          </p>

          {/* エラーID */}
          {errorId && (
            <div className="text-xs text-gray-400 mb-4 font-mono">
              エラーID: {errorId}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="px-6 pb-6 space-y-3">
          <AnimatePresence>
            {canRetry && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>再試行 ({maxRetries - retryCount}回まで)</span>
              </motion.button>
            )}
          </AnimatePresence>

          <button
            onClick={handleGoHome}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>ホームに戻る</span>
          </button>

          <button
            onClick={handleReportError}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>エラーを報告</span>
          </button>
        </div>

        {/* 詳細情報の切り替え */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full p-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
          >
            <span>詳細情報</span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-200 bg-gray-50 overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {/* コピーボタン */}
                  <div className="flex justify-end">
                    <button
                      onClick={copyErrorDetails}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                      disabled={copied}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>コピー済み</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>詳細をコピー</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* エラー詳細 */}
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">エラータイプ:</h4>
                      <code className="text-xs bg-white p-1 rounded border text-red-600">
                        {error.name}
                      </code>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">エラーメッセージ:</h4>
                      <code className="text-xs bg-white p-2 rounded border block text-gray-800 break-words">
                        {error.message}
                      </code>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">発生場所:</h4>
                      <code className="text-xs bg-white p-2 rounded border block text-gray-600 break-words whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {errorInfo.componentStack}
                      </code>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">タイムスタンプ:</h4>
                      <code className="text-xs bg-white p-1 rounded border text-gray-600">
                        {new Date().toISOString()}
                      </code>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}