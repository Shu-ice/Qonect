// 不適切回答検出デバッグテスト

async function testInappropriateDetection() {
  try {
    console.log('🧪 不適切回答検出テスト開始');
    
    const testCases = [
      { userMessage: "野比のぎたです", expected: true },
      { userMessage: "タケコプターできました", expected: true },
      { userMessage: "田中太郎です", expected: false }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📝 テスト: "${testCase.userMessage}"`);
      
      const response = await fetch('http://localhost:3004/api/test-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: testCase.userMessage,
          conversationHistory: [{
            role: 'interviewer',
            content: '受検番号と名前を教えてください。'
          }]
        }),
      });
      
      if (!response.ok) {
        console.error(`❌ HTTPエラー: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log('📥 レスポンス:', data);
      
      if (data.inappropriate) {
        console.log(`✅ 不適切回答として検出: ${data.inappropriateReason}`);
      } else {
        console.log(`⚠️ 適切回答として判定: ${data.question?.substring(0, 50)}...`);
      }
    }
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
  }
}

testInappropriateDetection();