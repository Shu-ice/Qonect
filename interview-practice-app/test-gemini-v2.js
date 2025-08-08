// Gemini API V2テスト - 実際の面接シナリオ

async function testGeminiV2() {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = 'AIzaSyDhSwuxAwrIccB5L4GG0Y7jvz6Rabe21qk';
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 500,  // 200から500に増やす
        temperature: 0.4
      }
    });
    
    // 実際のプロンプト
    const prompt = `You are interviewing a 6th grader for Meiwa Middle School.

Previous question: "受検番号と名前を教えてください。"
Student answer: "1234番 田中太郎です"

Generate the NEXT natural follow-up question in Japanese.

CRITICAL RULES:
1. Question must be in Japanese
2. Must end with ？
3. Maximum 30 characters
4. Relate to student's answer
5. Use polite form

Meiwa interview flow:
- After name → ask about transportation
- After transportation → ask about exploration activities  
- Always be specific to their answer

Return JSON:
{"question": "Japanese question here", "reasoning": "brief reason"}`;
    
    console.log('📤 Gemini API呼び出し...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log('📥 レスポンスオブジェクト:', response);
    console.log('📥 生レスポンス長:', text.length);
    console.log('📥 生レスポンス:');
    console.log(text || '(空のレスポンス)');
    console.log('\n');
    
    // クリーニング
    let cleanText = text;
    if (text.includes('```json')) {
      cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      console.log('🧹 クリーニング後:');
      console.log(cleanText);
      console.log('\n');
    }
    
    // JSONパース
    try {
      const parsed = JSON.parse(cleanText);
      console.log('✅ パース成功:');
      console.log('質問:', parsed.question);
      console.log('理由:', parsed.reasoning);
    } catch (e) {
      console.log('❌ パース失敗:', e.message);
      
      // 正規表現で抽出
      const patterns = [
        /"question"\s*:\s*"([^"]+)"/,
        /\"question\"\s*:\s*\"([^\"]+)\"/,
        /"question":"([^"]+)"/
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          console.log('✅ 正規表現で抽出:', match[1]);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.error(error.stack);
  }
}

testGeminiV2();