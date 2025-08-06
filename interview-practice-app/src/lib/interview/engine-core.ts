// interview/engine-core.ts
// 面接エンジンの核心部分（簡素化・最適化版）

import { 
  InterviewStage, 
  QuestionChain, 
  DeepDiveQuestion, 
  InterviewPattern,
  ResponseAnalysis 
} from './types';
import { InterviewPatterns } from './patterns';
import { ResponseAnalyzer } from './response-analyzer';

export class InterviewEngine {
  private readonly patterns: Map<string, InterviewPattern>;

  constructor() {
    this.patterns = InterviewPatterns.getPatterns();
  }

  /**
   * 探究活動の性質を分析して適切なパターンを選択
   */
  selectInterviewPattern(inquiryActivity: string): string {
    if (!inquiryActivity) return 'artistic_collaborative';
    
    const activity = inquiryActivity.toLowerCase();
    
    if (/ダンス|音楽|演劇|美術|歌|楽器/.test(activity)) {
      return 'artistic_collaborative';
    }
    
    // 他のパターンも将来追加可能
    return 'artistic_collaborative'; // デフォルト
  }

  /**
   * 質問チェーンを生成
   */
  generateQuestionChain(
    patternType: string,
    stage: InterviewStage,
    conversationHistory: string[],
    currentDepth: number
  ): QuestionChain {
    const pattern = this.patterns.get(patternType);
    if (!pattern) {
      throw new Error(`Pattern not found: ${patternType}`);
    }

    const stageQuestions = pattern.stages[stage];
    
    return {
      stage,
      depth: currentDepth,
      questions: stageQuestions.questions,
      nextStageCondition: stageQuestions.transitionCondition
    };
  }

  /**
   * 次の質問を選択
   */
  selectNextQuestion(
    questionChain: QuestionChain,
    latestResponse: string,
    conversationHistory: Array<{question: string, response: string}>
  ): DeepDiveQuestion | null {
    const responseAnalysis = ResponseAnalyzer.analyzeResponse(latestResponse);
    
    // シンプルな質問選択ロジック
    const availableQuestions = questionChain.questions;
    if (availableQuestions.length === 0) return null;
    
    // 現在の深度に基づいて質問を選択
    const questionIndex = Math.min(
      conversationHistory.length,
      availableQuestions.length - 1
    );
    
    return availableQuestions[questionIndex] || null;
  }

  /**
   * 段階移行をチェック
   */
  checkStageTransition(
    currentStage: InterviewStage,
    conversationHistory: Array<{question: string, response: string}>,
    patternType: string
  ): InterviewStage | null {
    const pattern = this.patterns.get(patternType);
    if (!pattern) return null;

    const condition = pattern.stages[currentStage].transitionCondition;
    const studentResponses = conversationHistory.filter(h => 
      h.response && h.response.trim().length > 0
    );

    if (studentResponses.length < condition.minDepth) {
      return null;
    }

    // 段階移行のロジック
    switch (currentStage) {
      case 'opening':
        return studentResponses.length >= 3 ? 'exploration' : null;
      case 'exploration':
        return studentResponses.length >= 7 ? 'metacognition' : null;
      case 'metacognition':
        return studentResponses.length >= 10 ? 'future' : null;
      default:
        return null;
    }
  }
}