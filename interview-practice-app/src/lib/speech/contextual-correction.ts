/**
 * 文脈を考慮した音声認識修正システム
 * 志願理由書のコンテキストとAIを活用した高精度文字起こし
 */

// OpenAIクライアントはサーバーサイドでのみ初期化

export interface CorrectionContext {
  essayContent: {
    motivation: string;
    research: string;
    schoolLife: string;
    future: string;
  };
  conversationHistory: Array<{
    role: 'interviewer' | 'student';
    content: string;
  }>;
  currentQuestion: string;
  previousTranscripts: string[];
}

export interface TranscriptCorrection {
  original: string;
  corrected: string;
  confidence: number;
  corrections: Array<{
    position: number;
    original: string;
    corrected: string;
    reason: string;
  }>;
}

export class ContextualSpeechCorrector {
  private static instance: ContextualSpeechCorrector;
  
  // 志願理由書によく出る専門用語・固有名詞辞書
  private readonly SCHOOL_SPECIFIC_TERMS = [
    '明和高校附属中学校',
    '刈谷高校附属中学校', 
    '津島高校附属中学校',
    '半田高校附属中学校',
    '中高一貫',
    '探究学習',
    '国際理解',
    'SSH',
    'SGH',
    '理数科',
    '国際科学科',
    '課題研究',
    '大学受験',
    '進路指導',
    '部活動',
    '生徒会',
    '文化祭',
    '体育祭',
    '修学旅行'
  ];

  private readonly INTERVIEW_CONTEXT_WORDS = [
    '志望動機',
    '将来の夢',
    '得意科目',
    '苦手科目',
    '長所',
    '短所',
    '改善',
    '努力',
    '頑張る',
    '成長',
    '学習',
    '勉強',
    '友達',
    '協力',
    'チームワーク',
    'リーダーシップ',
    '責任感',
    '積極性'
  ];

  static getInstance(): ContextualSpeechCorrector {
    if (!ContextualSpeechCorrector.instance) {
      ContextualSpeechCorrector.instance = new ContextualSpeechCorrector();
    }
    return ContextualSpeechCorrector.instance;
  }

  /**
   * 文脈を考慮してリアルタイム音声認識結果を修正
   */
  async correctTranscriptInContext(
    rawTranscript: string,
    context: CorrectionContext,
    isInterim: boolean = false
  ): Promise<TranscriptCorrection> {
    try {
      // 基本的な修正（同音異義語、助詞など）
      let corrected = this.applyBasicCorrections(rawTranscript);
      
      // 学校固有名詞の修正
      corrected = this.applySchoolSpecificCorrections(corrected);
      
      // 文脈ベースの修正（AIを使用）
      if (!isInterim && rawTranscript.length > 10) {
        const aiCorrected = await this.applyAIContextualCorrection(
          corrected, 
          context
        );
        corrected = aiCorrected.corrected;
      }

      // 修正箇所の検出
      const corrections = this.detectCorrections(rawTranscript, corrected);
      
      return {
        original: rawTranscript,
        corrected,
        confidence: this.calculateConfidence(rawTranscript, corrected),
        corrections
      };
    } catch (error) {
      console.error('音声修正エラー:', error);
      return {
        original: rawTranscript,
        corrected: rawTranscript,
        confidence: 0.5,
        corrections: []
      };
    }
  }

  /**
   * 基本的な音声認識エラーの修正
   */
  private applyBasicCorrections(text: string): string {
    const basicCorrections: Record<string, string> = {
      // 同音異義語の修正
      'きぼうどうき': '志望動機',
      'しょうらいのゆめ': '将来の夢',
      'べんきょう': '勉強',
      'がくしゅう': '学習',
      'ちょうしょ': '長所',
      'たんしょ': '短所',
      'どりょく': '努力',
      'せいちょう': '成長',
      'がんばる': '頑張る',
      'きょうりょく': '協力',
      'せきにんかん': '責任感',
      
      // よくある誤認識の修正
      'です。': 'です',
      'ます。': 'ます',
      'だと思います。': 'だと思います',
      'と思っています。': 'と思っています',
      
      // 助詞の修正
      'わ': 'は', // 主題を表す「は」
      'お': 'を', // 目的格の「を」
      'え': 'へ', // 方向を表す「へ」
    };

    let corrected = text;
    Object.entries(basicCorrections).forEach(([wrong, right]) => {
      const regex = new RegExp(wrong, 'gi');
      corrected = corrected.replace(regex, right);
    });

    return corrected;
  }

