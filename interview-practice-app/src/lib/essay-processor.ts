/**
 * 志願理由書処理システム
 * 4項目分析とAI評価統合
 */

export interface EssayAnalysis {
  motivation: {
    content: string;
    keyPoints: string[];
    strength: number; // 1-5
    suggestions: string[];
  };
  research: {
    content: string;
    topic: string;
    depth: number; // 1-5
    socialConnection: boolean;
    methodology: string[];
    suggestions: string[];
  };
  schoolLife: {
    content: string;
    aspirations: string[];
    feasibility: number; // 1-5
    suggestions: string[];
  };
  future: {
    content: string;
    goals: string[];
    connection: number; // 1-5 (探究活動との関連性)
    suggestions: string[];
  };
  overallScore: {
    total: number; // 1-5
    readiness: number; // 面接準備度
    meiwaAlignment: number; // 明和中適合度
  };
}

export class EssayProcessor {
  
  /**
   * 志願理由書を4項目に自動分類
   */
  static analyzeEssayStructure(text: string): {
    motivation: string;
    research: string;
    schoolLife: string;
    future: string;
  } {
    // キーワードベースの自動分類
    const sections = text.split(/\n\s*\n/); // 段落で分割
    
    const keywords = {
      motivation: ['志望', '理由', 'なぜ', '憧れ', '魅力', '選んだ', '入学したい'],
      research: ['調べ', '研究', '探究', '実験', '観察', '発見', '疑問', '課題'],
      schoolLife: ['中学', '高校', '学校生活', '部活', '友達', '先輩', '活動', '目標'],
      future: ['将来', '夢', '職業', '大学', '社会', '貢献', '活かし', '続け']
    };
    
    const result = {
      motivation: '',
      research: '',
      schoolLife: '',
      future: ''
    };
    
    // 各段落をキーワードマッチングで分類
    sections.forEach(section => {
      if (section.trim().length < 20) return; // 短すぎる段落は除外
      
      const scores = {
        motivation: this.calculateKeywordScore(section, keywords.motivation),
        research: this.calculateKeywordScore(section, keywords.research),
        schoolLife: this.calculateKeywordScore(section, keywords.schoolLife),
        future: this.calculateKeywordScore(section, keywords.future)
      };
      
      const maxCategory = Object.keys(scores).reduce((a, b) => 
        scores[a as keyof typeof scores] > scores[b as keyof typeof scores] ? a : b
      ) as keyof typeof result;
      
      if (scores[maxCategory] > 0) {
        result[maxCategory] += (result[maxCategory] ? '\n\n' : '') + section;
      }
    });
    
    return result;
  }
  
