/**
 * エラー監視ダッシュボード
 * リアルタイムエラー統計とアラート表示
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Download,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useErrorAlerts } from '@/hooks/error-handling';
import { errorMonitor, MonitoringStats, ErrorAlert } from '@/lib/error-handling/error-monitoring';
import { logger } from '@/lib/error-handling/logger';

interface ErrorDashboardProps {
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onToggleVisibility?: (visible: boolean) => void;
}

export function ErrorDashboard({ 
  isVisible = false, 
  position = 'top-right',
  onToggleVisibility 
}: ErrorDashboardProps) {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ErrorAlert | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);
  const { alerts, unacknowledgedCount, acknowledgeAlert, acknowledgeAllAlerts } = useErrorAlerts();

  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      const currentStats = errorMonitor.getMonitoringStats();
      setStats(currentStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // 10秒ごと

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleDownloadReport = () => {
    const report = errorMonitor.exportErrorReport();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logger.info('Error report downloaded');
  };

  const handleClearLogs = () => {
    logger.clearStoredLogs();
    setStats(null);
    logger.info('Error logs cleared');
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';
    switch (position) {
      case 'top-left': return `${baseClasses} top-4 left-4`;
      case 'top-right': return `${baseClasses} top-4 right-4`;
      case 'bottom-left': return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right': return `${baseClasses} bottom-4 right-4`;
      default: return `${baseClasses} top-4 right-4`;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggleVisibility?.(true)}
        className={cn(
          getPositionClasses(),
          'w-12 h-12 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors'
        )}
        title="エラー監視ダッシュボードを開く"
      >
        <AlertTriangle className="w-5 h-5 text-gray-600" />
        {unacknowledgedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unacknowledgedCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        getPositionClasses(),
        'bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden',
        isMinimized ? 'w-80' : 'w-96'
      )}
    >
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">エラー監視</h3>
            {stats && (
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                getHealthColor(stats.systemHealth)
              )}>
                {stats.systemHealth === 'healthy' && '正常'}
                {stats.systemHealth === 'warning' && '警告'}
                {stats.systemHealth === 'critical' && '重要'}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-100 rounded"
              title={isMinimized ? "展開" : "最小化"}
            >
              {isMinimized ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onToggleVisibility?.(false)}
              className="p-1 hover:bg-gray-100 rounded"
              title="閉じる"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {unacknowledgedCount > 0 && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-red-600 font-medium">
              {unacknowledgedCount}件の未確認アラート
            </span>
            <button
              onClick={acknowledgeAllAlerts}
              className="text-blue-600 hover:text-blue-700"
            >
              すべて確認済みにする
            </button>
          </div>
        )}
      </div>

      {!isMinimized && (
        <div className="max-h-96 overflow-y-auto">
          {/* 統計情報 */}
          {stats && (
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    総エラー数
                  </div>
                  <div className="font-semibold">{stats.totalErrors}</div>
                </div>
                
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    エラー率
                  </div>
                  <div className="font-semibold">{stats.errorRate.toFixed(2)}/分</div>
                </div>
              </div>

              {/* 重要度別統計 */}
              <div className="mt-3">
                <div className="text-xs text-gray-600 mb-2">重要度別</div>
                <div className="flex space-x-2">
                  {Object.entries(stats.severityBreakdown).map(([severity, count]) => (
                    <span
                      key={severity}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        getSeverityColor(severity)
                      )}
                    >
                      {severity}: {count}
                    </span>
                  ))}
                </div>
              </div>

              {/* トップエラー */}
              {stats.topErrors.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-2">頻発エラー</div>
                  <div className="space-y-1">
                    {stats.topErrors.slice(0, 3).map((error, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-700 truncate">{error.type}</span>
                        <span className="font-medium">{error.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* アラート一覧 */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">最近のアラート</h4>
              <div className="flex space-x-1">
                <button
                  onClick={handleDownloadReport}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="レポートダウンロード"
                >
                  <Download className="w-3 h-3 text-gray-500" />
                </button>
                <button
                  onClick={handleClearLogs}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="ログクリア"
                >
                  <Trash2 className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {alerts.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-4">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  アラートはありません
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alerts.slice(0, 10).map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        'p-3 rounded border cursor-pointer transition-colors',
                        alert.acknowledged 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-red-50 border-red-200 hover:bg-red-100'
                      )}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              getSeverityColor(alert.severity)
                            )}>
                              {alert.severity}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 truncate">
                            {alert.message}
                          </p>
                        </div>
                        
                        {!alert.acknowledged && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              acknowledgeAlert(alert.id);
                            }}
                            className="ml-2 p-1 hover:bg-white rounded"
                            title="確認済みにする"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* アラート詳細モーダル */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    アラート詳細
                  </h3>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-96">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">基本情報</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">重要度:</span>
                        <span className={cn(
                          'ml-2 px-2 py-0.5 rounded text-xs font-medium',
                          getSeverityColor(selectedAlert.severity)
                        )}>
                          {selectedAlert.severity}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">発生時刻:</span>
                        <span className="ml-2">
                          {new Date(selectedAlert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">エラー数:</span>
                        <span className="ml-2 font-medium">{selectedAlert.count}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">時間窓:</span>
                        <span className="ml-2">{selectedAlert.timeWindow / 60000}分</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">メッセージ</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {selectedAlert.message}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      関連ログ ({selectedAlert.matchingLogs.length}件)
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 p-3 rounded">
                      {selectedAlert.matchingLogs.slice(0, 5).map((log, index) => (
                        <div key={index} className="text-xs">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="font-medium text-red-600">
                              {log.level.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-700">{log.message}</p>
                          {log.context && (
                            <pre className="mt-1 text-gray-600 bg-white p-1 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                      {selectedAlert.matchingLogs.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">
                          ...他 {selectedAlert.matchingLogs.length - 5} 件
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                {!selectedAlert.acknowledged && (
                  <button
                    onClick={() => {
                      acknowledgeAlert(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    確認済みにする
                  </button>
                )}
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}