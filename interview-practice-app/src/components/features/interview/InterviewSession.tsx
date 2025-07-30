/**
 * 面接セッション実行コンポーネント
 * 実際の面接練習を行うメインコンポーネント
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Clock,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Eye,
  AlertCircle,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InterviewQuestion } from '@/lib/interview-patterns/meiwa-patterns';
import { useAriaAnnouncer } from '@/lib/accessibility';

interface InterviewSessionProps {
  questions: InterviewQuestion[];
  sessionTitle?: string;
  onComplete: (results: InterviewResult[]) => void;
  onExit: () => void;
  className?: string;
}

interface InterviewResult {
  questionId: string;
  question: string;
  userAnswer: string;
  recordingDuration: number;
  timestamp: Date;
  evaluation?: {
    content: number;
    expression: number;
    attitude: number;
    uniqueness: number;
    totalScore: number;
    feedback: string;
  };
}

type SessionState = 'intro' | 'question' | 'recording' | 'paused' | 'reviewing' | 'completed';

export function InterviewSession({ 
  questions, 
  sessionTitle = '面接練習セッション',
  onComplete, 
  onExit, 
  className 
}: InterviewSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>('intro');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<InterviewResult[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [preparationTime, setPreparationTime] = useState(30); // 準備時間（秒）
  const [answerTime, setAnswerTime] = useState(0);
  const [maxAnswerTime, setMaxAnswerTime] = useState(0);

  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preparationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const answerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { announce } = useAriaAnnouncer();

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = (currentQuestionIndex / totalQuestions) * 100;

  useEffect(() => {
    if (currentQuestion) {
      setMaxAnswerTime(currentQuestion.expectedAnswerLength);
    }
  }, [currentQuestion]);

  useEffect(() => {
    return () => {
      // クリーンアップ
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      if (preparationTimerRef.current) clearInterval(preparationTimerRef.current);
      if (answerTimerRef.current) clearInterval(answerTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startSession = () => {
    setSessionState('question');
    setSessionStartTime(new Date());
    announce('面接練習を開始します。最初の質問を表示します。');
    startPreparationTimer();
  };

  const startPreparationTimer = () => {
    setPreparationTime(30);
    preparationTimerRef.current = setInterval(() => {
      setPreparationTime(prev => {
        if (prev <= 1) {
          clearInterval(preparationTimerRef.current!);
          announce('準備時間が終了しました。録音を開始してください。');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // ここで音声データを処理（AI評価に送信など）
        handleRecordingComplete(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAnswerTime(0);
      setSessionState('recording');

      announce('録音を開始しました。質問に回答してください。');

      // 録音時間の計測
      recordingTimeoutRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // 回答時間の計測
      answerTimerRef.current = setInterval(() => {
        setAnswerTime(prev => {
          if (prev >= maxAnswerTime) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Recording failed:', error);
      announce('録音の開始に失敗しました。マイクの許可を確認してください。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    setIsRecording(false);
    if (recordingTimeoutRef.current) clearInterval(recordingTimeoutRef.current);
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);

    announce('録音を停止しました。');
  };

  const handleRecordingComplete = (audioBlob: Blob) => {
    const result: InterviewResult = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      userAnswer: userAnswer || '[音声回答]',
      recordingDuration: recordingTime,
      timestamp: new Date(),
    };

    setResults(prev => [...prev, result]);
    setSessionState('reviewing');
    announce('回答が記録されました。評価を確認してください。');
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSessionState('question');
      setRecordingTime(0);
      setAnswerTime(0);
      setUserAnswer('');
      
      announce(`質問${currentQuestionIndex + 2}に進みます。`);
      startPreparationTimer();
    } else {
      completeSession();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSessionState('question');
      announce(`質問${currentQuestionIndex}に戻ります。`);
    }
  };

  const completeSession = () => {
    setSessionState('completed');
    announce('面接練習が完了しました。結果を確認してください。');
    onComplete(results);
  };

  const retryCurrentQuestion = () => {
    setSessionState('question');
    setRecordingTime(0);
    setAnswerTime(0);
    setUserAnswer('');
    
    // 結果から現在の質問の回答を削除
    setResults(prev => prev.filter(r => r.questionId !== currentQuestion.id));
    
    announce('この質問をやり直します。');
    startPreparationTimer();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio < 0.5) return 'text-green-600';
    if (ratio < 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (sessionState === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('max-w-2xl mx-auto p-6 text-center', className)}
      >
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {sessionTitle}
          </h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{totalQuestions}問</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>約{Math.ceil(totalQuestions * 2)}分</span>
              </div>
            </div>
            
            <p className="text-gray-600">
              各質問について30秒の準備時間があります。<br />
              その後、録音ボタンを押して回答してください。
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={startSession}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              面接練習を開始
            </button>
            
            <button
              onClick={onExit}
              className="w-full text-gray-600 py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('max-w-4xl mx-auto p-6', className)}
    >
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {sessionTitle}
          </h2>
          
          <button
            onClick={onExit}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* プログレスバー */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>質問 {currentQuestionIndex + 1} / {totalQuestions}</span>
            <span>{Math.round(progress)}% 完了</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 時間表示 */}
        <div className="flex items-center justify-center space-x-6 text-sm">
          {preparationTime > 0 && (
            <div className="flex items-center space-x-1 text-blue-600">
              <Clock className="w-4 h-4" />
              <span>準備時間: {preparationTime}秒</span>
            </div>
          )}
          
          {sessionState === 'recording' && (
            <div className={cn(
              'flex items-center space-x-1',
              getTimeColor(answerTime, maxAnswerTime)
            )}>
              <Clock className="w-4 h-4" />
              <span>回答時間: {formatTime(answerTime)} / {formatTime(maxAnswerTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <AnimatePresence mode="wait">
          {sessionState === 'question' && (
            <motion.div
              key="question"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {currentQuestion.question}
                </h3>
                
                {currentQuestion.tips && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-2">
                      <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">回答のポイント</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {currentQuestion.tips.map((tip, index) => (
                            <li key={index}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {preparationTime === 0 && (
                  <button
                    onClick={startRecording}
                    className="flex items-center justify-center space-x-2 bg-red-600 text-white py-4 px-8 rounded-lg hover:bg-red-700 transition-colors font-medium mx-auto"
                  >
                    <Mic className="w-5 h-5" />
                    <span>録音開始</span>
                  </button>
                )}
                
                {preparationTime > 0 && (
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {preparationTime}
                    </div>
                    <p className="text-gray-600">準備時間</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {sessionState === 'recording' && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentQuestion.question}
                </h3>
                
                <div className="flex items-center justify-center space-x-2 text-red-600 mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Mic className="w-8 h-8" />
                  </motion.div>
                  <span className="text-lg font-medium">録音中...</span>
                </div>
                
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatTime(recordingTime)}
                </div>
                
                <div className={cn(
                  'text-sm',
                  getTimeColor(answerTime, maxAnswerTime)
                )}>
                  推奨時間: {formatTime(maxAnswerTime)}
                </div>
              </div>

              <button
                onClick={stopRecording}
                className="flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors font-medium mx-auto"
              >
                <Square className="w-5 h-5" />
                <span>録音停止</span>
              </button>
            </motion.div>
          )}

          {sessionState === 'reviewing' && (
            <motion.div
              key="reviewing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  回答完了
                </h3>
                <p className="text-gray-600">
                  録音時間: {formatTime(recordingTime)}
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={retryCurrentQuestion}
                  className="flex items-center space-x-2 text-blue-600 hover:bg-blue-50 py-2 px-4 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>やり直し</span>
                </button>
                
                <button
                  onClick={nextQuestion}
                  className="flex items-center space-x-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <span>
                    {currentQuestionIndex < totalQuestions - 1 ? '次の質問' : '完了'}
                  </span>
                  {currentQuestionIndex < totalQuestions - 1 && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ナビゲーション */}
      <div className="flex justify-between mt-6">
        <button
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>前の質問</span>
        </button>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {results.map((_, index) => (
            <div
              key={index}
              className={cn(
                'w-3 h-3 rounded-full',
                index < currentQuestionIndex ? 'bg-green-500' : 'bg-gray-300'
              )}
            />
          ))}
        </div>

        <button
          onClick={nextQuestion}
          disabled={sessionState !== 'reviewing'}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span>次の質問</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}