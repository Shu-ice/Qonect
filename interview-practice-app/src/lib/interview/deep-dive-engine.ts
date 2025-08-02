// lib/interview/deep-dive-engine.ts
// 段階的深掘り質問エンジン - HさんTさんパターン完全再現

export interface QuestionChain {
  stage: InterviewStage;
  depth: number;
  questions: DeepDiveQuestion[];
  nextStageCondition: StageTransitionCondition;
}

export interface DeepDiveQuestion {
  id: string;
  intent: QuestionIntent;
  evaluationFocus: MeiwaAxis;
  expectedDepth: ResponseDepth;
  followUpTriggers: FollowUpTrigger[];
  preparationTime?: number; // 準備時間（秒）
  // AI生成用のガイダンス
  guidanceForAI: {
    topic: string; // 質問のトピック（例：「探究活動の説明」）
    style: 'formal' | 'friendly' | 'encouraging'; // 質問のスタイル
    elements: string[]; // 含めるべき要素（例：["1分で", "準備時間"]）
    context?: string; // 追加の文脈情報
  };
}

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

export type ResponseDepth = 'surface' | 'moderate' | 'deep' | 'profound';

export type MeiwaAxis = 
  | 'genuine_interest'      // 真の興味・関心度
  | 'experience_based'      // 体験・学び基盤性
  | 'social_connection'     // 社会・日常連結性
  | 'inquiry_nature'        // 探究性・非正解性
  | 'empathy_communication' // 他者理解・共感可能性
  | 'self_transformation'   // 自己変容・成長実感
  | 'original_expression'   // 自分の言葉表現力

export interface FollowUpTrigger {
  condition: string;          // 回答に含まれるべきキーワード・要素
  nextQuestionId?: string;    // トリガー条件が満たされた場合の次質問
  depthIncrease: number;      // 深度増加値
}

export interface StageTransitionCondition {
  minDepth: number;           // 最小深掘り層数
  requiredElements: string[]; // 必須要素（例：困難、解決策、学び）
  evaluatedAxes: MeiwaAxis[]; // 評価完了すべき軸
}

export class DeepDiveEngine {
  private readonly interviewPatterns: Map<string, InterviewPattern>;

  constructor() {
    this.interviewPatterns = new Map();
    this.initializePatterns();
  }

  private initializePatterns() {
    // Hさん（ダンス）パターン
    this.interviewPatterns.set('artistic_collaborative', {
      name: 'Hさんパターン（芸術・協働系）',
      stages: {
        opening: this.createOpeningStage(),
        exploration: this.createArtisticExplorationStage(),
        metacognition: this.createArtisticMetacognitionStage(),
        future: this.createArtisticFutureStage()
      }
    });

    // Tさん（生物飼育）パターン
    this.interviewPatterns.set('scientific_individual', {
      name: 'Tさんパターン（科学・個人研究系）',
      stages: {
        opening: this.createOpeningStage(),
        exploration: this.createScientificExplorationStage(),
        metacognition: this.createScientificMetacognitionStage(),
        future: this.createScientificFutureStage()
      }
    });
  }

  /**
   * 探究活動の性質を分析して適切なパターンを選択
   */
  public selectInterviewPattern(researchTopic: string): string {
    const topicAnalysis = this.analyzeResearchTopic(researchTopic);
    
    if (topicAnalysis.isCollaborative && topicAnalysis.isArtistic) {
      return 'artistic_collaborative';
    } else if (topicAnalysis.isScientific && topicAnalysis.isIndividual) {
      return 'scientific_individual';
    }
    
    // デフォルトは汎用パターン（基本的にはHさんパターンベース）
    return 'artistic_collaborative';
  }

  /**
   * 段階的深掘り質問チェーンを生成
   */
  public generateQuestionChain(
    patternType: string,
    stage: InterviewStage,
    previousResponses: string[],
    currentDepth: number = 1
  ): QuestionChain {
    const pattern = this.interviewPatterns.get(patternType);
    if (!pattern) throw new Error(`Pattern ${patternType} not found`);

    const stageQuestions = pattern.stages[stage];
    const availableQuestions = this.filterQuestionsByContext(
      stageQuestions.questions,
      previousResponses,
      currentDepth
    );

    return {
      stage,
      depth: currentDepth,
      questions: availableQuestions,
      nextStageCondition: stageQuestions.transitionCondition
    };
  }

