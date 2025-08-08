import { NextRequest, NextResponse } from 'next/server';

// 🚨 緊急: 「メインはAIチャット」原則の実証
// 完全にクリーンなAI面接システム

// 🧠 AI駆動の不適切回答検出システム
async function detectInappropriateAnswerAI(userMessage: string, conversationHistory: any[]): Promise<{isInappropriate: boolean, reason: string}> {
  console.log('🧠 AI不適切回答判定開始:', userMessage);
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = 'AIzaSyDhSwuxAwrIccB5L4GG0Y7jvz6Rabe21qk';
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.1  // より保守的な判定のため低温度
      }
    });
    
    // 過去の質問を取得
    const lastQuestion = conversationHistory.length > 0 
      ? conversationHistory[conversationHistory.length - 1].content 
      : '受検番号と名前を教えてください。';
    
    const prompt = `You are judging a 6th grader's interview answer for appropriateness.

Question: "${lastQuestion}"
Student Answer: "${userMessage}"

Is this answer INAPPROPRIATE for a serious school interview?

CLEARLY INAPPROPRIATE examples:
- Famous names: 夏目漱石, 織田信長, ドラえもん, ピカチュウ
- Fantasy: どこでもドア, magic, time travel, superpowers
- Impossible transport: 新幹線, airplane, rocket, teleport, ダッシュ (running/dash as main transport)
- Joking: "冗談です", "適当です", obvious lies
- Nonsense: gibberish, completely unrelated answers

APPROPRIATE examples:
- Normal names: 山田太郎, 佐藤花子
- Real transport: 電車(train), バス(bus), 自転車(bike), 歩き(walking)
- Real activities: programming, sports, music, studying
- Honest student responses

CRITICAL: "ダッシュできました" (came by dashing/running) as transportation method is INAPPROPRIATE - it's not a realistic way to commute to school.

Return JSON only:
{"inappropriate": true/false, "reason": "why inappropriate or appropriate"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // JSONクリーニング
    if (text.includes('```json')) {
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }
    
    try {
      const parsed = JSON.parse(text);
      const isInappropriate = parsed.inappropriate === true;
      console.log(`🧠 AI判定結果: ${isInappropriate ? '不適切' : '適切'} (理由: ${parsed.reason})`);
      
      return {
        isInappropriate,
        reason: parsed.reason || '判定完了'
      };
    } catch (parseError) {
      console.log('⚠️ AI判定JSONパース失敗、保守的に適切と判定');
      return {isInappropriate: false, reason: 'AI判定エラー（保守的判定）'};
    }
    
  } catch (error) {
    console.error('❌ AI判定エラー:', error);
    // AIエラー時は緊急的にキーワードベース判定にフォールバック
    return detectInappropriateAnswerBasic(userMessage);
  }
}

// 🚨 AI判定エラー時の超シンプルフォールバック
function detectInappropriateAnswerBasic(userMessage: string): {isInappropriate: boolean, reason: string} {
  // AIエラー時は極めて保守的に判定（ほぼ全て適切とみなす）
  console.log('⚠️ AIエラーのため基本判定モード');
  
  if (userMessage.length < 2) {
    return {isInappropriate: true, reason: '極端に短い回答'};
  }
  
  // AIエラー時はとりあえず適切と判定して面接続行
  return {isInappropriate: false, reason: 'AI判定エラー時の保守的判定'};
}

