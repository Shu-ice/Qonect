/**
 * シンプルなAPIテスト
 */

async function testAPI() {
  console.log('🧪 シンプルAPIテスト開始');
  
  const testData = {
    essayContent: {
      motivation: "明和中学校を志望します。",
      research: "学校見学に行きました。", 
      schoolLife: "友達と一緒に頑張りたいです。",
      future: "将来は科学者になりたいです。",
      inquiryLearning: "メダカの飼育をしています。毎日観察記録をつけています。"
    },
    conversationHistory: [
      { role: 'interviewer', content: '面接を始めます。' },
      { role: 'student', content: 'よろしくお願いします。' },
      { role: 'interviewer', content: '探究活動について教えてください。' },
      { role: 'student', content: 'メダカを飼っています。毎日観察しています。pH値も測定しています。' }
    ],
    questionType: 'follow_up',
    currentStage: 'exploration',
    interviewDepth: 2
  };

  try {
    console.log('📤 送信データ:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3030/api/test/simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 レスポンス状態:', response.status);
    console.log('📥 レスポンスヘッダー:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📥 レスポンステキスト:', responseText);

    if (!response.ok) {
      console.error('❌ HTTPエラー:', response.status, responseText);
      return;
    }

    try {
      const result = JSON.parse(responseText);
      console.log('✅ テスト成功!');
      console.log('📝 生成された質問:', result.question);
      console.log('📊 段階:', result.stageInfo?.currentStage || 'unknown');
      console.log('📊 深度:', result.stageInfo?.depth || 0);
      
      if (result.continuityEnhanced) console.log('🔗 連続性強化');
      if (result.clarification) console.log('🚨 ツッコミ質問');
      if (result.seriousReminder) console.log('🎭 冷静なツッコミ');
      
    } catch (parseError) {
      console.error('❌ JSON解析エラー:', parseError);
      console.error('❌ レスポンステキスト:', responseText);
    }
    
  } catch (error) {
    console.error('❌ ネットワークエラー:', error);
  }
}

// テスト実行
testAPI().catch(console.error);