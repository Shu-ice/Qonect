// interview/patterns.ts
// 面接パターンの定義（HさんTさんパターン等）

import { 
  InterviewPattern, 
  StageQuestions, 
  DeepDiveQuestion,
  StageTransitionCondition
} from './types';

export class InterviewPatterns {
  static createOpeningStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'opening_1',
          intent: 'basic_confirmation',
          evaluationFocus: 'original_expression',
          expectedDepth: 'surface',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '面接開始・本人確認',
            style: 'formal',
            elements: ['面接開始の挨拶', '受検番号', '名前'],
            context: '面接の開始を告げ、本人確認を行う'
          }
        },
        {
          id: 'opening_2', 
          intent: 'basic_confirmation',
          evaluationFocus: 'original_expression',
          expectedDepth: 'surface',
          followUpTriggers: [
            {
              condition: '電車|バス|車|自転車|歩い|徒歩',
              nextQuestionId: 'opening_3',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '交通手段の確認',
            style: 'friendly',
            elements: ['交通手段を尋ねる'],
            context: '緊張をほぐす雰囲気作り。自然な相槌で前の回答に反応してから聞く'
          }
        },
        {
          id: 'opening_3',
          intent: 'basic_confirmation', 
          evaluationFocus: 'original_expression',
          expectedDepth: 'surface',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '所要時間の確認',
            style: 'friendly',
            elements: ['時間を尋ねる', '前回答との整合性確認'],
            context: '前の回答に時間情報が含まれている場合は時間を聞き返さず、自然な相槌で次の話題に進む'
          }
        }
      ],
      transitionCondition: {
        minDepth: 3,
        requiredElements: ['交通手段', '時間'],
        evaluatedAxes: ['original_expression']
      }
    };
  }

  static createArtisticExplorationStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'art_1',
          intent: 'trigger_exploration',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'moderate',
          preparationTime: 60,
          followUpTriggers: [
            {
              condition: 'ダンス|音楽|美術|演劇',
              nextQuestionId: 'art_2',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '探究活動の概要説明',
            style: 'encouraging',
            elements: ['1分程度で', '探究活動について', '準備時間の提案'],
            context: '本題に入る。準備時間を与えるかどうかも状況に応じて判断'
          }
        },
        {
          id: 'art_2',
          intent: 'trigger_exploration',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'moderate',
          followUpTriggers: [
            {
              condition: '友達|家族|先生|テレビ|本',
              nextQuestionId: 'art_3',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '探究活動を始めたきっかけ',
            style: 'encouraging',
            elements: ['きっかけ', '始まり', '出会い'],
            context: '前の回答（探究活動の説明）を踏まえ、具体的なきっかけや始まりを深掘りする'
          }
        }
      ],
      transitionCondition: {
        minDepth: 7,
        requiredElements: ['活動内容', 'きっかけ', '困難', '解決策', '学び'],
        evaluatedAxes: ['genuine_interest', 'experience_based']
      }
    };
  }

  static getPatterns(): Map<string, InterviewPattern> {
    const patterns = new Map<string, InterviewPattern>();
    
    patterns.set('artistic_collaborative', {
      name: '芸術・表現協働系パターン（ダンス、音楽、演劇等）',
      stages: {
        opening: this.createOpeningStage(),
        exploration: this.createArtisticExplorationStage(),
        metacognition: this.createOpeningStage(), // 簡素化のため同じものを使用
        future: this.createOpeningStage()
      }
    });

    return patterns;
  }
}