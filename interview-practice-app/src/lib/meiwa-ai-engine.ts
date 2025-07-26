/**
 * 明和高校附属中学校 AI評価エンジン
 * 探究活動特化の質問生成・評価システム
 */

import {
  MeiwaResearchEvaluation,
  MeiwaQuestionGenerator,
  MeiwaQuestion,
  MeiwaQuestionType,
  ResearchCategory,
  ResearchActivityAnalysis,
  NegativeQuestionHandler
} from '@/types/meiwa-evaluation';
import { meiwaAIService } from './meiwa-ai-service';

export class MeiwaAIEngine {
  
  /**
   * 否定疑問文ハンドラー
   * 「決まった正解がないか？」のような否定疑問文を正しく処理
   */
  private negativeQuestionHandler: NegativeQuestionHandler = {
    detectNegativePattern: (question: string): boolean => {
      const negativePatterns = [
        /ないか[？?]/,
        /ではないか[？?]/,
        /じゃないか[？?]/,
        /ありませんか[？?]/,
        /いけないか[？?]/,
        /だめか[？?]/
      ];
      return negativePatterns.some(pattern => pattern.test(question));
    },

    interpretResponse: (response: string, isNegativeQuestion: boolean) => {
      const yesPatterns = ['はい', 'そうです', 'そう思います', 'あります', 'います'];
      const noPatterns = ['いいえ', 'ちがいます', 'ありません', 'いません', 'そうではない'];
      
      const hasYes = yesPatterns.some(pattern => response.includes(pattern));
      const hasNo = noPatterns.some(pattern => response.includes(pattern));
      
      let actualMeaning = response;
      let confidence = 0.7;
      let needsClarification = false;

      if (isNegativeQuestion) {
        if (hasYes && !hasNo) {
          // 否定疑問文で「はい」= 否定を肯定 = 実際は「ない」という意味
          actualMeaning = "（正解は）ない";
          confidence = 0.8;
        } else if (hasNo && !hasYes) {
          // 否定疑問文で「いいえ」= 否定を否定 = 実際は「ある」という意味
          actualMeaning = "（正解は）ある";
          confidence = 0.8;
        } else {
          needsClarification = true;
          confidence = 0.3;
        }
      }

      return { actualMeaning, confidence, needsClarification };
    },

    generateClarification: (response: string): string => {
      return "すみません、もう少し詳しく教えてください。その探究活動には、1つの決まった正解がありますか？それとも、いろいろな答えが考えられる問題ですか？";
    }
  };

  /**
   * 探究活動を分析してカテゴリーと特性を判定
   */
  analyzeResearchActivity(description: string): ResearchActivityAnalysis {
    // 実際はAI APIを使用してより精密な分析を行う
    const mockAnalysis: ResearchActivityAnalysis = {
      category: this.classifyResearchCategory(description),
      complexity: this.assessComplexity(description),
      hasDefinitiveAnswer: this.checkDefinitiveAnswer(description),
      socialRelevance: this.assessSocialRelevance(description),
      personalConnection: this.assessPersonalConnection(description),
      originalityLevel: this.assessOriginality(description),
      sustainabilityPotential: this.assessSustainability(description)
    };

    return mockAnalysis;
  }

  /**
   * 探究活動のカテゴリー分類
   */
  private classifyResearchCategory(description: string): ResearchCategory {
    const keywords = {
      science_experiment: ['実験', '観察', '科学', '理科', '化学', '物理', '生物'],
      social_investigation: ['調査', '社会', 'アンケート', '統計', '歴史', '政治'],
      environmental_study: ['環境', '生態', '自然', '動物', '植物', '気候'],
      cultural_exploration: ['文化', '伝統', '芸能', '祭り', '風習', '言語'],
      technology_creation: ['プログラミング', 'ロボット', '発明', 'IT', 'アプリ'],
      community_service: ['ボランティア', '地域', '福祉', '高齢者', '子ども'],
      artistic_expression: ['絵画', '音楽', '創作', 'アート', '表現'],
      health_wellness: ['健康', '医療', '食事', '運動', '心理'],
      international_awareness: ['国際', '外国', '多文化', '言語', '交流'],
      philosophical_inquiry: ['哲学', '倫理', '考える', '疑問', '本質']
    };

    for (const [category, keywordList] of Object.entries(keywords)) {
      if (keywordList.some(keyword => description.includes(keyword))) {
        return category as ResearchCategory;
      }
    }

    return 'social_investigation'; // デフォルト
  }

