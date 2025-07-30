'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from '@/components/ui/PremiumCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { runAllTests, testPerformance, type TestResult } from '@/lib/test-utils';

export function TestDashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await runAllTests();
      const perfResult = testPerformance();
      setTestResults([...results, perfResult]);
      setLastRun(new Date());
    } catch (error) {
      console.error('テスト実行エラー:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // コンポーネントマウント時に自動実行
  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'border-green-300 bg-green-50';
      case 'warning':
        return 'border-yellow-300 bg-yellow-50';
      case 'fail':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const passCount = testResults.filter(r => r.status === 'pass').length;
  const warningCount = testResults.filter(r => r.status === 'warning').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;

  if (process.env.NODE_ENV === 'production') {
    return null; // 本番環境では表示しない
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden"
    >
      <PremiumCard className="shadow-2xl border border-gray-200">
        <PremiumCardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <PremiumCardTitle className="text-lg flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              システム診断
            </PremiumCardTitle>
            <PremiumButton
              onClick={runTests}
              disabled={isRunning}
              size="sm"
              variant="outline"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </PremiumButton>
          </div>
        </PremiumCardHeader>

        <PremiumCardContent className="p-4 max-h-96 overflow-y-auto">
          {/* 概要 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">{passCount}</div>
              <div className="text-xs text-green-600">成功</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded">
              <div className="text-lg font-bold text-yellow-700">{warningCount}</div>
              <div className="text-xs text-yellow-600">警告</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-700">{failCount}</div>
              <div className="text-xs text-red-600">失敗</div>
            </div>
          </div>

          {/* テスト結果一覧 */}
          <div className="space-y-2">
            <AnimatePresence>
              {testResults.map((result, index) => (
                <motion.div
                  key={`${result.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'p-3 rounded-lg border-l-4 transition-all duration-200',
                    getStatusColor(result.status)
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="font-medium text-sm">{result.name}</div>
                        <div className="text-xs text-gray-600">{result.message}</div>
                        {result.duration && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round(result.duration)}ms
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 最終実行時刻 */}
          {lastRun && (
            <div className="mt-4 pt-3 border-t text-xs text-gray-500 text-center">
              最終実行: {lastRun.toLocaleTimeString('ja-JP')}
            </div>
          )}

          {/* ローディング状態 */}
          {isRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">テスト実行中...</div>
              </div>
            </motion.div>
          )}
        </PremiumCardContent>
      </PremiumCard>
    </motion.div>
  );
}