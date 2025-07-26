/**
 * パフォーマンス監視コンポーネント
 * リアルタイムでアプリのパフォーマンス指標を監視・表示
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Clock, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { performanceMonitor, MemoryManager } from '@/lib/performance/memory-management';

interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  
  // Runtime metrics
  memoryUsage?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
    memoryPressure: 'low' | 'medium' | 'high';
  };
  
  // Custom metrics
  aiResponseTime?: number;
  renderTime?: number;
  interactionTime?: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function PerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  minimized: initialMinimized = true,
  onMetricsUpdate 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [minimized, setMinimized] = useState(initialMinimized);
  const [isVisible, setIsVisible] = useState(enabled);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const memoryManager = MemoryManager.getInstance();
    
    // Core Web Vitals の監視
    const measureWebVitals = () => {
      // Performance Observer for Core Web Vitals
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          setMetrics(prev => ({ ...prev, cls: clsValue }));
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // メモリ使用量の監視
        const updateMemoryMetrics = () => {
          const memoryUsage = memoryManager.getMemoryUsage();
          if (memoryUsage) {
            setMetrics(prev => ({ ...prev, memoryUsage }));
          }
        };

        // 定期的にメトリクスを更新
        const metricsInterval = setInterval(() => {
          updateMemoryMetrics();
          
          // Performance timing
          const timing = performance.timing;
          const fcp = timing.responseStart - timing.navigationStart;
          const ttfb = timing.responseStart - timing.requestStart;
          
          setMetrics(prev => ({
            ...prev,
            fcp,
            ttfb,
          }));
        }, 1000);

        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
          clearInterval(metricsInterval);
        };
      }
    };

    const cleanup = measureWebVitals();
    return cleanup;
  }, [enabled]);

  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  // カスタムメトリクスの記録
  useEffect(() => {
    if (!enabled) return;

    // AI応答時間の監視
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        
        // AI APIの呼び出しかチェック
        const url = args[0]?.toString() || '';
        if (url.includes('/api/ai') || url.includes('openai') || url.includes('anthropic') || url.includes('gemini')) {
          setMetrics(prev => ({ ...prev, aiResponseTime: duration }));
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [enabled]);

  if (!isVisible) return null;

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';
    switch (position) {
      case 'top-left': return `${baseClasses} top-4 left-4`;
      case 'top-right': return `${baseClasses} top-4 right-4`;
      case 'bottom-left': return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right': return `${baseClasses} bottom-4 right-4`;
      default: return `${baseClasses} bottom-4 right-4`;
    }
  };

  const getScoreColor = (score: number, thresholds: { good: number; needs: number }) => {
    if (score <= thresholds.good) return 'text-green-600';
    if (score <= thresholds.needs) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatMs = (ms: number) => {
    return `${ms.toFixed(1)}ms`;
  };

  return (
    <motion.div
      className={cn(
        getPositionClasses(),
        'bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden',
        minimized ? 'w-12 h-12' : 'w-80'
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {minimized ? (
        // 最小化表示
        <button
          onClick={() => setMinimized(false)}
          className="w-full h-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="パフォーマンス監視を展開"
        >
          <Activity className="w-5 h-5 text-gray-600" />
        </button>
      ) : (
        // 展開表示
        <div className="p-4">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">パフォーマンス</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-gray-100 rounded"
                title="非表示"
              >
                <EyeOff className="w-3 h-3 text-gray-500" />
              </button>
              <button
                onClick={() => setMinimized(true)}
                className="p-1 hover:bg-gray-100 rounded"
                title="最小化"
              >
                <Eye className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-medium text-gray-700 flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              Core Web Vitals
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {metrics.fcp && (
                <div className="flex justify-between">
                  <span className="text-gray-600">FCP:</span>
                  <span className={getScoreColor(metrics.fcp, { good: 1800, needs: 3000 })}>
                    {formatMs(metrics.fcp)}
                  </span>
                </div>
              )}
              
              {metrics.lcp && (
                <div className="flex justify-between">
                  <span className="text-gray-600">LCP:</span>
                  <span className={getScoreColor(metrics.lcp, { good: 2500, needs: 4000 })}>
                    {formatMs(metrics.lcp)}
                  </span>
                </div>
              )}
              
              {metrics.fid && (
                <div className="flex justify-between">
                  <span className="text-gray-600">FID:</span>
                  <span className={getScoreColor(metrics.fid, { good: 100, needs: 300 })}>
                    {formatMs(metrics.fid)}
                  </span>
                </div>
              )}
              
              {metrics.cls && (
                <div className="flex justify-between">
                  <span className="text-gray-600">CLS:</span>
                  <span className={getScoreColor(metrics.cls * 1000, { good: 100, needs: 250 })}>
                    {metrics.cls.toFixed(3)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* メモリ使用量 */}
          {metrics.memoryUsage && (
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-medium text-gray-700 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                メモリ使用量
              </h4>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">使用中:</span>
                  <span>{formatBytes(metrics.memoryUsage.usedJSHeapSize)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">総計:</span>
                  <span>{formatBytes(metrics.memoryUsage.totalJSHeapSize)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">制限:</span>
                  <span>{formatBytes(metrics.memoryUsage.jsHeapSizeLimit)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">圧迫:</span>
                  <div className="flex items-center space-x-1">
                    {metrics.memoryUsage.memoryPressure === 'low' && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                    {metrics.memoryUsage.memoryPressure === 'medium' && (
                      <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    )}
                    {metrics.memoryUsage.memoryPressure === 'high' && (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                    <span className={cn(
                      'text-xs',
                      metrics.memoryUsage.memoryPressure === 'low' && 'text-green-600',
                      metrics.memoryUsage.memoryPressure === 'medium' && 'text-yellow-600',
                      metrics.memoryUsage.memoryPressure === 'high' && 'text-red-600'
                    )}>
                      {metrics.memoryUsage.memoryPressure}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* カスタムメトリクス */}
          {(metrics.aiResponseTime || metrics.renderTime) && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-700">カスタム指標</h4>
              
              <div className="space-y-1 text-xs">
                {metrics.aiResponseTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI応答:</span>
                    <span className={getScoreColor(metrics.aiResponseTime, { good: 1000, needs: 3000 })}>
                      {formatMs(metrics.aiResponseTime)}
                    </span>
                  </div>
                )}
                
                {metrics.renderTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">描画時間:</span>
                    <span className={getScoreColor(metrics.renderTime, { good: 16, needs: 50 })}>
                      {formatMs(metrics.renderTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// 開発環境でのみ表示するラッパー
export function DevelopmentPerformanceMonitor(props: PerformanceMonitorProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return <PerformanceMonitor {...props} />;
}