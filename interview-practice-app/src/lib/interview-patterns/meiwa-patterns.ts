/**
 * 明和中学校入試面接パターン
 * 愛知県公立中高一貫校特有の面接質問と評価基準
 */

export interface InterviewQuestion {
  id: string;
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  question: string;
  expectedAnswerLength: number; // 秒
  keywords: string[];
  evaluationCriteria: {
    content: string;
    expression: string;
    attitude: string;
    uniqueness: string;
  };
  followUpQuestions?: string[];
  modelAnswer?: string;
  commonMistakes?: string[];
  tips?: string[];
}

export interface InterviewCategory {
  id: string;
  name: string;
  description: string;
  weight: number; // 評価における重要度
  questions: InterviewQuestion[];
}

export interface InterviewSession {
  id: string;
  title: string;
  description: string;
  categories: string[];
  totalTime: number; // 分
  questionCount: number;
  difficulty: 'practice' | 'mock' | 'intensive';
}

/**
 * 明和中学校面接パターンマネージャー
 */
class MeiwaInterviewPatterns {
  private static instance: MeiwaInterviewPatterns;
  private categories: Map<string, InterviewCategory> = new Map();
  private sessions: Map<string, InterviewSession> = new Map();

  static getInstance(): MeiwaInterviewPatterns {
    if (!MeiwaInterviewPatterns.instance) {
      MeiwaInterviewPatterns.instance = new MeiwaInterviewPatterns();
    }
    return MeiwaInterviewPatterns.instance;
  }

  constructor() {
    this.initializeCategories();
    this.initializeSessions();
  }

