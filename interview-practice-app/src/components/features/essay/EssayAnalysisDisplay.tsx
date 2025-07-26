/**
 * 志願理由書分析結果表示コンポーネント
 * AI分析結果と明和中適合度を表示
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Target,
  Users,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Brain,
  Heart,
  Lightbulb
} from 'lucide-react';
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from '@/components/ui/PremiumCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { EssayAnalysis } from '@/lib/essay-processor';

interface EssayAnalysisDisplayProps {
  analysis: EssayAnalysis;
  onStartInterview?: () => void;
  className?: string;
}

const ScoreBar = ({ label, score, maxScore = 5, color = "primary" }: {
  label: string;
  score: number;
  maxScore?: number;
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
}) => {
  const percentage = (score / maxScore) * 100;
  
  const colorClasses = {
    primary: "bg-primary-500",
    secondary: "bg-secondary-500", 
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500"
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{score.toFixed(1)}/{maxScore}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

const SuggestionCard = ({ title, suggestions, icon: Icon }: {
  title: string;
  suggestions: string[];
  icon: React.ComponentType<any>;
}) => (
  <PremiumCard className="h-full">
    <PremiumCardHeader className="pb-3">
      <div className="flex items-center space-x-2">
        <Icon className="w-5 h-5 text-primary-600" />
        <PremiumCardTitle className="text-sm">{title}</PremiumCardTitle>
      </div>
    </PremiumCardHeader>
    <PremiumCardContent className="pt-0">
      <ul className="space-y-2">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <li key={index} className="flex items-start space-x-2 text-xs text-gray-600">
            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-1.5 flex-shrink-0" />
            <span>{suggestion}</span>
          </li>
        ))}
      </ul>
    </PremiumCardContent>
  </PremiumCard>
);

export function EssayAnalysisDisplay({ 
  analysis, 
  onStartInterview,
  className 
}: EssayAnalysisDisplayProps) {
  const readinessColor = analysis.overallScore.meiwaAlignment >= 4 
    ? "success" 
    : analysis.overallScore.meiwaAlignment >= 3 
    ? "warning" 
    : "danger";
  
  const readinessIcon = analysis.overallScore.meiwaAlignment >= 4 
    ? CheckCircle2 
    : analysis.overallScore.meiwaAlignment >= 3 
    ? AlertTriangle 
    : AlertTriangle;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 総合評価カード */}
      <PremiumCard className="bg-gradient-to-r from-primary-50 to-secondary-50">
        <PremiumCardHeader>
          <div className="flex items-center justify-between">
            <PremiumCardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-primary-600" />
              <span>志願理由書 総合評価</span>
            </PremiumCardTitle>
            <div className="flex items-center space-x-2">
              {React.createElement(readinessIcon, { 
                className: `w-5 h-5 ${
                  readinessColor === 'success' ? 'text-green-500' :
                  readinessColor === 'warning' ? 'text-yellow-500' :
                  'text-red-500'
                }` 
              })}
              <span className="text-lg font-bold text-gray-900">
                {analysis.overallScore.total.toFixed(1)}/5.0
              </span>
            </div>
          </div>
        </PremiumCardHeader>
        <PremiumCardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreBar 
              label="総合スコア" 
              score={analysis.overallScore.total} 
              color="primary"
            />
            <ScoreBar 
              label="面接準備度" 
              score={analysis.overallScore.readiness} 
              color="secondary"
            />
            <ScoreBar 
              label="明和中適合度" 
              score={analysis.overallScore.meiwaAlignment} 
              color={readinessColor}
            />
          </div>
        </PremiumCardContent>
      </PremiumCard>

      {/* 4項目詳細分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 志望動機 */}
        <PremiumCard>
          <PremiumCardHeader>
            <PremiumCardTitle className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span>志望動機</span>
            </PremiumCardTitle>
          </PremiumCardHeader>
          <PremiumCardContent className="space-y-3">
            <ScoreBar 
              label="動機の強さ" 
              score={analysis.motivation.strength} 
              color="secondary"
            />
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>キーポイント:</strong></p>
              <ul className="space-y-1">
                {analysis.motivation.keyPoints.slice(0, 2).map((point, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </PremiumCardContent>
        </PremiumCard>

        {/* 探究活動 */}
        <PremiumCard>
          <PremiumCardHeader>
            <PremiumCardTitle className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-500" />
              <span>探究活動</span>
            </PremiumCardTitle>
          </PremiumCardHeader>
          <PremiumCardContent className="space-y-3">
            <ScoreBar 
              label="探究の深さ" 
              score={analysis.research.depth} 
              color="primary"
            />
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>テーマ:</strong> {analysis.research.topic}</p>
              <div className="flex items-center space-x-2">
                <span>社会とのつながり:</span>
                {analysis.research.socialConnection ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
            </div>
          </PremiumCardContent>
        </PremiumCard>

        {/* 学校生活 */}
        <PremiumCard>
          <PremiumCardHeader>
            <PremiumCardTitle className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-500" />
              <span>学校生活の抱負</span>
            </PremiumCardTitle>
          </PremiumCardHeader>
          <PremiumCardContent className="space-y-3">
            <ScoreBar 
              label="実現可能性" 
              score={analysis.schoolLife.feasibility} 
              color="success"
            />
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>主な抱負:</strong></p>
              <ul className="space-y-1">
                {analysis.schoolLife.aspirations.slice(0, 2).map((aspiration, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{aspiration}</span>
                  </li>
                ))}
              </ul>
            </div>
          </PremiumCardContent>
        </PremiumCard>

        {/* 将来の目標 */}
        <PremiumCard>
          <PremiumCardHeader>
            <PremiumCardTitle className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span>将来の目標</span>
            </PremiumCardTitle>
          </PremiumCardHeader>
          <PremiumCardContent className="space-y-3">
            <ScoreBar 
              label="探究活動との関連性" 
              score={analysis.future.connection} 
              color="secondary"
            />
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>主な目標:</strong></p>
              <ul className="space-y-1">
                {analysis.future.goals.slice(0, 2).map((goal, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </PremiumCardContent>
        </PremiumCard>
      </div>

      {/* 改善提案 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SuggestionCard
          title="志望動機の改善"
          suggestions={analysis.motivation.suggestions}
          icon={Lightbulb}
        />
        <SuggestionCard
          title="探究活動の強化"
          suggestions={analysis.research.suggestions}
          icon={TrendingUp}
        />
        <SuggestionCard
          title="将来設計の明確化"
          suggestions={analysis.future.suggestions}
          icon={Target}
        />
      </div>

      {/* 面接練習開始ボタン */}
      {onStartInterview && analysis.research.topic && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <PremiumCard className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
            <PremiumCardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="text-lg font-bold mb-2">明和中面接練習を始める</h3>
                <p className="text-primary-100 text-sm">
                  探究テーマ「{analysis.research.topic}」での面接練習が可能です
                </p>
              </div>
              <PremiumButton
                onClick={onStartInterview}
                variant="secondary"
                size="lg"
                className="bg-white text-primary-600 hover:bg-primary-50 shadow-lg"
              >
                面接開始
                <ArrowRight className="w-4 h-4 ml-2" />
              </PremiumButton>
            </PremiumCardContent>
          </PremiumCard>
        </motion.div>
      )}
    </div>
  );
}

export default EssayAnalysisDisplay;