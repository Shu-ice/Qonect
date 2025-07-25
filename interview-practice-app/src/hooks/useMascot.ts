'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { MascotType, EmotionType, AnimationType } from '@/components/ui/MascotCharacter';

interface MascotState {
  type: MascotType;
  emotion: EmotionType;
  animation: AnimationType;
  speaking: boolean;
  message: string | null;
}

interface MascotActions {
  setEmotion: (emotion: EmotionType) => void;
  setAnimation: (animation: AnimationType) => void;
  speak: (message: string, duration?: number) => void;
  stopSpeaking: () => void;
  react: (situation: 'success' | 'error' | 'encouragement' | 'thinking' | 'celebration') => void;
  changeMascot: (type: MascotType) => Promise<void>;
}

export type UseMascotReturn = MascotState & MascotActions;

/**
 * マスコットキャラクターの状態と動作を管理するカスタムフック
 */
export function useMascot(initialType: MascotType = 'friendly-bear'): UseMascotReturn {
  const { data: session, update } = useSession();
  
  const [state, setState] = useState<MascotState>({
    type: session?.user?.preferredMascot as MascotType || initialType,
    emotion: 'neutral',
    animation: 'idle',
    speaking: false,
    message: null,
  });

  // セッションからマスコットタイプを同期
  useEffect(() => {
    if (session?.user?.preferredMascot) {
      setState(prev => ({ 
        ...prev, 
        type: session.user.preferredMascot as MascotType 
      }));
    }
  }, [session?.user?.preferredMascot]);

  // 感情を設定
  const setEmotion = useCallback((emotion: EmotionType) => {
    setState(prev => ({ ...prev, emotion }));
  }, []);

  // アニメーションを設定
  const setAnimation = useCallback((animation: AnimationType) => {
    setState(prev => ({ ...prev, animation }));
  }, []);

  // マスコットに話をさせる
  const speak = useCallback((message: string, duration: number = 3000) => {
    setState(prev => ({
      ...prev,
      speaking: true,
      message,
      animation: 'talking',
      emotion: 'happy'
    }));

    // 指定時間後に話すのを停止
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        speaking: false,
        message: null,
        animation: 'idle',
        emotion: 'neutral'
      }));
    }, duration);
  }, []);

  // 話すのを停止
  const stopSpeaking = useCallback(() => {
    setState(prev => ({
      ...prev,
      speaking: false,
      message: null,
      animation: 'idle',
      emotion: 'neutral'
    }));
  }, []);

  // 状況に応じた反応
  const react = useCallback((situation: 'success' | 'error' | 'encouragement' | 'thinking' | 'celebration') => {
    const reactions = {
      success: {
        emotion: 'proud' as EmotionType,
        animation: 'nodding' as AnimationType,
        messages: [
          'よくできました！',
          'すばらしいですね！',
          'その調子です！',
          'とても上手でした！'
        ]
      },
      error: {
        emotion: 'concerned' as EmotionType,
        animation: 'thinking' as AnimationType,
        messages: [
          'だいじょうぶ、もう一度やってみましょう',
          '落ち着いて、ゆっくりで大丈夫ですよ',
          'みんな最初は失敗するものです',
          '一緒に頑張りましょう！'
        ]
      },
      encouragement: {
        emotion: 'encouraging' as EmotionType,
        animation: 'waving' as AnimationType,
        messages: [
          'きみならできます！',
          '自信を持って！',
          '頑張って！応援しています',
          'あと少しです、ファイト！'
        ]
      },
      thinking: {
        emotion: 'thinking' as EmotionType,
        animation: 'thinking' as AnimationType,
        messages: [
          'うーん、考えてみましょう...',
          'そうですね...',
          'いい質問ですね！',
          'ちょっと待ってくださいね'
        ]
      },
      celebration: {
        emotion: 'celebrating' as EmotionType,
        animation: 'jumping' as AnimationType,
        messages: [
          '🎉 おめでとうございます！',
          'やったね！すごいです！',
          '最高の出来でした！',
          'みんなで一緒にお祝いしましょう！'
        ]
      }
    };

    const reaction = reactions[situation];
    const randomMessage = reaction.messages[Math.floor(Math.random() * reaction.messages.length)];

    setState(prev => ({
      ...prev,
      emotion: reaction.emotion,
      animation: reaction.animation,
      speaking: true,
      message: randomMessage
    }));

    // 3秒後に通常状態に戻る
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        speaking: false,
        message: null,
        animation: 'idle',
        emotion: 'neutral'
      }));
    }, 3000);
  }, []);

  // マスコットタイプを変更
  const changeMascot = useCallback(async (type: MascotType) => {
    try {
      setState(prev => ({ ...prev, type }));
      
      // セッションを更新
      if (session) {
        await update({
          ...session,
          user: {
            ...session.user,
            preferredMascot: type
          }
        });
      }

      // データベースを更新（APIエンドポイント経由）
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferredMascot: type }),
      });

      if (!response.ok) {
        console.error('Failed to update mascot preference');
        // エラーの場合は元に戻す
        setState(prev => ({ 
          ...prev, 
          type: session?.user?.preferredMascot as MascotType || initialType 
        }));
      }
    } catch (error) {
      console.error('Error changing mascot:', error);
      // エラーの場合は元に戻す
      setState(prev => ({ 
        ...prev, 
        type: session?.user?.preferredMascot as MascotType || initialType 
      }));
    }
  }, [session, update, initialType]);

  return {
    // State
    type: state.type,
    emotion: state.emotion,
    animation: state.animation,
    speaking: state.speaking,
    message: state.message,
    
    // Actions
    setEmotion,
    setAnimation,
    speak,
    stopSpeaking,
    react,
    changeMascot,
  };
}