  /**
   * 次の質問を動的に選択（文脈理解型）
   */
  public selectNextQuestion(
    questionChain: QuestionChain,
    latestResponse: string,
    conversationHistory: Array<{question: string, response: string}>
  ): DeepDiveQuestion | null {
    console.log(`🔍 質問選択開始: 深度${questionChain.depth}, 段階${questionChain.stage}`);
    
    // 1. 回答の深度と内容を分析
    const responseAnalysis = this.analyzeResponse(latestResponse);
    console.log(`📊 回答分析: 深度=${responseAnalysis.depth}, 要素=[${responseAnalysis.elements.join(', ')}]`);
    
    // 2. フォローアップトリガーをチェック
    const currentQuestion = this.getCurrentQuestion(questionChain, conversationHistory);
    if (currentQuestion) {
      console.log(`🎯 現在の質問: ${currentQuestion.id} - ${currentQuestion.intent}`);
      
      const triggeredFollowUp = this.checkFollowUpTriggers(
        currentQuestion, 
        latestResponse, 
        responseAnalysis
      );
      
      if (triggeredFollowUp) {
        const nextQuestion = this.findQuestionById(questionChain, triggeredFollowUp.nextQuestionId);
        if (nextQuestion) {
          console.log(`⚡ フォローアップトリガー発動: ${nextQuestion.id}`);
          return nextQuestion;
        }
      }
    }

    // 3. 深度増加または次のフォーカスエリアへ移行
    const nextQuestion = this.selectNextByProgression(questionChain, responseAnalysis, conversationHistory);
    if (nextQuestion) {
      console.log(`➡️ プログレッション質問選択: ${nextQuestion.id} - ${nextQuestion.intent}`);
    } else {
      console.log(`⚠️ 利用可能な質問なし - 段階移行の検討が必要`);
    }
    
    return nextQuestion;
  }

