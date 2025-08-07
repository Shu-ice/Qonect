// 面接フロー確認テスト
const testInterviewFlow = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // 段階1: 交通手段質問（studentAnswerCount=1）
  console.log('🧪 段階1: 交通手段質問テスト');
  try {
    const response1 = await fetch(`${baseUrl}/api/interview/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essayContent: { motivation: 'テスト', research: 'テスト', schoolLife: 'テスト', future: 'テスト', inquiryLearning: 'テスト' },
        conversationHistory: [{ role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' }],
        userMessage: '1234番橋本健一です',
        studentAnswerCount: 1
      }),
    });
    const data1 = await response1.json();
    console.log('段階1結果:', data1.question);
  } catch (error) {
    console.error('段階1エラー:', error);
  }

  // 段階2: 所要時間質問（studentAnswerCount=2）
  console.log('\n🧪 段階2: 所要時間質問テスト');
  try {
    const response2 = await fetch(`${baseUrl}/api/interview/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essayContent: { motivation: 'テスト', research: 'テスト', schoolLife: 'テスト', future: 'テスト', inquiryLearning: 'テスト' },
        conversationHistory: [
          { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
          { role: 'student', content: '1234番橋本健一です' },
          { role: 'interviewer', content: 'こちらまではどのような交通手段でいらっしゃいましたか？' }
        ],
        userMessage: '電車できました',
        studentAnswerCount: 2
      }),
    });
    const data2 = await response2.json();
    console.log('段階2結果:', data2.question);
  } catch (error) {
    console.error('段階2エラー:', error);
  }

  // 段階3: 探究活動開始質問（studentAnswerCount=3）
  console.log('\n🧪 段階3: 探究活動開始質問テスト');
  try {
    const response3 = await fetch(`${baseUrl}/api/interview/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essayContent: { motivation: 'テスト', research: 'テスト', schoolLife: 'テスト', future: 'テスト', inquiryLearning: 'テスト' },
        conversationHistory: [
          { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
          { role: 'student', content: '1234番橋本健一です' },
          { role: 'interviewer', content: 'こちらまではどのような交通手段でいらっしゃいましたか？' },
          { role: 'student', content: '電車できました' },
          { role: 'interviewer', content: 'どのくらいお時間がかかりましたか？' }
        ],
        userMessage: '30分です',
        studentAnswerCount: 3
      }),
    });
    const data3 = await response3.json();
    console.log('段階3結果:', data3.question);
  } catch (error) {
    console.error('段階3エラー:', error);
  }
};

testInterviewFlow();