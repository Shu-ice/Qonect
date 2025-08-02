/**
 * 明和高校附属中学校 AI評価サービス
 * 実際のAI APIを使用した評価システム
 */

import { multiAI } from './ai/adapter';
import {
  MeiwaResearchEvaluation,
  MeiwaQuestion,
  MeiwaQuestionType
} from '@/types/meiwa-evaluation';

/**
 * 明和中特化AI評価プロンプト
 */
export class MeiwaAIPrompts {
  
  /**
   * 探究活動質問生成プロンプト
   */
  static generateQuestionPrompt(
    researchTopic: string,
    previousResponses: string[],
    questionType: MeiwaQuestionType
  ): string {
    const context = previousResponses.length > 0 
      ? `これまでの回答: ${previousResponses.join('\n')}\n\n`
      : '';

    const questionTypes = {
      basic_interest: `基本的な興味・関心を確認する質問。「なぜその探究活動を選んだのか」という動機を深く掘り下げる。`,
      experience_detail: `具体的な体験や実験の詳細を聞く質問。「実際にどのような方法で調べたか」「どんな困難があったか」等`,
      social_awareness: `社会や日常生活との関連性を確認する質問。探究活動が現実世界とどうつながっているかを問う。`,
      complexity_check: `否定疑問文で探究性を確認。「その問題には決まった正解がありますか？」のような質問。正解がない=良い探究活動。`,
      empathy_test: `他者への説明力を試す質問。「友達や家族にどう説明するか」等、共感可能性をテスト。`,
      growth_reflection: `自己変容・成長を振り返る質問。探究を通してどう変わったかを問う。`,
      expression_quality: `自分の言葉での表現力を確認。オリジナリティと真正性を評価。`,
      deep_dive: `さらなる深掘り質問。一番印象的だったこと、新たな発見等`,
      challenge: `挑戦的質問。改善点や今後の展開等`,
      synthesis: `統合的質問。学びを将来にどう活かすか等`
    };

    return `あなたは明和高校附属中学校の面接官です。以下の条件で質問を1つ生成してください。

【探究テーマ】${researchTopic}

【質問タイプ】${questionTypes[questionType]}

${context}

【出力形式】
質問: [15歳にも理解できる自然な日本語で]
意図: [この質問で何を評価したいか]
評価基準: [回答で重視すべき3つのポイント]

【重要な制約】
1. 小学6年生が理解できる語彙を使用
2. 明和中の「主体的で探究的な学習者」像に基づく
3. 1回の質問は30秒以内で回答できる長さ
4. 探究活動の真の理解度を測る深い質問にする`;
  }

  /**
   * 7項目評価実行プロンプト
   */
  static evaluateResponsePrompt(
    question: string,
    response: string,
    researchTopic: string,
    evaluationType: keyof MeiwaResearchEvaluation
  ): string {
    const evaluationCriteria = {
      genuineInterest: {
        name: '真の興味・関心度',
        description: 'その探究活動を心から好きか？本当に興味・関心があるか？',
        indicators: ['継続的関心の表現', '感情的な関与', '自発性の証拠', '熱意の真正性']
      },
      experienceBase: {
        name: '体験・学び基盤性',
        description: 'その探究活動は自分の体験や学びに基づいているか？',
        indicators: ['具体的な実体験', '学習プロセスの明確性', '試行錯誤の記述', '学びの深さ']
      },
      socialConnection: {
        name: '社会・日常連結性',
        description: 'その探究活動は日常生活または社会と結びついているか？',
        indicators: ['現実世界との関連', '社会的意義の認識', '日常への影響', '他者への影響']
      },
      noDefinitiveAnswer: {
        name: '探究性・非正解性',
        description: 'その探究内容には決まった正解がないか？複雑で多面的な問題か？',
        indicators: ['問題の複雑性理解', '多様な視点の認識', '創造的思考の余地', '唯一解の否定']
      },
      otherUnderstanding: {
        name: '他者理解・共感可能性',
        description: 'その探究活動は他者が理解でき、共感できるものか？',
        indicators: ['説明の明確性', '普遍的関心への接続', '共感可能な要素', '理解しやすさ']
      },
      selfTransformation: {
        name: '自己変容・成長実感',
        description: 'この探究活動を通じて、自分の在り方・生き方に変化をもたらしたか？',
        indicators: ['具体的な行動変化', '価値観の変化', '自己認識の変化', '成長の自覚']
      },
      originalExpression: {
        name: '自分の言葉表現力',
        description: '自分の言葉で語っているか？オリジナリティがあるか？',
        indicators: ['個人的な語彙使用', '独自の表現', '表現の真正性', '借り物でない言葉']
      }
    };

    const criteria = evaluationCriteria[evaluationType as keyof typeof evaluationCriteria];
    if (!criteria) {
      throw new Error(`Unknown evaluation type: ${evaluationType}`);
    }

    return `あなたは明和高校附属中学校の面接評価の専門家です。以下の回答を「${criteria.name}」の観点から評価してください。

【探究テーマ】${researchTopic}
【質問】${question}
【生徒の回答】${response}

【評価項目】${criteria.name}
【評価観点】${criteria.description}
【評価指標】${criteria.indicators.join('、')}

【出力形式（JSON）】
{
  "score": [1-5の整数],
  "indicators": ["具体的に見られた良い点のリスト"],
  "concerns": ["改善が必要な点のリスト"],
  "feedback": "具体的で建設的なフィードバック文章（100文字以内）"
}

【評価基準】
5点: 非常に優秀（明和中が求める理想的なレベル）
4点: 優秀（十分に評価できる）
3点: 普通（基本的な要件は満たす）
2点: やや不足（改善の余地が大きい）
1点: 不足（大幅な改善が必要）

【重要】
- 小学6年生の発達段階を考慮した評価
- 明和中の「主体的で探究的な学習者」像に基づく
- 探究活動の質を重視（結果よりもプロセス）
- JSONのみ出力（説明文は不要）`;
  }

