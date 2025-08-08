// Gemini API直接テスト
const fs = require('fs');
const path = require('path');

// .envファイル読み込み
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContents = fs.readFileSync(envPath, 'utf8');
  const lines = envContents.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

async function testGemini() {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    console.log('API Key found:', !!apiKey);
    if (apiKey) {
      console.log('API Key prefix:', apiKey.substring(0, 20) + '...');
    }
    
    if (!apiKey) {
      console.log('❌ APIキーが見つかりません');
      return;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = 'Hello. Please create a simple question. Return as JSON format {"question": "question text"}.';
    
    console.log('Gemini APIテスト開始...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('レスポンス:', text);
    
  } catch (error) {
    console.error('エラー:', error.message);
    console.error('スタック:', error.stack);
  }
}

testGemini();