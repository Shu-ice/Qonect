// 環境変数テスト
require('dotenv').config();

console.log('🔍 環境変数チェック:');
console.log('GOOGLE_GENERATIVE_AI_API_KEY:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? '設定済み' : '未設定');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '設定済み' : '未設定');
console.log('AI_PRIMARY_PROVIDER:', process.env.AI_PRIMARY_PROVIDER);
console.log('ENABLE_REAL_AI_API:', process.env.ENABLE_REAL_AI_API);

// Gemini API直接テスト
const testGeminiDirect = async () => {
  try {
    console.log('\n🧪 Gemini API直接テスト開始...');
    
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      console.log('❌ API キーが見つかりません');
      return;
    }
    
    console.log(`🔑 API キー存在: ${apiKey.substring(0, 10)}...`);
    
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
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('💡 API キーが無効です。新しいキーを取得してください。');
    }
  }
};

testGeminiDirect();