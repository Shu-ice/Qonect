import { NextRequest, NextResponse } from 'next/server';
import { multiAI } from '@/lib/ai/adapter';

interface EssayContent {
  motivation: string;
  research: string;
  schoolLife: string;
  future: string;
  inquiryLearning: string; // 探究学習の実績・経験（300字程度）
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

    // AIによる高精度評価プロンプトの構築
    const prompt = buildAdvancedEvaluationPrompt(question, response, essayContent);
    
    const systemPrompt = `あなたは明和高校附属中学校の面接官として、小学6年生の受験生の回答を適切に評価してください。

【明和中7つの探究活動評価項目】
1. **真の興味・関心度**: その探究活動を心より好きか？本当に興味・関心があるか？
2. **体験・学び基盤性**: その探究活動は自分の体験や学びに基づいているか？
3. **社会・日常連結性**: その探究活動は日常生活または社会と結びついているか？
4. **探究性・非正解性**: その探究内容には決まった正解（答え）がないか？（※決まった正解がない=良い）
5. **他者理解・共感可能性**: その探究活動は他者が理解できるものか？共感できるものか？
6. **自己変容・成長実感**: この探究活動を通じて、自分の在り方生き方に変化をもたらしたか？
7. **自分の言葉表現力**: 自分のことばで語っているか？

評価の心構え：
- 上記の7つの観点を重視して評価する
- 年齢相応の表現力や内容であることを考慮する
- 努力や誠実さを適切に評価し、建設的なフィードバックを提供する
- 敬語を用いた丁寧で温かい表現で評価する

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
    
    // AI必須のため、エラーを返す
    return NextResponse.json(
      { 
        error: 'AI評価システムに問題があります。管理者にお問い合わせください。',
        details: 'Gemini APIキーが無効または期限切れの可能性があります。'
      },
      { status: 503 }
    );
  }
}

function analyzeStudentResponse(response: string) {
  // const responseLength = response.length; // 未使用のため削除
  
  // 具体性レベルの分析
  const specificityMarkers = response.match(/具体的|例えば|実際|その時|ある日|時間|場所|人名|数字/g) || [];
  const specificityLevel = specificityMarkers.length >= 3 ? 'high' : 
                          specificityMarkers.length >= 1 ? 'medium' : 'low';
  
  // 感情表現の分析
  const emotionMarkers = response.match(/好き|嬉しい|楽しい|悲しい|驚いた|面白い|つらい|感動/g) || [];
  const emotionalExpression = emotionMarkers.length >= 2 ? 'rich' : 
                             emotionMarkers.length >= 1 ? 'moderate' : 'minimal';
  
  // 探究的要素の検出
  const inquiryElements = {
    curiosity: /なぜ|どうして|不思議|疑問|知りたい|調べ/.test(response),
    process: /方法|やり方|手順|プロセス|進め方/.test(response),
    discovery: /発見|気づき|わかった|見つけた|判明/.test(response),
    challenge: /困難|難しい|問題|課題|挑戦/.test(response)
  };
  
  // 明和7軸への適合度分析
  const meiwaAlignment = {
    genuineInterest: /好き|大好き|興味|関心|情熱|夢中/.test(response) ? 1 : 0,
    experienceBase: /体験|実際|やった|取り組ん|経験/.test(response) ? 1 : 0,
    socialConnection: /社会|人|みんな|役立|貢献|つながり/.test(response) ? 1 : 0,
    noDefinitiveAnswer: /答えがない|正解がない|わからない|まだ研究中/.test(response) ? 1 : 0,
    empathy: /伝え|共有|理解|共感|話し合/.test(response) ? 1 : 0,
    selfTransformation: /変わった|成長|できるよう|学んだ|身についた/.test(response) ? 1 : 0,
    originalExpression: /私は|僕は|自分なり|独自|オリジナル/.test(response) ? 1 : 0
  };
  
  // 個人的キーワードの抽出
  const personalKeywords = response.match(/[一-龯ぁ-ゖァ-ヶ]{2,}/g) || [];
  const filteredKeywords = personalKeywords
    .filter(word => !/です|ます|でした|こと|もの|ため|という|について/.test(word))
    .slice(0, 5);
    
  // 成長・学びの言及
  const growthMentioned = /成長|変化|学び|気づき|身につ|できるよう|上達/.test(response);
  
  // 具体的エピソードの有無
  const hasSpecificEpisode = /その時|ある日|例えば|実際に|[0-9]+年|[0-9]+月|[0-9]+時/.test(response);
  
  return {
    specificityLevel,
    emotionalExpression,
    inquiryElements,
    meiwaAlignment,
    personalKeywords: filteredKeywords,
    growthMentioned,
    hasSpecificEpisode
  };
}

function buildAdvancedEvaluationPrompt(
  question: string, 
  response: string, 
  essayContent: EssayContent
): string {
  // 回答の高度分析
  const responseAnalysis = analyzeStudentResponse(response);
  
  return `
【受験生プロファイル】
**探究活動**: ${essayContent.research}
**志望**: ${essayContent.motivation}
**将来の夢**: ${essayContent.future}

【面接状況】
**質問**: "${question}"
**生徒の回答**: "${response}"

【AIによる回答分析】
**回答の長さ**: ${response.length}文字
**具体性レベル**: ${responseAnalysis.specificityLevel}
**感情表現**: ${responseAnalysis.emotionalExpression}
**探究的要素**: ${JSON.stringify(responseAnalysis.inquiryElements)}
**明和7軸適合度**: ${JSON.stringify(responseAnalysis.meiwaAlignment)}
**個人的キーワード**: [${responseAnalysis.personalKeywords.join(', ')}]
**成長・学びの言及**: ${responseAnalysis.growthMentioned ? 'あり' : 'なし'}
**具体的エピソード**: ${responseAnalysis.hasSpecificEpisode ? 'あり' : 'なし'}

【明和中・ベテラン面接官への指示】
上記分析を元に、明和中の7つの探究評価軸で精密に評価し、建設的で具体的なフィードバックを提供してください。

【AI面接官の高度評価基準】

**明和中7つの探究評価軸で、以下を精密に分析し、具体的なフィードバックを提供**:

1. **真の興味・関心度** (1-5点)
   - 本当に好き、情熱が伝わるか
   - 上迺や建前ではなく、心からの言葉か

2. **体験・学び基盤性** (1-5点)
   - 実体験に裏付けられた具体的な話か
   - 学習プロセスが明確か

3. **社会・日常連結性** (1-5点)
   - 現実世界、社会とのつながりを意識しているか
   - 他者やコミュニティへの関心があるか

4. **探究性・非正解性** (1-5点)
   - 「答えのない問い」への挑戦意識
   - 未知への好奇心、探究精神

5. **他者理解・共感可能性** (1-5点)
   - 人に伝わる、共感される説明か
   - 相手の立場を考えた表現か

6. **自己変容・成長実感** (1-5点)
   - 自分自身の変化、成長を実感しているか
   - 学びや気づきの言及があるか

7. **自分の言葉表現力** (1-5点)
   - オリジナルな、その子らしい表現か
   - 模範解答ではなく、素直な言葉か

評価は以下のJSON形式で出力してください（コードブロックは使わず、直接JSONのみ）：
{
  "score": 1-5の数値（小学6年生として適切であれば3-4点）,
  "points": ["○○ですね", "○○という点が良いです"],
  "suggestions": ["○○について詳しく話してもらえるとさらに良いでしょう", "○○の具体例があると分かりやすいですね"]
}
`;
}