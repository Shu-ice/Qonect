// 🚀 簡易API動作テスト
const fetch = require('node-fetch');

async function testSimpleAPI() {
  console.log('🧪 簡易面接API動作確認テスト開始');
  console.log('=====================================');
  
  const essayContent = {
    motivation: "明和中学校で学びたいです",
    research: "学校見学に行きました",
    schoolLife: "友達と一緒に頑張りたいです", 
    future: "科学者になりたいです",
    inquiryLearning: "メダカの飼育をしています。毎日観察記録をつけて、水温やpHの変化を記録しています。"
  };
  
  // テストシナリオ：面接の流れを再現
  const testScenarios = [
    {
      step: 1,
      description: '面接開始',
      conversationHistory: [],
      expected: '受検番号と名前を聞く質問'
    },
    {
      step: 2,
      description: '名前回答後（来迎寺テスト）',
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
        { role: 'student', content: '1234番 来迎寺太郎です' }
      ],
      expected: '交通手段を聞く質問（来迎寺に言及）'
    },
    {
      step: 3,
      description: '交通手段回答後',
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
        { role: 'student', content: '1234番 来迎寺太郎です' },
        { role: 'interviewer', content: '来迎寺からお越しいただきありがとうございます。こちらまではどのような交通手段でいらっしゃいましたか？' },
        { role: 'student', content: '自転車で来ました' }
      ],
      expected: '所要時間を聞く質問'
    },
    {
      step: 4,
      description: '時間回答後',
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
        { role: 'student', content: '1234番 来迎寺太郎です' },
        { role: 'interviewer', content: '来迎寺からお越しいただきありがとうございます。こちらまではどのような交通手段でいらっしゃいましたか？' },
        { role: 'student', content: '自転車で来ました' },
        { role: 'interviewer', content: 'なるほど。どのくらいの時間がかかりましたか？' },
        { role: 'student', content: '15分ぐらいです' }
      ],
      expected: '探究活動の説明を求める質問'
    }
  ];
  
  for (const scenario of testScenarios) {
    console.log(`\n🧪 ステップ${scenario.step}: ${scenario.description}`);
    console.log('─'.repeat(50));
    
    try {
      const response = await fetch('http://localhost:3003/api/interview/generate-question-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayContent,
          conversationHistory: scenario.conversationHistory,
          currentStage: 'opening',
          interviewDepth: scenario.step
        })
      });
      
      console.log(`📤 会話履歴: ${scenario.conversationHistory.length}件`);
      console.log(`📋 期待される質問: ${scenario.expected}`);
      
      if (!response.ok) {
        console.log(`❌ HTTP エラー ${response.status}: ${await response.text()}`);
        continue;
      }
      
      const data = await response.json();
      
      console.log(`✅ 生成された質問: "${data.question}"`);
      console.log(`📊 段階: ${data.stage}, 深度: ${data.depth}`);
      
      // 🎯 重要チェック：来迎寺の交通機関質問
      if (scenario.step === 2) {
        const hasTransportQuestion = /交通|電車|バス|車|自転車|歩い|どのような.*手段/i.test(data.question);
        const mentionsLocation = /来迎寺/i.test(data.question);
        console.log(`🚗 交通手段質問: ${hasTransportQuestion ? '✅ YES' : '❌ NO'}`);
        console.log(`🏠 来迎寺言及: ${mentionsLocation ? '✅ YES' : '❌ NO'}`);
      }
      
    } catch (error) {
      console.log(`❌ エラー: ${error.message}`);
    }
    
    // テスト間の待機
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🏁 簡易面接API動作確認テスト完了');
  console.log('=====================================');
}

testSimpleAPI().catch(console.error);