import { NextRequest, NextResponse } from 'next/server';

// 🎯 明和中学校6軸評価システム（愛知県公式基準）
interface MeiwaResearchEvaluation {
  curiosity: number;              // 1-5段階 - 探究心（未知への「なぜ？」掘り下げ力）
  empathy: number;                // 1-5段階 - 共感力（他者理解・協働での気配り）
  tolerance: number;              // 1-5段階 - 寛容性（多様な価値観・失敗を成長機会に）
  persistence: number;            // 1-5段階 - 粘り強さ（困難への継続力・試行錯誤）
  reflection: number;             // 1-5段階 - リフレクション力（事実→感情→学びの整理）
  logicalExpression: number;      // 1-5段階 - 論理的表現力（結論→理由→具体例の構造）
  overallScore: number;           // 総合評価 (1-5)
  overallGrade: string;          // A-E判定
  strengths: string[];            // 強み
  improvements: string[];         // 改善点
  suggestions: string[];          // 次回への提案
}

interface EvaluationFeedback {
  evaluation: MeiwaResearchEvaluation;
  summary: string;
  explorationHighlight: string;  // 探究活動のハイライト
  impressiveAnswers: string[];   // 印象的な回答
}

export async function POST(request: NextRequest) {
  console.log('🎯 面接評価API開始');
  
  try {
    const body = await request.json();
    const { conversationHistory = [], sessionDuration = 0 } = body;
    
    console.log('📥 評価対象:', {
      conversationCount: conversationHistory.length,
      sessionDuration: `${Math.floor(sessionDuration / 60)}分${sessionDuration % 60}秒`
    });
    
    // 評価用のAI分析
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = 'AIzaSyDhSwuxAwrIccB5L4GG0Y7jvz6Rabe21qk';
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2  // 評価は一貫性重視
      }
    });
    
    // 面接内容の整理
    const interviewContext = conversationHistory
      .map((h: any) => `${h.role === 'interviewer' ? '面接官' : '受検生'}: ${h.content}`)
      .join('\n');
    
    // 探究活動の内容を抽出
    const explorationAnswers = conversationHistory
      .filter((h: any) => h.role === 'student' && h.content.length > 10) // 閾値を下げて短い回答も含める
      .map((h: any) => h.content);
    
    // 会話量の評価
    const studentMessages = conversationHistory.filter((h: any) => h.role === 'student');
    const conversationAmount = studentMessages.length;
    const isShortSession = conversationAmount < 3; // 3回未満の会話を短いセッションとする
    const isVeryShortSession = conversationAmount < 2; // 2回未満を非常に短いセッションとする
    
    console.log('📊 面接セッション分析:', {
      studentMessages: conversationAmount,
      isShortSession,
      isVeryShortSession,
      sessionDuration: `${Math.floor(sessionDuration / 60)}分${sessionDuration % 60}秒`
    });
    
    const prompt = `あなたは明和中学校の面接評価の専門家です。以下の面接内容を明和中学校の6つの評価軸（愛知県公式基準）で分析してください。

面接セッション情報:
- 学生の発言回数: ${conversationAmount}回
- セッション時間: ${Math.floor(sessionDuration / 60)}分${sessionDuration % 60}秒
- セッション状況: ${isVeryShortSession ? '非常に短い（ほとんど会話なし）' : isShortSession ? '短い（中途終了）' : '通常'}

面接内容:
${interviewContext}

${isVeryShortSession ? `
⚠️ 特別評価モード（非常に短いセッション）:
- 名前や基本的な挨拶程度のみの場合は、基本的な評価のみ実施
- 「判定困難」要素があることを明記
- 「今後のアドバイス」に重点を置いた評価を実施
` : isShortSession ? `
⚠️ 中途終了評価モード:
- 限られた情報での評価であることを考慮
- 話された内容については正当に評価
- 「もう少し長く面接を受けることで、より詳細な評価が可能」である旨を示唆
` : ''}

明和中学校6つの評価軸（各1-5点で評価）:

1. **探究心** - 未知の事柄に対し「なぜ？」を掘り下げ、自ら課題を設定して学びを深めようとする力
   評価観点：具体的な体験を基に、どこまで主体的に考えを掘り下げたか

2. **共感力** - 他者の立場や感情を想像し、協働の中で気配りができるか
   評価観点：友達との協働経験、サポート・両面の役割経験など

3. **寛容性** - 多様な価値観を受け入れ、対立や失敗を成長機会として捉えられるか
   評価観点：異なる意見が出た場面でどう行動したか

4. **粘り強さ** - 困難に直面した際の継続力と試行錯誤のプロセス
   評価観点：途中で投げ出した経験も含めて、どう乗り越えたか

5. **リフレクション力（振り返り型対話能力）** - 体験を事実→感情→学びへと整理し、自分の言葉で語れるか
   評価観点：面接形式自体が「リフレクション型」。質問に対して深い内省を示せるか

6. **論理的な表現力・コミュニケーション** - 質問の意図を正しく捉え、結論→理由→具体例の順で端的に語れるか
   評価観点：声量・語彙より、思考の筋道の明瞭さ

評価のポイント:
- 探究活動の内容を重点的に評価
- 小学6年生の発達段階を考慮
- 愛知県公式の評価基準に基づく
- 具体的で建設的なフィードバックを提供
- 強みを認めつつ、改善点も明確に指摘

JSON形式で返答:
{
  "evaluation": {
    "curiosity": 数値(1-5),
    "empathy": 数値(1-5), 
    "tolerance": 数値(1-5),
    "persistence": 数値(1-5),
    "reflection": 数値(1-5),
    "logicalExpression": 数値(1-5),
    "overallScore": 数値(1-5),
    "overallGrade": "A/B/C/D/E",
    "strengths": ["強み1", "強み2"],
    "improvements": ["改善点1", "改善点2"],
    "suggestions": ["提案1", "提案2"]
  },
  "summary": "面接全体の総評",
  "explorationHighlight": "探究活動の要約",
  "impressiveAnswers": ["印象的な回答1", "印象的な回答2"]
}`;

    console.log('🤖 AI評価分析中...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // JSONクリーニング
    if (text.includes('```json')) {
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }
    
    try {
      const evaluationResult: EvaluationFeedback = JSON.parse(text);
      
      // 総合評価の計算確認（6軸）
      const scores = evaluationResult.evaluation;
      const calculatedOverall = (
        scores.curiosity + scores.empathy + scores.tolerance +
        scores.persistence + scores.reflection + scores.logicalExpression
      ) / 6;
      
      scores.overallScore = Math.round(calculatedOverall * 10) / 10;
      
      // 成績判定
      if (scores.overallScore >= 4.5) scores.overallGrade = 'A';
      else if (scores.overallScore >= 3.5) scores.overallGrade = 'B';
      else if (scores.overallScore >= 2.5) scores.overallGrade = 'C';
      else if (scores.overallScore >= 1.5) scores.overallGrade = 'D';
      else scores.overallGrade = 'E';
      
      console.log('✅ 評価完了:', {
        overallScore: scores.overallScore,
        grade: scores.overallGrade,
        strengthsCount: scores.strengths.length,
        improvementsCount: scores.improvements.length
      });
      
      return NextResponse.json({
        success: true,
        ...evaluationResult,
        sessionInfo: {
          duration: sessionDuration,
          conversationCount: conversationHistory.length
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (parseError) {
      console.error('❌ 評価結果パース失敗:', parseError);
      
      // 会話量に応じたフォールバック評価（6軸）
      const studentMessages = conversationHistory.filter((h: any) => h.role === 'student');
      const conversationAmount = studentMessages.length;
      const isShortSession = conversationAmount < 3;
      const isVeryShortSession = conversationAmount < 2;
      
      let fallbackEvaluation: EvaluationFeedback;
      
      if (isVeryShortSession) {
        // 非常に短いセッション用のフォールバック
        fallbackEvaluation = {
          evaluation: {
            curiosity: 2,
            empathy: 2,
            tolerance: 2,
            persistence: 2,
            reflection: 2,
            logicalExpression: 2,
            overallScore: 2.0,
            overallGrade: 'D',
            strengths: ['面接に参加していただきありがとうございました'],
            improvements: ['面接時間を長く取って、より多くお話しできると良いでしょう'],
            suggestions: [
              '次回はもう少し長い時間面接を受けてみましょう',
              '探究活動について具体的に準備してみましょう',
              'リラックスして自分の体験を話してみましょう'
            ]
          },
          summary: '面接時間が短かったため、詳細な評価は難しい状況でした。次回はより長い時間をかけて面接練習をしてみましょう。',
          explorationHighlight: '探究活動についてお話しする時間が十分取れませんでした。',
          impressiveAnswers: ['面接に参加していただきました。']
        };
      } else if (isShortSession) {
        // 短いセッション用のフォールバック
        fallbackEvaluation = {
          evaluation: {
            curiosity: 2.5,
            empathy: 2.5,
            tolerance: 2.5,
            persistence: 2.5,
            reflection: 2.5,
            logicalExpression: 2.5,
            overallScore: 2.5,
            overallGrade: 'C',
            strengths: ['面接への取り組み姿勢が見られました'],
            improvements: ['もう少し長い時間をかけて詳しくお話しできると良いでしょう'],
            suggestions: [
              '次回はより詳細に探究活動について話してみましょう',
              '具体的な体験エピソードを準備しておきましょう',
              '面接時間を十分に活用して自分をアピールしましょう'
            ]
          },
          summary: '面接時間が短く、十分な評価は困難でしたが、お話しいただいた内容から可能性を感じます。',
          explorationHighlight: '限られた時間での探究活動に関するお話でした。',
          impressiveAnswers: ['短い時間でしたが、真剣に取り組まれました。']
        };
      } else {
        // 通常のフォールバック
        fallbackEvaluation = {
          evaluation: {
            curiosity: 3,
            empathy: 3,
            tolerance: 3,
            persistence: 3,
            reflection: 3,
            logicalExpression: 3,
            overallScore: 3.0,
            overallGrade: 'C',
            strengths: ['面接に真剣に取り組まれました'],
            improvements: ['より具体的な体験談を話せるとよいでしょう'],
            suggestions: ['次回は探究活動についてもう少し詳しく準備しましょう']
          },
          summary: '面接お疲れさまでした。真剣に取り組んでいただけました。',
          explorationHighlight: '探究活動について話していただきました。',
          impressiveAnswers: ['誠実にお答えいただきました。']
        };
      }
      
      return NextResponse.json({
        success: true,
        ...fallbackEvaluation,
        fallback: true,
        sessionInfo: {
          duration: sessionDuration,
          conversationCount: conversationHistory.length
        },
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ 評価API エラー:', error);
    
    return NextResponse.json({
      success: false,
      error: 'evaluation_failed',
      message: '評価の生成中にエラーが発生しました',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}