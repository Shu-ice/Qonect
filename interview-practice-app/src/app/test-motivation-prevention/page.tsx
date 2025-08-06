'use client';

import React, { useState } from 'react';

export default function TestMotivationPreventionPage() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async (testName: string, testData: any) => {
    setIsLoading(true);
    
    try {
      console.log(`🧪 ${testName} テスト開始`);
      
      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`);
      }

      // 志願理由書関連のキーワードチェック
      const motivationKeywords = ['志望', '動機', '明和', '学校', '将来', '夢', '理由'];
      const containsMotivationKeywords = motivationKeywords.some(keyword => 
        result.question.includes(keyword)
      );
      
      const detectedMotivationKeywords = motivationKeywords.filter(keyword => 
        result.question.includes(keyword)
      );

      const testResult = {
        testName,
        question: result.question,
        stage: result.stageInfo?.currentStage || 'unknown',
        depth: result.stageInfo?.depth || 0,
        conversationLength: testData.conversationHistory?.length || 0,
        containsMotivationKeywords,
        detectedMotivationKeywords,
        success: !containsMotivationKeywords,
        timestamp: new Date().toLocaleTimeString()
      };

      setResults(prev => [...prev, testResult]);
      
      console.log(`${testResult.success ? '✅' : '❌'} ${testName}: ${testResult.success ? '成功' : '失敗'}`);
      
    } catch (error) {
      console.error(`❌ ${testName} エラー:`, error);
      
      const errorResult = {
        testName,
        question: '',
        stage: 'error',
        depth: 0,
        conversationLength: 0,
        containsMotivationKeywords: false,
        detectedMotivationKeywords: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toLocaleTimeString()
      };
      
      setResults(prev => [...prev, errorResult]);
    } finally {
      setIsLoading(false);
    }
  };

  const runOpeningTest = () => {
    const testData = {
      essayContent: {
        motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。",
        research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
        schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
        future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
        inquiryLearning: "小学3年生からチームダンスに取り組んでいます。練習では振付を覚えるだけでなく、チーム全体の表現を合わせることに力を入れています。"
      },
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
        { role: 'student', content: '受検番号123番、田中花子です。' },
        { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
        { role: 'student', content: '電車で来ました。' }
      ],
      questionType: 'follow_up',
      currentStage: 'opening',
      interviewDepth: 2
    };

    runTest('Opening段階での志願理由書質問防止', testData);
  };

  const runExplorationEarlyTest = () => {
    const testData = {
      essayContent: {
        motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。",
        research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
        schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
        future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
        inquiryLearning: "小学4年生から環境委員会に所属し、メダカの水質管理や植物の育成を継続しています。"
      },
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
        { role: 'student', content: '受検番号456番、佐藤太郎です。' },
        { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
        { role: 'student', content: '自転車で来ました。' },
        { role: 'interviewer', content: 'それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。' },
        { role: 'student', content: '小学4年生から環境委員会に所属して、メダカの飼育と水質管理をしています。pH値を測定して記録をつけたり、水温や酸素量も調べています。' }
      ],
      questionType: 'follow_up',
      currentStage: 'exploration',
      interviewDepth: 2 // 深度3未満
    };

    runTest('Exploration段階前半での志願理由書質問防止', testData);
  };

  const runShortConversationTest = () => {
    const testData = {
      essayContent: {
        motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。",
        research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
        schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
        future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
        inquiryLearning: "小学3年生からチームダンスに取り組んでいます。練習では振付を覚えるだけでなく、チーム全体の表現を合わせることに力を入れています。"
      },
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
        { role: 'student', content: '受検番号789番、山田花子です。' },
        { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
        { role: 'student', content: '徒歩で来ました。' },
        { role: 'interviewer', content: 'それでは、あなたが取り組んでいる探究活動について説明してください。' },
        { role: 'student', content: 'チームダンスをしています。振付を覚えて、チーム全体で表現を合わせています。' },
        { role: 'interviewer', content: 'チームダンスですね。何人くらいでやっているのですか？' },
        { role: 'student', content: '8人でやっています。' }
      ], // 8回の会話（10回未満）
      questionType: 'follow_up',
      currentStage: 'exploration',
      interviewDepth: 4
    };

    runTest('短い会話での志願理由書質問防止', testData);
  };

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">志願理由書質問の早期出現防止システムテスト</h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-orange-600">🚫 Opening段階テスト</h2>
            <p className="text-sm text-gray-600 mb-4">
              Opening段階では志願理由書質問を完全に回避
            </p>
            <button
              onClick={runOpeningTest}
              disabled={isLoading}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {isLoading ? 'テスト中...' : 'Opening段階テスト'}
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-yellow-600">⚠️ Exploration前半テスト</h2>
            <p className="text-sm text-gray-600 mb-4">
              Exploration段階の深度3未満では志願理由書質問を回避
            </p>
            <button
              onClick={runExplorationEarlyTest}
              disabled={isLoading}
              className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {isLoading ? 'テスト中...' : 'Exploration前半テスト'}
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">💬 短い会話テスト</h2>
            <p className="text-sm text-gray-600 mb-4">
              会話が10回未満の場合は探究活動に集中
            </p>
            <button
              onClick={runShortConversationTest}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'テスト中...' : '短い会話テスト'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 テスト結果サマリー</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{successCount}/{totalCount}</div>
              <div className="text-sm text-green-700">成功したテスト</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{totalCount - successCount}/{totalCount}</div>
              <div className="text-sm text-red-700">失敗したテスト</div>
            </div>
          </div>
          {totalCount > 0 && (
            <div className={`p-3 rounded ${successCount === totalCount ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
              {successCount === totalCount ? 
                '🎉 全てのテストが成功しました！志願理由書質問の早期出現防止システムは正常に動作しています。' :
                '⚠️ 一部のテストが失敗しました。システムの調整が必要です。'
              }
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">📋 詳細テスト結果</h2>
          
          {results.length === 0 ? (
            <p className="text-gray-500 text-center py-8">まだテストが実行されていません</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  result.error 
                    ? 'bg-red-50 border-red-500' 
                    : result.success 
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-800">
                      {result.testName}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.error 
                        ? 'bg-red-200 text-red-800' 
                        : result.success 
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {result.error ? 'エラー' : result.success ? '成功' : '失敗'}
                    </span>
                  </div>
                  
                  {result.error ? (
                    <div>
                      <p className="text-red-600 font-medium">エラー内容:</p>
                      <p className="text-red-700 mt-1">{result.error}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-gray-800 mb-2">生成された質問:</p>
                      <p className="text-gray-700 mb-3 p-3 bg-gray-50 rounded">
                        "{result.question}"
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <span>段階: <strong>{result.stage}</strong></span>
                        <span>深度: <strong>{result.depth}</strong></span>
                        <span>会話回数: <strong>{result.conversationLength}回</strong></span>
                        <span>時刻: <strong>{result.timestamp}</strong></span>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">志願理由書質問検出:</p>
                        {result.containsMotivationKeywords ? (
                          <div className="text-red-600 text-sm">
                            ⚠️ 志願理由書関連キーワード検出: {result.detectedMotivationKeywords.join(', ')}
                          </div>
                        ) : (
                          <div className="text-green-600 text-sm">
                            ✅ 志願理由書質問は回避されました
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => setResults([])}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            結果をクリア
          </button>
        </div>
      </div>
    </div>
  );
}