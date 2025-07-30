import { NextRequest, NextResponse } from 'next/server';
import { multiAI } from '@/lib/ai-clients';

interface EssayContent {
  motivation: string;
  research: string;
  schoolLife: string;
  future: string;
}

export async function POST(request: NextRequest) {
  try {
    const { question, response, essayContent } = await request.json();

    // 入力検証
    if (!question || !response) {
      return NextResponse.json(
        { error: '質問と回答が必要です' },
        { status: 400 }
      );
    }

    // 評価プロンプトの構築
    const prompt = buildEvaluationPrompt(question, response, essayContent);
    
    const systemPrompt = `あなたは明和高校附属中学校の面接官として、小学6年生の受験生の回答を適切に評価してください。

評価の心構え：
- 上位校面接官として品格を保ちつつ、小学6年生に配慮した評価を行う
- 年齢相応の表現力や内容であることを考慮する
- 努力や誠実さを適切に評価し、建設的なフィードバックを提供する
- 敬語を用いた丁寧で温かい表現で評価する

評価基準：
1. 内容の適切性（質問に対する理解と回答）
2. 表現力（年齢に応じた自然で誠実な表現）
3. 具体性（体験や例を含んだ説明）
4. 成長への意欲（学習や将来への前向きさ）

重要な点：
- 小学6年生として適切であれば3-4点で評価
- 改善提案は「さらに良くなります」という建設的な視点で
- 「〜ですね」「〜でいらっしゃいますね」など丁寧な表現
- 5段階評価（1=要改善 → 5=大変優秀）

出力形式：
{
  "score": 数値(1-5),
  "points": ["良かった点1", "良かった点2"],
  "suggestions": ["建設的な改善提案1", "建設的な改善提案2"]
}`;

    // GeminiAPI（プライマリ）を使用した評価
    const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
      operation: 'evaluation',
      priority: 'quality_first' // 評価では品質重視
    });

    const evaluationText = aiResponse.content.trim();

    if (!evaluationText) {
      throw new Error('評価生成に失敗しました');
    }

    // JSONパースを試みる
    try {
      const evaluation = JSON.parse(evaluationText);
      
      // データ検証
      if (typeof evaluation.score !== 'number' || 
          !Array.isArray(evaluation.points) || 
          !Array.isArray(evaluation.suggestions)) {
        throw new Error('評価フォーマットが不正です');
      }

      // スコアの範囲チェック
      evaluation.score = Math.max(1, Math.min(5, evaluation.score));

      return NextResponse.json({
        ...evaluation,
        timestamp: new Date().toISOString()
      });

    } catch (parseError) {
      console.error('JSON解析エラー:', parseError);
      throw new Error('評価結果の解析に失敗しました');
    }

  } catch (error) {
    console.error('回答評価エラー:', error);
    
    // フォールバック評価
    const fallbackEvaluation = {
      score: 3,
      points: ['一生懸命答えてくれましたね', '自分の言葉で表現できています'],
      suggestions: ['具体的な例を話してもらえるとさらに良いでしょう', '落ち着いて答えられています'],
      fallback: true
    };
    
    return NextResponse.json(fallbackEvaluation);
  }
}

function buildEvaluationPrompt(
  question: string, 
  response: string, 
  essayContent: EssayContent
): string {
  return `
志願理由書の内容：
- 志望動機: ${essayContent.motivation}
- 学校について調べたこと: ${essayContent.research}
- 中学校生活への期待: ${essayContent.schoolLife}
- 将来の夢: ${essayContent.future}

面接質問: "${question}"

受験生の回答: "${response}"

上記の小学6年生の回答を評価してください。

評価のポイント：
1. 一生懸命答えようとしているか（態度・姿勢）
2. 自分の言葉で素直に表現できているか
3. 質問の内容を理解して答えているか
4. 志願理由書と矛盾なく話せているか
5. 具体的な体験や気持ちを話せているか

評価は以下のJSON形式で出力してください（コードブロックは使わず、直接JSONのみ）：
{
  "score": 1-5の数値（小学6年生として適切であれば3-4点）,
  "points": ["○○ですね", "○○という点が良いです"],
  "suggestions": ["○○について詳しく話してもらえるとさらに良いでしょう", "○○の具体例があると分かりやすいですね"]
}
`;
}