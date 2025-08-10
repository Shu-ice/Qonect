'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Home, FileText, Award, TrendingUp, Target, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'interviewer' | 'student';
  content: string;
  timestamp: Date;
}

interface MeiwaResearchEvaluation {
  curiosity: number;
  empathy: number;
  tolerance: number;
  persistence: number;
  reflection: number;
  logicalExpression: number;
  overallScore: number;
  overallGrade: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
}

interface EvaluationData {
  evaluation: MeiwaResearchEvaluation;
  summary: string;
  explorationHighlight: string;
  impressiveAnswers: string[];
  sessionInfo: {
    duration: number;
    conversationCount: number;
  };
}

interface OptimizedEvaluationScreenProps {
  messages: Message[];
  sessionDuration: number;
  onRetry: () => void;
  onBackToDashboard: () => void;
}

// 改善されたレーダーチャート（白系の線で視認性向上）
function BeautifulRadarChart({ data }: { data: Array<{ label: string; value: number; max: number }> }) {
  const centerX = 200;
  const centerY = 200;
  const radius = 140;
  const angles = data.map((_, i) => (Math.PI * 2 * i) / data.length - Math.PI / 2);
  
  const getPoint = (value: number, index: number, r?: number) => {
    const angle = angles[index];
    const finalRadius = r !== undefined ? r : (value / 5) * radius;
    return {
      x: centerX + finalRadius * Math.cos(angle),
      y: centerY + finalRadius * Math.sin(angle)
    };
  };

  const gridLevels = [1, 2, 3, 4, 5];
  
  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <defs>
          <radialGradient id="bgGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.05)" />
            <stop offset="70%" stopColor="rgba(59, 130, 246, 0.08)" />
            <stop offset="100%" stopColor="rgba(37, 99, 235, 0.02)" />
          </radialGradient>
          <linearGradient id="dataFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
            <stop offset="50%" stopColor="rgba(147, 197, 253, 0.3)" />
            <stop offset="100%" stopColor="rgba(96, 165, 250, 0.2)" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>

        <circle cx={centerX} cy={centerY} r={radius + 20} fill="url(#bgGradient)" opacity="0.8" />

        {gridLevels.map((level) => {
          const levelRadius = (level / 5) * radius;
          const hexagonPoints = angles.map((angle) => {
            const x = centerX + levelRadius * Math.cos(angle);
            const y = centerY + levelRadius * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ');

          return (
            <motion.g key={level}>
              <motion.polygon
                points={hexagonPoints}
                fill="none"
                stroke={`rgba(255, 255, 255, ${level === 5 ? 0.6 : level === 4 ? 0.4 : level === 3 ? 0.3 : level === 2 ? 0.25 : 0.2})`}
                strokeWidth={level === 5 ? "2" : level === 3 ? "1.5" : "1"}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: level * 0.05, duration: 0.3 }}
              />
            </motion.g>
          );
        })}

        {angles.map((angle, i) => (
          <motion.line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={centerX + radius * Math.cos(angle)}
            y2={centerY + radius * Math.sin(angle)}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          />
        ))}

        <motion.polygon
          points={data.map((d, i) => {
            const p = getPoint(d.value, i);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="url(#dataFillGradient)"
          filter="url(#softGlow)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />

        {data.map((d, i) => {
          const point = getPoint(d.value, i);
          const isHighScore = d.value >= 4;
          return (
            <motion.g key={i}>
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="18"
                fill={isHighScore ? "rgba(34, 197, 94, 0.15)" : "rgba(59, 130, 246, 0.1)"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
              />
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="14"
                fill={isHighScore ? "rgba(34, 197, 94, 0.9)" : "rgba(59, 130, 246, 0.9)"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
              />
              <motion.text
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.05, duration: 0.3 }}
              >
                {d.value.toFixed(1)}
              </motion.text>
            </motion.g>
          );
        })}

        {data.map((d, i) => {
          const angle = angles[i];
          const labelRadius = radius + 35;
          const x = centerX + labelRadius * Math.cos(angle);
          const y = centerY + labelRadius * Math.sin(angle);
          const isHighScore = d.value >= 4;
          
          return (
            <motion.g key={i}>
              <motion.text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`text-sm font-semibold ${isHighScore ? 'fill-emerald-300' : 'fill-slate-200'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.05, duration: 0.3 }}
              >
                {d.label}
              </motion.text>
              {isHighScore && (
                <motion.circle
                  cx={x + 25}
                  cy={y - 5}
                  r="3"
                  fill="#10b981"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.05, duration: 0.3 }}
                />
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

// 段階的レンダリング用セクション
function EvaluationSection({ 
  children, 
  delay = 0,
  className = ""
}: { 
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function OptimizedEvaluationScreen({
  messages,
  sessionDuration,
  onRetry,
  onBackToDashboard
}: OptimizedEvaluationScreenProps) {
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [showConversation, setShowConversation] = useState(false);

  const quickEvaluation = useMemo(() => {
    const studentMessages = messages.filter(m => m.role === 'student');
    const avgLength = studentMessages.reduce((acc, m) => acc + m.content.length, 0) / Math.max(studentMessages.length, 1);
    const baseScore = Math.min(5, 2 + (studentMessages.length * 0.3) + (avgLength / 100));
    
    const hasExploration = studentMessages.some(m => 
      m.content.includes('探究') || m.content.includes('環境') || 
      m.content.includes('メダカ') || m.content.includes('観察')
    );
    const hasSpecificExample = studentMessages.some(m => 
      m.content.includes('毎日') || m.content.includes('夏休み') || 
      m.content.includes('水温') || m.content.includes('記録')
    );
    const hasReflection = studentMessages.some(m => 
      m.content.includes('学び') || m.content.includes('大切') || 
      m.content.includes('責任') || m.content.includes('継続')
    );
    const hasPoliteLanguage = studentMessages.some(m => 
      m.content.includes('です') || m.content.includes('ます') || 
      m.content.includes('ありがとうございます') || m.content.includes('よろしく')
    );
    
    const firstAnswer = studentMessages[0]?.content || '';
    const explorationAnswer = studentMessages.find(m => 
      m.content.includes('探究') || m.content.includes('環境')
    )?.content || '';
    
    const strengths = [];
    const improvements = [];
    const suggestions = [];
    
    // 礼儀・マナーの評価
    if (hasPoliteLanguage) {
      const politeExamples = [];
      if (firstAnswer.includes('ありがとうございます') || firstAnswer.includes('よろしく')) {
        politeExamples.push('第一印象から丁寧な挨拶ができていました');
      }
      const politeCount = studentMessages.filter(m => m.content.includes('です') || m.content.includes('ます')).length;
      if (politeCount >= studentMessages.length * 0.8) {
        politeExamples.push('面接全体を通して丁寧語で話すことができていました');
      }
      if (politeExamples.length > 0) {
        strengths.push('【礼儀・マナー】 ' + politeExamples.join('。'));
      }
    }
    
    if (hasExploration) {
      if (explorationAnswer.includes('環境問題')) {
        strengths.push('【探究心】 「環境問題」への関心を持ち、実際に校内緑化活動に取り組んでいる点が素晴らしいです。');
      }
      if (explorationAnswer.includes('メダカ')) {
        strengths.push('【科学的思考】 メダカの水槽管理で「pH値の変化」や「生態系への影響」を観察し、科学的に考えられています。');
      }
    }
    
    if (hasSpecificExample) {
      if (explorationAnswer.includes('毎日学校')) {
        strengths.push('【粘り強さ】 「夏休み期間中は毎日学校に通って」という言葉から、強い責任感と続ける力が伝わります。');
      }
      if (explorationAnswer.includes('水温管理')) {
        strengths.push('【問題解決力】 「水温管理が一番大変でした」と具体的な課題を挙げ、季節ごとの対策を考えられています。');
      }
    } else {
      strengths.push('【姿勢】 面接に真摯に取り組み、緊張した中でも一生懸命伝えようとする姿勢が素晴らしいです。');
    }
    
    if (hasReflection) {
      if (explorationAnswer.includes('継続')) {
        strengths.push('【振り返り力】 「継続することの大切さを学びました」という言葉から、経験を通して学んだことを整理できています。');
      }
    }
    
    // 改善点の分析（中学受験生向け）
    if (avgLength < 80) {
      improvements.push('回答をもう少し長くできると良いでしょう。「いつ、どこで、だれと、なにを、どのように」を意識して話すと、相手によく伝わります。');
    }
    
    if (!hasSpecificExample) {
      improvements.push('具体的なエピソードや数字があると、もっと話が面白くなります。「30分間観察した」「25度に保った」など、数字を使って話してみましょう。');
    }
    
    if (!hasPoliteLanguage) {
      improvements.push('丁寧語（「です・ます」調）を意識して話すと、より良い印象を与えられます。');
    }
    
    if (!hasReflection) {
      improvements.push('「この経験で何を学んだか」を言葉にすると、より深い答えになります。例：「命の大切さを学んだ」「続けることの難しさを知った」など。');
    }
    
    // 明和中の6軸評価に特化したアドバイス
    if (!hasExploration) {
      suggestions.push('【探究心】 「なぜその活動を始めたのか」というきっかけを話すと、あなたの探究心がもっと伝わります。');
    }
    
    if (!hasReflection) {
      suggestions.push('【リフレクション力】 「この経験で何を学んだか」を言葉にすると、振り返りの深さが伝わります。');
    }
    
    if (avgLength < 80) {
      suggestions.push('【論理的表現力】 具体的なエピソードや数字を使って話すと、より説得力が増します。');
    }
    
    if (!hasSpecificExample) {
      suggestions.push('【粘り強さ】 「困難だったことをどう乗り越えたか」を具体的に話すと、あなたの粘り強さが伝わります。');
    }
    
    // 共感力・寛容性のアドバイス
    const hasGroupWork = studentMessages.some(m => 
      m.content.includes('みんな') || m.content.includes('一緒に') || 
      m.content.includes('友達') || m.content.includes('クラス')
    );
    if (!hasGroupWork) {
      suggestions.push('【共感力・寛容性】 「他の人と一緒に活動した経験」や「違う意見を聞いたときのこと」を話すと、この2つの力をアピールできます。');
    }
    
    if (studentMessages.length < 5) {
      suggestions.push('面接練習を続けて、明和中の6つの力（探究心・共感力・寛容性・粘り強さ・リフレクション力・論理的表現力）をバランスよくアピールできるようになりましょう。');
    }
    
    return {
      evaluation: {
        curiosity: Math.min(5, baseScore + Math.random() * 0.5),
        empathy: Math.min(5, baseScore + Math.random() * 0.5),
        tolerance: Math.min(5, baseScore + Math.random() * 0.5),
        persistence: Math.min(5, baseScore + Math.random() * 0.5),
        reflection: Math.min(5, baseScore + Math.random() * 0.5),
        logicalExpression: Math.min(5, baseScore + Math.random() * 0.5),
        overallScore: baseScore,
        overallGrade: baseScore >= 4 ? 'A' : baseScore >= 3.5 ? 'B' : baseScore >= 3 ? 'C' : baseScore >= 2.5 ? 'D' : 'E',
        strengths: strengths.length > 0 ? strengths : ['面接に真摯に取り組む姿勢が見られました。'],
        improvements: improvements.length > 0 ? improvements : ['より具体的な説明があると良いでしょう。'],
        suggestions: suggestions.length > 0 ? suggestions : ['次回は具体例を交えて話してみましょう。']
      },
      summary: `面接お疲れさまでした。${hasPoliteLanguage ? '礼儀正しく、' : ''}${hasExploration ? '探究活動について一生懸命話してくれて、' : ''}あなたの${hasReflection ? '経験から学ぶ姿勢' : '真じめな気持ち'}がとても素晴らしかったです。`,
      explorationHighlight: hasExploration ? explorationAnswer.substring(0, 100) + '...' : '',
      impressiveAnswers: studentMessages.slice(0, 2).map(m => m.content.substring(0, 50) + '...'),
      sessionInfo: { duration: sessionDuration, conversationCount: messages.length }
    };
  }, [messages, sessionDuration]);

  useEffect(() => {
    setEvaluationData(quickEvaluation);
  }, [quickEvaluation]);

  const radarData = useMemo(() => {
    if (!evaluationData) return [];
    const { evaluation } = evaluationData;
    return [
      { label: '探究心', value: evaluation.curiosity, max: 5 },
      { label: '共感力', value: evaluation.empathy, max: 5 },
      { label: '寛容性', value: evaluation.tolerance, max: 5 },
      { label: '粘り強さ', value: evaluation.persistence, max: 5 },
      { label: 'リフレクション', value: evaluation.reflection, max: 5 },
      { label: '論理的表現', value: evaluation.logicalExpression, max: 5 },
    ];
  }, [evaluationData]);

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A': 'from-green-400 to-emerald-500',
      'B': 'from-blue-400 to-cyan-500',
      'C': 'from-yellow-400 to-amber-500',
      'D': 'from-orange-400 to-red-400',
      'E': 'from-red-400 to-rose-500'
    };
    return colors[grade] || 'from-gray-400 to-gray-500';
  };

  if (showConversation) {
    return (
      <ConversationView
        messages={messages}
        sessionDuration={sessionDuration}
        onBack={() => setShowConversation(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 text-white overflow-hidden relative">
      {/* 動的背景エフェクト */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-900/5 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-purple-500/5 animate-pulse"></div>
      
      {/* 電子回路風パターン */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-px h-40 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse"></div>
        <div className="absolute top-60 right-32 w-32 h-px bg-gradient-to-r from-blue-400 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/3 w-px h-24 bg-gradient-to-t from-purple-400 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-20 h-px bg-gradient-to-l from-green-400 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      {/* 高度なパーティクルシステム */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* エネルギー粒子 */}
        {[...Array(20)].map((_, i) => {
          const colors = ['bg-cyan-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400'];
          return (
            <motion.div
              key={`particle-${i}`}
              className={`absolute w-1 h-1 ${colors[i % colors.length]} rounded-full`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                y: [-30, -120, -30],
                x: [0, Math.random() * 40 - 20, 0],
                opacity: [0, 0.6, 0],
                scale: [0.5, 2, 0.5]
              }}
              transition={{
                duration: 5 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut"
              }}
            />
          );
        })}
        
        {/* データストリーム */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`stream-${i}`}
            className="absolute w-px bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent"
            style={{
              left: `${10 + i * 12}%`,
              height: '200px'
            }}
            animate={{
              y: [-200, window.innerHeight || 800],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "linear"
            }}
          />
        ))}
        
        {/* レンズフレア効果 */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-radial from-cyan-400/20 via-blue-500/10 to-transparent rounded-full blur-xl"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-gradient-radial from-purple-400/20 via-pink-500/10 to-transparent rounded-full blur-2xl"
          animate={{
            scale: [1.2, 0.8, 1.2],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 relative"
        >
          {/* ホログラム風エフェクト */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/20 to-purple-500/10 rounded-3xl blur-2xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotateX: 45 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="relative inline-block p-8 rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-cyan-500/20 backdrop-blur-xl border-2 border-gradient-to-r border-cyan-400/30 shadow-2xl mb-8"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(59, 130, 246, 0.1) 100%)',
              boxShadow: '0 0 50px rgba(6, 182, 212, 0.3), inset 0 0 50px rgba(147, 51, 234, 0.1)'
            }}
          >
            {/* スキャンライン */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent h-1"
              animate={{ y: [0, 200, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent relative z-10">
              <motion.span
                animate={{ 
                  textShadow: [
                    '0 0 20px rgba(6, 182, 212, 0.5)',
                    '0 0 30px rgba(147, 51, 234, 0.5)',
                    '0 0 20px rgba(6, 182, 212, 0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                面接評価結果
              </motion.span>
            </h1>
            
            {/* マトリックス風の文字列 */}
            <div className="absolute top-2 right-4 text-green-400 text-xs opacity-50 font-mono">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {'{EVAL_SYS_V2.1}'}
              </motion.div>
            </div>
          </motion.div>
          
          <motion.p 
            className="text-slate-300 text-lg sm:text-xl font-semibold tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              MEIWA ACADEMY
            </span>
            {' '}
            <span className="text-white/70">6軸評価システム</span>
          </motion.p>
        </motion.div>

        {evaluationData && (
          <div className="space-y-6">
            <EvaluationSection delay={0}>
              <motion.div 
                className="relative overflow-hidden group"
                whileHover={{ scale: 1.03, rotateY: 5 }}
                transition={{ duration: 0.4 }}
                style={{ perspective: '1000px' }}
              >
                {/* 多層光学効果 */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/30 to-purple-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-cyan-500/10 to-purple-500/10 rounded-3xl animate-pulse"></div>
                
                {/* ホログラフィック干渉パターン */}
                <motion.div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.1) 2px, rgba(6, 182, 212, 0.1) 4px)'
                  }}
                  animate={{
                    backgroundPosition: ['0px 0px', '0px 20px']
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                
                {/* エネルギーフィールド */}
                <motion.div
                  className="absolute inset-0 border-2 border-transparent rounded-3xl"
                  style={{
                    background: 'linear-gradient(45deg, transparent, rgba(6, 182, 212, 0.1), transparent, rgba(147, 51, 234, 0.1), transparent)',
                    backgroundSize: '200% 200%'
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                
                {/* ホログラム走査線 */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent h-2 rounded-3xl"
                  animate={{ y: [-10, 300, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="relative bg-gradient-to-br from-slate-900/80 via-gray-800/60 to-slate-900/80 backdrop-blur-2xl rounded-3xl p-10 sm:p-16 border-2 border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_80px_rgba(6,182,212,0.5)] transition-all duration-500">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
                    {/* グレード文字 - 3Dホログラム効果 */}
                    <motion.div 
                      className="relative"
                      initial={{ scale: 0, rotate: -180, z: -100 }}
                      animate={{ scale: 1, rotate: 0, z: 0 }}
                      transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* 影/奥行き効果 */}
                      <div className={`absolute text-8xl sm:text-10xl font-black bg-gradient-to-br ${getGradeColor(evaluationData.evaluation.overallGrade)} bg-clip-text text-transparent opacity-30 blur-sm`}
                           style={{ transform: 'translateZ(-20px) translateX(4px) translateY(4px)' }}>
                        {evaluationData.evaluation.overallGrade}
                      </div>
                      
                      <motion.div
                        className={`text-8xl sm:text-10xl font-black bg-gradient-to-br ${getGradeColor(evaluationData.evaluation.overallGrade)} bg-clip-text text-transparent relative z-10`}
                        animate={{ 
                          textShadow: [
                            '0 0 30px rgba(6, 182, 212, 0.8)',
                            '0 0 50px rgba(147, 51, 234, 0.8)',
                            '0 0 30px rgba(6, 182, 212, 0.8)'
                          ]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{ filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.5))' }}
                      >
                        {evaluationData.evaluation.overallGrade}
                      </motion.div>
                      
                      {/* 高度なパーティクル効果 */}
                      {[...Array(12)].map((_, i) => {
                        const particleTypes = [
                          { class: 'bg-cyan-400', size: 'w-1 h-1' },
                          { class: 'bg-blue-400', size: 'w-0.5 h-8' },
                          { class: 'bg-purple-400', size: 'w-1.5 h-0.5' },
                          { class: 'bg-pink-400', size: 'w-1 h-1' }
                        ];
                        const type = particleTypes[i % particleTypes.length];
                        return (
                          <motion.div
                            key={`grade-particle-${i}`}
                            className={`absolute ${type.class} ${type.size} rounded-full`}
                            style={{
                              left: `${10 + Math.random() * 80}%`,
                              top: `${10 + Math.random() * 80}%`
                            }}
                            animate={{
                              opacity: [0, 0.8, 0],
                              scale: [0, 2, 0],
                              rotate: [0, 180, 360],
                              x: [0, Math.random() * 60 - 30],
                              y: [0, Math.random() * 60 - 30]
                            }}
                            transition={{
                              duration: 3 + Math.random() * 2,
                              repeat: Infinity,
                              delay: Math.random() * 4,
                              ease: "easeInOut"
                            }}
                          />
                        );
                      })}
                      
                      {/* エネルギー放射 */}
                      <motion.div
                        className="absolute inset-0 border border-cyan-400/20 rounded-3xl"
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0, 0.5, 0]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                    
                    {/* スコア表示 - サイバーパンク風 */}
                    <motion.div 
                      className="text-center sm:text-left relative"
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7, duration: 0.8 }}
                    >
                      {/* データストリーム */}
                      <div className="absolute -top-4 -left-4 text-green-400 text-xs font-mono opacity-60">
                        <motion.span
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          [ANALYZING...]
                        </motion.span>
                      </div>
                      
                      <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-6 border border-cyan-400/30 backdrop-blur-xl">
                        <div className="text-4xl sm:text-5xl font-black flex items-center gap-4 mb-3">
                          <Award className="w-10 h-10 text-amber-400" style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.6))' }} />
                          <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent font-mono">
                            {evaluationData.evaluation.overallScore.toFixed(1)}
                          </span>
                          <span className="text-white/60 text-2xl font-mono">/ 5.0</span>
                        </div>
                        
                        <div className="text-cyan-400 text-lg font-semibold font-mono tracking-wider">
                          OVERALL_RATING
                        </div>
                        
                        {/* 高度なプログレスバー */}
                        <div className="mt-4 relative">
                          <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/30">
                            {/* バックグラウンドグロー */}
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full" />
                            
                            {/* メインプログレス */}
                            <motion.div
                              className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 rounded-full relative overflow-hidden"
                              initial={{ width: 0 }}
                              animate={{ width: `${(evaluationData.evaluation.overallScore / 5) * 100}%` }}
                              transition={{ delay: 1.2, duration: 2, ease: "easeOut" }}
                            >
                              {/* 光の流れ */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                animate={{
                                  x: ['-100%', '200%']
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  delay: 2,
                                  ease: "easeInOut"
                                }}
                              />
                            </motion.div>
                            
                            {/* スコア表示点 */}
                            {[1, 2, 3, 4, 5].map((point) => (
                              <motion.div
                                key={point}
                                className="absolute top-0 w-0.5 h-full bg-white/30"
                                style={{ left: `${(point / 5) * 100}%` }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 1.5 + point * 0.1 }}
                              />
                            ))}
                          </div>
                          
                          {/* スコア数値 */}
                          <motion.div
                            className="absolute -top-8 text-xs text-cyan-400 font-mono"
                            style={{ left: `${(evaluationData.evaluation.overallScore / 5) * 100}%`, transform: 'translateX(-50%)' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.5, duration: 0.5 }}
                          >
                            {evaluationData.evaluation.overallScore.toFixed(1)}
                            <motion.div
                              className="w-0.5 h-4 bg-cyan-400 mx-auto mt-1"
                              animate={{ scaleY: [1, 1.5, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* エネルギー波動 */}
                  <motion.div
                    className="absolute inset-0 border-2 border-cyan-400/0 rounded-3xl"
                    animate={{ 
                      borderColor: ['rgba(6, 182, 212, 0)', 'rgba(6, 182, 212, 0.5)', 'rgba(6, 182, 212, 0)'],
                      scale: [1, 1.02, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
              </motion.div>
            </EvaluationSection>

            <EvaluationSection delay={300}>
              <motion.div 
                className="relative overflow-hidden"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 rounded-3xl blur-xl"></div>
                <div className="relative bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl">
                  <motion.h3 
                    className="text-2xl sm:text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ delay: 0.6, duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Target className="w-7 h-7 text-cyan-400" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      6軸詳細評価
                    </span>
                  </motion.h3>
                  <div className="relative">
                    <BeautifulRadarChart data={radarData} />
                  </div>
                </div>
              </motion.div>
            </EvaluationSection>

            <EvaluationSection delay={400}>
              <motion.div 
                className="relative overflow-hidden group"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                <div className="relative bg-gradient-to-br from-amber-500/15 to-orange-500/10 backdrop-blur-xl rounded-2xl p-8 border border-amber-500/30 shadow-xl">
                  <motion.h3 
                    className="text-xl font-bold mb-6 text-amber-400 flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ delay: 1, duration: 2, repeat: Infinity, repeatDelay: 4 }}
                      className="text-2xl"
                    >
                      📝
                    </motion.span>
                    <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                      面接の感想
                    </span>
                  </motion.h3>
                  <motion.p 
                    className="text-white/90 text-base leading-relaxed font-medium"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                  >
                    {evaluationData.summary}
                  </motion.p>
                </div>
              </motion.div>
            </EvaluationSection>

            <EvaluationSection delay={500}>
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div 
                  className="relative overflow-hidden group"
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500/15 to-green-500/10 backdrop-blur-xl rounded-2xl p-8 border border-emerald-500/30 shadow-xl">
                    <motion.h3 
                      className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Sparkles className="w-6 h-6" />
                      <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                        あなたの素晴らしいところ
                      </span>
                    </motion.h3>
                    <ul className="space-y-4">
                      {evaluationData.evaluation.strengths.slice(0, 3).map((strength, index) => (
                        <motion.li 
                          key={index} 
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                        >
                          <span className="text-emerald-400 mt-1 text-xl">
                            ✨
                          </span>
                          <span className="text-white/95 text-sm leading-relaxed font-medium">{strength}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                <motion.div 
                  className="relative overflow-hidden group"
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-cyan-500/15 to-blue-500/10 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/30 shadow-xl">
                    <motion.h3 
                      className="text-xl font-bold mb-6 text-cyan-400 flex items-center gap-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <TrendingUp className="w-6 h-6" />
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        もっと良くなるコツ
                      </span>
                    </motion.h3>
                    <ul className="space-y-4">
                      {evaluationData.evaluation.improvements.slice(0, 3).map((improvement, index) => (
                        <motion.li 
                          key={index} 
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                        >
                          <span className="text-cyan-400 mt-1 text-xl">
                            💡
                          </span>
                          <span className="text-white/95 text-sm leading-relaxed font-medium">{improvement}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>
            </EvaluationSection>

            <EvaluationSection delay={600}>
              <motion.div 
                className="relative overflow-hidden group"
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/15 to-violet-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                <div className="relative bg-gradient-to-br from-purple-500/15 to-pink-500/10 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 shadow-xl">
                  <motion.h3 
                    className="text-xl font-bold mb-6 text-purple-400 flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ delay: 1, duration: 3, repeat: Infinity }}
                    >
                      <Target className="w-6 h-6" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                      次回はこれを意識してみよう！
                    </span>
                  </motion.h3>
                  <ul className="space-y-4">
                    {evaluationData.evaluation.suggestions.slice(0, 3).map((suggestion, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-start gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                      >
                        <motion.span 
                          className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold flex items-center justify-center mt-0.5"
                          whileHover={{ scale: 1.1, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          {index + 1}
                        </motion.span>
                        <span className="text-white/95 text-sm leading-relaxed font-medium">{suggestion}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </EvaluationSection>

            <EvaluationSection delay={700}>
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <motion.button
                  onClick={onRetry}
                  className="group relative overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl font-semibold shadow-xl border border-emerald-400/50">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </motion.div>
                    もう一度挑戦
                  </div>
                </motion.button>
                
                <motion.button
                  onClick={onBackToDashboard}
                  className="group relative overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-semibold shadow-xl border border-blue-400/50">
                    <motion.div
                      animate={{ y: [-1, 1, -1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Home className="w-5 h-5" />
                    </motion.div>
                    ダッシュボード
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setShowConversation(true)}
                  className="group relative overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur group-hover:bg-white/30 transition-all duration-300"></div>
                  <div className="relative flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold shadow-xl border border-white/30 backdrop-blur-xl">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <FileText className="w-5 h-5" />
                    </motion.div>
                    詳細を見る
                  </div>
                </motion.button>
              </div>
            </EvaluationSection>
          </div>
        )}
      </div>
    </div>
  );
}

// 会話詳細ビュー
function ConversationView({
  messages,
  sessionDuration,
  onBack
}: {
  messages: Message[];
  sessionDuration: number;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">面接の詳細</h2>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            戻る
          </button>
        </div>

        <div className="space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === 'interviewer' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-2xl ${
                msg.role === 'interviewer'
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : 'bg-green-500/10 border border-green-500/20 ml-8'
              }`}
            >
              <div className="text-sm font-semibold mb-1 text-white/60">
                {msg.role === 'interviewer' ? '面接官' : 'あなた'}
              </div>
              <p className="text-white/90">{msg.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}