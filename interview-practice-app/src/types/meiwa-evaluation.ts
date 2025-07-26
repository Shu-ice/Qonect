/**
 * 明和高校附属中学校 探究活動特化評価システム
 * 7つの評価項目による5段階評価
 */

// 明和中の7つの探究活動評価項目
export interface MeiwaResearchEvaluation {
  // 1. 真の興味・関心度
  genuineInterest: {
    score: number;           // 1-5段階評価
    indicators: string[];    // 熱意の証拠・具体例
    concerns: string[];      // 懸念点・改善が必要な点
    feedback: string;        // 具体的フィードバック
  };
  
  // 2. 体験・学び基盤性
  experienceBase: {
    score: number;
    realExperiences: string[];     // 実体験の具体例
    learningProcess: string[];     // 学習プロセスの明確性
    feedback: string;
  };
  
  // 3. 社会・日常連結性
  socialConnection: {
    score: number;
    dailyLifeLinks: string[];      // 日常生活との関連
    societalRelevance: string[];   // 社会的意義
    feedback: string;
  };
  
  // 4. 探究性・非正解性 ⚠️重要：否定疑問文対応
  noDefinitiveAnswer: {
    score: number;
    // AI認識ルール：正解がない = 高スコア、正解がある = 低スコア
    complexity: string[];          // 問題の複雑性
    multipleViews: boolean;        // 多様な視点の存在
    creativePotential: boolean;    // 創造的思考の余地
    feedback: string;
  };
  
  // 5. 他者理解・共感可能性
  otherUnderstanding: {
    score: number;
    clarity: string[];             // 説明の明確性
    empathy: string[];             // 共感可能な要素
    universality: boolean;         // 普遍的関心への接続
    feedback: string;
  };
  
  // 6. 自己変容・成長実感
  selfTransformation: {
    score: number;
    behaviorChanges: string[];     // 行動の変化
    valueShifts: string[];         // 価値観の変化
    selfAwareness: string[];       // 自己認識の変化
    feedback: string;
  };
  
  // 7. 自分の言葉表現力
  originalExpression: {
    score: number;
    personalVocab: string[];       // 個人的な語彙使用
    uniquePhrases: string[];       // 独自の表現
    authenticity: boolean;         // 表現の真正性
    feedback: string;
  };
  
  // 総合評価
  overallScore: number;            // 1-5段階総合評価
  overallFeedback: string;         // 総合的なフィードバック
  strengths: string[];             // 主な強み
  improvements: string[];          // 改善提案
  nextSteps: string[];             // 次の練習で重点的に取り組むべき点
}

// 明和中特化質問生成システム
export interface MeiwaQuestionGenerator {
  researchAnalysis: {
    topic: string;                 // 探究活動のテーマ
    personalExperience: string;    // 個人的体験の詳細
    socialConnection: string;      // 社会との関連性
    openEndedness: boolean;        // 正解がないかの判定
    currentDepth: number;          // 現在の探究の深さ（1-5）
  };
  
  questionTypes: {
    deepDive: string[];            // 60% 探究活動深掘り質問
    socialLink: string[];          // 20% 社会・日常関連質問
    selfGrowth: string[];          // 15% 自己変容確認質問
    future: string[];              // 5% 将来展望質問
  };
  
  followUpStrategy: 'deeper' | 'broader' | 'clarification' | 'challenge';
  nextQuestion: string;
  questionContext: string;         // 質問の意図・文脈
}

// 質問の難易度と種類
export type MeiwaQuestionType = 
  | 'basic_interest'       // 基本的興味確認
  | 'experience_detail'    // 体験詳細確認
  | 'social_awareness'     // 社会認識確認
  | 'complexity_check'     // 複雑性・非正解性確認
  | 'empathy_test'         // 共感可能性テスト
  | 'growth_reflection'    // 成長振り返り
  | 'expression_quality'   // 表現力確認
  | 'deep_dive'           // 深掘り質問
  | 'challenge'           // 挑戦的質問
  | 'synthesis';          // 統合的質問

export interface MeiwaQuestion {
  id: string;
  type: MeiwaQuestionType;
  question: string;
  intent: string;                  // 質問の意図
  evaluationCriteria: string[];    // 評価基準
  expectedResponse: string;        // 期待される回答の方向性
  followUpTriggers: string[];      // フォローアップのトリガー
  difficulty: 1 | 2 | 3 | 4 | 5;   // 難易度
}

// 否定疑問文対応システム
export interface NegativeQuestionHandler {
  detectNegativePattern: (question: string) => boolean;
  interpretResponse: (response: string, isNegativeQuestion: boolean) => {
    actualMeaning: string;
    confidence: number;
    needsClarification: boolean;
  };
  generateClarification: (response: string) => string;
}

// 探究活動カテゴリー分類
export type ResearchCategory = 
  | 'science_experiment'      // 科学実験・観察
  | 'social_investigation'    // 社会調査・研究
  | 'environmental_study'     // 環境・生態研究
  | 'cultural_exploration'    // 文化・歴史探究
  | 'technology_creation'     // 技術・創作活動
  | 'community_service'       // 地域・ボランティア
  | 'artistic_expression'     // 芸術・表現活動
  | 'health_wellness'         // 健康・福祉研究
  | 'international_awareness' // 国際理解・多文化
  | 'philosophical_inquiry';  // 哲学的探究

export interface ResearchActivityAnalysis {
  category: ResearchCategory;
  complexity: number;              // 1-5段階
  hasDefinitiveAnswer: boolean;    // 決まった正解があるか
  socialRelevance: number;         // 社会的関連性 1-5
  personalConnection: number;      // 個人的関連性 1-5
  originalityLevel: number;        // 独創性レベル 1-5
  sustainabilityPotential: number; // 継続可能性 1-5
}

// セッション管理
export interface MeiwaInterviewSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  researchTopic: string;
  questions: MeiwaQuestion[];
  responses: {
    questionId: string;
    response: string;
    audioUrl?: string;
    timestamp: Date;
    evaluation?: Partial<MeiwaResearchEvaluation>;
  }[];
  finalEvaluation?: MeiwaResearchEvaluation;
  progressMarkers: {
    questionNumber: number;
    totalQuestions: number;
    completionPercentage: number;
    averageResponseTime: number;
  };
}