export async function POST(request: NextRequest) {
  console.log('🚀 緊急テストAI面接エンドポイント開始');
  
  try {
    const body = await request.json();
    const { userMessage, conversationHistory = [] } = body;
    
    console.log('📥 受検生メッセージ:', userMessage);
    console.log('📥 会話履歴件数:', conversationHistory.length);
    
    // 🧠 AI駆動の不適切回答検出 - 強制実行
    if (userMessage) {
      console.log('🎭 不適切回答チェック強制実行中...');
      console.log('🎭 チェック対象:', userMessage);
      
      const inappropriateCheck = await detectInappropriateAnswerAI(userMessage, conversationHistory);
      
      console.log('🎭 AI判定結果:', inappropriateCheck);
      console.log('🎭 不適切判定:', inappropriateCheck.isInappropriate);
      console.log('🎭 判定理由:', inappropriateCheck.reason);
      
      if (inappropriateCheck.isInappropriate) {
        console.log('🚨🚨🚨 不適切回答検出！即座に対応！🚨🚨🚨');
        console.log('🚨 対象メッセージ:', userMessage);
        console.log('🚨 AI検出理由:', inappropriateCheck.reason);
        
        return NextResponse.json({
          question: 'すみません、今は面接の場ですので、真剣にお答えいただけますか？あらためて、お名前を教えてください。',
          aiGenerated: false,
          inappropriate: true,
          inappropriateReason: inappropriateCheck.reason,
          seriousReminder: true,
          aiJudgment: true,
          userMessage: userMessage, // デバッグ用
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('✅ 適切な回答と判定、面接続行');
      }
    }
    
    // Gemini API呼び出し
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = 'AIzaSyDhSwuxAwrIccB5L4GG0Y7jvz6Rabe21qk';
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4
        // maxOutputTokensは設定しない - 必要に応じてGeminiが自動調整
      }
    });
    
    // 明和中面接特化プロンプト - 正しい面接流れ重視
    const conversationContext = conversationHistory.map(h => `${h.role}: "${h.content}"`).join('\n');
    
    const prompt = `You are a Meiwa Middle School interviewer following the EXACT interview structure.

CONVERSATION SO FAR:
${conversationContext}
STUDENT JUST SAID: "${userMessage}"

🚨 CRITICAL MEIWA INTERVIEW FLOW:
1. Name/Number → Transportation (どうやって来ましたか？)
2. Transportation → Time taken (どのくらいかかりましたか？) 
3. Time → IMMEDIATELY move to 探究活動 with "1分ほどで"

❌ FORBIDDEN: Random chitchat, study habits, train activities, personal interests
✅ REQUIRED: Stick to the official interview progression

CURRENT STAGE DETECTION:
- If just got transportation method → ask time taken
- If just got time → MUST ask 探究活動 with "1分ほどで説明してください"
- NO other topics allowed until 探究活動 phase

EXACT TRANSITION PHRASE:
"ありがとうございます。それでは、あなたがこれまで打ち込んできた探究活動について、1分ほどで説明してください。"

JSON format:
{"question": "Exact interview question with proper flow", "reasoning": "Stage in interview progression"}`;
    
    console.log('📤 Gemini API呼び出し中...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    console.log('📥 Geminiレスポンス:', text);
    
    // ```json```ブロックを除去
    if (text.includes('```json')) {
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('🧹 クリーニング後:', text);
    }
    
    try {
      const parsed = JSON.parse(text);
      console.log('🎉 AI生成質問:', parsed.question);
      console.log('📝 理由:', parsed.reason);
      
      return NextResponse.json({
        question: parsed.question,
        aiGenerated: true,
        reason: parsed.reason,
        followUpType: 'ai_generated',
        timestamp: new Date().toISOString()
      });
      
    } catch (parseError) {
      console.log('⚠️ JSONパース失敗、正規表現で抽出');
      const questionMatch = text.match(/"question":\s*"([^"]+)"/);
      if (questionMatch) {
        return NextResponse.json({
          question: questionMatch[1],
          aiGenerated: true,
          followUpType: 'regex_extracted',
          timestamp: new Date().toISOString()
        });
      }
      
      // 最後の手段
      return NextResponse.json({
        question: 'すみません、もう一度お答えいただけますか？',
        aiGenerated: false,
        followUpType: 'emergency',
        error: parseError.message,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ 緊急テストAPI エラー:', error);
    return NextResponse.json({
      question: 'システムに問題が発生しました。もう一度お試しください。',
      aiGenerated: false,
      followUpType: 'system_error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}