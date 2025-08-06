// lib/interview/deep-dive-engine-new.ts  
// 最適化された面接エンジン（最高の面接体験を提供）

// 型定義をエクスポート（既存コードとの互換性のため）
export type { 
  InterviewStage,
  QuestionIntent,
  ResponseDepth,
  MeiwaAxis,
  DeepDiveQuestion,
  FollowUpTrigger,
  StageTransitionCondition,
  QuestionChain,
  InterviewPattern,
  StageQuestions,
  ResponseAnalysis
} from './types';

// メインエンジンクラス
import { InterviewEngine } from './engine-core';

export class DeepDiveEngine extends InterviewEngine {
  constructor() {
    super();
    console.log('🚀 最適化された面接エンジンが初期化されました');
  }
}

// 既存コードとの互換性のための追加エクスポート
export { InterviewEngine };
export { ResponseAnalyzer } from './response-analyzer';
export { InterviewPatterns } from './patterns';