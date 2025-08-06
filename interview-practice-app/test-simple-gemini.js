// 簡単なGemini APIテスト
const testGeminiSimple = async () => {
  console.log('🧪 Gemini API簡易テスト開始...');
  
  // 環境変数を手動で設定
  const apiKey = 'AIzaSyDhSwuxAwrIccB5L4GG0Y7jvz6Rabe21qk';
  
  console.log(`🔑 API キー: ${apiKey.substring(0, 10)}...`);
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    console.log('📦 Google AI ライブラリ読み込み成功');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const testPrompt = '「1234番橋本健一です」という受験生の自己紹介に対して、面接官として自然な交通手段に関する質問を1つ生成してください。';
    
    console.log('📡 Gemini APIに送信中...');
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API成功!');
    console.log('💬 生成された質問:', text);
    
  } catch (error) {
    console.error('❌ Gemini APIエラー:', error.message);
    console.error('🔍 詳細エラー:', error);
  }
};

testGeminiSimple();