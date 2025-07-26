/**
 * リアルタイムフィードバックコンポーネント
 * 面接中の発言をリアルタイムで分析し、視覚的なフィードバックを提供
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  Target,
  MessageCircle,
  Lightbulb,
  ThumbsUp,
  Timer,
  Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { RealtimeAnalysis, RealtimeFeedback as FeedbackType } from '@/lib/realtime-evaluation';

interface RealtimeFeedbackProps {
  analysis: RealtimeAnalysis | null;
  feedback: FeedbackType[];
  isActive: boolean;
  showDetails?: boolean;
  className?: string;
}

export function RealtimeFeedback({
  analysis,
  feedback,
  isActive,
  showDetails = true,
  className
}: RealtimeFeedbackProps) {
  if (!isActive || !analysis) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* メイン分析ダッシュボード */}
      <PremiumCard variant="glass" className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-premium-800 flex items-center">
              <Target className="w-4 h-4 mr-2 text-primary-600" />
              リアルタイム分析
            </h3>
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-2 h-2 bg-success-500 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs text-success-600">分析中</span>
            </div>
          </div>

          {/* 分析指標 */}
          <div className="grid grid-cols-2 gap-3">
            <AnalysisMetric
              label="信頼度"
              value={analysis.confidence}
              icon={CheckCircle}
              color="primary"
            />
            <AnalysisMetric
              label="完成度"
              value={analysis.completeness}
              icon={TrendingUp}
              color="success"
            />
            <AnalysisMetric
              label="明確性"
              value={analysis.clarity}
              icon={MessageCircle}
              color="info"
            />
            <AnalysisMetric
              label="関与度"
              value={analysis.engagement}
              icon={Star}
              color="warning"
            />
          </div>

          {showDetails && (
            <>
              {/* 強み */}
              {analysis.strengths.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-success-800 flex items-center">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    良い点
                  </h4>
                  <div className="space-y-1">
                    {analysis.strengths.map((strength, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-success-700 bg-success-50 px-2 py-1 rounded flex items-start"
                      >
                        <CheckCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                        {strength}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* 提案 */}
              {analysis.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-primary-800 flex items-center">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    改善提案
                  </h4>
                  <div className="space-y-1">
                    {analysis.suggestions.slice(0, 2).map((suggestion, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-xs text-primary-700 bg-primary-50 px-2 py-1 rounded flex items-start"
                      >
                        <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* 警告 */}
              {analysis.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-warning-800 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    注意点
                  </h4>
                  <div className="space-y-1">
                    {analysis.warnings.slice(0, 1).map((warning, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-warning-700 bg-warning-50 px-2 py-1 rounded flex items-start"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                        {warning}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PremiumCard>

      {/* リアルタイムフィードバックメッセージ */}
      <AnimatePresence>
        {feedback.slice(-3).map((item, index) => (
          <FeedbackMessage key={`${item.timestamp}-${index}`} feedback={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface AnalysisMetricProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'warning' | 'info';
}

function AnalysisMetric({ label, value, icon: Icon, color }: AnalysisMetricProps) {
  const percentage = Math.round(value * 100);
  
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    info: 'text-info-600 bg-info-50'
  };

  const barColors = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    info: 'bg-info-500'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Icon className={cn('w-3 h-3', colorClasses[color].split(' ')[0])} />
          <span className="text-xs font-medium text-premium-700">{label}</span>
        </div>
        <span className="text-xs font-bold text-premium-800">{percentage}%</span>
      </div>
      <div className="w-full bg-premium-200 rounded-full h-2">
        <motion.div
          className={cn('h-2 rounded-full', barColors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

interface FeedbackMessageProps {
  feedback: FeedbackType;
}

function FeedbackMessage({ feedback }: FeedbackMessageProps) {
  const getIcon = () => {
    switch (feedback.type) {
      case 'positive':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'critical':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getStyles = () => {
    switch (feedback.type) {
      case 'positive':
        return 'bg-success-50 border-success-200 text-success-800';
      case 'warning':
        return 'bg-warning-50 border-warning-200 text-warning-800';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-info-50 border-info-200 text-info-800';
    }
  };

  const getCategoryIcon = () => {
    switch (feedback.category) {
      case 'content':
        return MessageCircle;
      case 'delivery':
        return Volume2;
      case 'structure':
        return Target;
      case 'engagement':
        return Star;
      default:
        return Info;
    }
  };

  const Icon = getIcon();
  const CategoryIcon = getCategoryIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'p-3 rounded-lg border-l-4 shadow-sm',
        getStyles()
      )}
    >
      <div className="flex items-start space-x-2">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <CategoryIcon className="w-3 h-3" />
            <span className="text-xs font-medium capitalize">
              {feedback.category}
            </span>
            {feedback.priority === 'high' && (
              <span className="text-xs bg-red-100 text-red-700 px-1 rounded">
                重要
              </span>
            )}
          </div>
          <p className="text-sm leading-tight">{feedback.message}</p>
        </div>
        <div className="text-xs text-premium-500 flex items-center">
          <Timer className="w-3 h-3 mr-1" />
          {new Date(feedback.timestamp).toLocaleTimeString('ja-JP', {
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default RealtimeFeedback;