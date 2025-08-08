// 🚨 緊急修正: Gemini API直接呼び出しで面接質問生成テスト

const fs = require('fs');
const path = require('path');

// APIキー
const apiKey = 'AIzaSyDhSwuxAwrIccB5L4GG0Y7jvz6Rabe21qk';

async function testInterviewGeneration() {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    console.log('🚀 緊急Gemini APIテスト開始');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // 明和中面接に特化したプロンプト
    const prompt = `You are a Meiwa Middle School interviewer talking to a 6th grade student.

Previous question: "受検番号と名前を教えてください。"  
Student answer: "1234番 田中太郎です"

Generate the NEXT natural question in Japanese. For Meiwa interviews, after name/number comes questions about HOW they got to school.

Rules:
1. MUST be in Japanese
2. MUST end with ？
3. Should ask about transportation/journey to school
4. Polite form for elementary student
5. Maximum 25 characters

Expected response: Ask about how they came to school today.

Return JSON:
{"question": "Japanese question", "reasoning": "reason"}`;

    console.log('📤 プロンプト送信中...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 Geminiレスポンス:', text);
    
    try {
      const parsed = JSON.parse(text);
      console.log('✅ 生成された質問:', parsed.question);
      console.log('✅ 理由:', parsed.reasoning);
      
      // 期待される質問かチェック
      if (parsed.question && parsed.question.includes('来') || parsed.question.includes('どうやって')) {
        console.log('🎉 適切な面接質問が生成されました！');
      } else {
        console.log('⚠️ 期待と異なる質問:', parsed.question);
      }
      
    } catch (parseError) {
      console.log('⚠️ JSONパース失敗:', parseError.message);
      console.log('生テキスト:', text);
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

testInterviewGeneration();