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
    
    console.log('📊 会話段階:', { hasAskedTransport, hasAskedTime });
    
    const prompt = `You are an experienced Meiwa Middle School interviewer. A 6th grader just said something.

CONVERSATION SO FAR:
${context}
受検生: "${userMessage}"

CURRENT STAGE:
- Asked about transport: ${hasAskedTransport ? 'YES' : 'NO'}
- Asked about time: ${hasAskedTime ? 'YES' : 'NO'}
${hasAskedTransport && hasAskedTime ? '⚠️ MUST NOW ASK ABOUT EXPLORATION ACTIVITIES WITH "1分ほどで"' : ''}

Your task:
1. FIRST: Check if the answer is inappropriate/joking/impossible
2. IF INAPPROPRIATE: Gently but firmly ask them to answer seriously
3. IF APPROPRIATE: Continue the interview naturally

CRITICAL RULES:
- If they say fictional names (野比のぎた, 夏目漱石, etc.) → Ask for their real name
- If they mention impossible transport (タケコプター, どこでもドア, etc.) → Ask them to answer seriously
- If they say unrealistic transport (ダッシュ, 新幹線 for local school) → Clarify or redirect
- If their answer is genuine → Continue with natural follow-up

INTERVIEW FLOW (MUST follow exactly):
1. Name → Ask "今日はどうやって来ましたか？" (TODAY's journey, not future commute)
2. Transportation → Ask "どのくらいかかりましたか？" (time taken)
3. Time → IMMEDIATELY ask "ありがとうございます。それでは、あなたがこれまで打ち込んできた探究活動について、1分ほどで説明してください。"
4. Exploration activities → Deep dive into their activities

CRITICAL: After hearing the time, MUST transition to exploration activities. NO other topics!

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