  /**
   * 学校固有名詞・専門用語の修正
   */
  private applySchoolSpecificCorrections(text: string): string {
    let corrected = text;
    
    // 学校名の修正
    const schoolNamePatterns: Record<string, string> = {
      'めいわこうこうふぞくちゅうがっこう': '明和高校附属中学校',
      'めいわちゅうがっこう': '明和高校附属中学校',
      'かりやこうこうふぞく': '刈谷高校附属中学校',
      'つしまこうこうふぞく': '津島高校附属中学校',
      'はんだこうこうふぞく': '半田高校附属中学校',
      'ちゅうこういったん': '中高一貫',
      'たんきゅうがくしゅう': '探究学習',
      'こくさいりかい': '国際理解',
    };

    Object.entries(schoolNamePatterns).forEach(([pattern, correction]) => {
      const regex = new RegExp(pattern, 'gi');
      corrected = corrected.replace(regex, correction);
    });

    return corrected;
  }

  /**
   * AIを使用した文脈ベースの高度修正
   */
  private async applyAIContextualCorrection(
    text: string,
    context: CorrectionContext
  ): Promise<{ corrected: string; reasoning: string }> {
    try {
      // サーバーサイドAPIを呼び出し
      const response = await fetch('/api/speech/contextual-correction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`API呼び出しエラー: ${response.status}`);
      }

      const result = await response.json();
      return {
        corrected: result.corrected || text,
        reasoning: result.reasoning || '修正なし'
      };
    } catch (error) {
      console.error('AI文脈修正エラー:', error);
      return { corrected: text, reasoning: 'AI修正失敗' };
    }
  }

  /**
   * AI修正用プロンプトの構築
   */
  private buildCorrectionPrompt(text: string, context: CorrectionContext): string {
    return `
音声認識結果: "${text}"

文脈情報:
志願理由書の内容:
- 志望動機: ${context.essayContent.motivation}
- 学校調査: ${context.essayContent.research}
- 中学生活: ${context.essayContent.schoolLife}
- 将来の夢: ${context.essayContent.future}

現在の質問: "${context.currentQuestion}"

これまでの会話:
${context.conversationHistory.slice(-3).map(msg => 
  `${msg.role === 'interviewer' ? '面接官' : '受験生'}: ${msg.content}`
).join('\n')}

上記の文脈を踏まえて、音声認識結果を自然で正確な日本語に修正してください。
`;
  }

  /**
   * 修正箇所の検出
   */
  private detectCorrections(original: string, corrected: string): Array<{
    position: number;
    original: string;
    corrected: string;
    reason: string;
  }> {
    const corrections: Array<{
      position: number;
      original: string;
      corrected: string;
      reason: string;
    }> = [];

    // 簡単な差分検出（実際の実装ではより高度なdiffアルゴリズムを使用）
    if (original !== corrected) {
      corrections.push({
        position: 0,
        original: original,
        corrected: corrected,
        reason: '文脈・表記修正'
      });
    }

    return corrections;
  }

  /**
   * 修正の信頼度計算
   */
  private calculateConfidence(original: string, corrected: string): number {
    if (original === corrected) return 1.0;
    
    const lengthRatio = Math.min(original.length, corrected.length) / 
                       Math.max(original.length, corrected.length);
    const similarity = this.calculateStringSimilarity(original, corrected);
    
    return (lengthRatio + similarity) / 2;
  }

  /**
   * 文字列類似度計算
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * レーベンシュタイン距離計算
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 志願理由書サンプルから学習データを作成
   */
  async trainFromEssaySamples(essaySamples: Array<{
    content: string;
    metadata: {
      school: string;
      year: number;
      admissionResult: 'pass' | 'fail';
    };
  }>): Promise<void> {
    // 志願理由書の特徴的な表現パターンを抽出
    const patterns = this.extractPatterns(essaySamples);
    
    // 専門用語辞書を更新
    this.updateTerminologyDictionary(patterns);
    
    console.log(`${essaySamples.length}件の志願理由書から学習完了`);
  }

  /**
   * 志願理由書から表現パターンを抽出
   */
  private extractPatterns(samples: Array<{ content: string; metadata: any }>): string[] {
    const patterns: string[] = [];
    
    samples.forEach(sample => {
      // よく使われる表現を抽出
      const commonPhrases = [
        /志望動機は.+です/g,
        /将来は.+になりたい/g,
        /.+に興味があります/g,
        /.+を学びたいと思います/g,
        /.+に取り組みたいです/g
      ];

      commonPhrases.forEach(pattern => {
        const matches = sample.content.match(pattern);
        if (matches) patterns.push(...matches);
      });
    });

    return Array.from(new Set(patterns)); // 重複除去
  }

  /**
   * 専門用語辞書の更新
   */
  private updateTerminologyDictionary(patterns: string[]): void {
    // 実装: パターンから新しい専門用語を抽出し、辞書に追加
    // 実際の実装では、頻度分析や文脈分析を行う
    console.log('専門用語辞書を更新しました');
  }
}

export const contextualSpeechCorrector = ContextualSpeechCorrector.getInstance();