  /**
   * 総合評価生成プロンプト
   */
  static generateOverallEvaluationPrompt(
    researchTopic: string,
    allResponses: string[],
    individualEvaluations: Partial<MeiwaResearchEvaluation>
  ): string {
    const evaluationSummary = Object.entries(individualEvaluations)
      .map(([key, value]) => `${key}: ${(value as any)?.score || 0}点`)
      .join('\n');

    return `明和高校附属中学校の面接評価を総合的に分析してください。

【探究テーマ】${researchTopic}
【全回答】
${allResponses.join('\n---\n')}

【個別評価結果】
${evaluationSummary}

【出力形式（JSON）】
{
  "overallScore": [1-5の小数点1桁],
  "overallFeedback": "明和中の教育理念に基づく総合的なフィードバック（200文字以内）",
  "strengths": ["主な強みのリスト（3-5項目）"],
  "improvements": ["改善提案のリスト（2-4項目）"],
  "nextSteps": ["次の練習で重点的に取り組むべき点（3-5項目）"]
}

【評価方針】
- 明和中の「夢や憧れを持ち、粘り強く挑戦する人」像に基づく
- 探究活動の質と深さを最重視
- 小学6年生としての成長の可能性を評価
- 建設的で励ましとなるフィードバック
- JSONのみ出力`;
  }
}

/**
 * 明和中AI評価サービス
 */
export class MeiwaAIEvaluationService {

  /**
   * 複数の明和中特化質問を生成
   */
  async generateQuestions(
    researchTopic: string,
    questionCount: number,
    difficultyLevel: number
  ): Promise<MeiwaQuestion[]> {
    const questions: MeiwaQuestion[] = [];
    const questionTypes: MeiwaQuestionType[] = [
      'basic_interest',
      'experience_detail', 
      'social_awareness',
      'complexity_check',
      'empathy_test',
      'growth_reflection',
      'expression_quality',
      'deep_dive'
    ];

    const previousResponses: string[] = [];

    for (let i = 0; i < questionCount; i++) {
      const questionType = questionTypes[i % questionTypes.length];
      
      const question = await this.generateMeiwaQuestion(
        researchTopic,
        previousResponses,
        questionType
      );

      questions.push({
        ...question,
        difficulty: Math.min(5, Math.max(1, difficultyLevel)) as 1 | 2 | 3 | 4 | 5,
      });

      // ダミーレスポンスを追加（より良い質問生成のため）
      previousResponses.push(`質問${i + 1}への回答`);
    }

    return questions;
  }

  /**
   * 明和中特化質問を生成
   */
  async generateMeiwaQuestion(
    researchTopic: string,
    previousResponses: string[],
    questionType: MeiwaQuestionType
  ): Promise<MeiwaQuestion> {
    try {
      const prompt = MeiwaAIPrompts.generateQuestionPrompt(
        researchTopic,
        previousResponses,
        questionType
      );

      const systemPrompt = `あなたは明和高校附属中学校の面接のエキスパートです。
探究活動を重視する教育理念に基づいて、小学6年生が答えられる質問を生成してください。`;

      // トリプルAI統合：質問生成では創造性と多様性を重視
      const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
        operation: 'question_generation',
        priority: 'balanced' // バランス重視で多様な質問を生成
      });
      
      // AI応答をパース（実装簡略化のため基本構造のみ）
      const questionText = this.extractQuestionFromAIResponse(aiResponse.content);
      
