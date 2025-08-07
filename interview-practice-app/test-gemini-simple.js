// Gemini 2.5 Flash簡単テスト
const testGemini = async () => {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = 'AIzaSyDhSwuxAwrIccB5L4GG0Y7jvz6Rabe21qk';
    
    console.log('🤖 Gemini 2.5 Flash簡単テスト');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0.3
      }
    });
    
    const prompt = '面接官として「124夏目漱石です」という自己紹介に対して、交通手段を聞く質問を1つ生成してください。';
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ 成功:', text);
    
  } catch (error) {
    console.error('❌ エラー:', error);
    console.error('Status:', error.status);
    console.error('StatusText:', error.statusText);
  }
};

testGemini();