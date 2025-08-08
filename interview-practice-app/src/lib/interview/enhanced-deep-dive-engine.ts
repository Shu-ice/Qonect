/**
 * 🚀 Enhanced Deep Dive Engine - 世界最高レベルの深掘り質問生成
 * 小学6年生が明和中で最高の面接をするための究極のAIエンジン
 */

export interface KeywordAnalysis {
  primary: string[];      // 最重要キーワード
  secondary: string[];    // 補助キーワード
  emotions: string[];     // 感情表現
  timeFrames: string[];   // 時間軸
  difficulties: string[]; // 困難・課題
  collaborators: string[]; // 協力者
}

export interface DeepDiveStrategy {
  currentDepth: number;
  maxDepth: number;
  focusAreas: string[];
  questionType: 'process' | 'emotion' | 'difficulty' | 'collaboration' | 'learning' | 'future';
  urgency: 'low' | 'medium' | 'high';
}

export class EnhancedDeepDiveEngine {
  private questionHistory: Map<string, number> = new Map();
  private keywordUsage: Map<string, number> = new Map();

  /**
   * 高精度キーワード分析
   */
  analyzeKeywords(response: string): KeywordAnalysis {
    const analysis: KeywordAnalysis = {
      primary: [],
      secondary: [],
      emotions: [],
      timeFrames: [],
      difficulties: [],
      collaborators: []
    };

    // 最重要キーワード（活動名・主題）
    const primaryPatterns = [
      /環境委員会|生徒会|委員長|部活動|クラブ活動/g,
      /メダカ|金魚|熱帯魚|植物|野菜|花/g,
      /ダンス|音楽|演劇|合唱|楽器|ピアノ|バイオリン/g,
      /プログラミング|ロボット|アプリ|ゲーム|電子工作/g,
      /サッカー|野球|バスケ|テニス|水泳|陸上/g,
      /ボランティア|地域活動|環境問題|社会貢献/g
    ];

    // 補助キーワード（プロセス・方法）
    const secondaryPatterns = [
      /観察|記録|測定|実験|調査|研究|分析|比較/g,
      /練習|訓練|勉強|学習|習得|上達|向上/g,
      /作成|制作|開発|設計|企画|準備/g,
      /発表|披露|公演|展示|説明|紹介/g
    ];

    // 感情表現
    const emotionPatterns = [
      /楽しい|面白い|嬉しい|わくわく|ドキドキ/g,
      /大変|困った|悩んだ|不安|心配/g,
      /感動|感激|驚いた|びっくり|すごい/g,
      /悲しい|残念|がっかり|つらい/g
    ];

    // 時間軸
    const timePatterns = [
      /小学[1-6]年生?|[1-6]年生?の?時/g,
      /[1-9]年間|毎日|毎週|週[1-7]回|月[1-9]回/g,
      /最初|初めて|はじめは|当初/g,
      /今|現在|最近|今度|これから/g
    ];

    // 困難・課題
    const difficultyPatterns = [
      /困難|大変|難しい|困った|苦労/g,
      /失敗|うまくいかな|だめ|ミス|間違い/g,
      /問題|課題|トラブル|悩み/g,
      /壁|限界|挫折|諦め/g
    ];

    // 協力者
    const collaboratorPatterns = [
      /友達|友人|仲間|チーム|グループ|メンバー/g,
      /先生|指導者|コーチ|先輩|後輩/g,
      /家族|両親|父|母|兄弟|姉妹/g,
      /一緒|協力|手伝い|サポート|支援/g
    ];

    // パターンマッチング実行
    this.extractMatches(response, primaryPatterns, analysis.primary);
    this.extractMatches(response, secondaryPatterns, analysis.secondary);
    this.extractMatches(response, emotionPatterns, analysis.emotions);
    this.extractMatches(response, timePatterns, analysis.timeFrames);
    this.extractMatches(response, difficultyPatterns, analysis.difficulties);
    this.extractMatches(response, collaboratorPatterns, analysis.collaborators);

    return analysis;
  }

