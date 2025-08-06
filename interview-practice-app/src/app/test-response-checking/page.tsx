'use client';

import React, { useState } from 'react';

export default function TestResponseChecking() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testScenarios = [
    {
      name: "正常な回答",
      description: "適切な回答での通常の深掘り質問",
      conversationHistory: [
        { role: 'interviewer', content: 'それでは、あなたが取り組んでいる探究活動について教えてください。' },
        { role: 'student', content: '私は環境委員会でメダカの飼育をしています。毎日pH値を測定して記録をつけています。' }
      ]
    },
    {
      name: "齟齬のある回答",  
      description: "質問と関係ない回答への対応",
      conversationHistory: [
        { role: 'interviewer', content: 'メダカの飼育で困ったことはありましたか？' },
        { role: 'student', content: '昨日は友達と映画を見に行きました。とても面白かったです。' }
      ]
    },
    {
      name: "ふざけた回答1",
      description: "どこでもドア的なふざけた回答",
      conversationHistory: [
        { role: 'interviewer', content: 'この学校にはどうやって来ましたか？' },
        { role: 'student', content: 'どこでもドアで来ました。ドラえもんが貸してくれました。' }
      ]
    },
    {
      name: "ふざけた回答2", 
      description: "現実離れしたふざけた回答",
      conversationHistory: [
        { role: 'interviewer', content: 'メダカの飼育で大変だったことはありますか？' },
        { role: 'student', content: 'メダカが突然しゃべり出して、宿題を手伝ってくれと言われました。' }
      ]
    },
    {
      name: "微妙な回答",
      description: "関連はあるが的外れな回答",  
      conversationHistory: [
        { role: 'interviewer', content: 'pH値の測定で工夫していることはありますか？' },
        { role: 'student', content: 'メダカはとても可愛いです。毎日見ているだけで癒されます。' }
      ]
    }
  ];

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);
    
    const essayContent = {
      motivation: "明和中学校を志望します。",
      research: "学校見学に行きました。",
      schoolLife: "友達と一緒に頑張りたいです。", 
      future: "将来は科学者になりたいです。",
      inquiryLearning: "メダカの飼育をしています。毎日観察記録をつけています。"
    };

    const testResults = [];

    for (const scenario of testScenarios) {
      try {
        console.log(`🧪 テスト実行: ${scenario.name}`);
        
        const testData = {
          essayContent,
          conversationHistory: scenario.conversationHistory,
          questionType: 'follow_up',
          currentStage: 'exploration',
          interviewDepth: 2
        };

        const response = await fetch('/api/interview/generate-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        });

        const result = await response.json();
        
        testResults.push({
          scenario: scenario.name,
          description: scenario.description,
          studentAnswer: scenario.conversationHistory[scenario.conversationHistory.length - 1].content,
          generatedQuestion: result.question,
          clarification: result.clarification || false,
          seriousReminder: result.seriousReminder || false,
          responseAnalysis: {
            isClarification: result.clarification ? '✅ 齟齬検出' : '❌ 通常処理',
            isJokeDetection: result.seriousReminder ? '✅ ふざけ検出' : '❌ 通常処理'
          },
          fullResult: result
        });

        console.log(`✅ ${scenario.name} 完了`);
        
      } catch (error) {
        console.error(`❌ ${scenario.name} エラー:`, error);
        testResults.push({
          scenario: scenario.name,
          description: scenario.description,
          error: error.message,
          studentAnswer: scenario.conversationHistory[scenario.conversationHistory.length - 1].content
        });
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">
          🔍 返答齟齬・ふざけた質問対応テスト
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">テスト概要</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• <strong>齟齬検出</strong>: 質問と関係ない回答 → 「それはどういうことですか？」</p>
            <p>• <strong>ふざけた回答検出</strong>: 現実離れした回答 → 「それは間違いありませんか？」</p>
            <p>• <strong>正常な回答</strong>: 通常の深掘り質問を継続</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⏳ 全テスト実行中...' : '🚀 全テストシナリオ実行'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className={`rounded-lg p-6 ${
                result.error ? 'bg-red-50 border border-red-200' :
                result.clarification || result.seriousReminder ? 'bg-yellow-50 border border-yellow-200' : 
                'bg-green-50 border border-green-200'
              }`}>
                <h3 className={`font-semibold mb-3 ${
                  result.error ? 'text-red-800' :
                  result.clarification || result.seriousReminder ? 'text-yellow-800' :
                  'text-green-800'
                }`}>
                  {result.scenario}
                </h3>
                
                <div className="text-sm space-y-2">
                  <p><strong>概要:</strong> {result.description}</p>
                  <p><strong>学生回答:</strong> "{result.studentAnswer}"</p>
                  
                  {result.error ? (
                    <p className="text-red-600"><strong>エラー:</strong> {result.error}</p>
                  ) : (
                    <>
                      <p><strong>生成質問:</strong> "{result.generatedQuestion}"</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <strong>検出結果:</strong>
                          <p>{result.responseAnalysis?.isClarification}</p>
                          <p>{result.responseAnalysis?.isJokeDetection}</p>
                        </div>
                        <div>
                          <strong>フラグ:</strong>
                          <p>clarification: {result.clarification ? '✅' : '❌'}</p>
                          <p>seriousReminder: {result.seriousReminder ? '✅' : '❌'}</p>
                        </div>
                      </div>

                      <details className="mt-4">
                        <summary className="cursor-pointer text-blue-600">完全なレスポンスを表示</summary>
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