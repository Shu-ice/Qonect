'use client';

import React, { useState } from 'react';

interface TestResult {
  question: string;
  stage: string;
  depth: number;
  timestamp: string;
  error?: string;
  clarification?: boolean;
}

export default function TestDeepDivePage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testMode, setTestMode] = useState<'normal' | 'misaligned' | 'joking'>('normal');

  // Hさん（ダンス）パターンのテストデータ
  const hsanTestData = {
    essayContent: {
      motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。",
      research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
      schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
      future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
      inquiryLearning: "小学3年生からチームダンスに取り組んでいます。練習では振付を覚えるだけでなく、チーム全体の表現を合わせることに力を入れています。特に文化祭での発表に向けて、みんなで話し合いながら練習しています。"
    },
    conversationHistory: [
      { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
      { role: 'student', content: '受検番号123番、田中花子です。' },
      { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
      { role: 'student', content: '電車で来ました。' },
      { role: 'interviewer', content: '電車でお疲れさまでした。どれくらい時間がかかりましたか？' },
      { role: 'student', content: '30分かかりました。' },
      { role: 'interviewer', content: '30分ですか、ちょうど良い距離ですね。それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。' },
      { role: 'student', content: '小学3年生からチームダンスに取り組んでいます。最初は振付を覚えるのが精一杯でしたが、だんだんチーム全体の表現を合わせることの大切さを学びました。特に文化祭の発表では、みんなで何度も話し合って、それぞれの動きを調整しました。振付にばらつきがあってなかなかそろわなかったのですが、お互いの動きを見ながら練習を重ねて、最終的にはとても良い発表ができました。' }
    ]
  };

  // ふざけた回答のテストデータ
  const jokingTestData = {
    essayContent: {
      motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。",
      research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
      schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
      future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
      inquiryLearning: "小学3年生から宇宙研究に取り組んでいます。"
    },
    conversationHistory: [
      { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
      { role: 'student', content: '受検番号999番、宇宙人Xです。' },
      { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
      // ふざけた回答例1: どこでもドア
      { role: 'student', content: 'どこでもドアで来ました。' },
      { role: 'interviewer', content: 'どれくらい時間がかかりましたか？' },
      // ふざけた回答例2: 非現実的な時間
      { role: 'student', content: '0秒です。瞬間移動なので。' },
      { role: 'interviewer', content: 'あなたの探究活動について教えてください。' },
      // ふざけた回答例3: ゲーム関連
      { role: 'student', content: 'ポケモンの研究をしています。ピカチュウと一緒に電気の実験をしています。' }
    ]
  };

  // かみ合わない回答のテストデータ
  const misalignedTestData = {
    essayContent: {
      motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。",
      research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
      schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
      future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
      inquiryLearning: "小学4年生から環境委員会に所属し、メダカの水質管理や植物の育成を継続しています。"
    },
    conversationHistory: [
      { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
      { role: 'student', content: '受検番号789番、山田太郎です。' },
      { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
      { role: 'student', content: '電車です。' },
      { role: 'interviewer', content: 'どれくらい時間がかかりましたか？' },
      // かみ合わない回答例1: 時間を聞かれているのに理由を答える
      { role: 'student', content: '朝早く家を出たのは、遅刻したくなかったからです。' },
      { role: 'interviewer', content: 'メダカの飼育で一番困ったことは何でしたか？' },
      // かみ合わない回答例2: 困難を聞かれているのに楽しかったことを答える
      { role: 'student', content: 'メダカの赤ちゃんが生まれた時はとても嬉しかったです。みんなで観察して楽しかったです。' },
      { role: 'interviewer', content: 'pH値の測定はどのような方法で行いましたか？' },
      // かみ合わない回答例3: 方法を聞かれているのに感想だけ答える
      { role: 'student', content: 'pH値の測定はとても重要だと思います。' }
    ]
  };

  // Tさん（メダカ）パターンのテストデータ
  const tsanTestData = {
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
      { role: 'interviewer', content: '自転車でいらしたんですね。どれくらい時間がかかりましたか？' },
      { role: 'student', content: '15分ぐらいです。' },
      { role: 'interviewer', content: 'お近くですね。それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。' },
      { role: 'student', content: '小学4年生から環境委員会に所属して、メダカの飼育と水質管理をしています。最初はただ餌をあげるだけでしたが、だんだん水の汚れやpH値に興味を持つようになりました。pH値を測定して記録をつけたり、水温や酸素量も調べています。時々メダカが死んでしまうこともあって悲しかったのですが、原因を調べて改善策を考えるようになりました。今では毎日観察記録をつけて、小さな変化にも気づけるようになりました。' }
    ]
  };

  const testAPI = async (testData: any, testName: string) => {
    setIsLoading(true);
    
    try {
      console.log(`🧪 ${testName} テスト開始`);
      
      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testData,
          questionType: 'follow_up',
          currentStage: 'exploration',
          interviewDepth: Math.floor(testData.conversationHistory.length / 2)
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`);
      }

      const newResult: TestResult = {
        question: result.question,
        stage: result.stageInfo?.currentStage || result.stage || 'unknown',
        depth: result.stageInfo?.depth || result.depth || 0,
        timestamp: new Date().toLocaleTimeString(),
        error: undefined,
        clarification: result.clarification
      };

      setResults(prev => [...prev, newResult]);
      
      console.log('✅ テスト成功:', newResult);
      
    } catch (error) {
      console.error('❌ テストエラー:', error);
      
      const errorResult: TestResult = {
        question: '',
        stage: 'error',
        depth: 0,
        timestamp: new Date().toLocaleTimeString(),
        error: error instanceof Error ? error.message : String(error)
      };
      
      setResults(prev => [...prev, errorResult]);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeQuestionQuality = (question: string, testType: 'hsan' | 'tsan') => {
    // 大幅に拡張された具体性マーカー
    const specificityMarkers = question.match(/具体的|どのよう|なぜ|どんな|どういう|どのくらい|どのような|どういった|いつ|誰|何|どこで|どう|どんなふうに|どうやって|どんな方法|どんな時|どんな状況|どんな気持ち|どんな工夫|どんな対処|どのように解決|どう対処|どう解決|どう感じ|どう思っ|どう乗り越え|どう克服/gi) || [];
    
    let keywordCount = 0;
    if (testType === 'hsan') {
      const danceKeywords = ['ダンス', '振付', 'チーム', 'ばらつき', '話し合い', '練習', '表現', '文化祭', 'メンバー', '調整', '合わせ', '意見', '分かれ', '解決', '振付合わせ', 'チームメンバー', 'メンバー同士'];
      keywordCount = danceKeywords.filter(keyword => question.includes(keyword)).length;
    } else {
      const medakaKeywords = ['メダカ', 'pH', '水質', '観察', '記録', '環境委員会', '測定', '飼育', '数値', '対処', '管理', '工夫', '思うようにならない', 'pH値', '数値', '測定', '水質管理'];
      keywordCount = medakaKeywords.filter(keyword => question.includes(keyword)).length;
    }
    
    // 大幅に拡張された深掘りパターン
    const deepDivePatterns = [
      '困った', '大変', 'うまくいかな', '失敗', '課題', '問題', '苦労', '難しかった', '思うようにならな',
      '誰かと一緒', '先生', '友達', 'チーム', '協力', 'メンバー', '仲間', 'みんなで', '一緒に',
      'どのように', 'どんな方法', 'どうやって', 'どういう風に', 'どのような', 'どう解決', 'どう対処', 'どんな工夫',
      '一番', '特に', '印象に残った', '覚えている', '思い出', '予想', '違った', 'もっとも', '最も',
      '解決', '対処', '工夫', '改善', '克服', '乗り越え', '努力', '頑張っ', '取り組', '挑戦',
      '意見', '話し合い', '相談', 'アドバイス', '支援', '助け', '協力', '連携', 'サポート',
      '実際', '具体的', '詳しく', '深く', 'さらに', 'もう少し', 'より', 'もっと',
      '感じ', '思っ', '考え', '気持ち', '体験', '経験', '学び', '発見', '気づき'
    ];
    const deepDiveCount = deepDivePatterns.filter(pattern => question.includes(pattern)).length;
    
    // 質問としての基本要素チェック
    const hasQuestionMark = question.includes('？') ? 1 : 0;
    const hasProperLength = question.length >= 30 ? 1 : 0;
    
    // スコア計算（最大50点、より緻密に調整）
    const qualityScore = Math.min(50, (specificityMarkers.length * 2) + (keywordCount * 3) + (deepDiveCount * 2) + (hasQuestionMark * 5) + (hasProperLength * 3));
    
    return {
      specificityMarkers: specificityMarkers.length,
      keywordCount,
      deepDiveCount,
      hasQuestionMark,
      hasProperLength,
      qualityScore
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">深掘り面接システム動作確認テスト</h1>
        
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-3">テストモード選択</h3>
          <div className="flex gap-4">
            <button
              onClick={() => setTestMode('normal')}
              className={`px-4 py-2 rounded ${
                testMode === 'normal' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              通常テスト
            </button>
            <button
              onClick={() => setTestMode('misaligned')}
              className={`px-4 py-2 rounded ${
                testMode === 'misaligned' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              かみ合わない回答テスト
            </button>
            <button
              onClick={() => setTestMode('joking')}
              className={`px-4 py-2 rounded ${
                testMode === 'joking' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ふざけた回答テスト
            </button>
          </div>
        </div>

        {testMode === 'normal' ? (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-blue-600">🎭 Hさん（ダンス）パターン</h2>
              <p className="text-sm text-gray-600 mb-4">
                チームダンスでの振付調整、協力、発表体験を深掘り
              </p>
              <button
                onClick={() => testAPI(hsanTestData, 'Hさん（ダンス）パターン')}
                disabled={isLoading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'テスト中...' : 'Hさんパターンテスト'}
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-green-600">🐟 Tさん（メダカ）パターン</h2>
              <p className="text-sm text-gray-600 mb-4">
                メダカ飼育でのpH管理、観察記録、継続活動を深掘り
              </p>
              <button
                onClick={() => testAPI(tsanTestData, 'Tさん（メダカ）パターン')}
                disabled={isLoading}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isLoading ? 'テスト中...' : 'Tさんパターンテスト'}
              </button>
            </div>
          </div>
        ) : testMode === 'misaligned' ? (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4 text-red-600">🚨 かみ合わない回答テスト</h2>
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-red-50 rounded">
                <p className="text-sm"><strong>例1:</strong> 「どれくらい時間がかかりましたか？」→「朝早く家を出たのは、遅刻したくなかったからです。」</p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="text-sm"><strong>例2:</strong> 「一番困ったことは何でしたか？」→「メダカの赤ちゃんが生まれた時はとても嬉しかったです。」</p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="text-sm"><strong>例3:</strong> 「どのような方法で行いましたか？」→「pH値の測定はとても重要だと思います。」</p>
              </div>
            </div>
            <button
              onClick={() => testAPI(misalignedTestData, 'かみ合わない回答パターン')}
              disabled={isLoading}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              {isLoading ? 'テスト中...' : 'かみ合わない回答テスト実行'}
            </button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">🎭 ふざけた回答テスト</h2>
            <div className="space-y-4 mb-6">
              <div className="p-3 bg-purple-50 rounded">
                <p className="text-sm"><strong>例1:</strong> 「こちらまでは何で来られましたか？」→「どこでもドアで来ました。」</p>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <p className="text-sm"><strong>例2:</strong> 「どれくらい時間がかかりましたか？」→「0秒です。瞬間移動なので。」</p>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <p className="text-sm"><strong>例3:</strong> 「探究活動について教えてください」→「ポケモンの研究をしています。ピカチュウと一緒に電気の実験をしています。」</p>
              </div>
            </div>
            <button
              onClick={() => testAPI(jokingTestData, 'ふざけた回答パターン')}
              disabled={isLoading}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {isLoading ? 'テスト中...' : 'ふざけた回答テスト実行'}
            </button>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">📋 テスト結果</h2>
          
          {results.length === 0 ? (
            <p className="text-gray-500 text-center py-8">まだテストが実行されていません</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  result.error 
                    ? 'bg-red-50 border-red-500' 
                    : 'bg-green-50 border-green-500'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">
                      テスト #{index + 1} - {result.timestamp}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.error 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-green-200 text-green-800'
                    }`}>
                      {result.error ? 'エラー' : '成功'}
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
                      
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>段階: <strong>{result.stage}</strong></span>
                        <span>深度: <strong>{result.depth}</strong></span>
                        {result.clarification && (
                          <span className="text-red-600 font-bold">🚨 ツッコミ質問</span>
                        )}
                        {(result as any).seriousReminder && (
                          <span className="text-purple-600 font-bold">🎭 冷静なツッコミ</span>
                        )}
                        {(result as any).continuityEnhanced && (
                          <span className="text-blue-600 font-bold">🔗 連続性強化</span>
                        )}
                      </div>
                      
                      {/* 質問品質分析 */}
                      {result.question && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <p className="text-sm font-medium text-blue-800 mb-2">質問品質分析:</p>
                          {(() => {
                            // 質問内容から適切なタイプを自動判定
                            const questionType = result.question.includes('pH') || result.question.includes('メダカ') || result.question.includes('水質') || result.question.includes('環境委員会') || result.question.includes('測定') || result.question.includes('数値') || result.question.includes('管理') ? 'tsan' : 'hsan';
                            const analysis = analyzeQuestionQuality(result.question, questionType);
                            return (
                              <div className="text-xs text-blue-700 space-y-1">
                                <p>パターンタイプ: {questionType === 'hsan' ? 'Hさん（ダンス）' : 'Tさん（メダカ）'}</p>
                                <p>具体性マーカー数: {analysis.specificityMarkers}</p>
                                <p>キーワード使用数: {analysis.keywordCount}</p>
                                <p>深掘りパターン数: {analysis.deepDiveCount}</p>
                                <p>質問形式: {analysis.hasQuestionMark ? '✅' : '❌'}</p>
                                <p>適切な長さ: {analysis.hasProperLength ? '✅' : '❌'}</p>
                                <p className="font-medium">
                                  総合品質スコア: {analysis.qualityScore}/50 
                                  {analysis.qualityScore >= 40 ? ' 🏆優秀' : 
                                   analysis.qualityScore >= 30 ? ' ✅良好' : 
                                   analysis.qualityScore >= 20 ? ' ⚠️要改善' : ' ❌不十分'}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
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