// 正しいポートでAI生成テスト
const testCorrectPort = async () => {
  const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006];
  
  for (const port of ports) {
    try {
      console.log(`🧪 ポート${port}をテスト中...`);
      
      const response = await fetch(`http://localhost:${port}/api/interview/generate-question`, {
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

      if (response.status === 200) {
        const data = await response.json();
        console.log(`✅ ポート${port}で成功!`);
        console.log('📋 レスポンス:', JSON.stringify(data, null, 2));
        return;
      }
      
    } catch (error) {
      console.log(`❌ ポート${port}は接続不可`);
    }
  }
  
  console.log('💥 全てのポートでAPIが見つかりませんでした');
};

testCorrectPort();