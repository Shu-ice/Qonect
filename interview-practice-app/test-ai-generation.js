// AI生成テスト
const testAIGeneration = async () => {
  try {
    const response = await fetch('http://localhost:3006/api/interview/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        essayContent: {
          motivation: 'テスト志望動機',
          research: 'テスト研究内容',  
          schoolLife: 'テスト学校生活',
          future: 'テスト将来の夢',
          inquiryLearning: 'テスト探究学習'
        },
        conversationHistory: [
          {
            role: 'interviewer',
            content: 'それでは面接を始めます。受検番号と名前を教えてください。'
          }
        ],
        userMessage: '1234番橋本健一です',
        studentAnswerCount: 1
      }),
    });

    const data = await response.json();
    console.log('レスポンス:', JSON.stringify(data, null, 2));
    console.log('質問:', data.question);
    
    if (response.ok) {
      console.log('✅ API呼び出し成功');
    } else {
      console.log('❌ API呼び出し失敗:', response.status);
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
};

testAIGeneration();