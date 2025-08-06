// 単発リクエストテスト
const testSingleRequest = async () => {
  try {
    console.log('🧪 単発API呼び出しテスト');
    
    const response = await fetch('http://localhost:3000/api/interview/generate-question', {
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
        userMessage: '1234番橋本健一です',
        studentAnswerCount: 1
      }),
    });
    
    console.log('レスポンス状態:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 成功!');
      console.log('質問:', data.question);
      console.log('デバッグ情報:', data.debugInfo);
    } else {
      const errorText = await response.text();
      console.log('❌ エラー:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
};

testSingleRequest();