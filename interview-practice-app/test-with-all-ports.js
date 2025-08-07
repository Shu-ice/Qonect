// 動作中のポートを見つけてテスト
const testPorts = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3015, 3020, 3025, 3030, 3035, 3040, 3050];

const testPortApi = async (port) => {
  try {
    console.log(`🧪 ポート${port}テスト中...`);
    
    const response = await fetch(`http://localhost:${port}/api/interview/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essayContent: { 
          motivation: 'テスト', 
          research: 'テスト', 
          schoolLife: 'テスト', 
          future: 'テスト', 
          inquiryLearning: 'テスト' 
        },
        conversationHistory: [
          { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' }
        ],
        userMessage: '124夏目漱石です',
        studentAnswerCount: 1
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ポート${port}成功!`);
      console.log('質問:', data.question);
      return true;
    } else {
      console.log(`❌ ポート${port}エラー: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ポート${port}接続失敗`);
    return false;
  }
};

const testAllPorts = async () => {
  for (const port of testPorts) {
    const success = await testPortApi(port);
    if (success) {
      console.log(`🎯 正常動作ポート発見: ${port}`);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

testAllPorts();