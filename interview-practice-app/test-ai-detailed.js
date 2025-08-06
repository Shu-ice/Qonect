// AI生成詳細テスト
const testAIDetailed = async () => {
  console.log('🧪 詳細テスト開始');
  
  try {
    console.log('📡 API呼び出し開始...');
    
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
          },
          {
            role: 'student',
            content: '1234番橋本健一です'
          }
        ],
        userMessage: '1234番橋本健一です',
        studentAnswerCount: 1
      }),
    });

    console.log('📊 レスポンスステータス:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ エラーレスポンス:', errorText);
      return;
    }

    const data = await response.json();
    console.log('📋 完全レスポンス:', JSON.stringify(data, null, 2));
    
    if (data.question && data.question !== 'すみません、もう一度お答えいただけますでしょうか？') {
      console.log('✅ AI生成成功!');
      console.log('💬 生成された質問:', data.question);
    } else {
      console.log('⚠️ フォールバックが返されました');
      console.log('🔍 デバッグ情報を確認してください');
    }
    
  } catch (error) {
    console.error('💥 テストエラー:', error.message);
  }
};

testAIDetailed();