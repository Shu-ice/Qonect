'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Target,
  BookOpen,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from '@/components/ui/PremiumCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { MascotCharacter } from '@/components/ui/MascotCharacter';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import RealtimeFeedback from './RealtimeFeedback';
import { meiwaAIEngine } from '@/lib/meiwa-ai-engine';
import { meiwaAIService } from '@/lib/meiwa-ai-service';
import { realtimeEvaluator, RealtimeAnalysis, RealtimeFeedback as RealtimeFeedbackType } from '@/lib/realtime-evaluation';
import {
  MeiwaInterviewSession as SessionType,
  MeiwaQuestion,
  MeiwaResearchEvaluation,
  MeiwaQuestionType
} from '@/types/meiwa-evaluation';

interface MeiwaInterviewSessionProps {
  researchTopic: string;
  essayContent: {
    motivation: string;
    research: string;
    schoolLife: string;
    future: string;
  };
  onSessionComplete: (evaluation: MeiwaResearchEvaluation) => void;
  onSessionExit: () => void;
  className?: string;
}

export function MeiwaInterviewSession({
  researchTopic,
  essayContent,
  onSessionComplete,
  onSessionExit,
  className
}: MeiwaInterviewSessionProps) {
  const [session, setSession] = useState<SessionType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<MeiwaQuestion | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<'intro' | 'questions' | 'evaluation' | 'complete'>('intro');
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15分
  const [questionProgress, setQuestionProgress] = useState(0);
  const [liveEvaluation, setLiveEvaluation] = useState<Partial<MeiwaResearchEvaluation>>({});
  const [showHint, setShowHint] = useState(false);
  const [realtimeAnalysis, setRealtimeAnalysis] = useState<RealtimeAnalysis | null>(null);
  const [realtimeFeedback, setRealtimeFeedback] = useState<RealtimeFeedbackType[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showRealtimeFeedback, setShowRealtimeFeedback] = useState(true);

  // セッション初期化
  useEffect(() => {
    if (!session) {
      initializeSession();
    }
  }, []);

  // タイマー
  useEffect(() => {
    if (sessionPhase === 'questions' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSessionTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sessionPhase, timeRemaining]);

  const initializeSession = useCallback(() => {
    const newSession: SessionType = {
      sessionId: `meiwa_${Date.now()}`,
      userId: 'current_user',
      startTime: new Date(),
      researchTopic,
      questions: [],
      responses: [],
      progressMarkers: {
        questionNumber: 0,
        totalQuestions: 8, // 明和中は8-10問程度
        completionPercentage: 0,
        averageResponseTime: 0
      }
    };

    setSession(newSession);
    generateFirstQuestion(newSession);
  }, [researchTopic]);

  const generateFirstQuestion = useCallback(async (session: SessionType) => {
    try {
      const firstQuestion = await meiwaAIEngine.generateMeiwaQuestion(
        researchTopic,
        [],
        'basic_interest'
      );
      
      setCurrentQuestion(firstQuestion);
      setSessionPhase('questions');
      
      setSession(prev => prev ? {
        ...prev,
        questions: [...prev.questions, firstQuestion]
      } : null);
    } catch (error) {
      console.error('Failed to generate first question:', error);
    }
  }, [researchTopic]);

  // リアルタイム分析ハンドラー
  const handleTranscriptChange = useCallback(async (transcript: string, interimTranscript: string = '') => {
    setCurrentTranscript(transcript);
    setCurrentResponse(transcript);

    if (currentQuestion && transcript.length > 10) {
      try {
        const analysis = await realtimeEvaluator.analyzeResponse(
          transcript,
          interimTranscript,
          currentQuestion.question,
          researchTopic
        );
        
        setRealtimeAnalysis(analysis);
        
        // フィードバック取得
        const feedback = realtimeEvaluator.getRealtimeFeedback();
        if (feedback.length > 0) {
          setRealtimeFeedback(prev => [...prev.slice(-5), ...feedback]); // 最新6件を保持
        }
      } catch (error) {
        console.error('Realtime analysis error:', error);
      }
    }
  }, [currentQuestion, researchTopic]);

  const handleResponse = useCallback(async (response: string) => {
    if (!session || !currentQuestion) return;

    const finalAnalysis = realtimeAnalysis || {
      confidence: 0.5,
      completeness: 0.5,
      clarity: 0.5,
      engagement: 0.5,
      suggestions: [],
      strengths: [],
      warnings: []
    };

    const responseData: {
      questionId: string;
      response: string;
      timestamp: Date;
      evaluation?: Partial<MeiwaResearchEvaluation>;
      realtimeAnalysis?: any;
    } = {
      questionId: currentQuestion.id,
      response,
      timestamp: new Date(),
      realtimeAnalysis: finalAnalysis
    };

    try {
      // AI評価を実行
      const evaluation = await meiwaAIEngine.evaluateResponse(
        currentQuestion,
        response,
        {
          researchTopic,
          previousResponses: session.responses.map(r => r.response),
          currentSessionData: session
        }
      );

      responseData.evaluation = evaluation;

      // ライブ評価を更新
      setLiveEvaluation(prev => ({
        ...prev,
        ...evaluation
      }));

      // セッションを更新
      const updatedSession = {
        ...session,
        responses: [...session.responses, responseData],
        progressMarkers: {
          ...session.progressMarkers,
          questionNumber: session.progressMarkers.questionNumber + 1,
          completionPercentage: ((session.progressMarkers.questionNumber + 1) / session.progressMarkers.totalQuestions) * 100
        }
      };

      setSession(updatedSession);
      setQuestionProgress(prev => prev + 1);

      // 分析データをリセット
      setRealtimeAnalysis(null);
      setRealtimeFeedback([]);
      setCurrentTranscript('');
      setCurrentResponse('');

      // 次の質問を生成または面接終了
      if (updatedSession.progressMarkers.questionNumber >= updatedSession.progressMarkers.totalQuestions) {
        await completeSession(updatedSession);
      } else {
        await generateNextQuestion(updatedSession);
      }

    } catch (error) {
      console.error('Failed to process response:', error);
    }
  }, [session, currentQuestion, researchTopic, realtimeAnalysis]);

  const generateNextQuestion = useCallback(async (session: SessionType) => {
    try {
      // 次の質問タイプを決定（明和中の質問戦略に基づく）
      const nextQuestionType = determineNextQuestionType(session);
      
      const nextQuestion = await meiwaAIEngine.generateMeiwaQuestion(
        researchTopic,
        session.responses.map(r => r.response),
        nextQuestionType
      );

      setCurrentQuestion(nextQuestion);
      
      setSession(prev => prev ? {
        ...prev,
        questions: [...prev.questions, nextQuestion]
      } : null);

    } catch (error) {
      console.error('Failed to generate next question:', error);
    }
  }, [researchTopic]);

  const determineNextQuestionType = (session: SessionType): MeiwaQuestionType => {
    const questionCount = session.progressMarkers.questionNumber;
    const usedTypes = session.questions.map(q => q.type);

    // 明和中の質問戦略: 60% 探究活動深掘り、20% 社会関連、15% 成長、5% 将来
    const strategy = [
      'experience_detail',      // 2問目: 体験詳細
      'social_awareness',       // 3問目: 社会関連
      'complexity_check',       // 4問目: 複雑性（否定疑問文）
      'deep_dive',             // 5問目: 深掘り
      'empathy_test',          // 6問目: 他者理解
      'growth_reflection',     // 7問目: 成長
      'synthesis'              // 8問目: 統合
    ];

    return strategy[questionCount - 1] as MeiwaQuestionType || 'deep_dive';
  };

  const completeSession = useCallback(async (session: SessionType) => {
    setSessionPhase('evaluation');

    try {
      // 全体評価を生成（実際はAI APIを使用）
      const finalEvaluation = await generateFinalEvaluation(session);
      
      const completedSession = {
        ...session,
        endTime: new Date(),
        finalEvaluation
      };

      setSession(completedSession);
      setSessionPhase('complete');
      
      // 親コンポーネントに結果を通知
      onSessionComplete(finalEvaluation);

    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  }, [onSessionComplete]);

  const generateFinalEvaluation = async (session: SessionType): Promise<MeiwaResearchEvaluation> => {
    try {
      // 実際のAI APIを使用した総合評価
      const allResponses = session.responses.map(r => r.response);
      const individualEvaluations = session.responses
        .map(r => r.evaluation)
        .filter(e => e) as Partial<MeiwaResearchEvaluation>[];
      
      const mergedEvaluations = individualEvaluations.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      
      return await meiwaAIService.generateFinalEvaluation(
        researchTopic,
        allResponses,
        mergedEvaluations
      );
    } catch (error) {
      console.error('AI総合評価エラー、フォールバックを使用:', error);
      
      // エラー時はフォールバック評価を生成
      return generateFallbackFinalEvaluation(session);
    }
  };

  const generateFallbackFinalEvaluation = (session: SessionType): MeiwaResearchEvaluation => {
    const evaluations = session.responses
      .map(r => r.evaluation)
      .filter(e => e) as Partial<MeiwaResearchEvaluation>[];

    const finalEvaluation: MeiwaResearchEvaluation = {
      genuineInterest: liveEvaluation.genuineInterest || {
        score: 4,
        indicators: ['継続的な関心を示している'],
        concerns: [],
        feedback: '探究活動への真の興味が伝わってきます。'
      },
      experienceBase: liveEvaluation.experienceBase || {
        score: 4,
        realExperiences: ['具体的な体験を豊富に持っている'],
        learningProcess: ['段階的な学習プロセスが明確'],
        feedback: '実体験に基づいた深い学びが感じられます。'
      },
      socialConnection: liveEvaluation.socialConnection || {
        score: 3,
        dailyLifeLinks: ['日常生活との関連が認識されている'],
        societalRelevance: ['社会的意義への理解がある'],
        feedback: '社会との関連性をより具体的に説明できるとよいでしょう。'
      },
      noDefinitiveAnswer: liveEvaluation.noDefinitiveAnswer || {
        score: 5,
        complexity: ['問題の複雑性を理解している'],
        multipleViews: true,
        creativePotential: true,
        feedback: '探究的思考が素晴らしく発達しています。'
      },
      otherUnderstanding: liveEvaluation.otherUnderstanding || {
        score: 4,
        clarity: ['説明が分かりやすい'],
        empathy: ['共感を呼ぶ内容'],
        universality: true,
        feedback: '他者にもよく伝わる説明ができています。'
      },
      selfTransformation: liveEvaluation.selfTransformation || {
        score: 4,
        behaviorChanges: ['具体的な行動の変化がある'],
        valueShifts: ['価値観の成長が見られる'],
        selfAwareness: ['自己認識が深まっている'],
        feedback: '探究を通した成長が素晴らしく表現されています。'
      },
      originalExpression: liveEvaluation.originalExpression || {
        score: 4,
        personalVocab: ['個人的な表現を使用'],
        uniquePhrases: ['独自の表現がある'],
        authenticity: true,
        feedback: 'あなたらしい言葉で表現できています。'
      },
      overallScore: 4.1,
      overallFeedback: '明和高校附属中学校が求める「主体的で探究的な学習者」の資質が十分に表れています。特に探究活動の複雑性を理解し、自己の成長を具体的に表現できている点が素晴らしいです。',
      strengths: [
        '探究活動への真の関心と熱意',
        '体験に基づいた深い学び',
        '探究的思考力の高さ',
        '自己成長への自覚'
      ],
      improvements: [
        '社会との関連性をより具体的に',
        '他者への説明をもう少し詳しく'
      ],
      nextSteps: [
        '探究活動の社会的インパクトを考えてみる',
        '研究内容を様々な人に説明する練習をする',
        '将来への具体的な展望をさらに深める'
      ]
    };

    return finalEvaluation;
  };

  const handleSessionTimeout = useCallback(() => {
    if (session) {
      completeSession(session);
    }
  }, [session, completeSession]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (sessionPhase === 'intro') {
    return (
      <div className={cn('space-y-6', className)}>
        <PremiumCard variant="premium" className="p-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <MascotCharacter
              type="wise-owl"
              size="xl"
              emotion="encouraging"
              animation="nodding"
              message="面接練習を始めましょう！"
            />
            
            <div>
              <h2 className="text-2xl font-bold text-premium-900 mb-4">
                明和高校附属中学校 面接練習
              </h2>
              <div className="space-y-3 text-premium-700">
                <p className="text-lg">
                  <span className="font-semibold text-primary-600">探究テーマ:</span> {researchTopic}
                </p>
                <p>約15分間で、あなたの探究活動について詳しくお話を聞かせてください。</p>
                <p className="text-sm">7つの評価項目に基づいて、リアルタイムでフィードバックします。</p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 text-sm text-premium-600">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>15分間</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>8-10問</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>7項目評価</span>
              </div>
            </div>

            <PremiumButton
              size="xl"
              variant="premium"
              onClick={() => setSessionPhase('questions')}
              className="min-w-[200px]"
            >
              <Play className="w-5 h-5 mr-2" />
              面接を開始する
            </PremiumButton>
          </motion.div>
        </PremiumCard>
      </div>
    );
  }

  if (sessionPhase === 'questions' && currentQuestion) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* ヘッダー情報 */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center space-x-4">
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onSessionExit}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              終了
            </PremiumButton>
            <div className="text-sm text-premium-600">
              質問 {questionProgress + 1} / {session?.progressMarkers.totalQuestions || 8}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className={cn(
              "flex items-center space-x-2 text-sm font-medium",
              timeRemaining < 300 ? "text-warning-600" : "text-premium-600"
            )}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
            
            <div className="w-24 bg-premium-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((questionProgress) / (session?.progressMarkers.totalQuestions || 8)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 質問セクション */}
        <PremiumCard variant="elevated" className="p-6">
          <PremiumCardHeader>
            <div className="flex items-center space-x-3">
              <MascotCharacter
                type="wise-owl"
                size="md"
                emotion="encouraging"
                animation="talking"
                speaking={true}
              />
              <div>
                <PremiumCardTitle className="text-lg">
                  面接官からの質問
                </PremiumCardTitle>
                <p className="text-sm text-premium-600 mt-1">
                  {currentQuestion.intent}
                </p>
              </div>
            </div>
          </PremiumCardHeader>
          
          <PremiumCardContent className="space-y-4">
            <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-r-lg">
              <p className="text-lg text-premium-800 leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-secondary-50 border border-secondary-200 rounded-lg p-3"
              >
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-secondary-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-secondary-700">
                    <p className="font-medium mb-1">回答のヒント:</p>
                    <ul className="space-y-1">
                      {currentQuestion.evaluationCriteria.map((criteria, index) => (
                        <li key={index} className="flex items-start space-x-1">
                          <span className="w-1 h-1 bg-secondary-500 rounded-full mt-2 flex-shrink-0" />
                          <span>{criteria}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between items-center">
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
              >
                {showHint ? 'ヒントを閉じる' : 'ヒントを見る'}
              </PremiumButton>
              
              <div className="text-xs text-premium-500">
                難易度: {'★'.repeat(currentQuestion.difficulty)}{'☆'.repeat(5 - currentQuestion.difficulty)}
              </div>
            </div>
          </PremiumCardContent>
        </PremiumCard>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 音声入力セクション */}
          <div className="lg:col-span-2">
            <PremiumCard variant="default" className="p-6">
              <VoiceRecorder
                onTranscriptChange={handleTranscriptChange}
                onRecordingComplete={(transcript) => {
                  handleResponse(transcript);
                }}
                placeholder="マイクボタンを押して回答してください"
                maxDuration={120} // 2分
                context="interview"
                showTranscript={true}
                showAudioVisualization={true}
              />
            </PremiumCard>
          </div>

          {/* リアルタイムフィードバック */}
          <div className="lg:col-span-1">
            <RealtimeFeedback
              analysis={realtimeAnalysis}
              feedback={realtimeFeedback}
              isActive={sessionPhase === 'questions'}
              showDetails={true}
              className="sticky top-4"
            />
          </div>
        </div>

        {/* 従来のライブ評価も保持（最終スコア表示用） */}
        {Object.keys(liveEvaluation).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PremiumCard variant="success" className="p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-success-600" />
                <div>
                  <h4 className="font-medium text-success-800">累積評価スコア</h4>
                  <div className="text-sm text-success-700 mt-1">
                    現在の平均: {(() => {
                      const values = Object.values(liveEvaluation);
                      const total = values.reduce((acc: number, item: any) => {
                        return acc + (typeof item?.score === 'number' ? item.score : 0);
                      }, 0);
                      const count = values.length;
                      return count > 0 ? (total / count).toFixed(1) : '0.0';
                    })()}点/5点
                  </div>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        )}
      </div>
    );
  }

  if (sessionPhase === 'evaluation') {
    return (
      <div className={cn('space-y-6', className)}>
        <PremiumCard variant="premium" className="p-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-primary-500 rounded-full opacity-20" />
              <div className="relative bg-primary-500 rounded-full p-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-premium-900 mb-2">
                面接お疲れさまでした！
              </h2>
              <p className="text-premium-700">
                AIが7つの評価項目で詳細分析中です...
              </p>
            </div>

            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
            </div>
          </motion.div>
        </PremiumCard>
      </div>
    );
  }

  return null;
}