  /**
   * 面接カテゴリの初期化
   */
  private initializeCategories(): void {
    // 1. 志望動機・学校理解
    const motivationCategory: InterviewCategory = {
      id: 'motivation',
      name: '志望動機・学校理解',
      description: '明和高校附属中学校を志望する理由と学校への理解',
      weight: 0.25,
      questions: [
        {
          id: 'mot_001',
          category: 'motivation',
          difficulty: 'basic',
          question: 'なぜ明和高校附属中学校を志望したのですか？',
          expectedAnswerLength: 90,
          keywords: ['中高一貫', '学習環境', '将来', '大学進学', '理数系', '国際教育'],
          evaluationCriteria: {
            content: '具体的で説得力のある志望理由',
            expression: '論理的で分かりやすい説明',
            attitude: '学校への真剣な思い',
            uniqueness: '自分らしい視点や体験'
          },
          followUpQuestions: [
            'その理由で他の学校ではだめなのですか？',
            '明和高校附属中学校の特色をどう理解していますか？'
          ],
          modelAnswer: '明和高校附属中学校を志望する理由は三つあります。一つ目は中高一貫教育により6年間を通じて深い学びができることです。二つ目は理数系教育が充実しており、将来研究者になりたい私の目標に適していることです。三つ目は国際教育にも力を入れており、グローバルな視野を身につけられることです。これらの環境で学ぶことで、将来社会に貢献できる人材になりたいと考えています。',
          commonMistakes: [
            '「家から近いから」など表面的な理由',
            '学校の特色を理解していない回答',
            '志望理由が曖昧で具体性がない'
          ],
          tips: [
            '学校説明会や見学で感じたことを具体的に話す',
            '自分の将来の目標と関連付ける',
            '明和中学校独自の特色を調べて盛り込む'
          ]
        },
        {
          id: 'mot_002',
          category: 'motivation',
          difficulty: 'intermediate',
          question: '明和高校附属中学校でどのような学校生活を送りたいですか？',
          expectedAnswerLength: 120,
          keywords: ['勉強', '部活動', '友達', '先生', '行事', '挑戦'],
          evaluationCriteria: {
            content: '具体的で実現可能な計画',
            expression: '順序立てた説明',
            attitude: '積極的な姿勢',
            uniqueness: '個性的な目標設定'
          },
          followUpQuestions: [
            'そのために今からできることはありますか？',
            '困難にぶつかったときはどうしますか？'
          ],
          modelAnswer: '学習面では、特に理科と数学に力を入れて基礎力をしっかり身につけたいです。また、探究学習では興味のある環境問題について深く研究してみたいと思います。学校生活では、クラスメートと協力して学級活動に取り組み、文化祭や体育祭などの行事でも積極的に参加したいです。部活動では科学部に入り、実験を通して理科への理解を深めたいと考えています。',
          commonMistakes: [
            '「楽しく過ごしたい」など抽象的な表現',
            '勉強面のみに偏った回答',
            '現実的でない高すぎる目標'
          ],
          tips: [
            '学習、友人関係、活動など複数の側面から話す',
            '具体的な科目や活動を挙げる',
            '自分の興味・関心と関連付ける'
          ]
        },
        {
          id: 'mot_003',
          category: 'motivation',
          difficulty: 'advanced',
          question: '明和高校附属中学校の教育方針についてどう思いますか？',
          expectedAnswerLength: 150,
          keywords: ['探究', '自主性', '国際性', '創造性', '協働'],
          evaluationCriteria: {
            content: '教育方針の正確な理解',
            expression: '自分の考えを明確に表現',
            attitude: '教育への真摯な姿勢',
            uniqueness: '独自の解釈や体験'
          },
          followUpQuestions: [
            'その教育方針のどの部分が最も魅力的ですか？',
            'あなたはその教育方針にどう応えますか？'
          ],
          tips: [
            '学校のウェブサイトや資料で教育方針を確認',
            '自分の価値観との共通点を見つける',
            '具体例を交えて説明する'
          ]
        }
      ]
    };

    // 2. 自己PR・将来目標
    const selfPRCategory: InterviewCategory = {
      id: 'self_pr',
      name: '自己PR・将来目標',
      description: '自分の長所や特技、将来の夢について',
      weight: 0.2,
      questions: [
        {
          id: 'spr_001',
          category: 'self_pr',
          difficulty: 'basic',
          question: '自分の長所を教えてください。',
          expectedAnswerLength: 90,
          keywords: ['努力', '協調性', '責任感', '好奇心', '継続力'],
          evaluationCriteria: {
            content: '具体的なエピソードがある',
            expression: '分かりやすい構成',
            attitude: '謙虚さと自信のバランス',
            uniqueness: '個性的な長所や表現'
          },
          followUpQuestions: [
            'その長所はいつ頃から身についたのですか？',
            'その長所を学校生活でどう活かしますか？'
          ],
          modelAnswer: '私の長所は最後まで諦めない継続力です。小学3年生から始めたピアノで、最初は思うように弾けず挫折しそうになりましたが、毎日30分の練習を続けることで、昨年は地区のコンクールで優秀賞をいただくことができました。この経験から、困難なことでも継続すれば必ず成果が出ることを学びました。中学校では勉強でもこの継続力を活かしたいと思います。',
          commonMistakes: [
            '長所を羅列するだけで具体例がない',
            '謙遜しすぎて長所が伝わらない',
            '自慢話になってしまう'
          ],
          tips: [
            '一つの長所に絞って具体的なエピソードを話す',
            'PREP法（結論→理由→具体例→結論）で構成する',
            '失敗から学んだ経験も含める'
          ]
        },
        {
          id: 'spr_002',
          category: 'self_pr',
          difficulty: 'intermediate',
          question: '将来の夢や目標を教えてください。',
          expectedAnswerLength: 120,
          keywords: ['職業', '社会貢献', '研究', '国際', '技術', '医療', '教育'],
          evaluationCriteria: {
            content: '明確な目標と実現方法',
            expression: '論理的な説明',
            attitude: '夢への真剣な思い',
            uniqueness: '独創的な発想や動機'
          },
          followUpQuestions: [
            'その夢を持ったきっかけは何ですか？',
            'その夢を実現するために今していることはありますか？'
          ],
          modelAnswer: '私の将来の夢は環境問題を解決する研究者になることです。最近、地球温暖化や海洋汚染のニュースを見て、このままでは地球の未来が心配になりました。そこで、新しい技術で環境を守る方法を研究したいと思うようになりました。そのためには理科と数学の知識が必要なので、中学校では特にこれらの教科をしっかり学びたいと思います。また、環境問題は世界共通の課題なので、英語も頑張って将来は国際的に活躍したいです。',
          commonMistakes: [
            '現実味のない夢を語る',
            '夢への具体的な道筋がない',
            '「まだ決まっていない」で終わる'
          ],
          tips: [
            '夢を持ったきっかけを含める',
            '実現に向けた具体的な計画を話す',
            '社会とのつながりを意識する'
          ]
        }
      ]
    };

    // 3. 学習・成績・得意分野
    const academicCategory: InterviewCategory = {
      id: 'academic',
      name: '学習・成績・得意分野',
      description: '学習への取り組みや得意科目について',
      weight: 0.2,
      questions: [
        {
          id: 'acd_001',
          category: 'academic',
          difficulty: 'basic',
          question: '得意な科目とその理由を教えてください。',
          expectedAnswerLength: 90,
          keywords: ['理解', '興味', '努力', '先生', '実験', '計算', '読書'],
          evaluationCriteria: {
            content: '科目選択の明確な理由',
            expression: '具体的なエピソード',
            attitude: '学習への積極性',
            uniqueness: '独自の学習方法や発見'
          },
          followUpQuestions: [
            'その科目で特に印象に残っている内容はありますか？',
            '苦手な科目はどのように克服していますか？'
          ],
          modelAnswer: '私が最も得意な科目は理科です。特に実験が好きで、予想と違う結果が出たときに「なぜだろう？」と考えることがとても楽しいです。5年生の時の水の性質の実験で、氷が水に浮く理由を調べるうちに、分子の構造まで興味を持つようになりました。図書館で専門書を借りて調べることもあります。理科は暗記だけでなく、考える力が必要な科目だと思うので、これからも好奇心を大切にして学習を続けたいです。',
          commonMistakes: [
            '「簡単だから」など表面的な理由',
            '得意科目だけで終わる',
            '具体的なエピソードがない'
          ],
          tips: [
            '具体的な体験や発見を含める',
            'なぜ得意になったかの過程を説明',
            '学習方法や工夫も紹介する'
          ]
        },
        {
          id: 'acd_002',
          category: 'academic',
          difficulty: 'intermediate',
          question: '勉強で困ったときはどのように解決しますか？',
          expectedAnswerLength: 100,
          keywords: ['質問', '調べる', '友達', '先生', '参考書', '復習', '基礎'],
          evaluationCriteria: {
            content: '具体的な解決方法',
            expression: 'ステップを順序立てて説明',
            attitude: '主体的な姿勢',
            uniqueness: '工夫された学習法'
          },
          followUpQuestions: [
            '一人で解決できないときはどうしますか？',
            '同じ間違いを繰り返さないための工夫はありますか？'
          ],
          modelAnswer: '勉強で分からないことがあったときは、まず教科書や参考書をもう一度読み返します。それでも分からない場合は、インターネットで調べたり、図書館で関連する本を探したりします。それでも解決しない時は、先生や友達に質問します。質問する前に、どこが分からないのかを整理してから聞くようにしています。また、理解したことはノートにまとめ直して、後で見返せるようにしています。',
          commonMistakes: [
            'すぐに人に聞いてしまう',
            '諦めてしまう',
            '解決方法が曖昧'
          ],
          tips: [
            '自分なりの解決手順を持つ',
            '質問の仕方も工夫する',
            '学んだことの定着方法も含める'
          ]
        }
      ]
    };

    // 4. 小学校生活・活動
    const schoolLifeCategory: InterviewCategory = {
      id: 'school_life',
      name: '小学校生活・活動',
      description: '小学校での経験や活動について',
      weight: 0.15,
      questions: [
        {
          id: 'scl_001',
          category: 'school_life',
          difficulty: 'basic',
          question: '小学校生活で最も印象に残っていることは何ですか？',
          expectedAnswerLength: 120,
          keywords: ['行事', '友達', '先生', '挑戦', '成長', '協力', '発見'],
          evaluationCriteria: {
            content: '具体的で印象深いエピソード',
            expression: '時系列や感情を含めた説明',
            attitude: '前向きな姿勢',
            uniqueness: '個人的な気づきや成長'
          },
          followUpQuestions: [
            'その経験から何を学びましたか？',
            'その経験は今の自分にどう活かされていますか？'
          ],
          modelAnswer: '最も印象に残っているのは6年生の修学旅行です。班長として班のメンバーをまとめる役割を任されましたが、最初はみんなの意見がまとまらず困りました。しかし、一人ひとりの話をよく聞いて、全員が楽しめるような計画を一緒に考えることで、とても充実した修学旅行にすることができました。この経験から、リーダーシップとは指示することではなく、みんなの気持ちを理解して協力しやすい環境を作ることだと学びました。',
          commonMistakes: [
            '単なる出来事の説明に終わる',
            '学びや成長に言及しない',
            '印象が薄いエピソードを選ぶ'
          ],
          tips: [
            '自分が成長したエピソードを選ぶ',
            '困難をどう乗り越えたかを含める',
            '他者との関わりを意識する'
          ]
        },
        {
          id: 'scl_002',
          category: 'school_life',
          difficulty: 'intermediate',
          question: 'クラスの中でどのような役割を果たしていましたか？',
          expectedAnswerLength: 100,
          keywords: ['委員', '班長', 'リーダー', 'サポート', '協力', '責任'],
          evaluationCriteria: {
            content: '具体的な役割と貢献',
            expression: '客観的な自己分析',
            attitude: '責任感と協調性',
            uniqueness: '独自の貢献方法'
          },
          followUpQuestions: [
            'その役割で大変だったことはありますか？',
            'クラスメートからはどう思われていましたか？'
          ],
          tips: [
            '公式な役職だけでなく自然な役割も含める',
            '周りとの関係性も説明する',
            '責任感を持って取り組んだことを強調'
          ]
        }
      ]
    };

    // 5. 課外活動・趣味・特技
    const extracurricularCategory: InterviewCategory = {
      id: 'extracurricular',
      name: '課外活動・趣味・特技',
      description: '習い事や趣味、特技について',
      weight: 0.1,
      questions: [
        {
          id: 'ext_001',
          category: 'extracurricular',
          difficulty: 'basic',
          question: '習い事や趣味について教えてください。',
          expectedAnswerLength: 90,
          keywords: ['継続', '努力', '成果', '楽しみ', '挑戦', '技術'],
          evaluationCriteria: {
            content: '継続性と成果',
            expression: '具体的な体験談',
            attitude: '積極的な取り組み',
            uniqueness: '独特な趣味や成果'
          },
          followUpQuestions: [
            'それを始めたきっかけは何ですか？',
            'その活動から学んだことはありますか？'
          ],
          modelAnswer: '私は4年間ピアノを習っています。最初は指が思うように動かず難しかったのですが、毎日の練習を続けることで少しずつ上達し、今では複雑な曲も演奏できるようになりました。昨年は発表会でショパンの曲を演奏し、たくさんの拍手をもらえた時はとても嬉しかったです。ピアノを通じて集中力と継続力が身につき、勉強にも活かされています。中学校でも続けて、いつか大きなコンクールに挑戦してみたいです。',
          commonMistakes: [
            '表面的な説明だけで終わる',
            '成果や学びに触れない',
            '継続性が感じられない'
          ],
          tips: [
            '始めた動機から現在までの成長を語る',
            '困難を乗り越えた経験を含める',
            '将来への展望も話す'
          ]
        }
      ]
    };

    // 6. 時事問題・社会への関心
    const currentEventsCategory: InterviewCategory = {
      id: 'current_events',
      name: '時事問題・社会への関心',
      description: '最近のニュースや社会問題への関心',
      weight: 0.1,
      questions: [
        {
          id: 'cur_001',
          category: 'current_events',
          difficulty: 'intermediate',
          question: '最近気になったニュースはありますか？',
          expectedAnswerLength: 120,
          keywords: ['環境', '技術', '国際', '教育', 'スポーツ', '科学'],
          evaluationCriteria: {
            content: '適切なニュースの選択と理解',
            expression: '自分の意見を含めた説明',
            attitude: '社会への関心',
            uniqueness: '独自の視点や提案'
          },
          followUpQuestions: [
            'そのニュースについてどう思いますか？',
            '自分たちにできることはありますか？'
          ],
          modelAnswer: '最近、地球温暖化による異常気象のニュースが印象に残っています。世界各地で豪雨や干ばつが起こり、多くの人が困っているのを見て、環境問題の深刻さを感じました。私たち中学生にもできることがあると思います。例えば、節電や節水を心がけたり、プラスチックゴミを減らしたりすることです。また、将来は環境を守る技術を開発する仕事に就きたいとも思いました。一人ひとりの小さな行動が大きな変化につながると信じています。',
          commonMistakes: [
            '表面的な理解に留まる',
            '自分の意見がない',
            '関心の薄いニュースを選ぶ'
          ],
          tips: [
            '日頃からニュースに関心を持つ',
            '自分なりの意見や解決策を考える',
            '中学生らしい視点で語る'
          ]
        }
      ]
    };

    // カテゴリをマップに追加
    this.categories.set('motivation', motivationCategory);
    this.categories.set('self_pr', selfPRCategory);
    this.categories.set('academic', academicCategory);
    this.categories.set('school_life', schoolLifeCategory);
    this.categories.set('extracurricular', extracurricularCategory);
    this.categories.set('current_events', currentEventsCategory);
  }

