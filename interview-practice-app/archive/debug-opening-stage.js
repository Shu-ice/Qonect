// 🚀 Opening段階デバッグテスト
const fetch = require('node-fetch');

async function debugOpeningStage() {
  console.log('🔍 Opening段階デバッグテスト開始');
  console.log('=====================================');
  
  const testCases = [
    {
      name: '1回目: 面接開始（受験番号・名前質問後）',
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
        { role: 'student', content: '1234番 夏目漱石である' }
      ],
      currentStage: 'opening',
      interviewDepth: 1
    },
    {
      name: '2回目: 名前確認後（交通機関質問が来るべき）',
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
        { role: 'student', content: '1234番 夏目漱石です' },
        { role: 'interviewer', content: 'はい、夏目さんですね。よろしくお願いします。' },
        { role: 'student', content: 'よろしくお願いします' }
      ],
      currentStage: 'opening',
      interviewDepth: 2
    },
    {
      name: '3回目: 正常フロー確認（明示的にopening段階）',
      conversationHistory: [
        { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
        { role: 'student', content: '1234番 来迎寺太郎です' }
      ],
      currentStage: 'opening',
      interviewDepth: 1
    }
  ];
  
  const essayContent = {
    motivation: "明和中学校で学びたいです",
    research: "学校見学に行きました",
    schoolLife: "友達と一緒に頑張りたいです", 
    future: "科学者になりたいです",
    inquiryLearning: "メダカの飼育をしています。毎日観察記録をつけて、水温やpHの変化を記録しています。"
  };
  
  for (const testCase of testCases) {
    console.log(`\n🧪 テストケース: ${testCase.name}`);
    console.log('─'.repeat(50));
    
    try {
      const response = await fetch('http://localhost:3001/api/interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayContent,
          conversationHistory: testCase.conversationHistory,
          questionType: 'follow_up',
          currentStage: testCase.currentStage,
          interviewDepth: testCase.interviewDepth
        })
      });
      
      console.log(`📤 送信データ: currentStage="${testCase.currentStage}", depth=${testCase.interviewDepth}`);
      console.log(`📤 会話履歴: ${testCase.conversationHistory.length}件`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ HTTP エラー ${response.status}: ${errorText}`);
        continue;
      }
      
      const data = await response.json();
      
      console.log(`✅ 生成質問: "${data.question}"`);
      console.log(`📊 段階情報: ${data.stageInfo || 'なし'}`);
      console.log(`⚡ 段階移行: ${data.stageTransition ? JSON.stringify(data.stageTransition) : 'なし'}`);
      
      // 🚀 重要: 交通機関質問が含まれているかチェック
      const isTransportationQuestion = /交通|電車|バス|車|自転車|歩い|通学|来.*まで/i.test(data.question);
      console.log(`🚗 交通機関質問判定: ${isTransportationQuestion ? '✅ YES' : '❌ NO'}`);
      
      // 🚀 重要: かみ合わない質問かチェック  
      const isMismatchedQuestion = /活動.*結果|予想.*違っ|対処/i.test(data.question);
      console.log(`🔍 かみ合わない質問判定: ${isMismatchedQuestion ? '❌ YES (問題)' : '✅ NO (正常)'}`);
      
    } catch (error) {
      console.log(`❌ ネットワークエラー: ${error.message}`);
    }
    
    // テスト間の待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 Opening段階デバッグテスト完了');
}

debugOpeningStage().catch(console.error);