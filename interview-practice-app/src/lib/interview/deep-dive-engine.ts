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
    // Hさん（ダンス）パターン - 芸術・表現協働系
    this.interviewPatterns.set('artistic_collaborative', {
      name: '芸術・表現協働系パターン（ダンス、音楽、演劇等）',
      stages: {
        opening: this.createOpeningStage(),
        exploration: this.createArtisticExplorationStage(),
        metacognition: this.createArtisticMetacognitionStage(),
        future: this.createArtisticFutureStage()
      }
    });

    // Tさん（生物飼育）パターン - 科学・実験探究系
    this.interviewPatterns.set('scientific_individual', {
      name: '科学・実験探究系パターン（生物、物理、化学等）',
      stages: {
        opening: this.createOpeningStage(),
        exploration: this.createScientificExplorationStage(),
        metacognition: this.createScientificMetacognitionStage(),
        future: this.createScientificFutureStage()
      }
    });

    // 新パターン1: スポーツ・競技分析系
    this.interviewPatterns.set('sports_competitive', {
      name: 'スポーツ・競技分析系パターン（個人・団体競技、データ分析等）',
      stages: {
        opening: this.createOpeningStage(),
        exploration: this.createSportsExplorationStage(),
        metacognition: this.createSportsMetacognitionStage(),
        future: this.createSportsFutureStage()
      }
    });

    // 新パターン2: 社会・課題解決系
    this.interviewPatterns.set('social_problem_solving', {
      name: '社会・課題解決系パターン（ボランティア、環境問題、地域活動等）',
      stages: {
        opening: this.createOpeningStage(),
        exploration: this.createSocialExplorationStage(),
        metacognition: this.createSocialMetacognitionStage(),
        future: this.createSocialFutureStage()
      }
    });

    // 新パターン3: 技術・創造開発系
    this.interviewPatterns.set('technology_creative', {
      name: '技術・創造開発系パターン（プログラミング、ロボット、電子工作等）',
      stages: {
        opening: this.createOpeningStage(),
        exploration: this.createTechnologyExplorationStage(),
        metacognition: this.createTechnologyMetacognitionStage(),
        future: this.createTechnologyFutureStage()
      }
    });

    // 新パターン4: リーダーシップ・合意形成系
    this.interviewPatterns.set('leadership_consensus', {
      name: 'リーダーシップ・合意形成系パターン（生徒会、委員長、企画運営等）',
      stages: {
        opening: this.createOpeningStage(),
        exploration: this.createLeadershipExplorationStage(),
        metacognition: this.createLeadershipMetacognitionStage(),
        future: this.createLeadershipFutureStage()
      }
    });
  }

  /**
   * 探究活動の性質を分析して適切なパターンを選択（6パターン完全対応）
   */
  public selectInterviewPattern(researchTopic: string): string {
    console.log(`🔍 6パターン分析開始: "${researchTopic}"`);
    
    const analysis = this.analyzeActivityComprehensive(researchTopic);
    const scores = this.calculatePatternScores(analysis);
    
    console.log('📊 パターンスコア分析結果:');
    Object.entries(scores).forEach(([pattern, score]) => {
      console.log(`  ${pattern}: ${score.toFixed(2)}`);
    });
    
    // 最高スコアのパターンを選択
    const selectedPattern = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];
    
    console.log(`✅ 選択されたパターン: ${selectedPattern}`);
    console.log(`選択理由: ${this.explainPatternSelection(researchTopic, selectedPattern)}`);
    
    return selectedPattern;
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
    
    // exploration段階の最小回答数を7に強化
    const requiredMinDepth = currentStage === 'exploration' ? Math.max(condition.minDepth, 7) : condition.minDepth;
    
    if (studentResponses.length < requiredMinDepth) {
      console.log(`❌ 段階移行条件不足: 必要${requiredMinDepth}回答, 現在${studentResponses.length}回答`);
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
    
    // 実際の合格者面接基準に合わせた厳格な移行条件
    const satisfactionRate = foundElements.length / condition.requiredElements.length;
    let requiredSatisfactionRate = 0.8; // 80%（より厳格）
    
    // exploration段階からの移行は特に厳格に（7-9層の深掘り完了が必要）
    if (currentStage === 'exploration') {
      requiredSatisfactionRate = 0.9; // 90%
      
      // 深掘り層数の厳格化（実際の合格者面接基準）
      const minimumDeepDiveLayers = 7;  // 5から7に強化
      if (studentResponses.length < minimumDeepDiveLayers) {
        console.log(`❌ exploration段階移行条件不足: 深掘り不足 ${studentResponses.length}/${minimumDeepDiveLayers}層以上 必要`);
        return null;
      }
      
      // さらに、探究活動の核心要素が十分に語られているかチェック
      const responsesText = studentResponses.map(h => h.response).join(' ');
      const coreInquiryElements = [
        '困難|大変|失敗|うまくいかな|課題',  // 困難体験
        '続け|継続|年間|毎日|ずっと',      // 継続性
        '発見|気づ|わかっ|学ん|新し',      // 学び・発見
        '方法|やり方|進め|調べ|記録'       // プロセス
      ];
      
      let coreElementCount = 0;
      for (const element of coreInquiryElements) {
        if (new RegExp(element).test(responsesText)) {
          coreElementCount++;
        }
      }
      
      if (coreElementCount < 3) {
        console.log(`❌ exploration段階移行条件不足: 核心要素不足 ${coreElementCount}/4要素`);
        return null;
      }
    }
    
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
            elements: ['時間を尋ねる', '前回答との整合性確認'],
            context: '🚀 重要：前の回答に時間情報（30分、1時間等）が既に含まれている場合は時間を聞き返さず、自然な相槌で次の話題に進む。含まれていない場合のみ時間を尋ねる。'
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
      ],
      transitionCondition: {
        minDepth: 7,  // 5から7に強化
        requiredElements: ['きっかけ', '協働体験', '困難', '解決策', '継続意欲', '学び・発見'],
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
            elements: ['1分程度で', '探究活動について', '整理時間の柔軟な提案'],
            context: '科学・個人研究系では整理時間が必要な場合が多い。「整理する時間が少しほしいようなら差し上げます」のような柔軟な提案をする。前の質問への相槌も含めて自然な流れを作る'
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
            elements: ['具体的な困難体験', '失敗の詳細', '予想外の出来事'],
            context: '実際の合格者面接レベルの具体性を求める。「〇〇が死んでしまった時」「植物が枯れた時」など具体的な失敗体験を引き出し、その時の気持ちや対応を詳しく聞く'
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
        minDepth: 7, // より厳格に（実際の合格者面接は7-9層）
        requiredElements: ['困難体験', '情報収集', '失敗', '再挑戦', 'きっかけ'],
        evaluatedAxes: ['genuine_interest', 'inquiry_nature', 'self_transformation', 'social_connection']
      }
    };
  }

  private createArtisticMetacognitionStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'art_meta_1',
          intent: 'metacognitive_connection',
          evaluationFocus: 'inquiry_nature',
          expectedDepth: 'deep',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '芸術活動と探究活動の共通点',
            style: 'encouraging',
            elements: ['答えがない', '自分なりの答え', '試行錘誤'],
            context: 'ダンスや音楽などの芸術活動と探究学習の共通点を聞く。"正解がない"という点に気づかせる'
          }
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
          intent: 'metacognitive_connection',
          evaluationFocus: 'self_transformation',
          expectedDepth: 'deep',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '探究活動を通した自己変化',
            style: 'encouraging',
            elements: ['成長', '変化', '新たな気づき'],
            context: '生き物飼育や植物栽培等を通して、自分自身がどう変わったかを深く聞く。人間的成長を確認'
          }
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
          intent: 'continuation_willingness',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'moderate',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '芸術活動の将来展望',
            style: 'encouraging',
            elements: ['中学での継続', '新たな挑戦', '夢や目標'],
            context: '明和中学校でも芸術活動を続けたいか、新たな分野への挑戦、将来の夢等を聞く'
          }
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
          intent: 'continuation_willingness',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'moderate',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '科学探究の将来展望',
            style: 'encouraging',
            elements: ['中学での継続', '更なる探究', '将来の研究'],
            context: '明和中学校でも生き物や科学の研究を続けたいか、新たな研究テーマ、将来の夢等を聞く'
          }
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
    return questionChain.questions.find(q => q.id === lastQuestion) || null;
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
      !usedQuestions.includes(q.id)
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
      questionChain.questions.find(q => q.id === h.question)?.intent
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
      questionChain.questions.find(q => q.id === h.question)?.intent
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

  /**
   * 包括的な活動分析（6パターン対応）
   */
  private analyzeActivityComprehensive(activity: string): ActivityAnalysis {
    return {
      // スポーツ・競技系指標
      sportsCompetitive: this.calculateSportsScore(activity),
      
      // 芸術・表現協働系指標
      artisticCollaborative: this.calculateArtisticScore(activity),
      
      // 科学・実験探究系指標
      scientificIndividual: this.calculateScientificScore(activity),
      
      // 社会・課題解決系指標
      socialProblemSolving: this.calculateSocialScore(activity),
      
      // 技術・創造開発系指標
      technologyCreative: this.calculateTechnologyScore(activity),
      
      // リーダーシップ・合意形成系指標
      leadershipConsensus: this.calculateLeadershipScore(activity)
    };
  }

  private calculateSportsScore(activity: string): number {
    let score = 0;
    
    // 競技名キーワード
    const sportsKeywords = /サッカー|野球|バスケ|バレー|テニス|水泳|陸上|体操|柔道|剣道|卓球|バドミントン|ソフトボール|ハンドボール|ラグビー|競技|大会|試合|練習|トレーニング/.test(activity);
    if (sportsKeywords) score += 4;
    
    // データ・記録分析
    const dataAnalysis = /記録|タイム|スコア|データ|分析|統計|測定|向上|改善/.test(activity);
    if (dataAnalysis) score += 3;
    
    // チーム・個人競技特徴
    const teamIndividual = /チーム|個人|競争|勝負|ライバル|仲間|連携|協力/.test(activity);
    if (teamIndividual) score += 2;
    
    // トレーニング・努力
    const training = /毎日|継続|努力|集中|精神|メンタル|技術|フォーム|戦術/.test(activity);
    if (training) score += 2;
    
    return Math.min(score, 10); // 最大10点
  }

  private calculateArtisticScore(activity: string): number {
    let score = 0;
    
    // 芸術分野キーワード
    const artisticKeywords = /ダンス|音楽|演劇|美術|絵画|工作|歌|楽器|合唱|吹奏楽|創作|表現|アート|デザイン/.test(activity);
    if (artisticKeywords) score += 4;
    
    // 協働・チーム活動
    const collaboration = /チーム|グループ|みんな|仲間|一緒|協力|合わせる|練習|発表/.test(activity);
    if (collaboration) score += 3;
    
    // 表現・発表
    const expression = /発表|披露|見せる|観客|舞台|コンサート|展示|作品|完成/.test(activity);
    if (expression) score += 2;
    
    // 創造・感性
    const creativity = /創造|感性|想像|オリジナル|工夫|アイデア|表現|美しい/.test(activity);
    if (creativity) score += 1;
    
    return Math.min(score, 10);
  }

  private calculateScientificScore(activity: string): number {
    let score = 0;
    
    // 生物・科学キーワード
    const scientificKeywords = /生き物|植物|動物|実験|観察|研究|調査|分析|データ|測定|記録|pH|水質|温度|成長|変化|仮説|検証/.test(activity);
    if (scientificKeywords) score += 4;
    
    // 個人研究特徴
    const individualResearch = /一人|個人|自分で|独自|継続|毎日|記録|観察|データ/.test(activity);
    if (individualResearch) score += 3;
    
    // 科学的手法
    const scientificMethod = /比較|実験|仮説|結果|考察|原因|理由|なぜ|どうして/.test(activity);
    if (scientificMethod) score += 2;
    
    // 探究心
    const inquiry = /不思議|疑問|知りたい|調べ|探究|発見|気づき/.test(activity);
    if (inquiry) score += 1;
    
    return Math.min(score, 10);
  }

  private calculateSocialScore(activity: string): number {
    let score = 0;
    
    // 社会問題・ボランティア
    const socialKeywords = /ボランティア|地域|社会|環境|問題|課題|解決|改善|支援|協力|奉仕|福祉|高齢者|子ども|障害|貧困|平和|人権|SDGs/.test(activity);
    if (socialKeywords) score += 4;
    
    // 問題意識・課題解決
    const problemSolving = /問題|課題|困っ|大変|改善|解決|工夫|提案|働きかけ|変える/.test(activity);
    if (problemSolving) score += 3;
    
    // 社会への影響
    const socialImpact = /みんな|社会|地域|学校|影響|効果|結果|成果|変化/.test(activity);
    if (socialImpact) score += 2;
    
    // 継続性・活動
    const continuity = /続け|継続|活動|取り組み|プロジェクト|キャンペーン/.test(activity);
    if (continuity) score += 1;
    
    return Math.min(score, 10);
  }

  private calculateTechnologyScore(activity: string): number {
    let score = 0;
    
    // 技術・プログラミング
    const techKeywords = /プログラミング|アプリ|ゲーム|ロボット|コンピュータ|PC|タブレット|Scratch|Python|HTML|CSS|JavaScript|Arduino|micro:bit|センサー|AI|機械学習/.test(activity);
    if (techKeywords) score += 4;
    
    // 開発・制作
    const development = /作る|開発|制作|プログラム|システム|ツール|機能|設計|実装/.test(activity);
    if (development) score += 3;
    
    // 問題解決・改善
    const problemSolving = /解決|改善|便利|効率|自動|楽に|簡単|工夫/.test(activity);
    if (problemSolving) score += 2;
    
    // 学習・探究
    const learning = /学ぶ|調べる|試す|挑戦|新しい|技術|知識/.test(activity);
    if (learning) score += 1;
    
    return Math.min(score, 10);
  }

  private calculateLeadershipScore(activity: string): number {
    let score = 0;
    
    // リーダーシップ・役職
    const leadershipKeywords = /生徒会|児童会|委員長|部長|キャプテン|リーダー|代表|会長|副会長|書記|会計|企画|運営|まとめる|指揮/.test(activity);
    if (leadershipKeywords) score += 4;
    
    // 組織・チーム運営
    const organization = /チーム|グループ|組織|メンバー|みんな|全校|学年|クラス|運営|管理/.test(activity);
    if (organization) score += 3;
    
    // 意見調整・合意形成
    const consensus = /話し合い|会議|相談|意見|調整|まとめ|決める|合意|納得|理解/.test(activity);
    if (consensus) score += 2;
    
    // 責任・実行
    const responsibility = /責任|役割|任せる|頼られる|期待|信頼|実行|やり遂げる/.test(activity);
    if (responsibility) score += 1;
    
    return Math.min(score, 10);
  }

  private calculatePatternScores(analysis: ActivityAnalysis): Record<string, number> {
    return {
      'sports_competitive': analysis.sportsCompetitive,
      'artistic_collaborative': analysis.artisticCollaborative,
      'scientific_individual': analysis.scientificIndividual,
      'social_problem_solving': analysis.socialProblemSolving,
      'technology_creative': analysis.technologyCreative,
      'leadership_consensus': analysis.leadershipConsensus
    };
  }

  private explainPatternSelection(activity: string, selectedPattern: string): string {
    const explanations: Record<string, string> = {
      'sports_competitive': 'スポーツ・競技関連のキーワードと継続的なトレーニング・データ分析の特徴を検出',
      'artistic_collaborative': '芸術・表現活動と協働・発表の特徴を検出',
      'scientific_individual': '科学的観察・実験と個人研究の継続性を検出',
      'social_problem_solving': '社会問題への関心とボランティア・課題解決活動を検出',
      'technology_creative': 'プログラミング・技術開発と創造的問題解決を検出',
      'leadership_consensus': 'リーダーシップ・組織運営と合意形成活動を検出'
    };
    
    return explanations[selectedPattern] || '総合的判断により選択';
  }

  // ===== 新パターン1: スポーツ・競技分析系 =====
  private createSportsExplorationStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'sports_1',
          intent: 'trigger_exploration',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'moderate',
          preparationTime: 60,
          followUpTriggers: [
            {
              condition: 'サッカー|野球|バスケ|テニス|水泳|陸上|競技|スポーツ',
              nextQuestionId: 'sports_2',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '競技・スポーツ活動の概要説明',
            style: 'encouraging',
            elements: ['1分程度で', 'スポーツ活動について', '競技の特徴'],
            context: 'スポーツ・競技系では継続的な努力と記録向上への取り組みを重視。前の回答への相槌も含めて自然な流れを作る'
          }
        },
        {
          id: 'sports_2',
          intent: 'difficulty_probing',
          evaluationFocus: 'self_transformation',
          expectedDepth: 'moderate',
          followUpTriggers: [
            {
              condition: '記録|タイム|スコア|負け|うまくいかな|悔し',
              nextQuestionId: 'sports_3',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: 'スポーツでの困難・挫折体験',
            style: 'friendly',
            elements: ['記録が伸びない', 'チーム内競争', '技術的な壁'],
            context: 'スポーツ特有の困難（記録停滞、怪我、チーム内競争等）を具体的に引き出す。負けや挫折への向き合い方を聞く'
          }
        },
        {
          id: 'sports_3',
          intent: 'solution_process',
          evaluationFocus: 'self_transformation',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: '練習|トレーニング|コーチ|先生|工夫|改善',
              nextQuestionId: 'sports_4',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '困難克服のための具体的な取り組み',
            style: 'encouraging',
            elements: ['練習方法の工夫', 'データ分析', 'メンタル管理'],
            context: 'スポーツでの問題解決プロセスを詳細に聞く。科学的アプローチ、継続的努力、周囲の支援活用等'
          }
        },
        {
          id: 'sports_4',
          intent: 'collaboration_detail',
          evaluationFocus: 'social_connection',
          expectedDepth: 'moderate',
          followUpTriggers: [
            {
              condition: 'チーム|仲間|コーチ|個人|一人',
              nextQuestionId: 'sports_5',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: 'チーム競技での協力・個人競技での支援者',
            style: 'friendly',
            elements: ['チームワーク', '個人の役割', '指導者との関係'],
            context: 'チーム競技なら連携・役割分担、個人競技なら周囲の支援者について聞く。スポーツにおける人間関係を探る'
          }
        },
        {
          id: 'sports_5',
          intent: 'failure_learning',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'deep',
          followUpTriggers: [],
          guidanceForAI: {
            topic: 'スポーツ継続への動機・情熱',
            style: 'encouraging',
            elements: ['継続の理由', '競技への愛情', '目標への執念'],
            context: '挫折があっても続ける理由、競技への情熱、将来の目標等を深く聞く。スポーツ特有の精神力を確認'
          }
        }
      ],
      transitionCondition: {
        minDepth: 6,
        requiredElements: ['困難体験', '練習・努力', '継続意欲', 'チームワーク・支援'],
        evaluatedAxes: ['genuine_interest', 'self_transformation', 'social_connection']
      }
    };
  }

  private createSportsMetacognitionStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'sports_meta_1',
          intent: 'metacognitive_connection',
          evaluationFocus: 'inquiry_nature',
          expectedDepth: 'deep',
          followUpTriggers: [],
          guidanceForAI: {
            topic: 'スポーツと探究活動・学習の共通点',
            style: 'encouraging',
            elements: ['継続的努力', '目標設定', '改善プロセス'],
            context: 'スポーツで身につけた力（継続力、目標達成力、チームワーク等）が他の分野にどう活かされているかを探る'
          }
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['関連性'],
        evaluatedAxes: ['inquiry_nature']
      }
    };
  }

  private createSportsFutureStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'sports_future_1',
          intent: 'continuation_willingness',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'moderate',
          followUpTriggers: [],
          guidanceForAI: {
            topic: 'スポーツ活動の将来展望',
            style: 'encouraging',
            elements: ['中学での継続', '新たな目標', '指導者への憧れ'],
            context: '明和中学校でのスポーツ継続意欲、新たな挑戦への期待、将来の夢等を聞く'
          }
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['継続意欲'],
        evaluatedAxes: ['genuine_interest']
      }
    };
  }

  // ===== 新パターン2: 社会・課題解決系 =====
  private createSocialExplorationStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'social_1',
          intent: 'trigger_exploration',
          evaluationFocus: 'social_connection',
          expectedDepth: 'moderate',
          preparationTime: 60,
          followUpTriggers: [
            {
              condition: 'ボランティア|地域|環境|社会|問題|課題',
              nextQuestionId: 'social_2',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '社会課題・ボランティア活動の概要説明',
            style: 'encouraging',
            elements: ['1分程度で', '社会活動について', '問題意識の背景'],
            context: '社会課題解決系では問題発見力と持続的な取り組みを重視。社会への関心の高さを確認'
          }
        },
        {
          id: 'social_2',
          intent: 'trigger_exploration', 
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: 'きっかけ|出会い|体験|知った|気づい',
              nextQuestionId: 'social_3',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '社会問題への関心を持ったきっかけ',
            style: 'friendly',
            elements: ['問題との出会い', '体験・体感', '心の動き'],
            context: '社会課題に関心を持った原体験を詳しく聞く。ニュース、体験、身近な人の影響など具体的なきっかけを探る'
          }
        },
        {
          id: 'social_3',
          intent: 'difficulty_probing',
          evaluationFocus: 'self_transformation',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: '大変|困難|難し|理解されな|反対|協力',
              nextQuestionId: 'social_4',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '社会活動での困難・障壁',
            style: 'encouraging',
            elements: ['周囲の理解不足', '資源・時間の制約', '成果の見えにくさ'],
            context: '社会活動特有の困難（理解されない、成果が見えない、継続の難しさ等）を具体的に聞く'
          }
        },
        {
          id: 'social_4',
          intent: 'information_gathering',
          evaluationFocus: 'inquiry_nature',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: '調べ|研究|データ|統計|専門家|本',
              nextQuestionId: 'social_5',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '社会課題についての情報収集・学習',
            style: 'friendly',
            elements: ['問題の調査方法', '専門知識の習得', '現状把握'],
            context: '社会課題の背景や解決策について、どのように情報を集め学習したかを詳しく聞く'
          }
        },
        {
          id: 'social_5',
          intent: 'collaboration_detail',
          evaluationFocus: 'social_connection',
          expectedDepth: 'deep',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '継続的な社会活動への意欲・使命感',
            style: 'encouraging',
            elements: ['社会への責任感', '将来への使命', '継続の決意'],
            context: '社会課題解決への長期的なコミットメント、将来の社会貢献への意欲を確認'
          }
        }
      ],
      transitionCondition: {
        minDepth: 6,
        requiredElements: ['問題意識', 'きっかけ', '困難体験', '学習・調査', '継続意欲'],
        evaluatedAxes: ['social_connection', 'genuine_interest', 'inquiry_nature']
      }
    };
  }

  private createSocialMetacognitionStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'social_meta_1',
          intent: 'metacognitive_connection',
          evaluationFocus: 'social_connection',
          expectedDepth: 'deep',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '社会活動と探究学習の共通点',
            style: 'encouraging',
            elements: ['問題発見力', '多角的思考', '持続的行動'],
            context: '社会課題解決で身につけた力（批判的思考、共感力、行動力等）が他の学習にどう活かされているかを探る'
          }
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['関連性'],
        evaluatedAxes: ['social_connection']
      }
    };
  }

  private createSocialFutureStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'social_future_1',
          intent: 'continuation_willingness',
          evaluationFocus: 'social_connection',
          expectedDepth: 'moderate',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '社会課題解決の将来展望',
            style: 'encouraging',
            elements: ['中学での継続', 'より大きな活動', '将来の職業'],
            context: '明和中学校での社会活動継続、将来の社会貢献への意欲、関連する職業への関心等を聞く'
          }
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['継続意欲'],
        evaluatedAxes: ['social_connection']
      }
    };
  }

  // ===== 新パターン3: 技術・創造開発系 =====
  private createTechnologyExplorationStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'tech_1',
          intent: 'trigger_exploration',
          evaluationFocus: 'inquiry_nature',
          expectedDepth: 'moderate',
          preparationTime: 60,
          followUpTriggers: [
            {
              condition: 'プログラミング|ロボット|電子工作|アプリ|システム|ゲーム|技術',
              nextQuestionId: 'tech_2',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '技術・プログラミング活動の概要説明',
            style: 'encouraging',
            elements: ['1分程度で', '技術活動について', 'きっかけ・動機'],
            context: '技術創造系では論理的思考力と創造力を重視。技術への関心と継続的学習姿勢を確認'
          }
        },
        {
          id: 'tech_2',
          intent: 'trigger_exploration', 
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: 'きっかけ|始め|最初|出会い|体験|興味',
              nextQuestionId: 'tech_3',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '技術に興味を持ったきっかけ',
            style: 'friendly',
            elements: ['最初の体験', '発見の瞬間', '心の動き'],
            context: 'プログラミングやロボット等の技術に関心を持った原体験を詳しく聞く。ゲーム、授業、家族の影響など具体的なきっかけを探る'
          }
        },
        {
          id: 'tech_3',
          intent: 'difficulty_probing',
          evaluationFocus: 'self_transformation',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: 'エラー|バグ|うまくいかな|難し|わからな|つまず',
              nextQuestionId: 'tech_4',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '技術学習での困難・挫折体験',
            style: 'encouraging',
            elements: ['エラーやバグ', '理解困難', '予想外の問題'],
            context: '技術学習特有の困難（コードのエラー、理論の理解困難、思い通りに動かない等）を具体的に聞く'
          }
        },
        {
          id: 'tech_4',
          intent: 'information_gathering',
          evaluationFocus: 'inquiry_nature',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: '調べ|検索|質問|本|サイト|動画|先生',
              nextQuestionId: 'tech_5',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '技術問題解決のための情報収集',
            style: 'friendly',
            elements: ['学習リソース', '質問・相談', 'トライアンドエラー'],
            context: '技術的な問題にぶつかった時の解決方法、学習方法について詳しく聞く。独学か指導者がいるかも重要'
          }
        },
        {
          id: 'tech_5',
          intent: 'creation_detail',
          evaluationFocus: 'original_expression',
          expectedDepth: 'deep',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '創作物・成果物への愛着と継続的改善',
            style: 'encouraging',
            elements: ['作品への思い', '改善・発展', '他者への共有'],
            context: '自分で作ったプログラムやロボット等の作品に対する愛着、継続的な改善意欲、他者と共有したい気持ちを確認'
          }
        }
      ],
      transitionCondition: {
        minDepth: 6,
        requiredElements: ['技術活動', 'きっかけ', '困難体験', '学習・調査', '創作・改善'],
        evaluatedAxes: ['inquiry_nature', 'genuine_interest', 'original_expression']
      }
    };
  }

  private createTechnologyMetacognitionStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'tech_meta_1',
          intent: 'metacognitive_connection',
          evaluationFocus: 'inquiry_nature',
          expectedDepth: 'deep',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '技術学習と探究活動・他教科学習の共通点',
            style: 'encouraging',
            elements: ['論理的思考', '試行錯誤', '創造的問題解決'],
            context: '技術学習で身につけた力（論理的思考、問題解決力、創造力等）が他の分野にどう活かされているかを探る'
          }
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['関連性'],
        evaluatedAxes: ['inquiry_nature']
      }
    };
  }

  private createTechnologyFutureStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'tech_future_1',
          intent: 'continuation_willingness',
          evaluationFocus: 'genuine_interest',
          expectedDepth: 'moderate',
          followUpTriggers: [],
          guidanceForAI: {
            topic: '技術学習の将来展望',
            style: 'encouraging',
            elements: ['中学での継続', '新しい技術への挑戦', '将来の職業'],
            context: '明和中学校での技術学習継続、新しい技術分野への興味、将来のエンジニア等への憧れを聞く'
          }
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['継続意欲'],
        evaluatedAxes: ['genuine_interest']
      }
    };
  }

  // ===== 新パターン4: リーダーシップ・合意形成系 =====
  private createLeadershipExplorationStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'leadership_1',
          intent: 'trigger_exploration',
          evaluationFocus: 'social_connection',
          expectedDepth: 'moderate',
          preparationTime: 60,
          followUpTriggers: [
            {
              condition: '生徒会|委員長|リーダー|代表|まとめ|企画|運営',
              nextQuestionId: 'leadership_2',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: 'リーダーシップ・組織運営活動の概要説明',
            style: 'encouraging',
            elements: ['1分程度で', 'リーダー経験について', '責任・役割の自覚'],
            context: 'リーダーシップ系では協調性と責任感を重視。組織をまとめる力と他者への配慮を確認'
          }
        },
        {
          id: 'leadership_2',
          intent: 'trigger_exploration', 
          evaluationFocus: 'social_connection',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: 'きっかけ|推薦|立候補|選ば|頼ま|やりたい',
              nextQuestionId: 'leadership_3',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: 'リーダーになったきっかけ・動機',
            style: 'friendly',
            elements: ['立候補・推薦', '責任感', '貢献したい気持ち'],
            context: 'リーダーシップを発揮する立場になった経緯を詳しく聞く。自発的か他薦かも重要なポイント'
          }
        },
        {
          id: 'leadership_3',
          intent: 'difficulty_probing',
          evaluationFocus: 'empathy',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: '意見|対立|まとまらな|困難|大変|反対',
              nextQuestionId: 'leadership_4',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: 'リーダーとしての困難・対立への対処',
            style: 'encouraging',
            elements: ['意見の対立', '合意形成の困難', '責任の重さ'],
            context: 'リーダーシップ特有の困難（意見対立、責任の重さ、板挟み等）を具体的に聞く'
          }
        },
        {
          id: 'leadership_4',
          intent: 'collaboration_detail',
          evaluationFocus: 'empathy',
          expectedDepth: 'deep',
          followUpTriggers: [
            {
              condition: '話し合い|聞く|意見|調整|妥協|解決',
              nextQuestionId: 'leadership_5',
              depthIncrease: 1
            }
          ],
          guidanceForAI: {
            topic: '合意形成・問題解決のプロセス',
            style: 'friendly',
            elements: ['対話重視', '相手の立場理解', 'Win-Win解決'],
            context: '対立や困難をどのように解決したか、合意形成のプロセスを詳しく聞く。他者への配慮が重要'
          }
        },
        {
          id: 'leadership_5',
          intent: 'self_change',
          evaluationFocus: 'self_transformation',
          expectedDepth: 'deep',
          followUpTriggers: [],
          guidanceForAI: {
            topic: 'リーダー経験による自己成長',
            style: 'encouraging',
            elements: ['責任感の向上', '他者理解', 'コミュニケーション力'],
            context: 'リーダーとしての経験を通じた自分自身の成長、変化について深く聞く。他者への感謝も重要'
          }
        }
      ],
      transitionCondition: {
        minDepth: 6,
        requiredElements: ['リーダー経験', 'きっかけ', '困難体験', '合意形成', '自己成長'],
        evaluatedAxes: ['social_connection', 'empathy', 'self_transformation']
      }
    };
  }

  private createLeadershipMetacognitionStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'leadership_meta_1',
          intent: 'metacognitive_connection',
          evaluationFocus: 'social_connection',
          expectedDepth: 'deep',
          followUpTriggers: [],
          guidanceForAI: {
            topic: 'リーダーシップと探究学習の共通点',
            style: 'encouraging',
            elements: ['多面的思考', '他者との協働', '責任感'],
            context: 'リーダー経験で身につけた力（協調性、責任感、調整力等）が他の学習にどう活かされているかを探る'
          }
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['関連性'],
        evaluatedAxes: ['social_connection']
      }
    };
  }

  private createLeadershipFutureStage(): StageQuestions {
    return {
      questions: [
        {
          id: 'leadership_future_1',
          intent: 'continuation_willingness',
          evaluationFocus: 'social_connection',
          expectedDepth: 'moderate',
          followUpTriggers: [],
          guidanceForAI: {
            topic: 'リーダーシップの将来展望',
            style: 'encouraging',
            elements: ['中学でのリーダー継続', '社会貢献', '将来の職業'],
            context: '明和中学校でのリーダーシップ継続、将来の社会リーダーへの意欲、関連する職業への関心等を聞く'
          }
        }
      ],
      transitionCondition: {
        minDepth: 1,
        requiredElements: ['継続意欲'],
        evaluatedAxes: ['social_connection']
      }
    };
  }
}

// 新しい分析インターface
interface ActivityAnalysis {
  sportsCompetitive: number;
  artisticCollaborative: number;
  scientificIndividual: number;
  socialProblemSolving: number;
  technologyCreative: number;
  leadershipConsensus: number;
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