'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Mic, 
  MicOff, 
  Send, 
  User, 
  Bot,
  Volume2,
  Loader2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { MascotCharacter } from '@/components/ui/MascotCharacter';
import { XPProgressBar, XPGainAnimation, LevelUpAnimation } from '@/components/gamification/XPProgressBar';
import { BadgeDisplay, BadgeEarnedAnimation } from '@/components/gamification/BadgeDisplay';
import { LeagueDisplay } from '@/components/gamification/LeagueSystem';
import { gamificationEngine, League, UserProgress, Badge } from '@/lib/gamification';
import { EditableTranscript, CorrectionHistory } from '@/components/speech/EditableTranscript';
import { CorrectionContext, TranscriptCorrection } from '@/lib/speech/contextual-correction';

interface Message {
  id: string;
  role: 'interviewer' | 'student';
  content: string;
  timestamp: Date;
  feedback?: {
    score: number;
    points: string[];
    suggestions: string[];
  };
}

interface EssayContent {
  motivation: string;
  research: string;
  schoolLife: string;
  future: string;
}

interface ReflectionInterviewChatProps {
  essayContent: EssayContent;
  onSessionEnd: (messages: Message[]) => void;
}

export function ReflectionInterviewChat({ 
  essayContent, 
  onSessionEnd 
}: ReflectionInterviewChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [interimText, setInterimText] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // ゲーミフィケーション状態
  const [userProgress, setUserProgress] = useState<UserProgress>({
    userId: 'demo-user',
    totalXP: 1250,
    level: 5,
    currentLeague: gamificationEngine.determineLeague(1250),
    streak: { current: 3, longest: 7, lastPracticeDate: new Date() },
    badges: [],
    weeklyXP: 285,
    monthlyXP: 1100,
    rank: 42
  });
  const [showXPGain, setShowXPGain] = useState<{ amount: number; reason: string } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const [showBadgeEarned, setShowBadgeEarned] = useState<Badge | null>(null);
  const [sessionStartXP, setSessionStartXP] = useState(0);

  // 音声修正機能
  const [correctionHistory, setCorrectionHistory] = useState<TranscriptCorrection[]>([]);
  const [showTranscriptEditor, setShowTranscriptEditor] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  // 音声認識の初期化
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'ja-JP';
      recognitionInstance.maxAlternatives = 1;
      
      // より敏感な音声認識設定
      if ('webkitSpeechRecognition' in window) {
        (recognitionInstance as any).webkitPersistent = true;
      }
      
      // 音声認識開始時点のテキストを保存
      let baseText = '';
      let lastTranscriptLength = 0;
      
      recognitionInstance.onstart = () => {
        console.log('🎤 音声認識開始 - 現在のテキストを保存');
        // 最新の状態を取得するために、setCurrentInputのコールバックを使用
        setCurrentInput(current => {
          baseText = current;
          console.log('📌 保存したベーステキスト:', baseText);
          return current;
        });
        lastTranscriptLength = 0;
      };
      
      recognitionInstance.onresult = (event) => {
        console.log('🎤 音声認識結果 - event.results.length:', event.results.length);
        let fullTranscript = '';
        let interimTranscript = '';
        
        // 各結果の詳細をログ出力
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          const isFinal = result.isFinal;
          
          console.log(`結果[${i}]: "${transcript}" (final: ${isFinal}, confidence: ${confidence})`);
          
          if (isFinal) {
            fullTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        console.log('📝 確定テキスト（累積）:', `"${fullTranscript}"`);
        console.log('⏳ 中間テキスト:', `"${interimTranscript}"`);
        console.log('🏁 ベーステキスト:', `"${baseText}"`);
        
        // リアルタイムで中間結果を表示
        setInterimText(interimTranscript);
        
        // 音声認識開始時のテキスト + 音声認識結果（累積）を設定
        const newFullText = baseText + fullTranscript;
        console.log('💾 最終結果:', `"${newFullText}"`);
        setCurrentInput(newFullText);
        
        // 次回の比較のために長さを保存
        lastTranscriptLength = fullTranscript.length;
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('音声認識エラー:', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        console.log('音声認識終了', { isListening });
        setInterimText(''); // 音声認識終了時に中間テキストをクリア
        
        // 音声認識が途切れた場合、リスニング中なら自動再開
        setTimeout(() => {
          if (isListening) {
            try {
              recognitionInstance.start();
              console.log('音声認識自動再開');
            } catch (error) {
              console.error('音声認識再開エラー:', error);
              setIsListening(false);
            }
          }
        }, 100);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // セッション開始
  useEffect(() => {
    if (!isSessionActive) {
      startSession();
    }
  }, []);

  // タイマー
  useEffect(() => {
    if (isSessionActive) {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSessionActive]);

  // メッセージ自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    setIsSessionActive(true);
    setIsThinking(true);
    setSessionStartXP(userProgress.totalXP);
    
    // 初回の挨拶と質問を生成
    const initialQuestion = await generateInitialQuestion();
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'interviewer',
      content: initialQuestion,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setIsThinking(false);
  };

  const generateInitialQuestion = async (): Promise<string> => {
    try {
      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayContent,
          conversationHistory: [],
          questionType: 'opening'
        })
      });
      
      if (!response.ok) throw new Error('質問生成に失敗');
      
      const data = await response.json();
      return data.question || "こんにちは。今日は面接練習をしていただき、ありがとうございます。まず、なぜ明和高校附属中学校を志望されたのか、お聞かせください。";
    } catch (error) {
      console.error('初回質問生成エラー:', error);
      return "こんにちは。今日は面接練習をしていただき、ありがとうございます。まず、なぜ明和高校附属中学校を志望されたのか、お聞かせください。";
    }
  };

  const generateNextQuestion = async (conversationHistory: Message[]): Promise<string> => {
    try {
      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayContent,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          questionType: 'follow_up'
        })
      });
      
      if (!response.ok) throw new Error('質問生成に失敗');
      
      const data = await response.json();
      return data.question;
    } catch (error) {
      console.error('質問生成エラー:', error);
      return "ありがとうございます。他にお聞かせいただけることはありますか？";
    }
  };

  const evaluateResponse = async (response: string, question: string) => {
    try {
      const evaluationResponse = await fetch('/api/interview/evaluate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          response,
          essayContent
        })
      });
      
      if (!evaluationResponse.ok) throw new Error('評価に失敗');
      
      const evaluation = await evaluationResponse.json();
      return evaluation;
    } catch (error) {
      console.error('回答評価エラー:', error);
      return {
        score: 3,
        points: ['回答をありがとうございます'],
        suggestions: ['さらに具体的な例があると良いでしょう']
      };
    }
  };

  const startListening = () => {
    if (recognition && !isListening) {
      console.log('音声認識開始');
      setIsListening(true);
      try {
        recognition.start();
      } catch (error) {
        console.error('音声認識開始エラー:', error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      console.log('音声認識停止');
      setIsListening(false); // 先にステートを更新して自動再開を防ぐ
      try {
        recognition.stop();
      } catch (error) {
        console.error('音声認識停止エラー:', error);
      }
      setInterimText(''); // 中間テキストもクリア
    }
  };

  const sendMessage = async () => {
    if (!currentInput.trim() || isThinking) return;
    
    const studentMessage: Message = {
      id: Date.now().toString(),
      role: 'student',
      content: currentInput.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, studentMessage]);
    
    // 入力欄と中間テキストをクリア
    setCurrentInput('');
    setInterimText('');
    
    // 音声認識が動作中であれば停止
    if (isListening && recognition) {
      setIsListening(false);
      try {
        recognition.stop();
      } catch (error) {
        console.error('音声認識停止エラー:', error);
      }
    }
    
    setIsThinking(true);
    
    // 回答を評価
    const lastInterviewerMessage = messages.filter(m => m.role === 'interviewer').slice(-1)[0];
    const feedback = await evaluateResponse(studentMessage.content, lastInterviewerMessage?.content || '');
    
    // フィードバック付きで更新
    const studentMessageWithFeedback = { ...studentMessage, feedback };
    
    // 次の質問を生成
    const updatedHistory = [...messages, studentMessageWithFeedback];
    const nextQuestion = await generateNextQuestion(updatedHistory);
    
    const interviewerMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'interviewer',
      content: nextQuestion,
      timestamp: new Date()
    };
    
    setMessages([...updatedHistory, interviewerMessage]);
    setIsThinking(false);

    // XP獲得処理
    await processXPGain(feedback.score, studentMessage.content);
  };

  // XP獲得とゲーミフィケーション処理
  const processXPGain = async (score: number, response: string) => {
    const currentTime = new Date();
    const timeOfDay = getTimeOfDay(currentTime);
    const isWeekend = [0, 6].includes(currentTime.getDay());
    
    // セッションデータを作成
    const sessionData = {
      completed: true,
      score: score,
      improvementFromLast: Math.max(score - 3, 0), // 基準点からの改善
      isPerfectScore: score >= 4.5,
      isStreakDay: userProgress.streak.current > 0,
      difficulty: 0.6, // 中程度の難易度
      timeOfDay,
      isWeekend
    };

    // XP計算
    const gainedXP = gamificationEngine.calculateSessionXP(sessionData);
    const oldLevel = userProgress.level;
    const newTotalXP = userProgress.totalXP + gainedXP;
    const newLevel = gamificationEngine.calculateLevel(newTotalXP);
    const newLeague = gamificationEngine.determineLeague(newTotalXP);

    // プログレス更新
    const newProgress: UserProgress = {
      ...userProgress,
      totalXP: newTotalXP,
      level: newLevel,
      currentLeague: newLeague,
      weeklyXP: userProgress.weeklyXP + gainedXP
    };

    // バッジチェック
    const userStats = {
      sessionsCompleted: messages.filter(m => m.role === 'student').length,
      bestScore: Math.max(score, 3),
      currentStreak: userProgress.streak.current,
      totalPracticeTime: sessionTime / 3600, // 時間単位
      improvementRate: sessionData.improvementFromLast || 0,
      morningPracticeCount: timeOfDay === 'morning' ? 1 : 0,
      weekendPracticeCount: isWeekend ? 1 : 0
    };

    const newBadges = gamificationEngine.checkBadgeEligibility(userStats, userProgress.badges);

    // 状態更新
    setUserProgress(newProgress);

    // アニメーション表示
    if (gainedXP > 0) {
      setShowXPGain({ 
        amount: gainedXP, 
        reason: score >= 4 ? "素晴らしい回答!" : "回答完了!" 
      });
      
      setTimeout(() => setShowXPGain(null), 3000);
    }

    if (newLevel > oldLevel) {
      setTimeout(() => {
        setShowLevelUp(newLevel);
        setTimeout(() => setShowLevelUp(null), 4000);
      }, 1000);
    }

    if (newBadges.length > 0) {
      setTimeout(() => {
        setShowBadgeEarned(newBadges[0]);
        setTimeout(() => setShowBadgeEarned(null), 4000);
      }, 2000);
    }
  };

  const getTimeOfDay = (date: Date): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  // 修正コンテキストの作成
  const createCorrectionContext = (): CorrectionContext => {
    const lastInterviewerMessage = messages.filter(m => m.role === 'interviewer').slice(-1)[0];
    return {
      essayContent,
      conversationHistory: messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      currentQuestion: lastInterviewerMessage?.content || '',
      previousTranscripts: messages
        .filter(m => m.role === 'student')
        .slice(-3)
        .map(m => m.content)
    };
  };

  // 音声テキスト変更ハンドラー
  const handleTranscriptChange = (correctedText: string) => {
    setCurrentInput(correctedText);
  };

  // 修正受諾ハンドラー
  const handleAcceptCorrection = (finalText: string, correction?: TranscriptCorrection) => {
    setCurrentInput(finalText);
    if (correction) {
      setCorrectionHistory(prev => [...prev, correction]);
    }
  };

  const endSession = () => {
    setIsSessionActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onSessionEnd(messages);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 音声認識結果に句読点を自動挿入（改良版）
  const addPunctuation = (text: string): string => {
    if (!text) return text;
    
    let processed = text;
    
    // スペースや不自然な区切りを正規化
    processed = processed.replace(/\s+/g, '');
    
    // より慎重な句読点パターン（完全な単語のみ対象）
    const patterns = [
      // 接続詞（単語境界を明確に）
      /\b(なので|それで|しかし|ただし|そして)\b(?![。、])/g,
      // 理由・説明（完全な単語）
      /\b(なぜなら|というのは|つまり|たとえば)\b(?![。、])/g,
      // よく使われる接続表現
      /\b(そのため|このため|また|さらに)\b(?![。、])/g,
    ];
    
    // 読点を追加（より慎重に）
    patterns.forEach(pattern => {
      processed = processed.replace(pattern, '$1、');
    });
    
    // 文末の句点（より限定的に）
    const endPatterns = [
      // 敬語表現
      /\b(です|ます|でした|ました)\b(?![。、？！])/g,
      // 断定表現
      /\b(である|だった|だ)\b(?![。、？！])/g,
    ];
    
    endPatterns.forEach(pattern => {
      processed = processed.replace(pattern, '$1。');
    });
    
    // 重複した句読点を除去
    processed = processed.replace(/[、]{2,}/g, '、');
    processed = processed.replace(/[。]{2,}/g, '。');
    
    // 句読点の後の不要なスペースを除去
    processed = processed.replace(/([。、])\s+/g, '$1');
    
    return processed;
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Apple-style ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-semibold tracking-tight text-white hover:text-white/90 transition-colors duration-300">
              Qonect
            </Link>
            
            <div className="flex items-center gap-6">
              {/* 進捗表示 */}
              <div className="flex items-center gap-4 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(sessionTime)}
                </div>
                <div className="text-white/40">|</div>
                <div>
                  回答数: {messages.filter(m => m.role === 'student').length}
                </div>
              </div>
              
              <motion.button
                onClick={endSession}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 border border-white/20 text-white text-sm font-medium rounded-full hover:bg-white/5 hover:border-white/30 transition-all duration-300 backdrop-blur-xl"
              >
                面接終了
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* チャットコンテンツ */}
      <div className="pt-24 pb-6 px-6 min-h-screen flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          {/* メッセージエリア */}
          <div className="flex-1 overflow-y-auto py-8 space-y-8">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  className={cn(
                    "flex gap-6",
                    message.role === 'student' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* アバター */}
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border",
                    message.role === 'interviewer' 
                      ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/30" 
                      : "bg-gradient-to-br from-white/10 to-white/5 border-white/20"
                  )}>
                    {message.role === 'interviewer' ? (
                      <Bot className="w-6 h-6 text-blue-400" />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  
                  <div className={cn(
                    "max-w-[75%] space-y-3",
                    message.role === 'student' ? "items-end" : "items-start"
                  )}>
                    {/* メッセージバブル */}
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "p-6 rounded-3xl backdrop-blur-xl border shadow-2xl",
                        message.role === 'interviewer' 
                          ? "bg-gradient-to-br from-white/10 to-white/5 border-white/20 text-white" 
                          : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/30 text-white"
                      )}
                    >
                      <p className="text-lg leading-relaxed font-light">
                        {message.content}
                      </p>
                    </motion.div>
                    
                    {/* フィードバック表示 */}
                    {message.role === 'student' && message.feedback && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-white/80 text-sm">評価:</span>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-2 h-2 rounded-full transition-all duration-300",
                                  i < message.feedback!.score 
                                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/30" 
                                    : "bg-white/20"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {message.feedback.suggestions.length > 0 && (
                          <p className="text-blue-300 text-sm font-medium leading-relaxed">
                            💡 {message.feedback.suggestions[0]}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* 思考中表示 */}
            {isThinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-6"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 backdrop-blur-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-400" />
                </div>
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 text-white/80">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-lg font-light">考えています...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <div className="mt-8 space-y-6">
            {/* 音声入力エリア */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="space-y-4">
                <label className="text-white/80 text-sm font-medium tracking-wide">あなたの回答</label>
                <textarea
                  value={currentInput + interimText}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="音声で話すか、ここに直接入力してください..."
                  className="w-full min-h-[120px] bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 resize-none transition-all duration-300 font-light text-lg leading-relaxed"
                  rows={4}
                />
                
                {/* デバッグ情報（開発中のみ表示） */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-white/40 bg-black/20 rounded-lg p-2 font-mono">
                    入力: "{currentInput}" | 中間: "{interimText}" | 認識中: {isListening ? 'ON' : 'OFF'}
                  </div>
                )}
              </div>
            </div>
            
            {/* コントロールボタン */}
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                {/* 音声認識ボタン */}
                <motion.button
                  onClick={isListening ? stopListening : startListening}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isThinking}
                  className={cn(
                    "w-14 h-14 rounded-full backdrop-blur-xl border transition-all duration-300 flex items-center justify-center shadow-lg",
                    isListening 
                      ? "bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-400/30 text-red-400" 
                      : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30",
                    isThinking && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </motion.button>
                
                {/* 履歴表示ボタン */}
                <motion.button
                  onClick={() => setShowTranscriptEditor(!showTranscriptEditor)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 text-white/70 text-sm font-medium rounded-full hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                >
                  {showTranscriptEditor ? '履歴を隠す' : '修正履歴'}
                </motion.button>
              </div>
              
              {/* 送信ボタン */}
              <motion.button
                onClick={sendMessage}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                disabled={!currentInput.trim() || isThinking}
                className={cn(
                  "px-8 py-3 bg-white text-black text-lg font-semibold rounded-full transition-all duration-300 shadow-2xl hover:shadow-white/30 border border-white/20 flex items-center gap-3",
                  (!currentInput.trim() || isThinking) && "opacity-50 cursor-not-allowed hover:scale-100 hover:y-0"
                )}
              >
                <Send className="w-5 h-5" />
                送信
              </motion.button>
            </div>
            
            {/* 修正履歴（折りたたみ式） */}
            <AnimatePresence>
              {showTranscriptEditor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl"
                >
                  <CorrectionHistory 
                    corrections={correctionHistory} 
                    className="max-h-48 overflow-y-auto text-white/80"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ゲーミフィケーションアニメーション */}
      <AnimatePresence>
        {showXPGain && (
          <XPGainAnimation
            amount={showXPGain.amount}
            reason={showXPGain.reason}
            onComplete={() => setShowXPGain(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLevelUp && (
          <LevelUpAnimation
            newLevel={showLevelUp}
            onComplete={() => setShowLevelUp(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBadgeEarned && (
          <BadgeEarnedAnimation
            badge={showBadgeEarned}
            onComplete={() => setShowBadgeEarned(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}