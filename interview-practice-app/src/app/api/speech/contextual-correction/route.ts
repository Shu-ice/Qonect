import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  let requestData;
  
  try {
    requestData = await request.json();
    const { text, context } = requestData;

    if (!text) {
      return NextResponse.json(
        { error: 'テキストが必要です' },
        { status: 400 }
      );
    }

    // OpenAI APIキーが設定されていない場合は基本修正のみ
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        corrected: text,
        reasoning: 'OpenAI APIキーが未設定のため基本修正のみ実行'
      });
    }

    const prompt = buildCorrectionPrompt(text, context);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `あなたは音声認識テキストの校正専門家です。中学受験面接の文脈を理解し、自然で正確な日本語に修正してください。

修正の方針：
1. 音声認識の誤りを修正（同音異義語、助詞、語尾など）
2. 面接にふさわしい丁寧語・敬語に調整
3. 文脈に合わない単語を適切な表現に置換
4. 重複や言い淀みを自然に整理
5. 小学6年生らしい表現を保持

JSONフォーマットで回答：
{
  "corrected": "修正されたテキスト",
  "reasoning": "修正理由の簡潔な説明"
}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('AI修正レスポンスが空です');

    const parsed = JSON.parse(response);
    return NextResponse.json({
      corrected: parsed.corrected || text,
      reasoning: parsed.reasoning || '修正なし'
    });

  } catch (error) {
    console.error('AI文脈修正エラー:', error);
    
    // エラー時は元のテキストを返す
    return NextResponse.json({
      corrected: requestData?.text || '',
      reasoning: 'AI修正でエラーが発生しました'
    });
  }
}

function buildCorrectionPrompt(text: string, context: any): string {
  if (!context) {
    return `音声認識結果: "${text}"\n\n上記のテキストを自然で正確な日本語に修正してください。`;
  }

  return `
音声認識結果: "${text}"

文脈情報:
志願理由書の内容:
- 志望動機: ${context.essayContent?.motivation || '不明'}
- 学校調査: ${context.essayContent?.research || '不明'}
- 中学生活: ${context.essayContent?.schoolLife || '不明'}
- 将来の夢: ${context.essayContent?.future || '不明'}

現在の質問: "${context.currentQuestion || '不明'}"

これまでの会話:
${context.conversationHistory?.slice(-3).map((msg: any) => 
  `${msg.role === 'interviewer' ? '面接官' : '受験生'}: ${msg.content}`
).join('\n') || '履歴なし'}

上記の文脈を踏まえて、音声認識結果を自然で正確な日本語に修正してください。
`;
}