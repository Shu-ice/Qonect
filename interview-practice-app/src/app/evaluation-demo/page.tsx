'use client';

import React from 'react';
import { OptimizedEvaluationScreen } from '@/components/features/interview/evaluation/OptimizedEvaluationScreen';
import { useRouter } from 'next/navigation';

// デモ用のメッセージデータ
const demoMessages = [
  {
    id: 'demo-1',
    role: 'interviewer' as const,
    content: 'それでは面接を始めます。受検番号と名前を教えてください。',
    timestamp: new Date(Date.now() - 600000)
  },
  {
    id: 'demo-2',
    role: 'student' as const,
    content: '受検番号123番、山田太郎です。よろしくお願いします。',
    timestamp: new Date(Date.now() - 540000)
  },
  {
    id: 'demo-3',
    role: 'interviewer' as const,
    content: 'ありがとうございます。今日はどうやって来ましたか？',
    timestamp: new Date(Date.now() - 480000)
  },
  {
    id: 'demo-4',
    role: 'student' as const,
    content: '電車で来ました。家から30分くらいかかりました。',
    timestamp: new Date(Date.now() - 420000)
  },
  {
    id: 'demo-5',
    role: 'interviewer' as const,
    content: 'そうですか。では、あなたが取り組んできた探究活動について1分程度で説明してください。',
    timestamp: new Date(Date.now() - 360000)
  },
  {
    id: 'demo-6',
    role: 'student' as const,
    content: '私は小学4年生から環境問題について探究してきました。特に学校の環境委員会で校内緑化活動に取り組み、植物の育成過程を観察記録しています。メダカの水槽管理では水質と生態の関係性について探究し、pH値の変化が及ぼす影響を継続的に調べています。この活動を通じて、自然環境の大切さと、小さな変化が生態系全体に与える影響について深く学ぶことができました。',
    timestamp: new Date(Date.now() - 300000)
  },
  {
    id: 'demo-7',
    role: 'interviewer' as const,
    content: '環境問題への取り組み、素晴らしいですね。メダカの水槽管理で一番苦労したことは何ですか？',
    timestamp: new Date(Date.now() - 240000)
  },
  {
    id: 'demo-8',
    role: 'student' as const,
    content: '水温管理が一番大変でした。夏場は水温が上がりすぎないように、冬場は下がりすぎないように調整が必要でした。特に夏休み期間中は毎日学校に通って水温をチェックし、必要に応じて水を入れ替えたり、日陰を作ったりしました。',
    timestamp: new Date(Date.now() - 180000)
  },
  {
    id: 'demo-9',
    role: 'interviewer' as const,
    content: 'その経験から何を学びましたか？',
    timestamp: new Date(Date.now() - 120000)
  },
  {
    id: 'demo-10',
    role: 'student' as const,
    content: '継続することの大切さと、責任感を学びました。生き物の命を預かっているという意識を持つことで、毎日の観察を怠らないようになりました。また、データを記録することで、環境の変化と生物の行動パターンの関係性も見えてきました。',
    timestamp: new Date(Date.now() - 60000)
  },
  {
    id: 'demo-11',
    role: 'interviewer' as const,
    content: 'とても素晴らしい探究活動ですね。本日の面接はこれで終了です。お疲れ様でした。',
    timestamp: new Date(Date.now() - 10000)
  }
];

export default function EvaluationDemoPage() {
  const router = useRouter();
  
  return (
    <OptimizedEvaluationScreen
      messages={demoMessages}
      sessionDuration={600} // 10分
      onRetry={() => {
        console.log('もう一度面接を受ける');
        router.push('/interview');
      }}
      onBackToDashboard={() => {
        console.log('ダッシュボードに戻る');
        router.push('/dashboard');
      }}
    />
  );
}