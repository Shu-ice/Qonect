import { NextRequest, NextResponse } from 'next/server';
import { multiAI } from '@/lib/ai-clients';

interface ConversationHistory {
  role: 'interviewer' | 'student';
  content: string;
}

interface EssayContent {
  motivation: string;
  research: string;
  schoolLife: string;
  future: string;
}

export async function POST(request: NextRequest) {
  let questionType: string = 'follow_up';
  
  try {
    const { essayContent, conversationHistory, questionType: requestQuestionType } = await request.json();
    questionType = requestQuestionType || 'follow_up';

    // 入力検証
    if (!essayContent) {
      return NextResponse.json(
        { error: '志願理由書の内容が必要です' },
        { status: 400 }
      );
    }

    // 質問生成プロンプトの構築
    const prompt = buildQuestionPrompt(essayContent, conversationHistory || [], questionType);
    
    const systemPrompt = `あなたは明和高校附属中学校の面接官です。この面接は「リフレクション面接」として、受験生の探究活動への深い省察を促すことが目的です。

【リフレクション面接の核心】
1. 探究活動の体験を深く振り返らせる
2. 「そこから何を学んだか」「なぜそう思ったか」を掘り下げる
3. 将来への学びの接続を意識させる
4. 自己変容・成長への気づきを引き出す

【質問の特徴】
- 相手の回答を受けて「そこから○○さんは何を〜」「それによってどんな〜」で深堀り
- 「なぜ」「どうして」を多用して内省を促す
- 「これから〜」「将来〜」で学びの継続性を確認
- 感情や変化に焦点を当てる（「どんな気持ち」「どう変わった」）

【望ましい質問パターン】
✓ 「そこからあなたは何を学びましたか？」
✓ 「それによってどんな気持ちの変化がありましたか？」
✓ 「その体験を通して、あなた自身はどう変わりましたか？」
✓ 「これからその学びをどのように活かしていきたいですか？」
✓ 「もしもう一度やるとしたら、何を変えたいと思いますか？」
✓ 「その活動で一番印象に残ったのはどんな瞬間でしたか？なぜですか？」

【避けるべき質問】
✗ 事実確認だけの質問（「いつやりましたか」「何をしましたか」）
✗ 一般論を聞く質問（「環境問題についてどう思いますか」）
✗ 正解があるような知識問題

【口調】
温かく、興味深そうに、受験生の体験を価値あるものとして扱う。
「そうなんですね。とても興味深い体験ですね。そこから○○さんは何を感じましたか？」`;

    // デバッグ：プロンプト内容をログ出力
    console.log('🤖 質問生成プロンプト:', prompt.substring(0, 500) + '...');
    console.log('📝 システムプロンプト:', systemPrompt.substring(0, 200) + '...');
    
    // GeminiAPI（プライマリ）を使用した質問生成
    const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
      operation: 'question_generation',
      priority: 'cost_efficient' // Gemini優先
    });
    
    console.log('✅ AI応答:', aiResponse.content.substring(0, 200) + '...');
    console.log('🔧 使用プロバイダー:', aiResponse.provider);

    const question = aiResponse.content.trim();

    if (!question) {
      throw new Error('質問生成に失敗しました');
    }

    return NextResponse.json({ 
      question,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('質問生成エラー:', error);
    
    // フォールバック質問
    const fallbackQuestions = getFallbackQuestion(questionType);
    
    return NextResponse.json({ 
      question: fallbackQuestions,
      fallback: true 
    });
  }
}

