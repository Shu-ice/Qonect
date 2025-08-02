import { NextRequest, NextResponse } from 'next/server';
import { multiAI } from '@/lib/ai/adapter';
import { DeepDiveEngine, InterviewStage } from '@/lib/interview/deep-dive-engine';

interface ConversationHistory {
  role: 'interviewer' | 'student';
  content: string;
}

interface EssayContent {
  motivation: string;
  research: string;
  schoolLife: string;
  future: string;
  inquiryLearning: string; // 探究学習の実績・経験（300字程度）
}

export async function POST(request: NextRequest) {
  let questionType: string = 'follow_up';
  
  try {
    const { 
      essayContent, 
      conversationHistory, 
      questionType: requestQuestionType,
      currentStage,
      interviewDepth 
    } = await request.json();
    
    questionType = requestQuestionType || 'follow_up';
    const stage: InterviewStage = currentStage || 'opening';
    const depth: number = interviewDepth || 1;

    // 入力検証
    if (!essayContent) {
      return NextResponse.json(
        { error: '志願理由書の内容が必要です' },
        { status: 400 }
      );
    }

    // 段階的深掘りエンジンを初期化
    const deepDiveEngine = new DeepDiveEngine();
    
    // 探究活動に適したパターンを選択
    const patternType = deepDiveEngine.selectInterviewPattern(essayContent.inquiryLearning);
    
    // 現在の段階での質問チェーンを生成
    const questionChain = deepDiveEngine.generateQuestionChain(
      patternType,
      stage,
      (conversationHistory || []).map((h: ConversationHistory) => h.content),
      depth
    );

    // 会話履歴から最適な次質問を選択
    let selectedQuestion = null;
    if (conversationHistory && conversationHistory.length > 0) {
      const conversationPairs = [];
      for (let i = 0; i < conversationHistory.length - 1; i += 2) {
        if (conversationHistory[i] && conversationHistory[i + 1]) {
          conversationPairs.push({
            question: conversationHistory[i].content,
            response: conversationHistory[i + 1].content
          });
        }
      }
      
      if (conversationPairs.length > 0) {
        const latestResponse = conversationPairs[conversationPairs.length - 1].response;
        selectedQuestion = deepDiveEngine.selectNextQuestion(
          questionChain,
          latestResponse,
          conversationPairs
        );
      }
    }

    // 次質問が見つからない場合は段階移行をチェック
    if (!selectedQuestion) {
      // 会話履歴を質問・回答ペアに変換
      const conversationPairs = [];
      if (conversationHistory && conversationHistory.length > 0) {
        for (let i = 0; i < conversationHistory.length - 1; i += 2) {
          if (conversationHistory[i] && conversationHistory[i + 1] && 
              conversationHistory[i].role === 'interviewer' && 
              conversationHistory[i + 1].role === 'student') {
            conversationPairs.push({
              question: conversationHistory[i].content,
              response: conversationHistory[i + 1].content
            });
          }
        }
      }
      
      console.log(`🔄 段階移行チェック用ペア数: ${conversationPairs.length}`);
      
      const nextStage = deepDiveEngine.checkStageTransition(
        stage,
        conversationPairs,
        patternType
      );

      if (nextStage) {
        // 新しい段階の最初の質問を取得
        const nextQuestionChain = deepDiveEngine.generateQuestionChain(
          patternType,
          nextStage,
          [],
          1
        );
        selectedQuestion = nextQuestionChain.questions[0] || null;

        // 新しい段階の質問もAI生成
        let generatedStageTransitionQuestion: string;
        
        if (selectedQuestion?.guidanceForAI) {
          try {
            generatedStageTransitionQuestion = await generateQuestionFromGuidance(
              selectedQuestion.guidanceForAI,
              conversationHistory || [],
              essayContent
            );
          } catch (error) {
            console.error('段階移行質問生成エラー:', error);
            generatedStageTransitionQuestion = buildFallbackQuestion(selectedQuestion, conversationHistory || []);
          }
        } else {
          generatedStageTransitionQuestion = selectedQuestion ? 
            buildFallbackQuestion(selectedQuestion, conversationHistory || []) : 
            '面接を終了いたします。お疲れさまでした。';
        }

        // 段階移行を通知
        return NextResponse.json({
          question: generatedStageTransitionQuestion,
          stageTransition: {
            from: stage,
            to: nextStage,
            depth: 1
          },
          preparationTime: selectedQuestion?.preparationTime || 0,
          questionMeta: {
            intent: selectedQuestion?.intent,
            evaluationFocus: selectedQuestion?.evaluationFocus,
            expectedDepth: selectedQuestion?.expectedDepth,
            guidance: selectedQuestion?.guidanceForAI
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // 選択された質問がない場合は現在の段階から未使用の質問を取得
    if (!selectedQuestion && questionChain.questions.length > 0) {
      // 会話履歴から使用済み質問を抽出
      const usedQuestions = conversationHistory ? 
        conversationHistory
          .filter((h: ConversationHistory) => h.role === 'interviewer')
          .map((h: ConversationHistory) => h.content) : [];
      
      // 未使用の質問を探す
      const unusedQuestion = questionChain.questions.find(q => 
        !usedQuestions.includes(q.text)
      );
      
      selectedQuestion = unusedQuestion || questionChain.questions[0];
      console.log(`📝 質問選択: ${selectedQuestion.id} (未使用: ${unusedQuestion ? 'はい' : 'いいえ'})`);
    }

    // フォールバック：AIによる動的質問生成
    if (!selectedQuestion) {
      const prompt = buildQuestionPrompt(essayContent, conversationHistory || [], questionType);
      const systemPrompt = `あなたは明和高校附属中学校のベテラン面接官です。HさんやTさんのような実際の合格者面接を再現し、5-9層の段階的深掘り質問を行ってください。`;

      const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
        operation: 'question_generation',
        priority: 'cost_efficient'
      });

      return NextResponse.json({
        question: aiResponse.content.trim(),
        fallbackGenerated: true,
        timestamp: new Date().toISOString()
      });
    }

    // guidanceForAIを使って実際の質問をAI生成
    let generatedQuestion: string;
    
    if (selectedQuestion.guidanceForAI) {
      try {
        generatedQuestion = await generateQuestionFromGuidance(
          selectedQuestion.guidanceForAI,
          conversationHistory || [],
          essayContent
        );
      } catch (error) {
        console.error('AI質問生成エラー:', error);
        // フォールバックとして従来の方式を使用
        generatedQuestion = buildFallbackQuestion(selectedQuestion, conversationHistory || []);
      }
    } else {
      // guidanceForAIがない場合のフォールバック
      generatedQuestion = buildFallbackQuestion(selectedQuestion, conversationHistory || []);
    }

    // 段階的深掘りエンジンによる質問を返す
    return NextResponse.json({
      question: generatedQuestion,
      stageInfo: {
        currentStage: stage,
        depth: depth,
        patternType: patternType
      },
      preparationTime: selectedQuestion.preparationTime || 0,
      questionMeta: {
        intent: selectedQuestion.intent,
        evaluationFocus: selectedQuestion.evaluationFocus,
        expectedDepth: selectedQuestion.expectedDepth,
        guidance: selectedQuestion.guidanceForAI
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('質問生成エラー:', error);
    
    // AI必須のため、エラーを返す
    return NextResponse.json(
      { 
        error: 'AI接続に問題があります。管理者にお問い合わせください。',
        details: 'Gemini APIキーが無効または期限切れの可能性があります。'
      },
      { status: 503 }
    );
  }
}

function buildQuestionPrompt(
  essayContent: EssayContent, 
  conversationHistory: ConversationHistory[], 
  questionType: string
): string {
  // 文脈分析とパーソナライズされたプロンプト生成
  // const conversationAnalysis = analyzeConversationContext(conversationHistory, essayContent); // 未使用のため削除
  
  let prompt = '';
  
  // 最新の受験生の回答を取得
  const lastStudentResponse = conversationHistory
    .filter(msg => msg.role === 'student')
    .slice(-1)[0]?.content || '';

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
    // 前の質問を特定（段階的深掘りエンジンの質問を優先）
    const lastInterviewerQuestion = conversationHistory
      .filter(msg => msg.role === 'interviewer')
      .slice(-1)[0]?.content || '';
    
    prompt = `
志願理由書の内容：
- 志望動機: ${essayContent.motivation}
- 学校について調べたこと: ${essayContent.research}
- 中学校生活への期待: ${essayContent.schoolLife}
- 将来の夢: ${essayContent.future}

これまでの会話：
${conversationHistory.map(msg => `${msg.role === 'interviewer' ? '面接官' : '受験生'}: ${msg.content}`).join('\n')}

【面接の状況】
前の質問：「${lastInterviewerQuestion}」
受験生の回答：「${lastStudentResponse}」

【重要な指示】
1. まず、受験生の回答に対して自然な相槌や反応を1文で表現してください
   - 回答内容を理解し、共感や驚き、興味を示す
   - 「そうですか」「なるほど」だけでなく、具体的な内容に触れる
   - 例：「2分ですか、本当に近いですね」「歩いて2分とは、学校のすぐ近くにお住まいなんですね」

2. その後、次の質問を続けてください
   - 相槌と質問は自然につながるようにする
   - 段階的深掘りエンジンの質問がある場合はそれを使用

【出力形式】
[相槌・反応] [次の質問]

例：
「歩いて2分ですか、本当にお近くにお住まいなんですね。それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。」

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

/**
 * guidanceForAIを使って実際の質問をAI生成する
 */
async function generateQuestionFromGuidance(
  guidance: {
    topic: string;
    style: 'formal' | 'friendly' | 'encouraging';
    elements: string[];
    context?: string;
  },
  conversationHistory: ConversationHistory[],
  essayContent: EssayContent
): Promise<string> {
  // 最新の受験生の回答を取得
  const lastStudentResponse = conversationHistory
    .filter(msg => msg.role === 'student')
    .slice(-1)[0]?.content || '';
  
  // 前の質問を取得
  const lastInterviewerQuestion = conversationHistory
    .filter(msg => msg.role === 'interviewer')
    .slice(-1)[0]?.content || '';

  const styleMapping = {
    formal: '丁寧で正式な面接らしい言葉遣い',
    friendly: '親しみやすく、緊張をほぐすような優しい言葉遣い',
    encouraging: '受験生を励まし、自信を持たせるような温かい言葉遣い'
  };

  // opening段階では志望動機情報を含めない（交通手段確認のため）
  const isOpeningStage = guidance.topic.includes('面接開始') || guidance.topic.includes('交通手段') || guidance.topic.includes('所要時間');
  
  const prompt = `
【面接官として質問を生成してください】

${isOpeningStage ? 
  '**受験生の情報**：（基本情報のみ確認段階）' :
  `**受験生の情報**：
- 志望動機：${essayContent.motivation}
- 探究活動：${essayContent.inquiryLearning}`
}

**会話の流れ**：
${conversationHistory.length > 0 ? 
  conversationHistory.map(msg => 
    `${msg.role === 'interviewer' ? '面接官' : '受験生'}: ${msg.content}`
  ).join('\n') : 
  '（まだ会話なし）'
}

**質問生成の指示**：
- **トピック**：${guidance.topic}
- **スタイル**：${styleMapping[guidance.style]}
- **含めるべき要素**：${guidance.elements.join('、')}
- **文脈**：${guidance.context || '特になし'}

**重要な要件**：
1. 前の受験生の回答「${lastStudentResponse}」に対して、まず自然な相槌や反応を示す
2. その後、指定されたトピックについて質問する
3. 相槌と質問は自然につながるように一文にまとめる
4. 小学6年生にわかりやすい言葉を使う
5. 明和中学校の面接官としての品格を保つ

**出力例**：
- 「歩いて2分ですか、本当にお近くにお住まいなんですね。それでは、あなたが取り組んでいる探究活動について、1分ほどで説明していただけますか？」
- 「電車で30分かけていらしたんですね、朝早くからお疲れさまでした。こちらまでは何で来られましたか？」

**1つの質問のみ**を生成してください：
`;

  const systemPrompt = `あなたは明和高校附属中学校のベテラン面接官です。
受験生一人ひとりに寄り添い、その子の良さを引き出す質問をします。
文脈を理解し、自然で温かい面接を心がけてください。

重要な注意：
- opening段階では志望動機や探究活動には言及せず、基本的な確認（交通手段、所要時間）のみ
- 「志望理由書」という書類は存在しないため言及しない
- 実際の面接フローに従って段階的に質問を進める`;

  const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
    operation: 'dynamic_question_generation',
    priority: 'quality_first'
  });

  return aiResponse.content.trim();
}

/**
 * AI生成が失敗した場合のフォールバック質問生成
 */
function buildFallbackQuestion(
  selectedQuestion: any,
  conversationHistory: ConversationHistory[]
): string {
  const guidance = selectedQuestion.guidanceForAI;
  const lastStudentResponse = conversationHistory
    .filter(msg => msg.role === 'student')
    .slice(-1)[0]?.content || '';

  // 基本的な相槌を生成
  let prefix = '';
  if (lastStudentResponse) {
    if (lastStudentResponse.includes('分')) {
      prefix = 'そうですか。';
    } else if (lastStudentResponse.includes('歩い')) {
      prefix = 'お疲れさまでした。';
    } else if (lastStudentResponse.includes('電車')) {
      prefix = 'ありがとうございます。';
    } else {
      prefix = 'ありがとうございます。';
    }
  }

  // トピックベースの基本質問
  if (guidance?.topic) {
    if (guidance.topic.includes('面接開始')) {
      return 'それでは面接を始めます。受検番号と名前を教えてください。';
    } else if (guidance.topic.includes('交通手段')) {
      return `${prefix} こちらまでは何で来られましたか？`;
    } else if (guidance.topic.includes('所要時間')) {
      return `${prefix} どれくらい時間がかかりましたか？`;
    } else if (guidance.topic.includes('探究活動')) {
      return `${prefix} それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。`;
    }
  }

  // 探究活動の深掘り質問をデフォルトで生成
  if (guidance?.topic && guidance.topic.includes('探究活動')) {
    return `${prefix} それは面白い取り組みですね。その中で一番印象に残った発見や気づきはありますか？`;
  } else if (guidance?.topic && guidance.topic.includes('困難')) {
    return `${prefix} 困ったことがあったときは、どのように解決しましたか？`;
  } else if (guidance?.topic && guidance.topic.includes('きっかけ')) {
    return `${prefix} それに興味を持ったきっかけは何でしたか？`;
  }
  
  // 最終デフォルト
  return `${prefix} もう少し詳しく教えていただけますか？`;
}

// 会話文脈の高度分析
function analyzeConversationContext(history: ConversationHistory[], _essay: EssayContent) {
  const studentAnswers = history.filter(msg => msg.role === 'student');
  const lastAnswer = studentAnswers[studentAnswers.length - 1]?.content || '';
  
  return {
    // 感情分析
    emotionalTone: detectEmotionalTone(lastAnswer),
    // 具体性レベル
    specificityLevel: assessSpecificity(lastAnswer),
    // 探究的思考の深さ
    inquiryDepth: assessInquiryDepth(lastAnswer),
    // 明和7軸の発現度
    meiwaQualityManifest: assessMeiwaQualities(lastAnswer),
    // 次の最適質問タイプ
    nextQuestionType: determineNextQuestionType(studentAnswers, _essay),
    // 個人的興味キーワード
    personalKeywords: extractPersonalKeywords(lastAnswer)
  };
}

function detectEmotionalTone(text: string): 'passionate' | 'uncertain' | 'confident' | 'reflective' | 'neutral' {
  if (/好き|大好き|楽し|嬉し|熱中|夢中|情熱/.test(text)) return 'passionate';
  if (/わからない|どうかな|うーん|悩ん|迷っ/.test(text)) return 'uncertain';
  if (/絶対|必ず|自信|できる|得意/.test(text)) return 'confident';
  if (/ふり返る|考え|思っ|気づ|学ん/.test(text)) return 'reflective';
  return 'neutral';
}

function assessSpecificity(text: string): 'high' | 'medium' | 'low' {
  const specificMarkers = text.match(/具体的|例えば|実際|その時|ある日|時間|場所|人/g) || [];
  const numbers = text.match(/一|二|三|四|五|六|七|八|九|十|1|2|3|4|5|6|7|8|9|0/g) || [];
  
  if (specificMarkers.length >= 3 || numbers.length >= 2) return 'high';
  if (specificMarkers.length >= 1 || numbers.length >= 1) return 'medium';
  return 'low';
}

function assessInquiryDepth(text: string): 'surface' | 'intermediate' | 'deep' {
  const deepMarkers = text.match(/なぜ|どうして|原因|理由|背景|仕組み|本質|意味/g) || [];
  const processMarkers = text.match(/過程|手順|方法|やり方|進め方/g) || [];
  
  if (deepMarkers.length >= 2) return 'deep';
  if (deepMarkers.length >= 1 || processMarkers.length >= 1) return 'intermediate';
  return 'surface';
}

function assessMeiwaQualities(text: string) {
  return {
    genuineInterest: /好き|大好き|興味|関心|情熱/.test(text) ? 1 : 0,
    experienceBase: /体験|実際|やった|取り組ん/.test(text) ? 1 : 0,
    socialConnection: /社会|人|みんな|役立/.test(text) ? 1 : 0,
    noDefinitiveAnswer: /答えがない|正解がない|わからない/.test(text) ? 1 : 0,
    empathy: /伝え|共有|理解|共感/.test(text) ? 1 : 0,
    selfTransformation: /変わっ|成長|できるよう|学ん/.test(text) ? 1 : 0,
    originalExpression: /私は|僕は|自分なり/.test(text) ? 1 : 0
  };
}

function determineNextQuestionType(answers: ConversationHistory[], _essay: EssayContent): string {
  const count = answers.length;
  
  if (count <= 1) return 'basic_info';
  if (count <= 3) return 'inquiry_introduction';
  if (count <= 6) return 'deep_exploration';
  if (count <= 9) return 'challenge_resolution';
  if (count <= 12) return 'metacognition';
  return 'future_connection';
}

function extractPersonalKeywords(text: string): string[] {
  // パーソナルなキーワードを抽出（名詞、活動、感情語）
  const keywords = text.match(/[一-龯ぁ-ゖァ-ヶ]{2,}/g) || [];
  return keywords
    .filter(word => !/です|ます|でした|こと|もの|ため/.test(word))
    .slice(0, 5);
}

