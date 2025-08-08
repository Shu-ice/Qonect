import { NextRequest, NextResponse } from 'next/server';

// 🎯 「メインはAIチャット」原則の完全実装
// 明和中学校面接専用AI質問生成システム V2

interface ConversationHistory {
  role: 'interviewer' | 'student';
  content: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const {
      conversationHistory = [],
      currentStage = 'opening',
      interviewDepth = 1,
      userMessage = '',
      studentAnswerCount = 0
    } = body;
    
    console.log('📥 リクエスト受信:', {
      stage: currentStage,
      depth: interviewDepth,
      userMessage: userMessage?.substring(0, 50),
      answerCount: studentAnswerCount
    });
    
    // 初回質問（面接開始時）
    if (studentAnswerCount === 0 && !userMessage) {
      console.log('🎬 面接開始 - 初回質問生成');
      return NextResponse.json({
        question: 'それでは面接を始めます。受検番号と名前を教えてください。',
        stageTransition: null,
        depth: 1,
        initialQuestion: true,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
    
    // 受検生の混乱・不適切回答の検出
    const confusionPatterns = [
      'アガサクリスティ', 'クリスティ', '駆動', 'しんいち',
      'わからない', '何度', '何言って', 'たすけて',
      '500人', '1000人', '？？'
    ];
    
    if (userMessage && confusionPatterns.some(p => userMessage.includes(p))) {
      console.log('🚨 混乱・不適切回答検出:', userMessage);
      return NextResponse.json({
        question: 'すみません、もう一度お名前を教えていただけますか？',
        stageTransition: null,
        depth: interviewDepth,
        confusionDetected: true,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
    
    // 🎯 AI動的質問生成（メインはAIチャット）
    if (userMessage) {
      console.log('🚀 AI動的質問生成開始');
      
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const apiKey = 'AIzaSyDhSwuxAwrIccB5L4GG0Y7jvz6Rabe21qk';
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: {
            // maxOutputTokensを削除 - Geminiのデフォルト値（8192）を使用
            temperature: 0.4
          }
        });
        
        // 前の質問を取得
        const lastQuestion = conversationHistory.length > 0 
          ? conversationHistory[conversationHistory.length - 1].content 
          : '受検番号と名前を教えてください。';
        
        // 明和中面接に特化したプロンプト（簡素化版）
        const prompt = `Meiwa Middle School interview. Student said: "${userMessage}"

Generate next interview question in Japanese. After name, ask about transportation.

Return JSON: {"question": "Japanese question"}`;
        
        console.log('📤 Gemini API呼び出し...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();
        
        console.log('📥 Geminiレスポンス長:', text.length);
        console.log('📥 Geminiレスポンス:', text.substring(0, 500));
        
        // 空のレスポンスチェック
        if (!text || text.length === 0) {
          console.error('❌ Gemini APIから空のレスポンス');
          throw new Error('Empty response from Gemini');
        }
        
        // 🎯 Geminiレスポンスの確実なクリーニング
        let cleanText = text;
        if (text.includes('```json')) {
          console.log('📝 ```json```ブロック検出 - クリーニング実行');
          cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        }
        
        // さらなるクリーニング：余分な空白・改行を除去
        cleanText = cleanText.replace(/^\s+|\s+$/g, '').replace(/\n\s*\n/g, '\n');
        console.log('🧹 クリーニング後テキスト:', cleanText.substring(0, 200));
        
        try {
          const parsed = JSON.parse(cleanText);
          console.log('✅ AI生成成功:', parsed.question);
          
          return NextResponse.json({
            question: parsed.question,
            stageTransition: null,
            depth: interviewDepth + 1,
            reflectionType: 'ai_generated',
            reflectionBased: true,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          });
          
        } catch (parseError) {
          console.log('⚠️ JSONパース失敗、正規表現抽出開始');
          console.log('⚠️ パースエラー:', parseError.message);
          
          // 複数の正規表現パターンで質問を抽出
          const patterns = [
            /"question"\s*:\s*"([^"]+)"/,
            /\"question\"\s*:\s*\"([^\"]+)\"/,
            /"question":"([^"]+)"/,
            /\{\s*"question"\s*:\s*"([^"]+)"/
          ];
          
          for (const pattern of patterns) {
            const match = cleanText.match(pattern) || text.match(pattern);
            if (match && match[1]) {
              console.log('✅ 正規表現で質問抽出成功:', match[1]);
              return NextResponse.json({
                question: match[1],
                stageTransition: null,
                depth: interviewDepth + 1,
                reflectionType: 'ai_extracted',
                reflectionBased: true,
                responseTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
              });
            }
          }
          
          // 🚨 AI質問抽出失敗 - 明和中面接の正しい質問を返す
          console.error('❌ **「メインはAIチャット」原則違反** - AI生成完全失敗');
          console.error('❌ Geminiレスポンス:', text.substring(0, 500));
          
          // 受検生の回答に基づいた適切な質問を選択
          let emergencyQuestion = 'ありがとうございます。こちらまで、どうやって来られましたか？';
          
          if (userMessage.includes('電車') || userMessage.includes('バス') || userMessage.includes('自転車')) {
            emergencyQuestion = '時間はどのくらいかかりましたか？';
          } else if (userMessage.includes('分') || userMessage.includes('時間')) {
            emergencyQuestion = 'それでは、あなたがこれまで打ち込んできた探究活動について、1分ほどで説明してください。';
          } else if (conversationHistory.length === 0 || userMessage.includes('番')) {
            emergencyQuestion = 'ありがとうございます。こちらまで、どうやって来られましたか？';
          }
          
          return NextResponse.json({
            question: emergencyQuestion,
            stageTransition: null,
            depth: interviewDepth + 1,
            reflectionType: 'emergency_proper_fallback',
            reflectionBased: false,
            aiFailureReason: 'extraction_failed',
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (aiError: any) {
        console.error('❌ AI生成エラー:', aiError.message);
        
        // AIエラー時の緊急フォールバック
        const fallbackQuestions = [
          'ありがとうございます。こちらまで、どうやって来られましたか？',
          '時間はどのくらいかかりましたか？',
          'それでは、あなたがこれまで打ち込んできた探究活動について、1分ほどで説明してください。'
        ];
        
        const fallbackQuestion = fallbackQuestions[interviewDepth % fallbackQuestions.length];
        
        return NextResponse.json({
          question: fallbackQuestion,
          stageTransition: null,
          depth: interviewDepth + 1,
          reflectionType: 'emergency_fallback',
          reflectionBased: false,
          aiError: aiError.message,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // デフォルトレスポンス
    return NextResponse.json({
      question: 'それでは面接を始めます。受検番号と名前を教えてください。',
      stageTransition: null,
      depth: 1,
      reflectionType: 'default',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ APIエラー:', error.message);
    
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}