function buildQuestionPrompt(
  essayContent: EssayContent, 
  conversationHistory: ConversationHistory[], 
  questionType: string
): string {
  let prompt = '';

  if (questionType === 'opening') {
    prompt = `
志願理由書の内容：
- 志望動機: ${essayContent.motivation}
- 学校について調べたこと: ${essayContent.research}
- 中学校生活への期待: ${essayContent.schoolLife}
- 将来の夢: ${essayContent.future}

【リフレクション面接の開始質問を作成してください】

この面接の目的は、受験生が書いた志願理由書の背景にある「体験」「気づき」「学び」を深く振り返らせることです。

開始質問の要件：
1. 温かい挨拶と志願理由書への評価
2. 単なる志望動機ではなく、「きっかけとなった体験や出来事」について質問する
3. 「なぜそう思うようになったのか」の背景を探る質問にする

良い開始質問の例：
「こんにちは。志願理由書を読ませていただきました。明和中学校への熱い思いが伝わってきます。ところで、○○さんが明和中学校に興味を持つようになったのは、何かきっかけとなる出来事や体験があったのでしょうか？」

「志願理由書の中で『${essayContent.motivation.substring(0, 30)}...』と書いてくださいましたが、そう感じるようになった背景には、どんな体験や出来事があったのでしょうか？」
`;
  } else {
    prompt = `
志願理由書の内容：
- 志望動機: ${essayContent.motivation}
- 学校について調べたこと: ${essayContent.research}
- 中学校生活への期待: ${essayContent.schoolLife}
- 将来の夢: ${essayContent.future}

これまでの会話：
${conversationHistory.map(msg => `${msg.role === 'interviewer' ? '面接官' : '受験生'}: ${msg.content}`).join('\n')}

【リフレクション面接の深堀り質問を作成してください】

**重要：受験生の最新回答の内容を必ず理解し、その回答に関連した適切な質問をしてください。**

最新の受験生回答：「${conversationHistory.filter(msg => msg.role === 'student').slice(-1)[0]?.content || '（まだ回答なし）'}」

この回答を受けて、以下のパターンから最も適切な1つを選んで質問してください：

1. **体験の深堀り**：「お母様から聞いた明和高校の話の中で、特に印象に残ったエピソードはありますか？」

2. **感情・動機の探究**：「そのお話を聞いて、○○さんはどんな気持ちになりましたか？」

3. **具体性の追求**：「お母様はどんな明和高校での体験を特に楽しそうに話されていましたか？」

4. **自己の変化**：「そうしたお話を聞く中で、○○さん自身の将来への考えはどう変わりましたか？」

5. **将来への展望**：「お母様の体験を踏まえて、○○さんは明和中学校でどんなことに挑戦したいと思いますか？」

**必須要件**：
- 受験生の回答内容（母親の明和高校体験談）に直接関連する質問をする
- 「そこから」「それを聞いて」「そうした話の中で」などで自然につなげる
- 抽象的でなく具体的な体験や感情を引き出す質問にする
- 1つの質問のみ作成する
`;
  }

  return prompt;
}

function getFallbackQuestion(questionType?: string): string {
  const openingQuestions = [
    "こんにちは。志願理由書を読ませていただきました。明和中学校への思いがよく伝わってきます。ところで、○○さんが明和中学校に興味を持つようになったのは、何かきっかけとなる出来事や体験があったのでしょうか？",
    "志願理由書を拝見させていただき、とても感心しました。明和中学校を志望されるようになった背景には、どんな体験や出来事があったのか、聞かせてもらえますか？",
    "こんにちは。志願理由書からは○○さんの真剣な思いがよく分かります。そうした気持ちを持つようになったきっかけについて、詳しく教えてください。"
  ];

  const reflectionQuestions = [
    "そこから○○さんは何を学びましたか？",
    "その体験を通して、○○さん自身はどう変わりましたか？",
    "その時どんな気持ちでしたか？",
    "その学びを、これからどのように活かしていきたいですか？",
    "その体験で一番印象に残ったのはどんな瞬間でしたか？なぜですか？",
    "もしもう一度同じことをするとしたら、何を変えたいと思いますか？",
    "それによってどんなことに気づきましたか？",
    "明和中学校でも、そうした経験を続けていきたいと思いますか？なぜですか？"
  ];

  if (questionType === 'opening') {
    return openingQuestions[Math.floor(Math.random() * openingQuestions.length)];
  } else {
    return reflectionQuestions[Math.floor(Math.random() * reflectionQuestions.length)];
  }
}