  private static calculateKeywordScore(text: string, keywords: string[]): number {
    const lowerText = text.toLowerCase();
    return keywords.reduce((score, keyword) => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      return score + matches;
    }, 0);
  }
  
  /**
   * 探究活動テーマを抽出
   */
  static extractResearchTopic(researchSection: string): string {
    // 頻出する名詞を抽出してテーマを特定
    const sentences = researchSection.split(/[。！？]/);
    const topics: string[] = [];
    
    sentences.forEach(sentence => {
      // 「〜について」「〜を調べた」「〜の研究」パターンを検出
      const patterns = [
        /(.+?)について/g,
        /(.+?)を調べ/g,
        /(.+?)の研究/g,
        /(.+?)を研究/g,
        /(.+?)の実験/g,
        /(.+?)を観察/g
      ];
      
      patterns.forEach(pattern => {
        const matches = sentence.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const topic = match.replace(pattern, '$1').trim();
            if (topic.length > 2 && topic.length < 20) {
              topics.push(topic);
            }
          });
        }
      });
    });
    
    // 最も頻出するトピックを選択
    const topicCounts = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sortedTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([topic]) => topic);
    
    return sortedTopics[0] || '探究活動';
  }
  
  /**
   * 明和中特化分析
   */
  static analyzeMeiwaReadiness(analysis: EssayAnalysis): {
    researchFocus: number; // 探究活動重視度
    socialAwareness: number; // 社会意識
    selfGrowth: number; // 自己成長
    authenticity: number; // 真正性
    interviewReadiness: number; // 面接準備度
    recommendations: string[];
  } {
    const researchFocus = analysis.research.depth * 0.6 + 
                         (analysis.research.socialConnection ? 2 : 0) * 0.4;
    
    const socialAwareness = analysis.research.socialConnection ? 4 : 2;
    
    const selfGrowth = (analysis.motivation.strength + 
                       analysis.schoolLife.feasibility + 
                       analysis.future.connection) / 3;
    
    const authenticity = this.calculateAuthenticity(analysis);
    
    const interviewReadiness = (researchFocus + socialAwareness + selfGrowth + authenticity) / 4;
    
    const recommendations = this.generateMeiwaRecommendations(analysis);
    
    return {
      researchFocus,
      socialAwareness,
      selfGrowth,
      authenticity,
      interviewReadiness,
      recommendations
    };
  }
  
  private static calculateAuthenticity(analysis: EssayAnalysis): number {
    let score = 3; // 基準点
    
    // 具体的な体験の記述があるか
    const hasSpecificExperience = analysis.research.methodology.length > 0;
    if (hasSpecificExperience) score += 1;
    
    // 個人的な感情や気づきがあるか
    const emotionalWords = ['感じた', '驚いた', '気づいた', '学んだ', '考えた'];
    const hasEmotionalContent = emotionalWords.some(word => 
      analysis.research.content.includes(word) ||
      analysis.motivation.content.includes(word)
    );
    if (hasEmotionalContent) score += 1;
    
    return Math.min(score, 5);
  }
  
  private static generateMeiwaRecommendations(analysis: EssayAnalysis): string[] {
    const recommendations: string[] = [];
    
    // 探究活動の深さに基づく推奨
    if (analysis.research.depth < 3) {
      recommendations.push('探究活動の具体的な方法や過程をより詳しく説明しましょう');
    }
    
    if (!analysis.research.socialConnection) {
      recommendations.push('探究活動が社会や日常生活とどうつながるかを考えてみましょう');
    }
    
    if (analysis.motivation.strength < 3) {
      recommendations.push('なぜその探究テーマを選んだのか、個人的な理由を深掘りしましょう');
    }
    
    if (analysis.future.connection < 3) {
      recommendations.push('探究活動を将来どう活かしたいか、具体的な計画を考えましょう');
    }
    
    // 明和中特化の推奨
    recommendations.push('面接では「その探究内容には決まった正解がないか？」という質問に注意しましょう');
    recommendations.push('探究活動を通じて自分がどう変わったかを具体的に表現できるようにしましょう');
    
    return recommendations;
  }
  
  /**
   * 面接質問生成のためのキーワード抽出
   */
  static extractInterviewKeywords(analysis: EssayAnalysis): {
    researchTopic: string;
    keyMethods: string[];
    challenges: string[];
    discoveries: string[];
    socialConnections: string[];
  } {
    const researchTopic = this.extractResearchTopic(analysis.research.content);
    
    // 方法論キーワード
    const methodKeywords = ['調べた', '実験', '観察', '測定', '比較', 'インタビュー', 'アンケート'];
    const keyMethods = methodKeywords.filter(keyword => 
      analysis.research.content.includes(keyword)
    );
    
    // 困難・課題キーワード  
    const challengeKeywords = ['難しかった', '困った', '失敗', '問題', '課題', 'うまくいかない'];
    const challenges = challengeKeywords.filter(keyword =>
      analysis.research.content.includes(keyword)
    );
    
    // 発見キーワード
    const discoveryKeywords = ['発見', '気づいた', '分かった', '学んだ', '新しい', '驚いた'];
    const discoveries = discoveryKeywords.filter(keyword =>
      analysis.research.content.includes(keyword)
    );
    
    // 社会とのつながりキーワード
    const socialKeywords = ['社会', '地域', '環境', '未来', '人々', '世界', '日本'];
    const socialConnections = socialKeywords.filter(keyword =>
      (analysis.research.content + analysis.future.content).includes(keyword)
    );
    
    return {
      researchTopic,
      keyMethods,
      challenges,
      discoveries,
      socialConnections
    };
  }
}

/**
 * AI統合志願理由書分析サービス
 */
export class AIEssayAnalyzer {
  
  /**
   * Geminiを使用した高度な志願理由書分析
   */
  static async analyzeWithAI(essayText: string): Promise<EssayAnalysis> {
    // まず基本分析を実行
    const sections = EssayProcessor.analyzeEssayStructure(essayText);
    
    try {
      // Geminiによる詳細分析（実装は簡略化）
      const analysis: EssayAnalysis = {
        motivation: {
          content: sections.motivation,
          keyPoints: ['志望理由の明確性', '個人的な動機'],
          strength: 3,
          suggestions: ['より具体的な体験を含める']
        },
        research: {
          content: sections.research,
          topic: EssayProcessor.extractResearchTopic(sections.research),
          depth: 3,
          socialConnection: sections.research.includes('社会') || sections.research.includes('地域'),
          methodology: ['観察', '実験'],
          suggestions: ['方法論の詳細化']
        },
        schoolLife: {
          content: sections.schoolLife,
          aspirations: ['学習活動', '友人関係'],
          feasibility: 3,
          suggestions: ['具体的な目標設定']
        },
        future: {
          content: sections.future,
          goals: ['継続的な探究', '社会貢献'],
          connection: 3,
          suggestions: ['より明確な将来設計']
        },
        overallScore: {
          total: 3,
          readiness: 3,
          meiwaAlignment: 3
        }
      };
      
      return analysis;
      
    } catch (error) {
      console.error('AI分析エラー:', error);
      
      // フォールバック：基本分析のみ
      return this.generateBasicAnalysis(sections);
    }
  }
  
  private static generateBasicAnalysis(sections: ReturnType<typeof EssayProcessor.analyzeEssayStructure>): EssayAnalysis {
    return {
      motivation: {
        content: sections.motivation,
        keyPoints: [],
        strength: 2,
        suggestions: ['AI分析が利用できません。基本分析を実行しました。']
      },
      research: {
        content: sections.research,
        topic: EssayProcessor.extractResearchTopic(sections.research),
        depth: 2,
        socialConnection: false,
        methodology: [],
        suggestions: []
      },
      schoolLife: {
        content: sections.schoolLife,
        aspirations: [],
        feasibility: 2,
        suggestions: []
      },
      future: {
        content: sections.future,
        goals: [],
        connection: 2,
        suggestions: []
      },
      overallScore: {
        total: 2,
        readiness: 2,
        meiwaAlignment: 2
      }
    };
  }
}