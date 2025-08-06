// interview/types.ts
// 面接システムの型定義

export type InterviewStage = 
  | 'opening'          // 冒頭確認（交通手段など）
  | 'exploration'      // 探究活動深掘り（5-9層）
  | 'metacognition'    // メタ認知・関連性発見
  | 'future'           // 将来への連結・継続意欲

export type QuestionIntent = 
  | 'basic_confirmation'     // 基本確認
  | 'trigger_exploration'    // きっかけ探究
  | 'difficulty_probing'     // 困難・課題探り
  | 'solution_process'       // 解決プロセス
  | 'collaboration_detail'   // 協働詳細
  | 'information_gathering'  // 情報収集プロセス
  | 'failure_learning'       // 失敗からの学び
  | 'metacognitive_connection' // メタ認知的関連付け
  | 'continuation_willingness' // 継続意欲
  | 'creation_detail'        // 創作物詳細
  | 'self_change'            // 自己変化

export type ResponseDepth = 'surface' | 'moderate' | 'deep' | 'profound';

export type MeiwaAxis = 
  | 'genuine_interest'      // 真の興味・関心度
  | 'experience_based'      // 体験・学び基盤性
  | 'social_connection'     // 社会・日常連結性
  | 'inquiry_nature'        // 探究性・非正解性
  | 'empathy_communication' // 他者理解・共感可能性
  | 'empathy'               // 共感・他者理解
  | 'self_transformation'   // 自己変容・成長実感
  | 'original_expression'   // 自分の言葉表現力

export interface DeepDiveQuestion {
  id: string;
  intent: QuestionIntent;
  evaluationFocus: MeiwaAxis;
  expectedDepth: ResponseDepth;
  followUpTriggers: FollowUpTrigger[];
  preparationTime?: number;
  guidanceForAI: {
    topic: string;
    style: 'formal' | 'friendly' | 'encouraging';
    elements: string[];
    context?: string;
  };
}

export interface FollowUpTrigger {
  condition: string;
  nextQuestionId?: string;
  depthIncrease: number;
}

export interface StageTransitionCondition {
  minDepth: number;
  requiredElements: string[];
  evaluatedAxes: MeiwaAxis[];
}

export interface QuestionChain {
  stage: InterviewStage;
  depth: number;
  questions: DeepDiveQuestion[];
  nextStageCondition: StageTransitionCondition;
}

export interface InterviewPattern {
  name: string;
  stages: {
    opening: StageQuestions;
    exploration: StageQuestions;
    metacognition: StageQuestions;
    future: StageQuestions;
  };
}

export interface StageQuestions {
  questions: DeepDiveQuestion[];
  transitionCondition: StageTransitionCondition;
}

export interface ResponseAnalysis {
  depth: ResponseDepth;
  elements: string[];
  emotions: string[];
  difficulties: string[];
  solutions: string[];
  learnings: string[];
}