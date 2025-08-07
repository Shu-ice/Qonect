// Gemini API接続テスト
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiConnection() {
  const apiKey = "AIzaSyBWoKe6EvNGZgLNWjJcLKSiLWI-WDh0FTk";
  
  if (!apiKey) {
    console.log('❌ API key not found');
    return;
  }

  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('📝 Testing basic connection...');

    const prompt = `明和高校附属中学校の面接で、小学6年生の受験生が「ダンスを習っています」と答えました。

次に聞くべき深掘り質問を1つ考えてください。小学6年生に適した言葉で、自然な会話調で回答してください。`;

    console.log('🚀 Sending request to Gemini...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Success! Gemini Response:');
    console.log('---');
    console.log(text);
    console.log('---');

    // より複雑なプロンプトでテスト
    console.log('\n📝 Testing complex prompt...');
    
    const complexPrompt = `以下は明和高校附属中学校の面接です。

【生徒の志願理由書】
探究活動: 「私は小学3年生から生き物の飼育をしています。特にメダカの観察を続け、餌によって色が変わることを発見しました。」

【面接官の質問】「生き物の飼育について詳しく教えてください」

【生徒の回答】「メダカを飼っていて、餌を変えると色が変わることがわかりました。赤い餌をあげると少し赤くなって、緑の餌だと緑っぽくなります。」

明和中学校の求める探究活動の7つの評価項目を考慮して、次に聞くべき深掘り質問を1つ提案してください：
1. 真の興味・関心度
2. 体験・学び基盤性  
3. 社会・日常連結性
4. 探究性・非正解性
5. 他者理解・共感可能性
6. 自己変容・成長実感
7. 自分の言葉表現力

質問のみを回答してください。`;

    const complexResult = await model.generateContent(complexPrompt);
    const complexResponse = await complexResult.response;
    const complexText = complexResponse.text();

    console.log('✅ Complex prompt response:');
    console.log('---');
    console.log(complexText);
    console.log('---');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('💡 API key might be invalid or expired');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.log('💡 API quota exceeded');
    } else if (error.message.includes('BLOCKED')) {
      console.log('💡 Request was blocked by safety filters');
    }
  }
}

testGeminiConnection();