  /**
   * 段階移行条件をチェック
   */
  public checkStageTransition(
    currentStage: InterviewStage,
    conversationHistory: Array<{question: string, response: string}>,
    patternType: string
  ): InterviewStage | null {
    console.log(`🔍 段階移行チェック開始: ${currentStage} (パターン: ${patternType})`);
    
    const pattern = this.interviewPatterns.get(patternType);
    if (!pattern) {
      console.log(`❌ パターンが見つかりません: ${patternType}`);
      return null;
    }

    const condition = pattern.stages[currentStage].transitionCondition;
    console.log(`📋 移行条件: 最小深度${condition.minDepth}, 必須要素[${condition.requiredElements.join(', ')}]`);
    
    // 実際の学生回答のみを対象とする（空回答を除外）
    const studentResponses = conversationHistory.filter(h => h.response && h.response.trim().length > 0);
    console.log(`📊 学生回答数: ${studentResponses.length}/${condition.minDepth} (必要)`);
    
    if (studentResponses.length < condition.minDepth) {
      console.log(`❌ 段階移行条件不足: 必要${condition.minDepth}回答, 現在${studentResponses.length}回答`);
      return null;
    }

    // 必須要素チェック - より柔軟な判定
    const responsesText = studentResponses.map(h => h.response).join(' ');
    const missingElements: string[] = [];
    const foundElements: string[] = [];
    
    for (const element of condition.requiredElements) {
      if (this.hasElement(responsesText, element)) {
        foundElements.push(element);
      } else {
        missingElements.push(element);
      }
    }

    console.log(`✅ 発見要素: [${foundElements.join(', ')}]`);
    console.log(`❌ 不足要素: [${missingElements.join(', ')}]`);
    
    // 少なくとも60%の要素が満たされていれば移行を許可（柔軟な条件）
    const satisfactionRate = foundElements.length / condition.requiredElements.length;
    const requiredSatisfactionRate = 0.6; // 60%
    
    if (satisfactionRate < requiredSatisfactionRate) {
      console.log(`❌ 段階移行条件不足: 満足度${Math.round(satisfactionRate * 100)}% < 必要${Math.round(requiredSatisfactionRate * 100)}%`);
      return null;
    }

    // 段階移行成功
    const stageOrder: InterviewStage[] = ['opening', 'exploration', 'metacognition', 'future'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const nextStage = currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null;
    
    if (nextStage) {
      console.log(`✅ 段階移行成功: ${currentStage} → ${nextStage} (満足度: ${Math.round(satisfactionRate * 100)}%)`);
    } else {
      console.log(`🏁 最終段階に到達: ${currentStage}`);
    }
    
    return nextStage;
  }

  // ====== Private Methods ======

  private createOpeningStage(): StageQuestions {
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
            elements: ['時間を尋ねる'],
            context: '前の回答（交通手段）を踏まえた自然な流れ。相槌も含めて文脈に応じた質問をする'
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

  private createArtisticExplorationStage(): StageQuestions {
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
            context: '本題に入る。準備時間を与えるかどうかも状況に応じて判断。前の質問への相槌も含めて自然な流れを作る'
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
        },
        {
          id: 'art_3',
          text: 'メンバーは何人くらいですか？',
          intent: 'collaboration_detail',
          evaluationFocus: 'empathy_communication',
          expectedDepth: 'moderate',
          followUpTriggers: [
            {
              condition: '複数|チーム|グループ|人',
              nextQuestionId: 'art_4',
              depthIncrease: 1
            }
          ]
        },
        {
          id: 'art_4',
          text: 'みんなの意見が対立したときはありませんか？',
          intent: 'difficulty_probing',
          evaluationFocus: 'empathy_communication',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: 'ある|対立|違い|もめ',
              nextQuestionId: 'art_5',
              depthIncrease: 1
            }
          ]
        },
        {
          id: 'art_5',
          text: 'そのときはどうしましたか？',
          intent: 'solution_process',
          evaluationFocus: 'empathy_communication',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: '話し合い|相談|解決|工夫',
              nextQuestionId: 'art_6',
              depthIncrease: 1
            }
          ]
        },
        {
          id: 'art_6',
          text: '話し合いの場をうまく作るために、何か工夫していることはありますか？',
          intent: 'solution_process',
          evaluationFocus: 'empathy_communication',
          expectedDepth: 'profound',
          followUpTriggers: []
        }
      ],
      transitionCondition: {
        minDepth: 5,
        requiredElements: ['きっかけ', '協働体験', '困難', '解決策'],
        evaluatedAxes: ['genuine_interest', 'empathy_communication', 'self_transformation']
      }
    };
  }

  private createScientificExplorationStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'sci_1',
          intent: 'trigger_exploration',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'moderate',
          preparationTime: 60,
          followUpTriggers: [
            {
              condition: '生き物|植物|実験|観察|研究',
              nextQuestionId: 'sci_2',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '探究活動の概要説明（科学・個人研究系）',
            style: 'encouraging',
            elements: ['1分程度で', '探究活動について', '整理時間の提案'],
            context: '科学・個人研究系の場合は、整理時間を明示的に提案する。前の質問への相槌も含めて自然な流れを作る'
          }
        },
        {
          id: 'sci_2',
          intent: 'difficulty_probing',
          evaluationFocus: 'self_transformation',
          expectedDepth: 'moderate',
          followUpTriggers: [
            {
              condition: '困っ|大変|難し|失敗|うまくいかな',
              nextQuestionId: 'sci_3',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '探究活動での困難や課題（科学・個人研究系）',
            style: 'friendly',
            elements: ['困ったこと', '大変だったこと', '失敗経験'],
            context: 'メダカや植物など生き物・植物関連の具体的な困難を自然に引き出す。前の回答内容に触れながら質問する'
          }
        },
        {
          id: 'sci_3',
          intent: 'trigger_exploration',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'deep',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '探究活動への興味のきっかけ（科学・個人研究系）',
            style: 'encouraging',
            elements: ['きっかけ', '始めた理由', '興味を持った出来事'],
            context: '生き物や植物への興味を持った具体的なきっかけを探る。家族の影響、体験、出会いなどを引き出す'
          }
        },
        {
          id: 'sci_4',
          intent: 'information_gathering',
          evaluationFocus: 'social_connection',
          expectedDepth: 'moderate',
          followUpTriggers: [
            {
              condition: '先生|家族|友達|専門家|本|インターネット',
              nextQuestionId: 'sci_5',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '探究活動での協力者・支援者（科学・個人研究系）',
            style: 'friendly',
            elements: ['手助けしてくれる人', '協力者', '相談相手'],
            context: '一人で研究する中でも、先生、家族、専門家などの支援があったかを探る。孤立せずに学んでいる姿勢を確認'
          }
        },
        {
          id: 'sci_5',
          intent: 'information_gathering',
          evaluationFocus: 'inquiry_nature',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: '本|インターネット|図書館|博物館|水族館|専門店',
              nextQuestionId: 'sci_6',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '探究活動での情報収集方法（科学・個人研究系）',
            style: 'encouraging',
            elements: ['調べ方', '情報収集方法', '学習プロセス'],
            context: 'メダカの水質やpH値について、どのように情報を集めたかを具体的に聞く。本、インターネット、実際の観察などの方法を引き出す'
          }
        },
        {
          id: 'sci_6',
          intent: 'failure_learning',
          evaluationFocus: 'self_transformation',
          expectedDepth: 'profound',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '探究活動での失敗と対処法（科学・個人研究系）',
            style: 'encouraging',
            elements: ['失敗経験', '困難への対処', '工夫した方法'],
            context: 'メダカが死んでしまったり、植物が枯れたりした時の対処法を聞く。失敗から学ぶ姿勢を確認'
          }
        },
        {
          id: 'sci_7',
          intent: 'failure_learning',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'profound',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '探究活動への継続意欲（科学・個人研究系）',
            style: 'encouraging',
            elements: ['継続の理由', '諦めなかった動機', '探究心'],
            context: '失敗しても続ける理由、生き物や植物への愛情、知りたい気持ちの強さを引き出す'
          }
        }
      ],
      transitionCondition: {
        minDepth: 6,
        requiredElements: ['困難体験', '情報収集', '失敗', '再挑戦'],
        evaluatedAxes: ['genuine_interest', 'inquiry_nature', 'self_transformation', 'social_connection']
      }
    };
  }

  private createArtisticMetacognitionStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'art_meta_1',
          text: 'ダンスと探究活動で似ているところはありますか？',
          intent: 'metacognitive_connection',
          evaluationFocus: 'inquiry_nature',
          expectedDepth: 'deep',
          followUpTriggers: []
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['関連性'],
        evaluatedAxes: ['inquiry_nature']
      }
    };
  }

  private createScientificMetacognitionStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'sci_meta_1',
          text: 'この探究活動を通して、あなた自身がどのように変わったと思いますか？',
          intent: 'metacognitive_connection',
          evaluationFocus: 'self_transformation',
          expectedDepth: 'deep',
          followUpTriggers: []
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['自己変容'],
        evaluatedAxes: ['self_transformation']
      }
    };
  }

  private createArtisticFutureStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'art_future_1',
          text: 'これからも続けていきたいと思いますか？',
          intent: 'continuation_willingness',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'moderate',
          followUpTriggers: []
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['継続意欲'],
        evaluatedAxes: ['genuine_interest']
      }
    };
  }

  private createScientificFutureStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'sci_future_1',
          text: 'まだまだ続けていきたいと思いますか？',
          intent: 'continuation_willingness',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'moderate',
          followUpTriggers: []
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['継続意欲'],
        evaluatedAxes: ['genuine_interest']
      }
    };
  }

  private analyzeResearchTopic(topic: string): TopicAnalysis {
    return {
      isCollaborative: /ダンス|演劇|音楽|バンド|チーム|グループ|部活|合唱|吹奏楽/.test(topic),
      isArtistic: /ダンス|絵|音楽|演劇|アート|デザイン|創作|表現/.test(topic),
      isScientific: /実験|観察|研究|調査|生き物|植物|科学|理科|数学/.test(topic),
      isIndividual: /一人|個人|自分で|飼育|栽培|読書|プログラミング/.test(topic)
    };
  }

  private analyzeResponse(response: string): ResponseAnalysis {
    return {
      depth: this.calculateResponseDepth(response),
      elements: this.extractResponseElements(response),
      emotions: this.extractEmotions(response),
      difficulties: this.extractDifficulties(response),
      solutions: this.extractSolutions(response),
      learnings: this.extractLearnings(response)
    };
  }

  private calculateResponseDepth(response: string): ResponseDepth {
    const length = response.length;
    const specificWords = (response.match(/具体的|例えば|実際|詳しく|なぜなら/g) || []).length;
    const emotionWords = (response.match(/嬉しい|楽しい|困った|大変|感動/g) || []).length;
    
    if (length > 100 && specificWords >= 2 && emotionWords >= 1) return 'profound';
    if (length > 60 && (specificWords >= 1 || emotionWords >= 1)) return 'deep';
    if (length > 30) return 'moderate';
    return 'surface';
  }

  private extractResponseElements(response: string): string[] {
    const elements: string[] = [];
    
    if (/きっかけ|始め|最初/.test(response)) elements.push('きっかけ');
    if (/困っ|大変|難し|問題|課題/.test(response)) elements.push('困難');
    if (/解決|工夫|方法|やり方/.test(response)) elements.push('解決策');
    if (/学ん|気づ|分か|理解/.test(response)) elements.push('学び');
    if (/友達|先生|家族|みんな|一緒/.test(response)) elements.push('協働');
    if (/続け|もっと|また|次/.test(response)) elements.push('継続意欲');
    
    return elements;
  }

  private extractEmotions(response: string): string[] {
    const emotions = [];
    const emotionPatterns = {
      joy: /嬉しい|楽しい|面白い|わくわく/,
      difficulty: /困っ|大変|つらい|悩ん/,
      surprise: /驚い|びっくり|意外/,
      satisfaction: /満足|達成|成功|うまく/
    };

    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
      if (pattern.test(response)) emotions.push(emotion);
    }
    
    return emotions;
  }

  private extractDifficulties(response: string): string[] {
    const difficulties = [];
    if (/意見|違い|対立|もめ/.test(response)) difficulties.push('意見対立');
    if (/技術|技能|うまく|できな/.test(response)) difficulties.push('技術的困難');
    if (/時間|忙し|間に合わ/.test(response)) difficulties.push('時間管理');
    if (/お金|費用|高い/.test(response)) difficulties.push('資金面');
    return difficulties;
  }

  private extractSolutions(response: string): string[] {
    const solutions = [];
    if (/話し合い|相談|聞い/.test(response)) solutions.push('対話解決');
    if (/練習|繰り返し|何度も/.test(response)) solutions.push('継続努力');
    if (/調べ|本|インターネット|聞い/.test(response)) solutions.push('情報収集');
    if (/工夫|アイデア|新しい方法/.test(response)) solutions.push('創意工夫');
    return solutions;
  }

  private extractLearnings(response: string): string[] {
    const learnings = [];
    if (/大切|重要/.test(response)) learnings.push('価値理解');
    if (/成長|変わっ|できるよう/.test(response)) learnings.push('自己成長');
    if (/協力|チームワーク|助け合/.test(response)) learnings.push('協働の価値');
    if (/継続|諦めな|続ける/.test(response)) learnings.push('継続の重要性');
    return learnings;
  }

  private filterQuestionsByContext(
    questions: DeepDiveQuestion[],
    previousResponses: string[],
    currentDepth: number
  ): DeepDiveQuestion[] {
    // 深度に応じた質問フィルタリング
    return questions.filter(q => {
      // 既に同じ意図の質問が出されていないかチェック
      const alreadyAsked = previousResponses.some(response => 
        this.hasBeenAsked(q.intent, previousResponses)
      );
      
      return !alreadyAsked;
    });
  }

  private getCurrentQuestion(
    questionChain: QuestionChain,
    conversationHistory: Array<{question: string, response: string}>
  ): DeepDiveQuestion | null {
    if (conversationHistory.length === 0) return null;
    const lastQuestion = conversationHistory[conversationHistory.length - 1].question;
    return questionChain.questions.find(q => q.text === lastQuestion) || null;
  }

  private checkFollowUpTriggers(
    question: DeepDiveQuestion,
    response: string,
    analysis: ResponseAnalysis
  ): FollowUpTrigger | null {
    for (const trigger of question.followUpTriggers) {
      const regex = new RegExp(trigger.condition);
      if (regex.test(response)) {
        return trigger;
      }
    }
    return null;
  }

  private findQuestionById(questionChain: QuestionChain, questionId?: string): DeepDiveQuestion | null {
    if (!questionId) return null;
    return questionChain.questions.find(q => q.id === questionId) || null;
  }

  private selectNextByProgression(
    questionChain: QuestionChain,
    analysis: ResponseAnalysis,
    conversationHistory: Array<{question: string, response: string}>
  ): DeepDiveQuestion | null {
    console.log(`📈 プログレッション選択: 深度=${analysis.depth}, 履歴長=${conversationHistory.length}`);
    
    // 使用済みの質問を除外
    const usedQuestions = conversationHistory.map(h => h.question);
    const availableQuestions = questionChain.questions.filter(q => 
      !usedQuestions.includes(q.text)
    );
    
    console.log(`📋 利用可能質問数: ${availableQuestions.length}/${questionChain.questions.length}`);
    
    if (availableQuestions.length === 0) {
      console.log(`⚠️ 利用可能な質問がありません`);
      return null;
    }
    
    // 回答の深度が浅い場合は深掘り質問を優先
    if (analysis.depth === 'surface' || analysis.depth === 'moderate') {
      const deepQuestions = availableQuestions.filter(q => 
        q.expectedDepth === 'deep' || q.expectedDepth === 'profound'
      );
      
      if (deepQuestions.length > 0) {
        console.log(`🔍 深掘り質問を選択: ${deepQuestions[0].id}`);
        return deepQuestions[0];
      }
    }

    // 次の未使用質問を順番に選択
    const nextQuestion = availableQuestions[0];
    console.log(`➡️ 次の質問を選択: ${nextQuestion.id} (深度期待: ${nextQuestion.expectedDepth})`);
    return nextQuestion;
  }

  private findDeepDiveQuestion(
    questionChain: QuestionChain,
    conversationHistory: Array<{question: string, response: string}>
  ): DeepDiveQuestion | null {
    // まだ出していない、より深い質問を探す
    const usedIntents = conversationHistory.map(h => 
      questionChain.questions.find(q => q.text === h.question)?.intent
    ).filter(Boolean);

    return questionChain.questions.find(q => 
      !usedIntents.includes(q.intent) && 
      (q.expectedDepth === 'deep' || q.expectedDepth === 'profound')
    ) || null;
  }

  private findNextFocusQuestion(
    questionChain: QuestionChain,
    conversationHistory: Array<{question: string, response: string}>
  ): DeepDiveQuestion | null {
    const usedIntents = conversationHistory.map(h => 
      questionChain.questions.find(q => q.text === h.question)?.intent
    ).filter(Boolean);

    return questionChain.questions.find(q => !usedIntents.includes(q.intent)) || null;
  }

  private hasElement(text: string, element: string): boolean {
    const patterns: Record<string, RegExp> = {
      '交通手段': /電車|バス|車|自転車|歩い|徒歩|来|いらっしゃい|到着|です/,  // 「です」を追加
      '時間': /分|時間|かかっ|かかり|早い|遅い|長い|短い|です/,  // 「です」を追加
      'きっかけ': /きっかけ|始め|最初|理由|なぜ|どうして|出会|発見/,
      '協働体験': /友達|仲間|一緒|チーム|グループ|みんな|協力|話し合|相談/,
      '困難': /困っ|大変|難し|問題|課題|うまくいかな|つまず|悩ん|苦労/,
      '解決策': /解決|工夫|方法|やり方|対処|アイデア|考え|試し|改善/,
      '困難体験': /困っ|失敗|うまくいかな|大変|つまず|悩ん|苦労|挫折/,
      '情報収集': /調べ|本|インターネット|図書館|聞い|検索|研究|探し|質問/,
      '失敗': /失敗|だめ|うまくいかな|死ん|枯れ|間違|ミス|挫折/,
      '再挑戦': /また|再び|もう一度|続け|諦めな|やり直|頑張|挑戦/,
      '関連性': /似て|同じ|関係|つながり|共通|関連|結び|影響|応用/,
      '自己変容': /成長|変わっ|できるよう|身につ|学ん|気づ|理解|向上/,
      '継続意欲': /続け|もっと|また|これから|将来|今度|次|さらに|発展/
    };

    const pattern = patterns[element];
    const hasElement = pattern ? pattern.test(text) : false;
    
    // デバッグログ
    if (hasElement) {
      console.log(`✅ 要素「${element}」発見: パターン「${pattern}」がマッチ`);
    } else {
      console.log(`❌ 要素「${element}」未発見: パターン「${pattern}」マッチせず`);
    }
    
    return hasElement;
  }

  private hasBeenAsked(intent: QuestionIntent, previousResponses: string[]): boolean {
    // 簡易的な実装：同じ意図の質問が既に出されているかを推定
    // 実際の実装では、より精密な質問意図マッチングが必要
    return false;
  }
}

// ====== Supporting Interfaces ======

interface InterviewPattern {
  name: string;
  stages: Record<InterviewStage, StageQuestions>;
}

interface StageQuestions {
  questions: DeepDiveQuestion[];
  transitionCondition: StageTransitionCondition;
}

interface TopicAnalysis {
  isCollaborative: boolean;
  isArtistic: boolean;
  isScientific: boolean;
  isIndividual: boolean;
}

interface ResponseAnalysis {
  depth: ResponseDepth;
  elements: string[];
  emotions: string[];
  difficulties: string[];
  solutions: string[];
  learnings: string[];
}