  /**
   * 複雑性の評価（1-5段階）
   */
  private assessComplexity(description: string): number {
    const complexityIndicators = [
      '複数の要因', '相互作用', '長期的', '多角的', '様々な視点',
      '深く', '複雑', '多面的', '総合的', 'システム'
    ];
    
    const matchCount = complexityIndicators.filter(indicator => 
      description.includes(indicator)
    ).length;

    return Math.min(5, Math.max(1, Math.ceil(matchCount / 2) + 2));
  }

  /**
   * 決まった正解があるかの判定（重要：否定疑問文対応）
   */
  private checkDefinitiveAnswer(description: string): boolean {
    const definitiveAnswerIndicators = [
      '正解', '答え', '公式', '定理', '法則', '決まった方法',
      '1つの結論', '明確な答え', '確実', '絶対'
    ];

    const openEndedIndicators = [
      '様々な', '多様な', '人それぞれ', '考え方による', '視点',
      '可能性', '創造的', '新しい発見', '未知', '探究'
    ];

    const definitiveCount = definitiveAnswerIndicators.filter(indicator =>
      description.includes(indicator)
    ).length;

    const openEndedCount = openEndedIndicators.filter(indicator =>
      description.includes(indicator)
    ).length;

    return definitiveCount > openEndedCount;
  }

  /**
   * 社会的関連性の評価
   */
  private assessSocialRelevance(description: string): number {
    const socialIndicators = [
      '社会', '地域', '人々', 'みんな', '世界', '日本', 
      '問題', '課題', '改善', '貢献', '役立つ'
    ];

    const matchCount = socialIndicators.filter(indicator =>
      description.includes(indicator)
    ).length;

    return Math.min(5, Math.max(1, matchCount + 1));
  }

  /**
   * 個人的関連性の評価
   */
  private assessPersonalConnection(description: string): number {
    const personalIndicators = [
      '自分', '私', '体験', '経験', '感じた', '思った',
      '気づいた', '学んだ', '変わった', '成長'
    ];

    const matchCount = personalIndicators.filter(indicator =>
      description.includes(indicator)
    ).length;

    return Math.min(5, Math.max(1, matchCount + 1));
  }

  /**
   * 独創性の評価
   */
  private assessOriginality(description: string): number {
    const originalityIndicators = [
      '新しい', '独自', 'オリジナル', '工夫', '発見',
      '考えた', '思いついた', 'アイデア', '創造'
    ];

    const matchCount = originalityIndicators.filter(indicator =>
      description.includes(indicator)
    ).length;

    return Math.min(5, Math.max(1, matchCount + 2));
  }

  /**
   * 継続可能性の評価
   */
  private assessSustainability(description: string): number {
    const sustainabilityIndicators = [
      '続けて', '継続', 'ずっと', '今後', '将来',
      'もっと', 'さらに', '深く', '発展'
    ];

    const matchCount = sustainabilityIndicators.filter(indicator =>
      description.includes(indicator)
    ).length;

    return Math.min(5, Math.max(1, matchCount + 2));
  }

  /**
   * 明和中特化の質問を生成（実AI API使用）
   */
  async generateMeiwaQuestion(
    researchTopic: string,
    previousResponses: string[],
    currentFocus: MeiwaQuestionType
  ): Promise<MeiwaQuestion> {
    try {
      // 実際のAI APIを使用した質問生成
      return await meiwaAIService.generateMeiwaQuestion(
        researchTopic,
        previousResponses,
        currentFocus
      );
    } catch (error) {
      console.error('AI質問生成エラー、フォールバックを使用:', error);
      
      // エラー時はローカル実装にフォールバック
      return this.generateFallbackQuestion(researchTopic, currentFocus);
    }
  }

