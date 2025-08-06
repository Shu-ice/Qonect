'use client';

import React, { useState } from 'react';

export default function SimpleTestPage() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const runSimpleTest = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);
    
    try {
      console.log('🧪 シンプルテスト開始');
      
      const testData = {
        essayContent: {
          motivation: "明和中学校を志望します。",
          research: "学校見学に行きました。",
          schoolLife: "友達と一緒に頑張りたいです。",
          future: "将来は科学者になりたいです。",
          inquiryLearning: "メダカの飼育をしています。"
        },
        conversationHistory: [
          { role: 'interviewer', content: '面接を始めます。' },
          { role: 'student', content: 'よろしくお願いします。' },
          { role: 'interviewer', content: '探究活動について教えてください。' },
          { role: 'student', content: 'メダカを飼っています。毎日観察しています。' }
        ],
        questionType: 'follow_up',
        currentStage: 'exploration',
        interviewDepth: 2
      };

      console.log('📤 送信データ:', testData);

      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      console.log('📥 レスポンス状態:', response.status);

      const responseText = await response.text();
      console.log('📥 レスポンステキスト:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const resultData = JSON.parse(responseText);
      setResult(resultData);
      
      console.log('✅ テスト成功:', resultData);
      
    } catch (error) {
      console.error('❌ テストエラー:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">シンプルAPIテスト</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <button
            onClick={runSimpleTest}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
          >
            {isLoading ? 'テスト中...' : 'APIテスト実行'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
              <h3 className="text-red-800 font-medium mb-2">エラー:</h3>
              <pre className="text-red-700 text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <h3 className="text-green-800 font-medium mb-2">成功:</h3>
              <div className="space-y-2">
                <p><strong>質問:</strong> "{result.question}"</p>
                <p><strong>段階:</strong> {result.stageInfo?.currentStage || 'unknown'}</p>
                <p><strong>深度:</strong> {result.stageInfo?.depth || 0}</p>
                {result.continuityEnhanced && <p className="text-blue-600">🔗 連続性強化</p>}
                {result.clarification && <p className="text-red-600">🚨 ツッコミ質問</p>}
                {result.seriousReminder && <p className="text-purple-600">🎭 冷静なツッコミ</p>}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">デバッグ情報</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>現在のURL:</strong> {typeof window !== 'undefined' ? window.location.href : 'サーバー側'}</p>
            <p><strong>テストページ:</strong> /simple-test</p>
            <p><strong>APIエンドポイント:</strong> /api/interview/generate-question</p>
          </div>
        </div>
      </div>
    </div>
  );
}