'use client';

import React, { useState } from 'react';

export default function TestInquiryMainStructurePage() {
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
      const motivationKeywords = ['志望', '動機', '明和', '学校', '将来', '夢', '理由', '志願'];
      const inquiryKeywords = ['どのように', 'なぜ', '具体的', '誰と', '困った', '大変', 'うまくいかな', '方法', '工夫'];
      
      const containsMotivationKeywords = motivationKeywords.some(keyword => 
        result.question.includes(keyword)
      );
      
      const containsInquiryKeywords = inquiryKeywords.some(keyword => 
        result.question.includes(keyword)
      );
      
      const detectedMotivationKeywords = motivationKeywords.filter(keyword => 
        result.question.includes(keyword)
      );
      
      const detectedInquiryKeywords = inquiryKeywords.filter(keyword => 
        result.question.includes(keyword)
      );

      const testResult = {
        testName,
        question: result.question,
        stage: result.stageInfo?.currentStage || 'unknown',
        depth: result.stageInfo?.depth || 0,
        conversationLength: testData.conversationHistory?.length || 0,
        containsMotivationKeywords,
        containsInquiryKeywords,
        detectedMotivationKeywords,
        detectedInquiryKeywords,
        isInquiryFocused: containsInquiryKeywords && !containsMotivationKeywords,
        timestamp: new Date().toLocaleTimeString()
      };

      setResults(prev => [...prev, testResult]);
      
      console.log(`${testResult.isInquiryFocused ? '✅' : '❌'} ${testName}: ${testResult.isInquiryFocused ? '探究活動メイン構造適合' : '志願理由書質問が混入'}`);
      
    } catch (error) {
      console.error(`❌ ${testName} エラー:`, error);
      
      const errorResult = {
        testName,
        question: '',
        stage: 'error',
        depth: 0,
        conversationLength: 0,
        containsMotivationKeywords: false,
        containsInquiryKeywords: false,
        detectedMotivationKeywords: [],
        detectedInquiryKeywords: [],
        isInquiryFocused: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toLocaleTimeString()
      };
      
      setResults(prev => [...prev, errorResult]);
    } finally {
      setIsLoading(false);
    }
  };

  const run15MinuteInquiryTest = () => {
    const testData = {
      essayContent: {
        motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。",
        research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
        schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
        future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
        inquiryLearning: "小学4年生から環境委員会に所属し、メダカの水質管理や植物の育成を継続しています。特にpH値の測定や観察記録を通じて、生き物の生態について学び続けています。"
      },
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
        { role: 'student', content: '受検番号456番、佐藤太郎です。' },
        { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
        { role: 'student', content: '自転車で来ました。' },
        { role: 'interviewer', content: 'それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。' },
        { role: 'student', content: '小学4年生から環境委員会に所属して、メダカの飼育と水質管理をしています。最初はただ餌をあげるだけでしたが、だんだん水の汚れやpH値に興味を持つようになりました。' },
        { role: 'interviewer', content: 'pH値の測定はどのような方法で行っていますか？' },
        { role: 'student', content: '試験紙を使って毎週測定しています。数値を記録ノートに書いて、変化を観察しています。' },
        { role: 'interviewer', content: 'その記録をつける中で、予想と違った結果が出たことはありませんでしたか？' },
        { role: 'student', content: '最初の頃、夏場にpH値が急に下がってしまったことがありました。メダカが弱ってしまい、とても心配でした。' }
      ], // 10回の会話（探究活動メイン継続）
      questionType: 'follow_up',
      currentStage: 'exploration',
      interviewDepth: 5
    };

    runTest('15分探究活動メイン構造テスト', testData);
  };

  const runDeep7LayerInquiryTest = () => {
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
        { role: 'student', content: '電車で来ました。' },
        { role: 'interviewer', content: 'それでは、あなたが取り組んでいる探究活動について説明してください。' },
        { role: 'student', content: 'チームダンスをしています。8人のメンバーで、振付を覚えて表現を合わせています。' },
        { role: 'interviewer', content: 'チームダンスですね。振付を合わせるのは大変でしたか？' },
        { role: 'student', content: 'はい、最初はみんなの動きがばらばらで、なかなかそろいませんでした。' },
        { role: 'interviewer', content: 'そのばらつきを解決するために、どのような工夫をしましたか？' },
        { role: 'student', content: 'みんなで話し合って、苦手な部分を教え合ったり、動画を撮って確認したりしました。' },
        { role: 'interviewer', content: '話し合いで意見が分かれることはありませんでしたか？' },
        { role: 'student', content: 'ありました。振付のスピードで意見が分かれて、なかなか決まりませんでした。' },
        { role: 'interviewer', content: 'そのときはどうやって解決しましたか？' },
        { role: 'student', content: '先生に相談して、実際に両方のスピードで踊ってみて、みんなで決めました。結果的に少し遅めのスピードになりました。' }
      ], // 14回の会話（7層深掘り完了レベル）
      questionType: 'follow_up',
      currentStage: 'exploration',
      interviewDepth: 7
    };

    runTest('深掘り7層完了レベルテスト', testData);
  };

  const runConsistencyCheckTest = () => {
    const testData = {
      essayContent: {
        motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。環境問題への関心から、将来は環境科学者になりたいと考えています。",
        research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
        schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
        future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
        inquiryLearning: "小学4年生から環境委員会に所属し、メダカの水質管理や植物の育成を継続しています。"
      },
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
        { role: 'student', content: '受検番号789番、山田太郎です。' },
        // ... 探究活動の深掘りが十分完了した状態
        { role: 'interviewer', content: 'メダカの飼育を通じて、環境について深く考えるようになったんですね。' },
        { role: 'student', content: 'はい、小さな生き物でも環境の変化にとても敏感だということがわかりました。水質が少し変わるだけで、メダカの行動も変わってしまいます。' }
      ],
      questionType: 'follow_up',
      currentStage: 'exploration',
      interviewDepth: 8 // 深掘り完了レベル
    };

    runTest('齟齬チェック用質問テスト（深掘り完了後）', testData);
  };

  const successfulTests = results.filter(r => !r.error && r.isInquiryFocused).length;
  const totalTests = results.filter(r => !r.error).length;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">探究活動メイン15分構造テスト</h1>
        
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">📋 新しい面接構造</h2>
          <div className="space-y-2 text-blue-700">
            <p><strong>メイン（15分）</strong>: 探究活動の深掘り質問</p>
            <p><strong>志願理由書</strong>: 基本的には「面接内容との齟齬チェック」用</p>
            <p><strong>時間余り</strong>: 志願理由書の他項目について補完質問</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-green-600">🎯 15分探究メイン</h2>
            <p className="text-sm text-gray-600 mb-4">
              15分の持ち時間を探究活動で埋める構造をテスト
            </p>
            <button
              onClick={run15MinuteInquiryTest}
              disabled={isLoading}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'テスト中...' : '15分探究メインテスト'}
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-purple-600">🔍 深掘り7層完了</h2>
            <p className="text-sm text-gray-600 mb-4">
              探究活動の深掘りが7層完了したレベルをテスト
            </p>
            <button
              onClick={runDeep7LayerInquiryTest}
              disabled={isLoading}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {isLoading ? 'テスト中...' : '深掘り7層完了テスト'}
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-orange-600">🔗 齟齬チェック</h2>
            <p className="text-sm text-gray-600 mb-4">
              探究活動完了後の志願理由書齟齬チェック
            </p>
            <button
              onClick={runConsistencyCheckTest}
              disabled={isLoading}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {isLoading ? 'テスト中...' : '齟齬チェックテスト'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 テスト結果サマリー</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{successfulTests}/{totalTests}</div>
              <div className="text-sm text-green-700">探究活動メイン適合</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{totalTests - successfulTests}/{totalTests}</div>
              <div className="text-sm text-red-700">志願理由書混入</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.filter(r => r.error).length}</div>
              <div className="text-sm text-blue-700">エラー発生</div>
            </div>
          </div>
          {totalTests > 0 && (
            <div className={`p-3 rounded ${successfulTests === totalTests ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
              {successfulTests === totalTests ? 
                '🎉 全てのテストが成功しました！探究活動メイン15分構造が正常に動作しています。' :
                '⚠️ 一部のテストで志願理由書質問が混入しました。システムの調整が必要です。'
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
                    : result.isInquiryFocused 
                    ? 'bg-green-50 border-green-500'
                    : 'bg-orange-50 border-orange-500'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-800">
                      {result.testName}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.error 
                        ? 'bg-red-200 text-red-800' 
                        : result.isInquiryFocused 
                        ? 'bg-green-200 text-green-800'
                        : 'bg-orange-200 text-orange-800'
                    }`}>
                      {result.error ? 'エラー' : result.isInquiryFocused ? '探究メイン適合' : '志願理由書混入'}
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">探究活動キーワード:</p>
                          {result.containsInquiryKeywords ? (
                            <div className="text-green-600 text-sm">
                              ✅ 検出: {result.detectedInquiryKeywords.join(', ')}
                            </div>
                          ) : (
                            <div className="text-red-600 text-sm">
                              ❌ 探究深掘りキーワードなし
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">志願理由書キーワード:</p>
                          {result.containsMotivationKeywords ? (
                            <div className="text-orange-600 text-sm">
                              ⚠️ 検出: {result.detectedMotivationKeywords.join(', ')}
                            </div>
                          ) : (
                            <div className="text-green-600 text-sm">
                              ✅ 志願理由書質問は回避
                            </div>
                          )}
                        </div>
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