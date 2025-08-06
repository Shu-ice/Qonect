'use client';

import React, { useState } from 'react';

export default function TestDepth7Fix() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    // 深度7相当の会話履歴を作成（14回のやり取り）
    const conversationHistory = [
      { role: 'interviewer', content: '面接を始めます。' },
      { role: 'student', content: 'よろしくお願いします。' },
      { role: 'interviewer', content: 'それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。' },
      { role: 'student', content: '私は小学4年生から環境委員会でメダカの飼育をしています。毎日観察記録をつけて、pH値も測定しています。' },
      { role: 'interviewer', content: 'メダカの飼育で、pH値測定も行っているんですね。どのような目的でpH値を調べているのですか？' },
      { role: 'student', content: 'メダカが健康に育つ環境を作るためです。pH値が6.5から7.5の間が良いと本で読んだので、毎日チェックしています。' },
      { role: 'interviewer', content: 'pH値の管理、とても大切ですね。測定した結果、思うようにならなかった時はありませんでしたか？' },
      { role: 'student', content: 'はい、梅雨の時期にpH値が下がってしまい、メダカが元気がなくなったことがありました。' },
      { role: 'interviewer', content: 'pH値が下がった時の対処法は、どのように調べて実行しましたか？' },
      { role: 'student', content: '先生に相談したり、図書館で本を調べました。結果的に水替えの頻度を増やして解決できました。' },
      { role: 'interviewer', content: 'しっかりと原因を調べて解決されたんですね。その過程で一番困ったことはありましたか？' },
      { role: 'student', content: '最初は何が原因かわからなくて、メダカが病気になってしまうのではないかと心配でした。' },
      { role: 'interviewer', content: 'その心配を解決するために、どのような行動を取りましたか？' },
      { role: 'student', content: '環境委員会の友達と一緒に毎日様子を観察して、記録を詳しくつけるようにしました。' },
      { role: 'interviewer', content: 'チームワークで解決されたんですね。その協力の過程で、一番印象に残ったことはありましたか？' },
      { role: 'student', content: '友達が毎日データを一緒に確認してくれて、異常な数値にすぐ気づけるようになりました。一人では見落としていたと思います。' }
    ];

    const testData = {
      essayContent: {
        motivation: "明和中学校を志望します。",
        research: "学校見学に行きました。", 
        schoolLife: "友達と一緒に頑張りたいです。",
        future: "将来は科学者になりたいです。",
        inquiryLearning: "メダカの飼育をしています。毎日観察記録をつけています。"
      },
      conversationHistory: conversationHistory,
      questionType: 'follow_up',
      currentStage: 'exploration',
      interviewDepth: 7
    };

    try {
      console.log('📤 テストデータ送信');
      console.log('- 会話履歴長:', conversationHistory.length);
      console.log('- 深度:', testData.interviewDepth);
      console.log('- 段階:', testData.currentStage);
      console.log('- 最後の学生回答:', conversationHistory[conversationHistory.length - 1].content);

      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const responseText = await response.text();
      console.log('📥 レスポンス状態:', response.status);
      console.log('📥 レスポンス長:', responseText.length);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      setResult(result);
      
      console.log('✅ テスト成功!');
      console.log('📝 生成された質問:', result.question);
      console.log('📊 段階:', result.stageInfo?.currentStage);
      console.log('📊 深度:', result.stageInfo?.depth);

    } catch (err: any) {
      console.error('❌ テストエラー:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeQuestion = (question: string) => {
    const analyses = {
      length: question.length,
      hasInquiryKeywords: /メダカ|pH|観察|記録|測定|環境委員会/.test(question),
      hasDeepDiveElements: /変わった|学んだ|今後|振り返って|体験を通して|一番大きな|成長/.test(question),
      hasBasicElements: /説明してください|教えてください/.test(question),
      hasContextualElements: /友達と一緒に|記録を詳しく|毎日様子を/.test(question)
    };
    return analyses;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">
          🔧 深度7問題の修正テスト
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">修正内容</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• 探究段階の継続条件を `conversationPairs.length &lt; 7` から `conversationPairs.length &lt; 9` に変更</p>
            <p>• 深度7での適切な深掘り質問生成を確保</p>
            <p>• 会話履歴14個（7ペア）で深掘り質問が生成されるかテスト</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={runTest}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⏳ テスト実行中...' : '🚀 深度7テスト実行'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">❌ エラー</h3>
            <pre className="text-red-600 text-sm overflow-auto">{error}</pre>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-green-800 font-semibold mb-4">✅ テスト結果</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">基本情報</h4>
                <div className="text-sm space-y-1">
                  <p><strong>段階:</strong> {result.stageInfo?.currentStage || 'unknown'}</p>
                  <p><strong>深度:</strong> {result.stageInfo?.depth || 0}</p>
                  <p><strong>継続強化:</strong> {result.continuityEnhanced ? '✅' : '❌'}</p>
                  <p><strong>強制深掘り:</strong> {result.forceDeepDive ? '✅' : '❌'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">質問分析</h4>
                {(() => {
                  const analysis = analyzeQuestion(result.question || '');
                  return (
                    <div className="text-sm space-y-1">
                      <p><strong>長さ:</strong> {analysis.length}文字</p>
                      <p><strong>探究キーワード:</strong> {analysis.hasInquiryKeywords ? '✅' : '❌'}</p>
                      <p><strong>深層要素:</strong> {analysis.hasDeepDiveElements ? '✅' : '❌'}</p>
                      <p><strong>基本要素:</strong> {analysis.hasBasicElements ? '⚠️' : '✅'}</p>
                      <p><strong>文脈要素:</strong> {analysis.hasContextualElements ? '✅' : '❌'}</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">生成された質問</h4>
              <div className="bg-gray-100 p-4 rounded border">
                <p className="text-gray-800">{result.question}</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">完全なレスポンス</h4>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}