/**
 * マスコット関連のユーティリティ関数
 */
export const MascotUtils = {
  /**
   * 状況に応じたマスコットのメッセージを生成
   */
  generateContextualMessage: (
    context: 'interview-start' | 'interview-end' | 'good-answer' | 'needs-improvement' | 'encouragement',
    studentName?: string
  ): string => {
    const messages = {
      'interview-start': [
        `${studentName ? studentName + 'さん、' : ''}面接練習を始めましょう！`,
        'リラックスして、自分らしく答えてくださいね',
        '緊張しなくて大丈夫。一緒に頑張りましょう！',
        '今日も素敵な笑顔で練習しましょう'
      ],
      'interview-end': [
        'お疲れさまでした！とてもよく頑張りましたね',
        '今日の練習、素晴らしかったです！',
        'だんだん上手になっていますね',
        '毎回の練習が成長につながっています'
      ],
      'good-answer': [
        'とても良い答えでした！',
        '具体的で分かりやすい説明でしたね',
        'その調子で続けてください！',
        '自信を持って話せていました'
      ],
      'needs-improvement': [
        'もう少し詳しく教えてもらえますか？',
        '具体的な例があると、より良くなりますよ',
        '落ち着いて、ゆっくり話してみましょう',
        '大丈夫、練習すれば必ず上手になります'
      ],
      'encouragement': [
        'きみならきっとできます！',
        '練習の成果が出てきていますね',
        '自分を信じて頑張って！',
        '応援していますよ！'
      ]
    };

    const contextMessages = messages[context];
    return contextMessages[Math.floor(Math.random() * contextMessages.length)];
  },

  /**
   * スコアに基づいてマスコットの反応を決定
   */
  getReactionFromScore: (score: number): 'success' | 'encouragement' | 'celebration' => {
    if (score >= 4.5) return 'celebration';
    if (score >= 3.5) return 'success';
    return 'encouragement';
  },

  /**
   * 時間帯に応じた挨拶メッセージ
   */
  getTimeBasedGreeting: (studentName?: string): string => {
    const hour = new Date().getHours();
    const name = studentName ? `${studentName}さん` : 'みなさん';
    
    if (hour < 10) {
      return `おはようございます、${name}！今日も元気に練習しましょう`;
    } else if (hour < 17) {
      return `こんにちは、${name}！面接練習を始めましょうか`;
    } else {
      return `こんばんは、${name}！お疲れさまです。今日の練習はいかがでしたか？`;
    }
  },

  /**
   * マスコットタイプに応じた性格的なメッセージ
   */
  getPersonalityBasedMessage: (
    type: MascotType,
    situation: 'praise' | 'comfort' | 'motivate'
  ): string => {
    const personalityMessages = {
      'friendly-bear': {
        praise: 'よくできました！とても上手でしたよ',
        comfort: 'だいじょうぶ、きみならできるよ。一緒に頑張ろう！',
        motivate: '自分を信じて！きみの力を僕は知っているよ'
      },
      'wise-owl': {
        praise: '論理的で素晴らしい回答でした',
        comfort: '失敗は学びの機会です。次はもっと良くなりますよ',
        motivate: 'よく考えて、自分の言葉で表現してみましょう'
      },
      'cheerful-cat': {
        praise: 'にゃんと素晴らしい！とっても上手でした♪',
        comfort: '大丈夫にゃ〜！楽しく練習していこうね',
        motivate: '元気いっぱいで頑張ろうね〜！'
      },
      'brave-lion': {
        praise: '堂々として立派でした！',
        comfort: '勇気を出して！失敗を恐れる必要はありません',
        motivate: '自信を持って！きみには素晴らしい力があります'
      },
      'gentle-rabbit': {
        praise: 'とても心のこもった素敵な答えでした',
        comfort: 'ゆっくりでいいから、自分のペースで進みましょうね',
        motivate: '優しい気持ちが伝わってきます。そのままで大丈夫ですよ'
      },
      'smart-fox': {
        praise: '戦略的で賢い回答でした',
        comfort: '分析して改善していけば、必ず上達します',
        motivate: 'よく考えましたね！その調子で続けていきましょう'
      }
    };

    return personalityMessages[type][situation];
  },

  /**
   * 季節やイベントに応じた特別メッセージ
   */
  getSeasonalMessage: (): string | null => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // 入試シーズン（1-2月）
    if (month === 1 || month === 2) {
      return '入試本番が近づいていますね。今までの練習の成果を信じて頑張って！';
    }
    
    // 新学期（4月）
    if (month === 4 && day <= 15) {
      return '新学期ですね！新しい目標に向かって一緒に頑張りましょう';
    }
    
    // 夏休み（7-8月）
    if (month === 7 || month === 8) {
      return '夏休みは練習のチャンス！毎日少しずつでも続けることが大切ですよ';
    }
    
    // 年末年始
    if (month === 12 && day >= 25) {
      return '今年もよく頑張りました！来年も一緒に頑張りましょうね';
    }
    
    return null;
  }
};