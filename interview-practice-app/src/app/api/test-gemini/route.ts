import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// テスト目的のため認証をバイパス

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Gemini API key not found',
        status: 'fail'
      });
    }

    console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('📝 Sending test prompt to Gemini...');

    const prompt = `明和高校附属中学校の面接で、小学6年生が「ダンスをチームで練習しています」と答えました。次に聞くべき深掘り質問を1つ考えてください。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini Response:', text);

    return NextResponse.json({
      status: 'success',
      prompt: prompt,
      response: text,
      model: 'gemini-1.5-flash',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'fail',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}