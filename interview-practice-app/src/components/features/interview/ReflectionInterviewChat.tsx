'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Clock,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { MascotCharacter } from '@/components/ui/MascotCharacter';
import { InterviewStage } from '@/lib/interview/deep-dive-engine';
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
  inquiryLearning: string; // 探究学習の実績・経験（300字程度）
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
  const [shouldStartListening, setShouldStartListening] = useState(true); // 音声入力をデフォルトに
  const [isThinking, setIsThinking] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [displayedContent, setDisplayedContent] = useState<Map<string, string>>(new Map());
  const [currentInput, setCurrentInput] = useState('');
  const [interimText, setInterimText] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const [timeWarningShown, setTimeWarningShown] = useState(false);
  const INTERVIEW_DURATION = 15 * 60; // 15分間（秒）
  const [recognition, setRecognition] = useState<any>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // 段階的深掘り面接状態
  const [currentStage, setCurrentStage] = useState<InterviewStage>('opening');
  const [interviewDepth, setInterviewDepth] = useState<number>(1);
  const [patternType, setPatternType] = useState<string>('artistic_collaborative');
  const [preparationTimeRemaining, setPreparationTimeRemaining] = useState<number>(0);
  const [stageProgress, setStageProgress] = useState({
    opening: { completed: false, questionsAsked: 0 },
    exploration: { completed: false, questionsAsked: 0 },
    metacognition: { completed: false, questionsAsked: 0 },
    future: { completed: false, questionsAsked: 0 }
  });

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
  
  // エラー状態管理
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [showTranscriptEditor, setShowTranscriptEditor] = useState(false);
  const [showHints, setShowHints] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const finalTranscriptRef = useRef<string>(''); // 確定テキストを保持
  const timerRef = useRef<NodeJS.Timeout>();

  // 音声認識の初期化（メモリリーク対策）
  useEffect(() => {
    console.log('音声認識初期化開始');
    let recognitionInstance: any = null;
    
    if (typeof window !== 'undefined') {
      console.log('window.webkitSpeechRecognition:', 'webkitSpeechRecognition' in window);
      console.log('window.SpeechRecognition:', 'SpeechRecognition' in window);
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        console.log('SpeechRecognition constructor:', SpeechRecognition);
        recognitionInstance = new SpeechRecognition();
        console.log('認識インスタンス作成成功');
      
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
        console.log('🎤 onstart イベント発火確認');
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
        console.error('🚨 音声認識エラー:', event.error);
        console.error('🚨 エラーイベント全体:', event);
        
        // エラータイプに応じた処理
        if (event.error === 'no-speech') {
          // 音声が検出されない場合は継続
          console.log('🔇 音声が検出されません。待機中...');
        } else if (event.error === 'audio-capture') {
          // マイクアクセスエラー
          console.error('🎤 マイクアクセスエラー');
          setError('マイクにアクセスできません。マイクの権限を確認してください。');
          setIsListening(false);
        } else if (event.error === 'not-allowed') {
          // 権限がない
          console.error('🚫 マイク権限エラー');
          setError('音声認識の権限が必要です。ブラウザの設定を確認してください。');
          setIsListening(false);
        } else if (event.error === 'network') {
          // ネットワークエラー
          console.error('🌐 ネットワークエラー');
          setError('ネットワーク接続を確認してください。');
          setIsListening(false);
        } else if (event.error === 'aborted') {
          // 中断された
          console.log('⏹️ 音声認識が中断されました');
        } else {
          // その他のエラー
          console.warn('⚠️ その他の音声認識エラー:', event.error);
          setError(`音声認識エラー: ${event.error}`);
          setIsListening(false);
        }
        
        setInterimText('');
      };
      
      recognitionInstance.onend = () => {
        console.log('音声認識終了');
        setInterimText(''); // 音声認識終了時に中間テキストをクリア
        // baseTextは音声認識再開時に最新の値を取得するため、ここではリセットしない
        lastTranscriptLength = 0;
        
        // 音声認識が予期せず終了した場合の自動再開（リスニング中のみ）
        if (isListening) {
          setTimeout(() => {
            try {
              recognitionInstance.start();
              console.log('音声認識を自動再開しました');
            } catch (error) {
              console.error('音声認識の再開に失敗:', error);
              setIsListening(false);
            }
          }, 300);
        }
      };
      
      setRecognition(recognitionInstance);
      } else {
        console.error('音声認識APIがブラウザでサポートされていません');
        setError('お使いのブラウザは音声認識に対応していません。Chrome、Edge、Safariなどをお使いください。');
      }
    } else {
      console.error('windowオブジェクトが利用できません');
    }
    
    // クリーンアップでメモリリーク防止
    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
          recognitionInstance.onstart = null;
          recognitionInstance.onresult = null;
          recognitionInstance.onerror = null;
          recognitionInstance.onend = null;
        } catch (error) {
          console.warn('音声認識のクリーンアップでエラー:', error);
        }
      }
    };
  }, []); // 依存配列を空にして、初回のみ実行

  // セッション開始（一度だけ実行）
  useEffect(() => {
    let mounted = true;
    
    if (!isSessionActive && mounted) {
      startSession();
    }
    
    return () => {
      mounted = false;
    };
  }, []); // 依存配列を空にして一度だけ実行

  // 音声入力をデフォルトで開始
  useEffect(() => {
    if (isSessionActive && recognition && !isListening) {
      // マイクの権限を確認してから開始
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          console.log('🎤 マイクアクセス許可取得成功');
          // ストリームを停止（権限確認のみ）
          stream.getTracks().forEach(track => track.stop());
          
          // セッション開始後、少し遅延を入れて音声認識を自動開始
          const timer = setTimeout(() => {
            console.log('音声入力をデフォルトで開始します');
            startListening();
          }, 1000);
          
          return () => clearTimeout(timer);
        })
        .catch((error) => {
          console.error('🚫 マイクアクセス拒否:', error);
          setError('マイクへのアクセスが拒否されました。ブラウザの設定でマイクの使用を許可してください。');
        });
    }
  }, [isSessionActive, recognition]); // セッションとrecognitionの準備ができたら実行

  // タイマー（15分間管理）
  useEffect(() => {
    if (isSessionActive) {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          
          // 12分経過で終了準備警告
          if (newTime >= 12 * 60 && !timeWarningShown) {
            setTimeWarningShown(true);
            // 警告メッセージを追加
            const warningMessage: Message = {
              id: `warning-${Date.now()}`,
              role: 'interviewer',
              content: `面接時間が残り3分となりました。これまでのお話、とても興味深く聞かせていただいています。最後に1つ、大切な質問をさせていただきますね。`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, warningMessage]);
          }
          
          // 15分経過で自動終了
          if (newTime >= INTERVIEW_DURATION) {
            setTimeout(() => endSession(), 1000);
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [isSessionActive, timeWarningShown]);

  // メッセージ自動スクロール（最適化・メモリリーク対策）
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  useEffect(() => {
    // デバウンスでスクロール処理を最適化
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages.length, scrollToBottom]);

  const startSession = async () => {
    setIsSessionActive(true);
    setIsThinking(false); // 最初の質問は固定なので思考不要
    setSessionStartXP(userProgress.totalXP);
    
    // 探究活動からパターンを決定
    const selectedPattern = determineInterviewPattern(essayContent.inquiryLearning);
    setPatternType(selectedPattern);
    console.log(`📋 面接パターン決定: ${selectedPattern} (探究活動: ${essayContent.inquiryLearning.substring(0, 50)}...)`);
    
    // 段階と深度を初期化
    setCurrentStage('opening');
    setInterviewDepth(1);
    
    // 実際の面接フローに基づいた開始
    const initialQuestion = await generateInitialQuestion();
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'interviewer',
      content: initialQuestion,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    
    // 初期メッセージのタイプライター効果
    setTimeout(() => {
      typewriterEffect(welcomeMessage.id, initialQuestion, 60);
    }, 500);
  };

  const generateInitialQuestion = async (): Promise<string> => {
    // 実際の面接フローに基づいた開始
    const greeting = "それでは面接を始めます。受検番号と名前を教えてください。";
    return greeting;
  };

  const generateNextQuestion = async (conversationHistory: Message[]): Promise<string> => {
    try {
      // 段階的深掘りエンジンを使って質問を生成
      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayContent,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          questionType: conversationHistory.length === 0 ? 'opening' : 'follow_up',
          currentStage,
          interviewDepth
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '質問生成に失敗しました');
      }

      const data = await response.json();
      
      // 段階移行の処理
      if (data.stageTransition) {
        setCurrentStage(data.stageTransition.to);
        setInterviewDepth(data.stageTransition.depth);
        
        // 進捗状況を更新
        setStageProgress(prev => ({
          ...prev,
          [data.stageTransition.from as InterviewStage]: { 
            completed: true, 
            questionsAsked: prev[data.stageTransition.from as InterviewStage].questionsAsked 
          }
        }));
      } else {
        // 同じ段階内での深度増加
        setInterviewDepth(prev => prev + 1);
        setStageProgress(prev => ({
          ...prev,
          [currentStage]: { ...prev[currentStage], questionsAsked: prev[currentStage].questionsAsked + 1 }
        }));
      }

      // 準備時間の設定
      if (data.preparationTime && data.preparationTime > 0) {
        setPreparationTimeRemaining(data.preparationTime);
        // 準備時間のカウントダウンを開始
        startPreparationTimer(data.preparationTime);
      }

      return data.question;
    } catch (error) {
      console.error('AI質問生成エラー:', error);
      
      // AIが利用できない場合は明確にエラーを表示
      setError('AI機能が利用できません。管理者にお問い合わせください。');
      throw error;
    }
  };

  // パターン決定ヘルパー関数
  const determineInterviewPattern = (inquiryActivity: string): string => {
    // 協働・芸術系のキーワード
    const collaborativeArtistic = /ダンス|演劇|音楽|バンド|合唱|吹奏楽|チーム|グループ|部活|サークル|みんな|仲間|協力|発表/.test(inquiryActivity);
    
    // 科学・個人研究系のキーワード
    const scientificIndividual = /生き物|植物|動物|飼育|栽培|実験|観察|研究|調査|一人|個人|自分で|コレクション|標本/.test(inquiryActivity);
    
    if (collaborativeArtistic) {
      console.log('🎭 Hさんパターン（芸術・協働系）を選択');
      return 'artistic_collaborative';
    } else if (scientificIndividual) {
      console.log('🔬 Tさんパターン（科学・個人研究系）を選択');
      return 'scientific_individual';
    } else {
      console.log('🎭 デフォルトでHさんパターンを選択');
      return 'artistic_collaborative'; // デフォルト
    }
  };

  // 段階ラベル用ヘルパー関数
  const getStageLabel = (stage: InterviewStage): string => {
    const labels = {
      opening: '冒頭確認',
      exploration: '探究深掘り',
      metacognition: 'メタ認知',
      future: '将来連結'
    };
    return labels[stage];
  };

  const getCurrentStageLabel = (stage: InterviewStage): string => {
    const labels = {
      opening: '冒頭確認フェーズ',
      exploration: '探究活動深掘りフェーズ',
      metacognition: 'メタ認知・関連性発見フェーズ',
      future: '将来への連結フェーズ'
    };
    return labels[stage];
  };

  // 準備時間タイマー（メモリリーク対策）
  const preparationTimerRef = useRef<NodeJS.Timeout>();
  
  const startPreparationTimer = (seconds: number) => {
    // 既存のタイマーをクリア
    if (preparationTimerRef.current) {
      clearInterval(preparationTimerRef.current);
    }
    
    preparationTimerRef.current = setInterval(() => {
      setPreparationTimeRemaining(prev => {
        if (prev <= 1) {
          if (preparationTimerRef.current) {
            clearInterval(preparationTimerRef.current);
            preparationTimerRef.current = undefined;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (preparationTimerRef.current) {
        clearInterval(preparationTimerRef.current);
      }
    };
  }, []);

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
      
      // エラーの詳細な分析とメッセージ設定
      let errorMessage = 'AI評価システムで問題が発生しました。';
      if (error instanceof Error) {
        if (error.message.includes('503')) {
          errorMessage = 'AI評価サービスが一時的に利用できません。';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'AI評価の処理時間が長すぎます。';
        } else if (error.message.includes('network')) {
          errorMessage = 'ネットワーク接続を確認してください。';
        } else if (error.message.includes('API')) {
          errorMessage = 'AI機能が利用できません。管理者にお問い合わせください。';
        }
      }
      
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
      
      // フォールバック評価を提供
      return {
        score: 3,
        points: ['ご回答いただき、ありがとうございます'],
        suggestions: ['現在、詳細な評価システムで問題が発生しております。面接は継続いたします。']
      };
    }
  };

  const startListening = () => {
    console.log('startListening called - recognition:', recognition, 'isListening:', isListening);
    
    if (!recognition) {
      console.error('音声認識が初期化されていません');
      setError('音声認識が利用できません。ブラウザの対応状況を確認してください。');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    if (recognition && !isListening) {
      console.log('音声認識開始を試みます');
      setIsListening(true);
      setInterimText(''); // 開始時に中間テキストをクリア
      try {
        recognition.start();
        console.log('recognition.start() 成功');
      } catch (error: any) {
        console.error('音声認識開始エラー:', error);
        console.error('エラー詳細:', error.message, error.name);
        setError(`音声認識エラー: ${error.message || 'マイクの許可を確認してください。'}`);
        setIsListening(false);
        setTimeout(() => setError(null), 5000);
      }
    } else {
      console.log('音声認識はすでに開始されています');
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

  // ハプティックフィードバック
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // 軽い振動
    }
  };

  // タイプライター効果
  const typewriterEffect = (messageId: string, fullContent: string, speed: number = 50) => {
    setTypingMessageId(messageId);
    setDisplayedContent(prev => new Map(prev.set(messageId, '')));
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullContent.length) {
        setDisplayedContent(prev => new Map(prev.set(messageId, fullContent.slice(0, currentIndex))));
        currentIndex++;
      } else {
        clearInterval(interval);
        setDisplayedContent(prev => new Map(prev.set(messageId, fullContent)));
        
        // 1.5秒間オーバーレイを保持してから消去
        setTimeout(() => {
          setTypingMessageId(null);
          
          // さらに少し遅延してから音声認識を確実にクリーンな状態で再開
          setTimeout(() => {
            if (recognition && !isThinking) {
              console.log('💬 オーバーレイ消去後 - 音声認識を確実に再開');
              // 現在の状態に関係なく、音声認識を確実に開始
              try {
                if (isListening) {
                  recognition.stop();
                }
                setTimeout(() => {
                  startListening();
                }, 200);
              } catch (error) {
                console.error('オーバーレイ後の音声認識再開エラー:', error);
                startListening(); // エラーでも再開を試す
              }
            }
          }, 300);
        }, 1500);
      }
    }, speed);
    
    return interval;
  };
  
  // 送信処理中の状態
  const [isSending, setIsSending] = useState(false);
  
  const sendMessage = async () => {
    if (!currentInput.trim() || isThinking || isSending) return;
    
    setIsSending(true);
    triggerHapticFeedback();
    
    const studentMessage: Message = {
      id: Date.now().toString(),
      role: 'student',
      content: currentInput.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, studentMessage]);
    
    // 音声認識が動作中であれば停止（ベーステキストをリセットするため）
    if (isListening && recognition) {
      setIsListening(false);
      try {
        recognition.stop();
      } catch (error) {
        console.error('音声認識停止エラー:', error);
      }
    }
    
    // 入力欄と中間テキストをクリア
    setCurrentInput('');
    setInterimText('');
    finalTranscriptRef.current = ''; // 確定テキストもクリア
    setIsSending(false);
    
    // 音声認識を常にクリーンな状態で再起動（デフォルト音声入力）
    if (recognition) {
      console.log('📝 メッセージ送信後、音声認識をクリーンな状態で再起動');
      try {
        if (isListening) {
          recognition.stop();
        }
        // 少し遅延してからクリーンな状態で再開
        setTimeout(() => {
          if (recognition && !isThinking) {
            console.log('🔄 クリーンな状態で音声認識を再開');
            setIsListening(false); // 一度停止状態にしてから
            setTimeout(() => {
              startListening();
            }, 100);
          }
        }, 200);
      } catch (error) {
        console.error('音声認識のクリーンな再起動でエラー:', error);
      }
    }
    
    setIsThinking(true);
    
    // 回答を評価（一時的に無効化）
    const lastInterviewerMessage = messages.filter(m => m.role === 'interviewer').slice(-1)[0];
    // const feedback = await evaluateResponse(studentMessage.content, lastInterviewerMessage?.content || '');
    const feedback = {
      score: 4,
      points: ['ご回答いただき、ありがとうございます'],
      suggestions: []
    };
    
    // フィードバック付きで更新
    const studentMessageWithFeedback = { ...studentMessage, feedback };
    const updatedHistory = [...messages, studentMessageWithFeedback];
    
    // 探究学習面接の進行管理（時間ベース＋質問数）
    const studentAnswerCount = updatedHistory.filter(m => m.role === 'student').length;
    const remainingTime = INTERVIEW_DURATION - sessionTime;
    
    // 時間切れまたは十分な質問数に達した場合の終了判定
    if (remainingTime <= 60 || studentAnswerCount >= 10) {
      // 面接終了
      const closingMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'interviewer',
        content: `ありがとうございます。○○さんの探究学習への取り組みと、明和中学校への熱意がとてもよく伝わりました。\n\n特に、探究学習での${studentAnswerCount >= 6 ? '困難を乗り越える姿勢' : '学びに対する真剣さ'}が印象的でした。面接はこれで終了とさせていただきます。\n\nお疲れさまでした。`,
        timestamp: new Date()
      };
      
      setMessages([...updatedHistory, closingMessage]);
      setIsThinking(false);
      
      // タイプライター効果を開始
      setTimeout(() => {
        typewriterEffect(closingMessage.id, closingMessage.content, 50);
      }, 100);
      
      // 6秒後に自動終了（タイプライター効果完了を待つ）
      setTimeout(() => {
        endSession();
      }, 6000);
      
    } else if (remainingTime <= 180 || studentAnswerCount >= 7) {
      // 終了準備質問（残り3分または7問目）
      const finalQuestions = [
        "最後にお聞きします。明和中学校で、これまでの探究学習の経験をどのように発展させていきたいですか？",
        "では最後に、探究学習を通して身につけた力を、明和中学校でどう活かしていきたいか教えてください。",
        "最後の質問です。明和中学校での3年間で、どのような探究活動に挑戦してみたいですか？"
      ];
      
      const nextQuestion = finalQuestions[Math.floor(Math.random() * finalQuestions.length)];
      
      const interviewerMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'interviewer',
        content: nextQuestion,
        timestamp: new Date()
      };
      
      setMessages([...updatedHistory, interviewerMessage]);
      setIsThinking(false);
      
      // タイプライター効果を開始
      setTimeout(() => {
        typewriterEffect(interviewerMessage.id, nextQuestion, 50);
      }, 100);
      
    } else {
      // 通常の質問継続
      let nextQuestion: string;
      
      // opening段階での強制的な順序制御
      if (currentStage === 'opening') {
        const studentAnswerCount = updatedHistory.filter(m => m.role === 'student').length;
        console.log(`🔍 Opening段階: 学生回答数=${studentAnswerCount}`);
        
        if (studentAnswerCount === 1) {
          // 受検番号・名前の次は必ず交通手段
          nextQuestion = 'ありがとうございます。こちらまでは何で来られましたか？';
          console.log('✅ 交通手段質問を設定');
        } else if (studentAnswerCount === 2) {
          // 交通手段の次は必ず所要時間
          nextQuestion = 'そうですか。どれくらい時間がかかりましたか？';
          console.log('✅ 所要時間質問を設定');
        } else if (studentAnswerCount >= 3) {
          // 3回目以降で探究活動へ、段階移行
          nextQuestion = 'それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。';
          setCurrentStage('exploration'); // 段階を移行
          console.log('✅ 探究活動質問を設定、exploration段階に移行');
        } else {
          // 0回の場合（開始時）
          nextQuestion = 'それでは面接を始めます。受検番号と名前を教えてください。';
          console.log('✅ 面接開始質問を設定');
        }
      } else {
        nextQuestion = await generateNextQuestion(updatedHistory);
      }
      
      const interviewerMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'interviewer',
        content: nextQuestion,
        timestamp: new Date()
      };
      
      setMessages([...updatedHistory, interviewerMessage]);
      setIsThinking(false);
      
      // タイプライター効果を開始
      setTimeout(() => {
        typewriterEffect(interviewerMessage.id, nextQuestion, 50);
      }, 100);
    }

    // XP獲得処理 - 無効化（会話の邪魔になるため）
    // await processXPGain(feedback.score, studentMessage.content);
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

  // 音声テキスト変更ハンドラー（メモ化）
  const handleTranscriptChange = useCallback((correctedText: string) => {
    setCurrentInput(correctedText);
  }, []);

  // 修正受諾ハンドラー（メモ化）
  const handleAcceptCorrection = useCallback((finalText: string, correction?: TranscriptCorrection) => {
    setCurrentInput(finalText);
    if (correction) {
      setCorrectionHistory(prev => [...prev, correction]);
    }
  }, []);

  const endSession = async () => {
    setIsSessionActive(false);
    
    // タイマーをクリア
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    
    // 音声認識を停止
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (error) {
        console.warn('音声認識停止エラー:', error);
      }
    }
    
    // 音声合成を停止
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    // 面接終了の挨拶を追加
    const closingMessage: Message = {
      id: `closing-${Date.now()}`,
      role: 'interviewer',
      content: `本日はお疲れさまでした。${messages.filter(m => m.role === 'student').length}つの質問にしっかりと答えていただき、ありがとうございます。\n\n○○さんの明和中学校への熱意と、これまでの体験から学ばれた姿勢がよく伝わってきました。面接練習の結果は、この後のサマリーでご確認いただけます。\n\n本日はありがとうございました。`,
      timestamp: new Date()
    };
    
    const finalMessages = [...messages, closingMessage];
    setMessages(finalMessages);
    
    // 少し待ってからセッション終了処理
    setTimeout(() => {
      onSessionEnd(finalMessages);
    }, 2000);
  };

  // 時間フォーマット関数（メモ化）
  const formatTime = useMemo(() => {
    return (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const remaining = INTERVIEW_DURATION - seconds;
      const remainingMins = Math.floor(remaining / 60);
      const remainingSecs = remaining % 60;
      
      if (remaining > 0) {
        return `残り ${remainingMins}:${remainingSecs.toString().padStart(2, '0')}`;
      } else {
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      }
    };
  }, []);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
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
                  約15分の面接
                </div>
                {sessionTime >= 12 * 60 && (
                  <div className="text-orange-400 font-medium animate-pulse">
                    ⚠️ 残り時間わずか
                  </div>
                )}
              </div>
              
              <motion.button
                onClick={endSession}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 border border-white/20 text-white text-sm font-medium rounded-full hover:bg-white/5 hover:border-white/30 transition-all duration-300 backdrop-blur-xl min-h-[44px] touch-manipulation"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                面接終了
              </motion.button>
            </div>
          </div>
          
          {/* 面接フロープログレスバー（モバイル最適化） */}
          <div className="mt-4 px-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 min-w-0">
                <div className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300 flex-shrink-0",
                  messages.length >= 1 ? "bg-green-400" : "bg-white/30"
                )} />
                <span className="text-xs text-white/60 truncate">受検番号</span>
              </div>
              <div className="flex-1 h-px bg-white/10 mx-2" />
              <div className="flex items-center gap-1 min-w-0">
                <div className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300 flex-shrink-0",
                  messages.length >= 3 ? "bg-green-400" : "bg-white/30"
                )} />
                <span className="text-xs text-white/60 truncate">交通手段</span>
              </div>
              <div className="flex-1 h-px bg-white/10 mx-2" />
              <div className="flex items-center gap-1 min-w-0">
                <div className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300 flex-shrink-0",
                  messages.length >= 5 ? "bg-blue-400 animate-pulse" : "bg-white/30"
                )} />
                <span className="text-xs text-white/60 truncate">探究活動</span>
              </div>
              <div className="flex-1 h-px bg-white/10 mx-2" />
              <div className="flex items-center gap-1 min-w-0">
                <div className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300 flex-shrink-0",
                  sessionTime >= 12 * 60 ? "bg-orange-400" : "bg-white/30"
                )} />
                <span className="text-xs text-white/60 truncate">終了準備</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* エラー表示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
          >
            <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/30 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">⚠</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">エラー</p>
                  <p className="text-white/90 text-xs mt-1 leading-relaxed">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-white/60 hover:text-white transition-colors p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* チャットコンテンツ */}
      <div className="pt-24 pb-6 px-4 sm:px-6 min-h-screen flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          {/* 段階的深掘り面接の進捗表示 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-indigo-400/20 rounded-2xl p-4 shadow-xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium text-sm">面接進捗 - {getCurrentStageLabel(currentStage)}</h3>
                <div className="text-white/60 text-xs">
                  深度 {interviewDepth} 層 | {patternType === 'artistic_collaborative' ? 'Hさんパターン' : 'Tさんパターン'}
                </div>
              </div>
              
              {/* 段階別進捗バー */}
              <div className="grid grid-cols-4 gap-2">
                {(['opening', 'exploration', 'metacognition', 'future'] as InterviewStage[]).map((stage, index) => (
                  <div key={stage} className="space-y-1">
                    <div className="text-xs text-white/70 text-center">
                      {getStageLabel(stage)}
                    </div>
                    <div className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      currentStage === stage ? "bg-blue-400 animate-pulse" :
                      stageProgress[stage].completed ? "bg-green-400" : "bg-white/20"
                    )} />
                    <div className="text-xs text-white/50 text-center">
                      {stageProgress[stage].questionsAsked}問
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 準備時間カウントダウン */}
              {preparationTimeRemaining > 0 && (
                <div className="flex items-center justify-center space-x-2 bg-yellow-500/20 rounded-lg p-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm font-medium">
                    準備時間: {preparationTimeRemaining}秒
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* 探究活動リマインダー（実際の面接を再現） */}
          {essayContent.inquiryLearning && messages.length >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-400/20 rounded-2xl p-4 shadow-xl"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Bot className="w-4 h-4" />
                  <span className="font-medium">あなたの探究活動内容（志願理由書より）</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  {essayContent.inquiryLearning}
                </p>
              </div>
            </motion.div>
          )}
          {/* タイピング中の中央表示 */}
          <AnimatePresence>
            {typingMessageId && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-2xl mx-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-lg font-medium text-white">面接官</div>
                  </div>
                  <p className="text-xl leading-relaxed text-white font-light">
                    {displayedContent.get(typingMessageId) || ''}
                    <span className="animate-pulse text-white/60">|</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                      <p className="text-lg leading-relaxed font-light whitespace-pre-wrap">
                        {message.role === 'interviewer' 
                          ? (displayedContent.get(message.id) ?? message.content)
                          : message.content
                        }
                        {/* タイピング中のカーソル */}
                        {typingMessageId === message.id && (
                          <span className="animate-pulse text-white/60">|</span>
                        )}
                      </p>
                      {/* 面接官の質問番号表示（実際の面接感を演出） */}
                      {message.role === 'interviewer' && messages.filter(m => m.role === 'interviewer').indexOf(message) > 0 && (
                        <div className="mt-2 text-xs text-white/40">
                          質問 {messages.filter(m => m.role === 'interviewer').indexOf(message)}
                        </div>
                      )}
                    </motion.div>
                    
                    {/* フィードバック表示 - 一時的に無効化
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
                    */}
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

          {/* 入力エリア（モバイル最適化） */}
          <div className="mt-4 sm:mt-8 space-y-4 sm:space-y-6">
            {/* 音声入力エリア（モバイル最適化） */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-white/80 text-sm font-medium tracking-wide">あなたの回答</label>
                  {isListening && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full"
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs text-red-400 font-medium">録音中</span>
                    </motion.div>
                  )}
                </div>
                <textarea
                  value={currentInput + interimText}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    // 中間テキスト部分を除いた実際の入力値を保存
                    const actualValue = newValue.substring(0, newValue.length - interimText.length);
                    setCurrentInput(actualValue);
                    finalTranscriptRef.current = actualValue; // 手動入力時も確定テキストを更新
                    
                    // 音声認識が実行中の場合、再起動して新しいbaseTextを設定
                    if (recognition && isListening) {
                      console.log('手動編集検出 - 音声認識を再起動');
                      recognition.stop();
                      setTimeout(() => {
                        if (isListening) {
                          recognition.start();
                        }
                      }, 100);
                    }
                  }}
                  disabled={typingMessageId !== null}
                  placeholder={
                    typingMessageId !== null 
                      ? "面接官が話しています..." 
                      : isListening 
                        ? "話してください..." 
                        : "音声で話すか、ここに直接入力してください..."
                  }
                  className={cn(
                    "w-full min-h-[140px] bg-black/20 backdrop-blur-xl border rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 resize-none transition-all duration-300 font-light text-lg leading-relaxed touch-manipulation",
                    typingMessageId !== null
                      ? "opacity-50 cursor-not-allowed border-white/10"
                      : isListening 
                        ? "border-red-400/40 focus:ring-red-400/50 focus:border-red-400/50" 
                        : "border-white/20 focus:ring-blue-400/50 focus:border-blue-400/50"
                  )}
                  rows={5}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    fontSize: '16px' // iOSズーム防止
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.shiftKey) {
                        // Shift+Enter は改行
                        return;
                      } else if (e.ctrlKey || e.metaKey) {
                        // Ctrl+Enter / Cmd+Enter も送信
                        e.preventDefault();
                        sendMessage();
                      } else {
                        // Enter のみは送信
                        e.preventDefault();
                        sendMessage();
                      }
                    }
                    // ESC キーでフォーカスを外す
                    if (e.key === 'Escape') {
                      e.currentTarget.blur();
                    }
                  }}
                />
                
                {/* ヒントテキスト */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40 flex items-center gap-2 text-center sm:text-left">
                    {isSending ? (
                      <>
                        <div className="w-2 h-2 border border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                        メッセージを送信中...
                      </>
                    ) : isListening ? (
                      <>
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                        録音中... 話し終わったらボタンをタップ
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">
                          <span className="opacity-60">Enter</span>で送信 / <span className="opacity-60">Shift+Enter</span>で改行
                        </span>
                        <span className="sm:hidden">
                          送信ボタンをタップして回答を送信
                        </span>
                      </>
                    )}
                  </p>
                  {/* 文字制限削除 */}
                </div>
              </div>
            </motion.div>
            
            {/* コントロールボタン（モバイル最適化・改善） */}
            <div className="space-y-4">
              {/* 送信ボタン（メインアクション） */}
              <div className="flex justify-center">
                <motion.button
                  onClick={sendMessage}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!currentInput.trim() || isThinking || isSending}
                  className={cn(
                    "w-full max-w-xs px-8 py-4 bg-white text-black text-lg font-semibold rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-white/30 border border-white/20 flex items-center gap-3 justify-center min-h-[56px] touch-manipulation",
                    (!currentInput.trim() || isThinking || isSending) && "opacity-50 cursor-not-allowed hover:scale-100 hover:y-0"
                  )}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  {isSending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>送信中...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>回答を送信</span>
                    </>
                  )}
                </motion.button>
              </div>
              
              {/* サブアクションボタン */}
              <div className="flex justify-center gap-4">
                {/* 音声認識ボタン（モバイル最適化・拡大） */}
                <motion.button
                  onClick={isListening ? stopListening : startListening}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isThinking}
                  className={cn(
                    "min-w-[72px] min-h-[72px] w-20 h-20 rounded-full backdrop-blur-xl border-2 transition-all duration-300 flex items-center justify-center shadow-2xl touch-manipulation relative",
                    isListening 
                      ? "bg-gradient-to-br from-red-500/30 to-red-600/30 border-red-400/50 text-red-400 animate-pulse" 
                      : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30",
                    isThinking && "opacity-50 cursor-not-allowed"
                  )}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-8 h-8" />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-red-400/30"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </>
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </motion.button>
                
                {/* 音声読み上げボタン（モバイル最適化） */}
                <motion.button
                  onClick={() => {
                    const lastInterviewerMessage = messages.filter(m => m.role === 'interviewer').slice(-1)[0];
                    if (lastInterviewerMessage && 'speechSynthesis' in window) {
                      const utterance = new SpeechSynthesisUtterance(lastInterviewerMessage.content);
                      utterance.lang = 'ja-JP';
                      utterance.rate = 0.9;
                      speechSynthesis.speak(utterance);
                      triggerHapticFeedback();
                    }
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="min-w-[56px] min-h-[56px] w-14 h-14 rounded-full bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 text-white/70 hover:border-white/30 transition-all duration-300 flex items-center justify-center shadow-lg touch-manipulation"
                  title="質問を読み上げる"
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <Volume2 className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
            
            {/* ヒント */}
            <AnimatePresence>
              {showHints && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-400/20 rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-white/80 text-sm font-medium">面接のコツ</p>
                        <button
                          onClick={() => setShowHints(false)}
                          className="text-white/40 hover:text-white/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation'
                          }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <ul className="text-white/60 text-xs space-y-1 list-disc list-inside">
                        <li>相手の目を見て、はっきりと話しましょう</li>
                        <li>結論を先に述べてから、理由を説明しましょう</li>
                        <li>具体的な経験やエピソードを交えて話しましょう</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ゲーミフィケーションアニメーション - 無効化
      <AnimatePresence>
        {showXPGain && (
          <XPGainAnimation
            amount={showXPGain.amount}
            reason={showXPGain.reason}
            onComplete={() => setShowXPGain(null)}
          />
        )}
      </AnimatePresence>
      */}

      {/* レベルアップアニメーション - 無効化
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
      */}
    </div>
  );
}