  private extractMatches(text: string, patterns: RegExp[], target: string[]): void {
    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (!target.includes(match)) {
          target.push(match);
        }
      });
    });
  }

  /**
   * 深掘り戦略の決定
   */
  determineDeepDiveStrategy(
    analysis: KeywordAnalysis, 
    currentDepth: number,
    stage: string
  ): DeepDiveStrategy {
    const strategy: DeepDiveStrategy = {
      currentDepth,
      maxDepth: 9, // 明和中の最大深掘り層数
      focusAreas: [],
      questionType: 'process',
      urgency: 'medium'
    };

    // 深度に応じた戦略調整
    if (currentDepth <= 3) {
      // 初期段階：基本情報の確認
      strategy.questionType = 'process';
      strategy.focusAreas = [...analysis.primary, ...analysis.secondary];
    } else if (currentDepth <= 6) {
      // 中段階：困難や感情の深掘り
      if (analysis.difficulties.length > 0) {
        strategy.questionType = 'difficulty';
        strategy.focusAreas = analysis.difficulties;
        strategy.urgency = 'high';
      } else if (analysis.emotions.length > 0) {
        strategy.questionType = 'emotion';
        strategy.focusAreas = analysis.emotions;
      }
    } else {
      // 深層段階：学習や将来への展開
      if (analysis.collaborators.length > 0) {
        strategy.questionType = 'collaboration';
        strategy.focusAreas = analysis.collaborators;
      } else {
        strategy.questionType = 'learning';
        strategy.focusAreas = ['学び', '発見', '成長'];
      }
    }

    return strategy;
  }

  /**
   * 最適化された深掘り質問生成
   */
  async generateOptimizedDeepDiveQuestion(
    question: string,
    answer: string,
    stage: string,
    depth: number
  ): Promise<{question: string, confidence: number, reasoning: string}> {
    
    console.log('🔥 Enhanced Deep Dive Engine 起動');
    
    const analysis = this.analyzeKeywords(answer);
    const strategy = this.determineDeepDiveStrategy(analysis, depth, stage);
    
    console.log('📊 キーワード分析結果:', {
      primary: analysis.primary,
      difficulties: analysis.difficulties,
      emotions: analysis.emotions
    });
    
    console.log('🎯 深掘り戦略:', {
      questionType: strategy.questionType,
      focusAreas: strategy.focusAreas,
      urgency: strategy.urgency
    });

    // 最適な質問パターンを選択
    const questionTemplate = this.selectOptimalQuestionTemplate(analysis, strategy);
    
    // Gemini APIで質問を生成
    const generatedQuestion = await this.generateQuestionWithGemini(
      questionTemplate,
      analysis,
      strategy,
      question,
      answer
    );

    return generatedQuestion;
  }

  /**
   * 最適な質問テンプレート選択
   */
  private selectOptimalQuestionTemplate(
    analysis: KeywordAnalysis, 
    strategy: DeepDiveStrategy
  ): string {
    
    const templates = {
      process: [
        `${analysis.primary[0] || '活動'}について、具体的にはどのような手順で進めていましたか？`,
        `${analysis.primary[0] || 'それ'}はどのようにして始めることになったのですか？`,
        `${analysis.secondary[0] || 'その方法'}は、誰かに教わったのですか？`
      ],
      
      difficulty: [
        `${analysis.primary[0] || '活動'}で、一番困ったことや大変だったことはありませんでしたか？`,
        `${analysis.difficulties[0] || 'その困難'}に直面したとき、どのように対処しましたか？`,
        `失敗やうまくいかなかったことから、どのような学びがありましたか？`
      ],
      
      emotion: [
        `${analysis.emotions[0] || 'その気持ち'}になったのは、どのような場面でしたか？`,
        `一番${analysis.emotions[0] || '印象的'}だった瞬間について、詳しく教えてください`,
        `そのとき、周りの人たちはどのような反応を示しましたか？`
      ],
      
      collaboration: [
        `${analysis.collaborators[0] || '仲間'}との協力で、印象に残っていることはありますか？`,
        `意見が分かれたときは、どのようにして解決しましたか？`,
        `${analysis.collaborators[0] || 'チーム'}の中での自分の役割は何でしたか？`
      ],
      
      learning: [
        `この経験を通して、自分自身はどのように変わったと思いますか？`,
        `他の活動にも活かせそうなことはありましたか？`,
        `今振り返ってみて、この経験の価値をどう感じますか？`
      ],
      
      future: [
        `これからも${analysis.primary[0] || '活動'}を続けていきたいですか？`,
        `次はどのようなことに挑戦してみたいと思いますか？`,
        `将来、この経験をどのように活かしたいですか？`
      ]
    };

    const availableTemplates = templates[strategy.questionType] || templates.process;
    
    // 使用頻度を考慮して最適なテンプレートを選択
    let bestTemplate = availableTemplates[0];
    let minUsage = this.questionHistory.get(bestTemplate) || 0;
    
    for (const template of availableTemplates) {
      const usage = this.questionHistory.get(template) || 0;
      if (usage < minUsage) {
        minUsage = usage;
        bestTemplate = template;
      }
    }
    
    // 使用回数を記録
    this.questionHistory.set(bestTemplate, minUsage + 1);
    
    return bestTemplate;
  }

  /**
   * Gemini APIを使った高品質質問生成
   */
  private async generateQuestionWithGemini(
    template: string,
    analysis: KeywordAnalysis,
    strategy: DeepDiveStrategy,
    previousQuestion: string,
    studentResponse: string
  ): Promise<{question: string, confidence: number, reasoning: string}> {
    
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      
      if (!apiKey) {
        return {
          question: template,
          confidence: 0.5,
          reasoning: 'API未使用のテンプレート回答'
        };
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.3, // 品質重視で低温度
          candidateCount: 1
        }
      });

      const prompt = `
【明和中面接 - プロフェッショナル深掘り質問生成】

## 現在の状況
- 前の質問: "${previousQuestion}"
- 学生の回答: "${studentResponse}"
- 深掘り層数: ${strategy.currentDepth}/${strategy.maxDepth}

## 分析結果
- 主要キーワード: ${analysis.primary.join(', ')}
- 困難・課題: ${analysis.difficulties.join(', ')}
- 感情表現: ${analysis.emotions.join(', ')}
- 協力者: ${analysis.collaborators.join(', ')}

## 質問生成指針
1. **具体的キーワード必須活用**: "${analysis.primary[0] || 'キーワード'}"を必ず含める
2. **自然な受け答え**: 学生の発言を受けて自然に続ける
3. **深掘り重視**: ${strategy.questionType}を重点的に掘り下げる
4. **面接官らしさ**: 優しく、でも的確に本質に迫る

## 期待する質問レベル
明和中の実際の面接官が行う${strategy.currentDepth}層目の深掘り質問レベル

以下のJSON形式で回答してください：
{
  "question": "生成された深掘り質問",
  "confidence": 0.0-1.0の自信度,
  "reasoning": "この質問を選んだ理由"
}
`;

      console.log('🚀 Gemini API呼び出し開始...');
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text().trim();
      
      console.log('📥 Gemini API応答:', text.substring(0, 150));
      
      try {
        const parsed = JSON.parse(text);
        console.log('✅ 高品質深掘り質問生成成功');
        
        return {
          question: parsed.question || template,
          confidence: parsed.confidence || 0.7,
          reasoning: parsed.reasoning || '高品質AI生成'
        };
      } catch (parseError) {
        console.log('⚠️ JSON解析失敗、質問テキスト抽出を試行');
        
        // JSON解析失敗時のフォールバック
        const questionMatch = text.match(/"question":\s*"([^"]+)"/);
        if (questionMatch) {
          return {
            question: questionMatch[1],
            confidence: 0.6,
            reasoning: 'テキスト抽出成功'
          };
        }
        
        return {
          question: template,
          confidence: 0.4,
          reasoning: 'フォールバックテンプレート使用'
        };
      }
      
    } catch (error) {
      console.error('❌ Enhanced Deep Dive Engine エラー:', error);
      
      return {
        question: template,
        confidence: 0.3,
        reasoning: `エラーフォールバック: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * パフォーマンス統計取得
   */
  getPerformanceStats() {
    return {
      totalQuestions: this.questionHistory.size,
      avgUsagePerTemplate: Array.from(this.questionHistory.values()).reduce((a, b) => a + b, 0) / this.questionHistory.size,
      keywordUsage: Object.fromEntries(this.keywordUsage),
      cacheHitRate: '計算中'
    };
  }

  /**
   * キャッシュクリア
   */
  clearCache() {
    this.questionHistory.clear();
    this.keywordUsage.clear();
    console.log('🧹 Enhanced Deep Dive Engine キャッシュクリア完了');
  }
}

// シングルトンインスタンス
export const enhancedDeepDiveEngine = new EnhancedDeepDiveEngine();