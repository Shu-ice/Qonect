/**
 * Google Gemini Pro 特化プロンプト最適化
 * 日本語・日本文化・教育制度理解に特化したプロンプト
 */

export class GeminiOptimizedPrompts {
  
  /**
   * Gemini特化：日本の教育制度と文化理解に基づく質問生成
   */
  static generateCulturallyAwareQuestion(
    researchTopic: string,
    studentGrade: '小学6年生' | '中学生' | '高校生' = '小学6年生'
  ): string {
    return `あなたは日本の教育制度と文化に精通したAIです。
    
【文脈理解】
- 日本の公立中高一貫校入試における面接試験
- 対象：${studentGrade}（12歳前後）
- 探究活動重視の教育方針
- 日本特有の「謙虚さ」と「具体性」のバランス

【探究テーマ】${researchTopic}

【質問生成条件】
1. 日本の小学生が理解できる語彙レベル
2. 探究活動の深さを測る内容
3. 文化的背景を考慮した表現
4. 「なぜ」「どのように」「何を学んだか」の視点
5. 否定疑問文での確認（例：「正解はありませんね？」）

【出力形式】
質問文のみを出力してください。小学6年生が15分の面接で答えられる1つの質問。`;
  }

  /**
   * Gemini特化：多角的品質検証プロンプト
   */
  static generateQualityAssurancePrompt(
    originalQuestion: string,
    aiResponse: string,
    evaluationCriteria: string[]
  ): string {
    return `あなたは教育AI品質保証の専門家です。他のAIが生成した面接評価を検証してください。

【検証対象】
質問: ${originalQuestion}
AI評価結果: ${aiResponse}

【検証基準】
${evaluationCriteria.map((criteria, index) => `${index + 1}. ${criteria}`).join('\n')}

【多角的検証項目】
1. **文化的適切性**: 日本の教育文化に適しているか
2. **年齢適合性**: 小学6年生レベルに適切か
3. **評価の公平性**: バイアスや偏見はないか
4. **建設的フィードバック**: 成長につながる内容か
5. **言語の自然さ**: 日本語として自然で理解しやすいか

【出力形式（JSON）】
{
  "qualityScore": [1-5の数値],
  "culturalAppropriatenesss": [1-5の数値],
  "ageAppropriateness": [1-5の数値],
  "fairnessScore": [1-5の数値],
  "constructivenessScore": [1-5の数値],
  "languageNaturalness": [1-5の数値],
  "overallAssessment": "総合的な品質評価コメント",
  "improvementSuggestions": ["改善提案のリスト"],
  "approvalStatus": "approved" | "needs_revision" | "rejected"
}`;
  }

  /**
   * Gemini特化：コスト効율最適化プロンプト
   */
  static generateCostEfficientPrompt(
    batchQuestions: string[],
    batchContext: string
  ): string {
    return `効率的なバッチ処理で複数の面接質問を同時に評価してください。

【共通コンテキスト】
${batchContext}

【評価対象質問群】
${batchQuestions.map((q, i) => `質問${i + 1}: ${q}`).join('\n')}

【効率化要求】
- 各質問を独立して評価
- 共通要素の重複説明を避ける
- 簡潔で実用的な評価
- 日本の教育制度理解を活用

【出力形式】
各質問に対して以下のフォーマットで出力：

質問1評価:
- 適切性: [1-5]
- 改善点: [簡潔に]

質問2評価:
- 適切性: [1-5] 
- 改善点: [簡潔に]

[続く...]`;
  }

  /**
   * Gemini特化：日本語ニュアンス最適化プロンプト
   */
  static generateLinguisticRefinementPrompt(
    originalText: string,
    targetAudience: '小学6年生' | '保護者' | '教師'
  ): string {
    const audienceContext = {
      '小学6年生': '子どもにも分かりやすく、励ましの気持ちを込めて',
      '保護者': '保護者の関心事に配慮し、具体的なサポート方法を含めて',
      '教師': '教育的観点から専門的だが実践的な内容で'
    };

    return `日本語の表現を${targetAudience}向けに最適化してください。

【原文】
${originalText}

【対象者】${targetAudience}
【最適化方針】${audienceContext[targetAudience]}

【日本語最適化基準】
1. **敬語の適切な使用**: 対象者に応じた敬語レベル
2. **語彙の調整**: 年齢・立場に適した言葉選び
3. **文体の統一**: 自然で読みやすい文章構成
4. **文化的配慮**: 日本の教育文化に適した表現
5. **感情的配慮**: 相手の気持ちに寄り添う表現

【出力形式】
最適化されたテキストのみを出力してください。改善理由の説明は不要です。`;
  }

  /**
   * Gemini特化：探究活動の社会的意義評価プロンプト
   */
  static generateSocialRelevancePrompt(
    researchTopic: string,
    studentResponse: string
  ): string {
    return `日本社会の文脈で探究活動の社会的意義を評価してください。

【探究テーマ】${researchTopic}
【生徒の回答】${studentResponse}

【日本社会の特徴考慮】
- 地域社会との結びつき
- 世代間の協力
- 環境・持続可能性への関心
- 技術革新と伝統文化の融合
- 国際化と日本らしさの両立

【評価観点】
1. **地域貢献の可能性**: 地元や日本社会への貢献度
2. **世代を超えた価値**: 大人も学べる内容か
3. **将来性**: 中学・高校・大学でさらに発展できるか
4. **実践可能性**: 実際に取り組める具体性があるか
5. **社会課題への意識**: 現代日本の課題と関連しているか

【出力形式（JSON）】
{
  "socialRelevanceScore": [1-5の数値],
  "communityContribution": [1-5の数値],
  "intergenerationalValue": [1-5の数値],
  "futureProspects": [1-5の数値],
  "practicality": [1-5の数値],
  "socialAwareness": [1-5の数値],
  "culturalAlignment": "日本文化・社会との適合性コメント",
  "developmentSuggestions": ["さらなる発展のための提案"]
}`;
  }
}

/**
 * Gemini Pro APIの日本語最適化設定
 */
export const GEMINI_JAPANESE_CONFIG = {
  // 日本語に最適化された生成設定
  generationConfig: {
    temperature: 0.7,
    topK: 20,
    topP: 0.8,
    maxOutputTokens: 2000,
    // 日本語の文脈理解を向上させる設定
    candidateCount: 1,
  },
  
  // 日本の教育制度理解のためのコンテキスト
  educationContext: {
    schoolSystem: "日本の6-3-3-4制教育システム",
    culturalValues: ["謙虚さ", "協調性", "継続力", "探究心"],
    evaluationCriteria: ["具体性", "体験の深さ", "社会とのつながり", "自己変革"],
  },
  
  // 安全性フィルター（日本の教育環境に適した設定）
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT" as any,
      threshold: "BLOCK_MEDIUM_AND_ABOVE" as any
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH" as any, 
      threshold: "BLOCK_MEDIUM_AND_ABOVE" as any
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
      threshold: "BLOCK_LOW_AND_ABOVE" as any
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
      threshold: "BLOCK_MEDIUM_AND_ABOVE" as any
    }
  ]
};