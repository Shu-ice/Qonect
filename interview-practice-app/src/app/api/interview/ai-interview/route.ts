import { NextRequest, NextResponse } from 'next/server';

// 🧠 真のAI面接システム - 受検生の発言を理解してリアクション

export async function POST(request: NextRequest) {
  console.log('🎯 真のAI面接システム起動');
  
  try {
    const body = await request.json();
    const { userMessage, conversationHistory = [] } = body;
    
    console.log('📥 受検生:', userMessage);
    
    // Gemini API - 受検生の発言を理解して適切に反応
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = 'AIzaSyDhSwuxAwrIccB5L4GG0Y7jvz6Rabe21qk';
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3  // より正確な判断のため低温度
      }
    });
    
    // 会話履歴
    const context = conversationHistory.map(h => `${h.role === 'interviewer' ? '面接官' : '受検生'}: ${h.content}`).join('\n');
    
    // 会話段階を検出
    const hasAskedTransport = conversationHistory.some(h => 
      h.content.includes('どうやって来ましたか') || 
      h.content.includes('どのようにして来ましたか')
    );
    const hasAskedTime = conversationHistory.some(h => 
      h.content.includes('どのくらいかかりましたか') || 
      h.content.includes('時間はどのくらい')
    );
    const hasAskedExploration = conversationHistory.some(h =>
      h.content.includes('探究活動について') || 
      h.content.includes('1分ほどで説明してください')
    );
    
    // 会話の数をカウント（面接時間の推定）
    const conversationCount = conversationHistory.length;
    const isNearTimeLimit = conversationCount >= 20; // 約15分相当
    const shouldEnd = conversationCount >= 24; // 終了時間
    
    console.log('📊 会話段階:', { hasAskedTransport, hasAskedTime, hasAskedExploration, conversationCount, isNearTimeLimit, shouldEnd });
    
    const prompt = `You are an experienced Meiwa Middle School interviewer. A 6th grader just said something.

CONVERSATION SO FAR:
${context}
受検生: "${userMessage}"

CURRENT STAGE:
- Asked about transport: ${hasAskedTransport ? 'YES' : 'NO'}
- Asked about time: ${hasAskedTime ? 'YES' : 'NO'}
- Asked about exploration: ${hasAskedExploration ? 'YES' : 'NO'}
- Conversation count: ${conversationCount}
- Near time limit: ${isNearTimeLimit ? 'YES' : 'NO'}
- Should end: ${shouldEnd ? 'YES' : 'NO'}

${shouldEnd ? '🏁 END INTERVIEW: Say "それでは面接を終わります。本日はありがとうございました。"' : ''}
${isNearTimeLimit && !shouldEnd ? '⏰ FINAL QUESTION: Ask about future goals or middle/high school life plans' : ''}
${hasAskedTransport && hasAskedTime && !hasAskedExploration ? '⚠️ MUST NOW ASK ABOUT EXPLORATION ACTIVITIES WITH "1分ほどで"' : ''}

Your task:
1. FIRST: Check if interview should end (conversation count >= 24)
2. IF SHOULD END: End the interview politely
3. IF NEAR TIME LIMIT: Ask final question about future goals
4. THEN: Check if the answer is inappropriate/joking/impossible
5. IF INAPPROPRIATE: Gently but firmly ask them to answer seriously
6. IF APPROPRIATE: Continue the interview naturally

CRITICAL RULES:
- If they say fictional names (野比のぎた, 夏目漱石, etc.) → Ask for their real name
- If they mention impossible transport (タケコプター, どこでもドア, etc.) → Ask them to answer seriously
- If they say unrealistic transport (ダッシュ, 新幹線 for local school) → Clarify or redirect
- If their answer is genuine → Continue with natural follow-up

INTERVIEW FLOW (MUST follow exactly):
1. Name → Ask "今日はどうやって来ましたか？" (TODAY's journey, not future commute)
2. Transportation → Ask "どのくらいかかりましたか？" (time taken)
3. Time → IMMEDIATELY ask "ありがとうございます。それでは、あなたがこれまで打ち込んできた探究活動について、1分ほどで説明してください。"
4. Exploration activities → Deep dive into their activities (multiple follow-ups)
5. Near time limit → Ask about "中学校・高校生活への豊富について" or "将来の目標について"
6. Time up → End with "それでは面接を終わります。本日はありがとうございました。"

CRITICAL: 
- DON'T repeat the same question twice
- After exploration activities, deep dive with follow-up questions
- When near time limit, transition to future topics
- End interview politely when time is up

Response in natural Japanese. End with a question.

Return JSON:
{"question": "Your response in Japanese", "inappropriate": true/false, "reason": "why"}`;

    console.log('🤖 AI判断中...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    console.log('📥 AI応答:', text);
    
    // JSONクリーニング
    if (text.includes('```json')) {
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }
    
    try {
      const parsed = JSON.parse(text);
      console.log(`🎯 結果: ${parsed.inappropriate ? '不適切' : '適切'} - ${parsed.question}`);
      
      return NextResponse.json({
        question: parsed.question,
        inappropriate: parsed.inappropriate || false,
        reason: parsed.reason,
        aiJudged: true,
        interviewEnded: shouldEnd || parsed.question.includes('面接を終わります'),
        conversationCount,
        timestamp: new Date().toISOString()
      });
      
    } catch (parseError) {
      console.log('⚠️ JSONパース失敗、質問抽出');
      
      // 正規表現で質問抽出
      const match = text.match(/"question"\s*:\s*"([^"]+)"/);
      if (match) {
        return NextResponse.json({
          question: match[1],
          aiJudged: true,
          parseError: true,
          timestamp: new Date().toISOString()
        });
      }
      
      // 緊急フォールバック
      return NextResponse.json({
        question: 'もう一度お答えいただけますか？',
        emergency: true,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
    
    return NextResponse.json({
      question: 'すみません、もう一度お答えいただけますか？',
      error: true,
      timestamp: new Date().toISOString()
    });
  }
}