      return {
        id: `meiwa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: questionType,
        question: questionText,
        intent: `${questionType}の評価`,
        evaluationCriteria: ['明和中基準', '探究活動重視', '小学生レベル'],
        expectedResponse: '具体的で真正な回答',
        followUpTriggers: ['詳しく', 'もっと', 'なぜ'],
        difficulty: this.getQuestionDifficulty(questionType)
      };

    } catch (error) {
      console.error('質問生成エラー:', error);
      
      // フォールバック: デフォルト質問
      return this.getFallbackQuestion(questionType, researchTopic);
    }
  }

  /**
   * 7項目評価実行
   */
  async evaluateResponse(
    question: MeiwaQuestion,
    response: string,
    context: {
      researchTopic: string;
      previousResponses: string[];
    }
  ): Promise<Partial<MeiwaResearchEvaluation>> {
    
    // 質問タイプに基づいて評価項目を決定
    const evaluationType = this.mapQuestionTypeToEvaluation(question.type);
    if (!evaluationType) {
      return {};
    }

    try {
      const prompt = MeiwaAIPrompts.evaluateResponsePrompt(
        question.question,
        response,
        context.researchTopic,
        evaluationType
      );

      const systemPrompt = `明和高校附属中学校の面接評価基準に基づいて、小学6年生の回答を公平に評価してください。`;

      // トリプルAI統合：評価では厳密性と客観性を重視
      const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
        operation: 'evaluation',
        priority: 'quality_first' // 品質重視で正確な評価を実行
      });
      
      // JSON応答をパース
      const evaluation = this.parseEvaluationResponse(aiResponse.content);
      
      return {
        [evaluationType]: evaluation
      };

    } catch (error) {
      console.error('評価実行エラー:', error);
      
      // フォールバック: デフォルト評価
      return this.getFallbackEvaluation(evaluationType);
    }
  }

  /**
   * 総合評価生成
   */
  async generateFinalEvaluation(
    researchTopic: string,
    allResponses: string[],
    individualEvaluations: Partial<MeiwaResearchEvaluation>
  ): Promise<MeiwaResearchEvaluation> {
    try {
      const prompt = MeiwaAIPrompts.generateOverallEvaluationPrompt(
        researchTopic,
        allResponses,
        individualEvaluations
      );

      const systemPrompt = `明和中の教育理念に基づいて総合評価を行い、生徒の成長を促す建設的なフィードバックを提供してください。`;

      // トリプルAI統合：最終評価では総合判断力を重視
      const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
        operation: 'final_evaluation',
        priority: 'quality_first' // 最高品質での最終判断
      });
      
      const overallData = this.parseOverallEvaluationResponse(aiResponse.content);
      
      // 個別評価とマージして完全な評価を作成
      return this.mergeEvaluations(individualEvaluations, overallData);

    } catch (error) {
      console.error('総合評価エラー:', error);
      
      // フォールバック: デフォルト総合評価
      return this.getFallbackFinalEvaluation(individualEvaluations);
    }
  }

  // ヘルパーメソッド
  private extractQuestionFromAIResponse(content: string): string {
    const match = content.match(/質問[：:]\s*(.+)/);
    return match ? match[1].trim() : content.split('\n')[0] || '探究活動について教えてください。';
  }

  private getQuestionDifficulty(type: MeiwaQuestionType): 1 | 2 | 3 | 4 | 5 {
    const difficultyMap: Record<MeiwaQuestionType, 1 | 2 | 3 | 4 | 5> = {
      basic_interest: 2,
      experience_detail: 3,
      social_awareness: 4,
      complexity_check: 5,
      empathy_test: 3,
      growth_reflection: 4,
      expression_quality: 3,
      deep_dive: 4,
      challenge: 5,
      synthesis: 4
    };
    return difficultyMap[type] || 3;
  }

  private mapQuestionTypeToEvaluation(type: MeiwaQuestionType): keyof MeiwaResearchEvaluation | null {
    const mapping: Record<MeiwaQuestionType, keyof MeiwaResearchEvaluation | null> = {
      basic_interest: 'genuineInterest',
      experience_detail: 'experienceBase',
      social_awareness: 'socialConnection',
      complexity_check: 'noDefinitiveAnswer',
      empathy_test: 'otherUnderstanding',
      growth_reflection: 'selfTransformation',
      expression_quality: 'originalExpression',
      deep_dive: 'genuineInterest',
      challenge: 'selfTransformation',
      synthesis: 'socialConnection'
    };
    return mapping[type];
  }

  private parseEvaluationResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('JSON解析エラー:', error);
    }
    
    // フォールバック
    return {
      score: 3,
      indicators: ['基本的な要件を満たしています'],
      concerns: ['より具体的な説明があるとよいでしょう'],
      feedback: '引き続き頑張りましょう！'
    };
  }

  private parseOverallEvaluationResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('総合評価JSON解析エラー:', error);
    }
    
    return {
      overallScore: 3.5,
      overallFeedback: '明和中の理念に向けて着実に成長されています。',
      strengths: ['探究活動への関心', '真面目な取り組み'],
      improvements: ['より具体的な表現', '社会との関連性'],
      nextSteps: ['体験の詳細化', '感想の深掘り', '将来とのつながり']
    };
  }

  private getFallbackQuestion(type: MeiwaQuestionType, researchTopic: string): MeiwaQuestion {
    const fallbackQuestions: Record<MeiwaQuestionType, string> = {
      basic_interest: `「${researchTopic}」について、どうしてそのテーマを選んだのですか？`,
      experience_detail: '実際にどのような方法で調べましたか？',
      social_awareness: 'その探究活動は、身の回りの人や社会とどのような関係がありますか？',
      complexity_check: 'その問題には、決まった正解がありますか？',
      empathy_test: '友達にその探究活動について説明するとしたら、どのように話しますか？',
      growth_reflection: 'この探究活動を通して、あなた自身はどのように変わりましたか？',
      expression_quality: '今話してくれたことを、あなた自身の言葉でもう一度説明してもらえますか？',
      deep_dive: 'その中で一番印象に残ったことは何ですか？',
      challenge: 'もしその探究をもう一度やり直すとしたら、何を変えたいですか？',
      synthesis: 'この探究活動で得たことを、将来どのように活かしていきたいですか？'
    };

    return {
      id: `fallback_${Date.now()}`,
      type,
      question: fallbackQuestions[type],
      intent: `${type}の評価`,
      evaluationCriteria: ['基本的な理解', '具体性', '真正性'],
      expectedResponse: '個人的な体験に基づく回答',
      followUpTriggers: ['具体的に', 'なぜ', 'どのように'],
      difficulty: this.getQuestionDifficulty(type)
    };
  }

  private getFallbackEvaluation(evaluationType: keyof MeiwaResearchEvaluation): Partial<MeiwaResearchEvaluation> {
    return {
      [evaluationType]: {
        score: 3,
        indicators: ['基本的な内容を含んでいます'],
        concerns: ['より詳しい説明があるとよいでしょう'],
        feedback: '良いスタートです。さらに詳しく教えてください。'
      }
    };
  }

  private getFallbackFinalEvaluation(
    individualEvaluations: Partial<MeiwaResearchEvaluation>
  ): MeiwaResearchEvaluation {
    return {
      genuineInterest: individualEvaluations.genuineInterest || {
        score: 3, indicators: [], concerns: [], feedback: ''
      },
      experienceBase: individualEvaluations.experienceBase || {
        score: 3, realExperiences: [], learningProcess: [], feedback: ''
      },
      socialConnection: individualEvaluations.socialConnection || {
        score: 3, dailyLifeLinks: [], societalRelevance: [], feedback: ''
      },
      noDefinitiveAnswer: individualEvaluations.noDefinitiveAnswer || {
        score: 3, complexity: [], multipleViews: true, creativePotential: true, feedback: ''
      },
      otherUnderstanding: individualEvaluations.otherUnderstanding || {
        score: 3, clarity: [], empathy: [], universality: true, feedback: ''
      },
      selfTransformation: individualEvaluations.selfTransformation || {
        score: 3, behaviorChanges: [], valueShifts: [], selfAwareness: [], feedback: ''
      },
      originalExpression: individualEvaluations.originalExpression || {
        score: 3, personalVocab: [], uniquePhrases: [], authenticity: true, feedback: ''
      },
      overallScore: 3.2,
      overallFeedback: '明和高校附属中学校での学習に向けて、基本的な準備ができています。',
      strengths: ['探究活動への取り組み', '面接への真摯な姿勢'],
      improvements: ['より具体的な体験の説明', '感想の詳細化'],
      nextSteps: ['体験エピソードの充実', '社会とのつながりの意識', '自己表現力の向上']
    };
  }

  private mergeEvaluations(
    individual: Partial<MeiwaResearchEvaluation>,
    overall: any
  ): MeiwaResearchEvaluation {
    const base = this.getFallbackFinalEvaluation(individual);
    
    return {
      ...base,
      ...individual,
      overallScore: overall.overallScore || base.overallScore,
      overallFeedback: overall.overallFeedback || base.overallFeedback,
      strengths: overall.strengths || base.strengths,
      improvements: overall.improvements || base.improvements,
      nextSteps: overall.nextSteps || base.nextSteps
    };
  }
}

// シングルトンインスタンス
export const meiwaAIService = new MeiwaAIEvaluationService();