'use client';

import React, { useState } from 'react';

export default function TestPremiumQuality() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const premiumTestScenarios = [
    {
      name: "深度7: 成長と学びの質問（最高レベル）",
      description: "深度7以上での深層質問生成テスト",
      conversationHistory: Array(14).fill(null).map((_, index) => ({
        role: index % 2 === 0 ? 'interviewer' : 'student',
        content: index % 2 === 0 
          ? `面接官質問${Math.floor(index/2) + 1}` 
          : `環境委員会でメダカの飼育をして、友達と一緒にpH値を毎日測定しています。記録をつけ続けて、データを分析しています。`
      }))
    },
    {
      name: "AI自然語りかけテスト", 
      description: "固定セリフではなく自然なAI生成質問",
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。こちらまでは何で来られましたか？' },
        { role: 'student', content: '電車で30分かけて来ました。少し緊張しています。' },
        { role: 'interviewer', content: 'どれくらい時間がかかりましたか？' },
        { role: 'student', content: '家を出てから1時間ほどです。' }
      ]
    },
    {
      name: "品質スコアリングテスト",
      description: "質問品質のリアルタイム計算",
      conversationHistory: [
        { role: 'interviewer', content: 'メダカの飼育で工夫していることはありますか？' },
        { role: 'student', content: 'メダカはとても可愛いです。毎日見ているだけで癒されます。' }
      ]
    },
    {
      name: "連続性強化テスト",
      description: "前の回答から具体的キーワードを拾った質問生成",
      conversationHistory: [
        { role: 'interviewer', content: 'あなたの探究活動について教えてください。' },
        { role: 'student', content: '小学4年生から環境委員会でメダカの飼育をしています。友達と一緒にpH値を測定して、毎日観察記録をつけています。' }
      ]
    },
    {
      name: "プレミアム齟齬検出テスト",
      description: "高度な齟齬検出とデバッグ情報",
      conversationHistory: [
        { role: 'interviewer', content: 'pH値の測定方法について詳しく教えてください。' },
        { role: 'student', content: '昨日は友達と映画を見に行きました。アニメ映画でとても面白かったです。' }
      ]
    }
  ];

  const runPremiumTests = async () => {
    setLoading(true);
    setResults([]);
    
    const essayContent = {
      motivation: "明和中学校を志望します。科学的な探究活動を深めたいです。",
      research: "学校見学に行き、理科の設備が充実していることを知りました。",
      schoolLife: "友達と一緒に研究活動に取り組みたいです。", 
      future: "将来は科学者になりたいです。",
      inquiryLearning: "メダカの飼育をしています。毎日観察記録をつけ、pH値の測定も行っています。"
    };

    const testResults = [];

    for (const scenario of premiumTestScenarios) {
      try {
        console.log(`🎯 プレミアムテスト実行: ${scenario.name}`);
        
        const testData = {
          essayContent,
          conversationHistory: scenario.conversationHistory,
          questionType: 'follow_up',
          currentStage: 'exploration',
          interviewDepth: scenario.conversationHistory.length >= 14 ? 7 : 3
        };

        const startTime = Date.now();
        const response = await fetch('/api/interview/generate-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        });
        const endTime = Date.now();

        const result = await response.json();
        
        testResults.push({
          scenario: scenario.name,
          description: scenario.description,
          generatedQuestion: result.question,
          responseTime: endTime - startTime,
          questionQuality: result.questionQuality || null,
          debugInfo: result.debugInfo || null,
          clarification: result.clarification || false,
          seriousReminder: result.seriousReminder || false,
          continuityEnhanced: result.continuityEnhanced || false,
          forceDeepDive: result.forceDeepDive || false,
          emergencyFallback: result.emergencyFallback || false,
          stageInfo: result.stageInfo || null,
          fullResult: result
        });

        console.log(`✅ ${scenario.name} 完了 (${endTime - startTime}ms)`);
        
      } catch (error) {
        console.error(`❌ ${scenario.name} エラー:`, error);
        testResults.push({
          scenario: scenario.name,
          description: scenario.description,
          error: error.message
        });
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-8">
          🏆 プレミアム品質テスト - 最高のプログラマ版
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">プレミアム機能テスト</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• <strong>深度7深層質問</strong>: 成長・学び・変化を引き出す高度な質問</p>
            <p>• <strong>AI自然語りかけ</strong>: 固定セリフを排除した臨機応変な生成</p>
            <p>• <strong>品質スコアリング</strong>: リアルタイム質問品質計算</p>
            <p>• <strong>連続性強化</strong>: 前回答からキーワード抽出して継続</p>
            <p>• <strong>デバッグ情報</strong>: AI生成・フォールバック・エラー詳細</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={runPremiumTests}
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? '⏳ プレミアムテスト実行中...' : '🚀 全プレミアム機能テスト実行'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className={`rounded-lg p-6 ${ 
                result.error ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200'
              }`}>
                <h3 className="font-semibold mb-3 text-lg text-gray-800">
                  {result.scenario}
                </h3>
                
                <div className="text-sm space-y-3">
                  <p><strong>概要:</strong> {result.description}</p>
                  
                  {result.error ? (
                    <p className="text-red-600"><strong>エラー:</strong> {result.error}</p>
                  ) : (
                    <>
                      <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
                        <p><strong>生成質問:</strong> "{result.generatedQuestion}"</p>
                        <p className="text-blue-600 mt-2">
                          <strong>生成時間:</strong> {result.responseTime}ms
                        </p>
                      </div>
                      
                      {result.questionQuality && (
                        <div className={`p-4 rounded ${getQualityColor(result.questionQuality.score)}`}>
                          <p><strong>品質スコア:</strong> {result.questionQuality.score}/100</p>
                          <p><strong>評価要因:</strong> {result.questionQuality.factors.join(', ')}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className={`text-center p-2 rounded ${result.clarification ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                          <p className="font-medium">齟齬検出</p>
                          <p>{result.clarification ? '✅ 検出' : '❌ なし'}</p>
                        </div>
                        <div className={`text-center p-2 rounded ${result.seriousReminder ? 'bg-red-100' : 'bg-gray-100'}`}>
                          <p className="font-medium">ふざけ検出</p>
                          <p>{result.seriousReminder ? '✅ 検出' : '❌ なし'}</p>
                        </div>
                        <div className={`text-center p-2 rounded ${result.continuityEnhanced ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <p className="font-medium">連続性強化</p>
                          <p>{result.continuityEnhanced ? '✅ 有効' : '❌ 無効'}</p>
                        </div>
                        <div className={`text-center p-2 rounded ${result.forceDeepDive ? 'bg-purple-100' : 'bg-gray-100'}`}>
                          <p className="font-medium">強制深掘り</p>
                          <p>{result.forceDeepDive ? '✅ 実行' : '❌ なし'}</p>
                        </div>
                      </div>

                      {result.debugInfo && (
                        <div className="bg-gray-50 p-4 rounded mt-4">
                          <h4 className="font-medium mb-2">🔍 デバッグ情報</h4>
                          <pre className="text-xs text-gray-600">
                            {JSON.stringify(result.debugInfo, null, 2)}
                          </pre>
                        </div>
                      )}

                      {result.stageInfo && (
                        <div className="bg-indigo-50 p-4 rounded mt-4">
                          <h4 className="font-medium mb-2">📊 段階情報</h4>
                          <p><strong>段階:</strong> {result.stageInfo.currentStage}</p>
                          <p><strong>深度:</strong> {result.stageInfo.depth}</p>
                          <p><strong>パターン:</strong> {result.stageInfo.patternType || 'なし'}</p>
                        </div>
                      )}

                      <details className="mt-4">
                        <summary className="cursor-pointer text-purple-600 font-medium">完全なレスポンスを表示</summary>
                        <pre className="bg-gray-100 p-3 rounded mt-2 text-xs overflow-auto">
                          {JSON.stringify(result.fullResult, null, 2)}
                        </pre>
                      </details>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}