  /**
   * 面接セッションの初期化
   */
  private initializeSessions(): void {
    const sessions: InterviewSession[] = [
      {
        id: 'basic_practice',
        title: '基本練習セッション',
        description: '明和中学校面接の基本的な質問を練習します',
        categories: ['motivation', 'self_pr', 'academic'],
        totalTime: 15,
        questionCount: 5,
        difficulty: 'practice'
      },
      {
        id: 'comprehensive_mock',
        title: '総合模擬面接',
        description: '本番を想定した総合的な面接練習',
        categories: ['motivation', 'self_pr', 'academic', 'school_life', 'extracurricular'],
        totalTime: 25,
        questionCount: 8,
        difficulty: 'mock'
      },
      {
        id: 'intensive_training',
        title: '集中特訓セッション',
        description: '難易度の高い質問を含む集中特訓',
        categories: ['motivation', 'self_pr', 'academic', 'school_life', 'extracurricular', 'current_events'],
        totalTime: 30,
        questionCount: 10,
        difficulty: 'intensive'
      },
      {
        id: 'motivation_focus',
        title: '志望動機特化練習',
        description: '志望動機と学校理解に特化した練習',
        categories: ['motivation'],
        totalTime: 10,
        questionCount: 4,
        difficulty: 'practice'
      },
      {
        id: 'self_expression',
        title: '自己表現練習',
        description: '自己PRと将来目標の表現力向上',
        categories: ['self_pr', 'extracurricular'],
        totalTime: 12,
        questionCount: 4,
        difficulty: 'practice'
      }
    ];

    sessions.forEach(session => {
      this.sessions.set(session.id, session);
    });
  }