  /**
   * フォールバック質問生成（従来の実装）
   */
  private generateFallbackQuestion(
    researchTopic: string,
    currentFocus: MeiwaQuestionType
  ): MeiwaQuestion {
    const questionTemplates = this.getMeiwaQuestionTemplates();
    const template = questionTemplates[currentFocus];
    
    const question = this.personalizeQuestion(template, researchTopic);
    
    return {
      id: `meiwa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: currentFocus,
      question: question.text,
      intent: question.intent,
      evaluationCriteria: question.criteria,
      expectedResponse: question.expected,
      followUpTriggers: question.triggers,
      difficulty: question.difficulty
    };
  }

  /**
   * 明和中の質問テンプレート
   */
  private getMeiwaQuestionTemplates() {
    return {
      basic_interest: {
        text: "その探究活動について、どうしてそのテーマを選んだのですか？",
        intent: "真の興味・関心の度合いを確認",
        criteria: ["自発性", "継続的関心", "熱意の真正性"],
        expected: "具体的なきっかけと継続的な関心を示す",
        triggers: ["もっと詳しく", "具体的には", "どんな気持ち"],
        difficulty: 2
      },
      experience_detail: {
        text: "実際にどのような方法で調べたり、実験したりしましたか？",
        intent: "体験・学び基盤性の確認",
        criteria: ["実体験の具体性", "学習プロセス", "取り組み方"],
        expected: "具体的な行動と学習過程を示す",
        triggers: ["困ったこと", "工夫したこと", "学んだこと"],
        difficulty: 3
      },
      social_awareness: {
        text: "その探究活動は、身の回りの人や社会とどのような関係がありますか？",
        intent: "社会・日常連結性の確認",
        criteria: ["現実世界との関連", "社会的意義", "日常生活への影響"],
        expected: "社会や日常生活との具体的な関連を示す",
        triggers: ["どんな影響", "なぜ重要", "他の人にとって"],
        difficulty: 4
      },
      complexity_check: {
        text: "その問題には、決まった正解がありますか？", // 否定疑問文注意
        intent: "探究性・非正解性の確認（否定疑問文対応重要）",
        criteria: ["問題の複雑性", "多様な視点", "創造的思考の余地"],
        expected: "複雑で多面的な問題であることを示す",
        triggers: ["どんな答え", "人によって違う", "新しい発見"],
        difficulty: 5
      },
      empathy_test: {
        text: "その探究活動について、友達や家族に説明するとしたら、どのように話しますか？",
        intent: "他者理解・共感可能性の確認",
        criteria: ["説明の明確性", "共感可能性", "普遍的関心"],
        expected: "分かりやすく共感を呼ぶ説明",
        triggers: ["どんな反応", "興味を持つ", "分かりやすく"],
        difficulty: 3
      },
      growth_reflection: {
        text: "この探究活動を通して、あなた自身はどのように変わりましたか？",
        intent: "自己変容・成長実感の確認",
        criteria: ["具体的変化", "成長認識", "価値観の変化"],
        expected: "具体的な自己変容を示す",
        triggers: ["どんな変化", "前と比べて", "新しい考え"],
        difficulty: 4
      },
      expression_quality: {
        text: "今話してくれたことを、あなた自身の言葉でもう一度説明してもらえますか？",
        intent: "自分の言葉表現力の確認",
        criteria: ["オリジナリティ", "個人的語彙", "表現の真正性"],
        expected: "独自の表現と個人的な語彙を使用",
        triggers: ["あなたらしい言葉", "感じたこと", "思ったこと"],
        difficulty: 3
      },
      deep_dive: {
        text: "その中で一番印象に残ったことは何ですか？なぜそれが印象的だったのでしょう？",
        intent: "深い理解と感情的関与の確認",
        criteria: ["深い洞察", "感情的関与", "記憶の鮮明さ"],
        expected: "深い洞察と感情的な関与を示す",
        triggers: ["なぜ印象的", "どんな気持ち", "何を学んだ"],
        difficulty: 4
      },
      challenge: {
        text: "もしその探究をもう一度やり直すとしたら、何を変えたいですか？",
        intent: "批判的思考と向上意欲の確認",
        criteria: ["批判的思考", "改善意識", "学習意欲"],
        expected: "建設的な改善案と学習意欲を示す",
        triggers: ["どうして変える", "どんな結果", "新しいアイデア"],
        difficulty: 5
      },
      synthesis: {
        text: "この探究活動で得たことを、将来どのように活かしていきたいですか？",
        intent: "統合的思考と将来展望の確認",
        criteria: ["統合的思考", "将来展望", "継続意欲"],
        expected: "学びの統合と将来への具体的展望",
        triggers: ["具体的に", "どんな場面で", "どんな風に"],
        difficulty: 4
      }
    };
  }

  /**
   * 質問をパーソナライズ
   */
  private personalizeQuestion(template: any, researchTopic: string) {
    // 実際はAI APIを使用してより精密なパーソナライゼーションを行う
    return {
      text: template.text.replace(/その探究活動/g, `「${researchTopic}」の探究`),
      intent: template.intent,
      criteria: template.criteria,
      expected: template.expected,
      triggers: template.triggers,
      difficulty: template.difficulty
    };
  }

  /**
   * 7項目評価を実行（実AI API使用）
   */
  async evaluateResponse(
    question: MeiwaQuestion,
    response: string,
    context: {
      researchTopic: string;
      previousResponses: string[];
      currentSessionData: any;
    }
  ): Promise<Partial<MeiwaResearchEvaluation>> {
    try {
      // 実際のAI APIを使用した評価
      return await meiwaAIService.evaluateResponse(question, response, {
        researchTopic: context.researchTopic,
        previousResponses: context.previousResponses
      });
    } catch (error) {
      console.error('AI評価エラー、フォールバックを使用:', error);
      
      // エラー時はローカル実装にフォールバック
      return this.evaluateResponseFallback(question, response);
    }
  }

  /**
   * フォールバック評価（従来の実装）
   */
  private evaluateResponseFallback(
    question: MeiwaQuestion,
    response: string
  ): Partial<MeiwaResearchEvaluation> {
    const evaluation: Partial<MeiwaResearchEvaluation> = {};

    switch (question.type) {
      case 'basic_interest':
        evaluation.genuineInterest = this.evaluateGenuineInterest(response);
        break;
      case 'experience_detail':
        evaluation.experienceBase = this.evaluateExperienceBase(response);
        break;
      case 'social_awareness':
        evaluation.socialConnection = this.evaluateSocialConnection(response);
        break;
      case 'complexity_check':
        evaluation.noDefinitiveAnswer = this.evaluateNoDefinitiveAnswer(response, question.question);
        break;
      case 'empathy_test':
        evaluation.otherUnderstanding = this.evaluateOtherUnderstanding(response);
        break;
      case 'growth_reflection':
        evaluation.selfTransformation = this.evaluateSelfTransformation(response);
        break;
      case 'expression_quality':
        evaluation.originalExpression = this.evaluateOriginalExpression(response);
        break;
    }

    return evaluation;
  }

  /**
   * 各評価項目の実装（モック版）
   */
  private evaluateGenuineInterest(response: string) {
    const score = this.calculateScoreBasedOnKeywords(response, [
      '好き', '興味', '面白い', '楽しい', '魅力的', 'ワクワク',
      '続けたい', 'もっと知りたい', '情熱', '夢中'
    ]);

    return {
      score,
      indicators: ['継続的な関心を示す表現', '感情的な関与'],
      concerns: score < 3 ? ['熱意がより伝わる表現を'] : [],
      feedback: `探究活動への真の興味・関心度: ${score}/5点。${score >= 4 ? '素晴らしい熱意が伝わります！' : '更に具体的な興味のポイントを教えてください。'}`
    };
  }

  private evaluateExperienceBase(response: string) {
    const score = this.calculateScoreBasedOnKeywords(response, [
      '実際に', '体験', '経験', 'やってみた', '試した',
      '観察した', '調べた', '実験', '取り組んだ', '行った'
    ]);

    return {
      score,
      realExperiences: ['具体的な実体験の記述'],
      learningProcess: ['学習プロセスの明確さ'],
      feedback: `体験・学び基盤性: ${score}/5点。${score >= 4 ? '具体的な体験がよく伝わります！' : 'より詳しい体験の過程を聞かせてください。'}`
    };
  }

  private evaluateSocialConnection(response: string) {
    const score = this.calculateScoreBasedOnKeywords(response, [
      '社会', '地域', 'みんな', '人々', '世界', '日本',
      '役立つ', '貢献', '影響', '関係', 'つながり', '大切'
    ]);

    return {
      score,
      dailyLifeLinks: ['日常生活との関連性'],
      societalRelevance: ['社会的意義'],
      feedback: `社会・日常連結性: ${score}/5点。${score >= 4 ? '社会との関連がよく理解できています！' : '社会や日常生活との関連をもう少し詳しく教えてください。'}`
    };
  }

  private evaluateNoDefinitiveAnswer(response: string, question: string) {
    // 否定疑問文の処理
    const isNegativeQuestion = this.negativeQuestionHandler.detectNegativePattern(question);
    const interpretation = this.negativeQuestionHandler.interpretResponse(response, isNegativeQuestion);
    
    let score = 3;
    if (interpretation.actualMeaning.includes('ない')) {
      score = 5; // 正解がない = 良い探究活動
    } else if (interpretation.actualMeaning.includes('ある')) {
      score = 2; // 正解がある = 改善の余地
    }

    return {
      score,
      complexity: ['問題の複雑性の認識'],
      multipleViews: !interpretation.actualMeaning.includes('ある'),
      creativePotential: !interpretation.actualMeaning.includes('ある'),
      feedback: `探究性・非正解性: ${score}/5点。${score >= 4 ? '素晴らしい探究的思考です！' : '多様な答えが考えられる問題への発展を考えてみましょう。'}`
    };
  }

  private evaluateOtherUnderstanding(response: string) {
    const score = this.calculateScoreBasedOnKeywords(response, [
      '分かりやすく', '説明', 'みんな', '友達', '家族',
      '共感', '理解', '興味', '関心', '身近'
    ]);

    return {
      score,
      clarity: ['説明の明確性'],
      empathy: ['共感可能な要素'],
      universality: score >= 4,
      feedback: `他者理解・共感可能性: ${score}/5点。${score >= 4 ? '他の人にもよく伝わる説明ですね！' : 'より多くの人が理解できる説明を考えてみましょう。'}`
    };
  }

  private evaluateSelfTransformation(response: string) {
    const score = this.calculateScoreBasedOnKeywords(response, [
      '変わった', '成長', '学んだ', '気づいた', '考えるように',
      '行動', '価値観', '見方', '思うように', '感じるように'
    ]);

    return {
      score,
      behaviorChanges: ['行動の変化'],
      valueShifts: ['価値観の変化'],
      selfAwareness: ['自己認識の変化'],
      feedback: `自己変容・成長実感: ${score}/5点。${score >= 4 ? '素晴らしい成長が感じられます！' : '探究を通しての変化をもう少し具体的に教えてください。'}`
    };
  }

  private evaluateOriginalExpression(response: string) {
    const score = this.calculateOriginalityScore(response);

    return {
      score,
      personalVocab: ['個人的な語彙の使用'],
      uniquePhrases: ['独自の表現'],
      authenticity: score >= 3,
      feedback: `自分の言葉表現力: ${score}/5点。${score >= 4 ? 'あなたらしい表現で素晴らしいです！' : 'もっとあなた自身の言葉で表現してみてください。'}`
    };
  }

  private calculateScoreBasedOnKeywords(response: string, keywords: string[]): number {
    const matchCount = keywords.filter(keyword => response.includes(keyword)).length;
    const responseLength = response.length;
    
    let score = Math.min(5, Math.max(1, Math.ceil(matchCount / 2) + 1));
    
    // 回答の長さも考慮
    if (responseLength < 50) score = Math.max(1, score - 1);
    if (responseLength > 200) score = Math.min(5, score + 1);
    
    return score;
  }

  private calculateOriginalityScore(response: string): number {
    const commonPhrases = ['思います', 'だと思う', 'という感じ', '〜みたいな'];
    const uniqueIndicators = ['感じた', '実感', '心から', '本当に', '自分なりに'];
    
    let score = 3;
    
    const commonCount = commonPhrases.filter(phrase => response.includes(phrase)).length;
    const uniqueCount = uniqueIndicators.filter(indicator => response.includes(indicator)).length;
    
    score = score - commonCount + uniqueCount;
    
    return Math.min(5, Math.max(1, score));
  }
}

// シングルトンインスタンス
export const meiwaAIEngine = new MeiwaAIEngine();