  /**
   * 全カテゴリを取得
   */
  public getCategories(): InterviewCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * カテゴリ別の質問を取得
   */
  public getQuestionsByCategory(categoryId: string): InterviewQuestion[] {
    const category = this.categories.get(categoryId);
    return category ? category.questions : [];
  }

  /**
   * 難易度別の質問を取得
   */
  public getQuestionsByDifficulty(difficulty: 'basic' | 'intermediate' | 'advanced'): InterviewQuestion[] {
    const allQuestions: InterviewQuestion[] = [];
    this.categories.forEach(category => {
      allQuestions.push(...category.questions.filter(q => q.difficulty === difficulty));
    });
    return allQuestions;
  }

  /**
   * ランダムな質問セットを生成
   */
  public generateQuestionSet(options: {
    categories?: string[];
    difficulty?: 'basic' | 'intermediate' | 'advanced' | 'mixed';
    count: number;
    includeFollowUp?: boolean;
  }): InterviewQuestion[] {
    let availableQuestions: InterviewQuestion[] = [];

    // カテゴリフィルタ
    const targetCategories = options.categories || Array.from(this.categories.keys());
    targetCategories.forEach(categoryId => {
      const category = this.categories.get(categoryId);
      if (category) {
        availableQuestions.push(...category.questions);
      }
    });

    // 難易度フィルタ
    if (options.difficulty && options.difficulty !== 'mixed') {
      availableQuestions = availableQuestions.filter(q => q.difficulty === options.difficulty);
    }

    // ランダム選択
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, options.count);
  }

  /**
   * セッション設定を取得
   */
  public getSessions(): InterviewSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 特定のセッションを取得
   */
  public getSession(sessionId: string): InterviewSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * セッション用の質問セットを生成
   */
  public generateSessionQuestions(sessionId: string): InterviewQuestion[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return this.generateQuestionSet({
      categories: session.categories,
      difficulty: 'mixed',
      count: session.questionCount,
      includeFollowUp: session.difficulty === 'intensive'
    });
  }

  /**
   * キーワードベースの質問検索
   */
  public searchQuestions(keyword: string): InterviewQuestion[] {
    const results: InterviewQuestion[] = [];
    
    this.categories.forEach(category => {
      category.questions.forEach(question => {
        if (
          question.question.includes(keyword) ||
          question.keywords.some(k => k.includes(keyword)) ||
          question.modelAnswer?.includes(keyword)
        ) {
          results.push(question);
        }
      });
    });

    return results;
  }

  /**
   * 面接評価基準を取得
   */
  public getEvaluationCriteria(): {
    [key: string]: {
      weight: number;
      description: string;
      levels: { score: number; description: string }[];
    };
  } {
    return {
      content: {
        weight: 0.4,
        description: '回答の内容の適切さと深さ',
        levels: [
          { score: 5, description: '非常に適切で深い内容' },
          { score: 4, description: '適切で具体的な内容' },
          { score: 3, description: '一般的だが妥当な内容' },
          { score: 2, description: 'やや不適切または浅い内容' },
          { score: 1, description: '不適切または内容が薄い' }
        ]
      },
      expression: {
        weight: 0.25,
        description: '話し方と表現力',
        levels: [
          { score: 5, description: '非常に分かりやすく論理的' },
          { score: 4, description: '分かりやすく整理されている' },
          { score: 3, description: '概ね理解できる' },
          { score: 2, description: 'やや分かりにくい' },
          { score: 1, description: '理解が困難' }
        ]
      },
      attitude: {
        weight: 0.25,
        description: '面接への姿勢と態度',
        levels: [
          { score: 5, description: '非常に前向きで誠実' },
          { score: 4, description: '前向きで真剣' },
          { score: 3, description: '普通の姿勢' },
          { score: 2, description: 'やや消極的' },
          { score: 1, description: '不適切な態度' }
        ]
      },
      uniqueness: {
        weight: 0.1,
        description: '独創性と個性',
        levels: [
          { score: 5, description: '非常に独創的で印象的' },
          { score: 4, description: '個性が感じられる' },
          { score: 3, description: '一般的な範囲' },
          { score: 2, description: 'やや平凡' },
          { score: 1, description: '個性が感じられない' }
        ]
      }
    };
  }
}

// シングルトンインスタンス
export const meiwaInterviewPatterns = MeiwaInterviewPatterns.getInstance();