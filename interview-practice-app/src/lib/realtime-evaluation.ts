/**
 * リアルタイム評価システム
 * 面接中の発言をリアルタイムで分析し、即座にフィードバックを提供
 */

import { multiAI } from './ai-clients';
import { MeiwaResearchEvaluation } from '@/types/meiwa-evaluation';

export interface RealtimeAnalysis {
  confidence: number;
  completeness: number;
  clarity: number;
  engagement: number;
  suggestions: string[];
  strengths: string[];
  warnings: string[];
}

export interface RealtimeFeedback {
  type: 'positive' | 'neutral' | 'warning' | 'critical';
  message: string;
  category: 'content' | 'delivery' | 'structure' | 'engagement';
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
}

export class RealtimeEvaluationEngine {
  private analysisHistory: RealtimeAnalysis[] = [];
  private feedbackBuffer: RealtimeFeedback[] = [];
  private lastAnalysisTime = 0;
  private readonly minAnalysisInterval = 3000; // 3秒間隔

  /**
   * 発言をリアルタイムで分析
   */
  async analyzeResponse(
    transcript: string,
    interimTranscript: string,
    questionContext: string,
    researchTopic: string
  ): Promise<RealtimeAnalysis> {
    const now = Date.now();
    
    // レート制限チェック
    if (now - this.lastAnalysisTime < this.minAnalysisInterval) {
      return this.getLastAnalysis();
    }

    const fullText = transcript + interimTranscript;
    if (fullText.length < 10) {
      return this.createEmptyAnalysis();
    }

    try {
      this.lastAnalysisTime = now;

      // 基本的な分析指標計算
      const basicMetrics = this.calculateBasicMetrics(fullText);
      
      // AI分析実行（並列処理）
      const [contentAnalysis, deliveryAnalysis] = await Promise.allSettled([
        this.analyzeContent(fullText, questionContext, researchTopic),
        this.analyzeDelivery(fullText, interimTranscript)
      ]);

      const content = contentAnalysis.status === 'fulfilled' ? contentAnalysis.value : null;
      const delivery = deliveryAnalysis.status === 'fulfilled' ? deliveryAnalysis.value : null;

      const analysis: RealtimeAnalysis = {
        confidence: this.calculateConfidence(basicMetrics, content, delivery),
        completeness: this.calculateCompleteness(fullText, questionContext),
        clarity: this.calculateClarity(fullText, basicMetrics),
        engagement: this.calculateEngagement(fullText, content),
        suggestions: this.generateSuggestions(basicMetrics, content, delivery),
        strengths: this.identifyStrengths(basicMetrics, content, delivery),
        warnings: this.identifyWarnings(basicMetrics, content, delivery)
      };

      this.analysisHistory.push(analysis);
      this.generateRealtimeFeedback(analysis, fullText);

      return analysis;

    } catch (error) {
      console.error('Realtime analysis error:', error);
      return this.createErrorAnalysis();
    }
  }

  /**
   * 基本的な分析指標を計算
   */
  private calculateBasicMetrics(text: string) {
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    const words = text.replace(/[。、！？\s]/g, '').length;
    const avgSentenceLength = sentences.length > 0 ? words / sentences.length : 0;
    
    // 感情表現の検出
    const emotionalWords = ['嬉しい', '楽しい', '面白い', '驚いた', '感動', '興味深い', 'わくわく'];
    const emotionCount = emotionalWords.reduce((count, word) => 
      count + (text.includes(word) ? 1 : 0), 0);
    
    // 具体性の検出
    const specificWords = ['例えば', '実際に', '具体的に', '詳しく', '実験', '観察', '調査'];
    const specificityCount = specificWords.reduce((count, word) => 
      count + (text.includes(word) ? 1 : 0), 0);
    
    // つなぎ言葉の検出
    const fillerWords = ['えーと', 'あの', 'その', 'まあ', 'なんか'];
    const fillerCount = fillerWords.reduce((count, word) => 
      count + (text.split(word).length - 1), 0);

    return {
      length: text.length,
      sentenceCount: sentences.length,
      avgSentenceLength,
      emotionScore: emotionCount / Math.max(sentences.length, 1),
      specificityScore: specificityCount / Math.max(sentences.length, 1),
      fillerRatio: fillerCount / Math.max(words, 1),
      readabilityScore: this.calculateReadability(text)
    };
  }

  /**
   * 読みやすさスコア計算
   */
  private calculateReadability(text: string): number {
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    const words = text.replace(/[。、！？\s]/g, '').length;
    
    if (sentences.length === 0) return 0;
    
    const avgSentenceLength = words / sentences.length;
    
    // 適切な文章長 (10-25文字) を基準にスコア算出
    let score = 1;
    if (avgSentenceLength < 5) score = 0.6; // 短すぎる
    else if (avgSentenceLength > 35) score = 0.7; // 長すぎる
    else if (avgSentenceLength >= 10 && avgSentenceLength <= 25) score = 1; // 適切
    
    return score;
  }

  /**
   * 内容分析（AI使用）
   */
  private async analyzeContent(text: string, question: string, researchTopic: string) {
    const prompt = `以下の面接回答を分析してください。

【質問】${question}
【探究テーマ】${researchTopic}
【回答】${text}

以下の観点で評価し、JSON形式で回答してください：
{
  "relevance": 0-1の数値（質問への関連性）,
  "depth": 0-1の数値（内容の深さ）,
  "authenticity": 0-1の数値（真正性・オリジナリティ）,
  "keyPoints": ["重要なポイント1", "重要なポイント2"],
  "missingElements": ["不足している要素1", "不足している要素2"]
}`;

    try {
      const response = await multiAI.generateWithFallback(prompt, '', 'gemini', {
        operation: 'evaluation'
      });

      return JSON.parse(response.content);
    } catch (error) {
      console.error('Content analysis error:', error);
      return null;
    }
  }

  /**
   * 発話分析
   */
  private async analyzeDelivery(finalText: string, interimText: string) {
    // 流暢性の評価
    const totalLength = finalText.length + interimText.length;
    const pauseIndicators = ['...', '、、', 'えーと', 'あの'];
    const pauseCount = pauseIndicators.reduce((count, indicator) => 
      count + (finalText.split(indicator).length - 1), 0);
    
    const fluency = Math.max(0, 1 - (pauseCount / Math.max(totalLength / 50, 1)));
    
    // 一貫性の評価
    const consistency = interimText.length > 0 ? 
      Math.min(1, finalText.length / (finalText.length + interimText.length)) : 1;

    return {
      fluency,
      consistency,
      pace: this.calculateSpeechPace(finalText),
      confidence: fluency * consistency
    };
  }

  /**
   * 発話ペース計算
   */
  private calculateSpeechPace(text: string): number {
    // 文字数ベースでペース評価（仮実装）
    const wordsPerMinute = text.length * 2; // 推定値
    if (wordsPerMinute < 100) return 0.6; // 遅い
    if (wordsPerMinute > 200) return 0.7; // 速い
    return 1; // 適切
  }

  /**
   * 信頼度計算
   */
  private calculateConfidence(metrics: any, content: any, delivery: any): number {
    let score = 0.5;
    
    // 基本指標の影響
    score += metrics.emotionScore * 0.1;
    score += metrics.specificityScore * 0.15;
    score -= metrics.fillerRatio * 0.2;
    score += metrics.readabilityScore * 0.1;
    
    // AI分析結果の影響
    if (content) {
      score += content.relevance * 0.2;
      score += content.depth * 0.15;
      score += content.authenticity * 0.1;
    }
    
    if (delivery) {
      score += delivery.confidence * 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 完成度計算
   */
  private calculateCompleteness(text: string, question: string): number {
    const expectedLength = 100; // 期待される最小文字数
    const lengthScore = Math.min(1, text.length / expectedLength);
    
    // 質問キーワードへの言及
    const questionWords = question.split(/\s+/).filter(w => w.length > 2);
    const mentionScore = questionWords.length > 0 ? 
      questionWords.filter(word => text.includes(word)).length / questionWords.length : 1;
    
    return (lengthScore * 0.6) + (mentionScore * 0.4);
  }

  /**
   * 明確性計算
   */
  private calculateClarity(text: string, metrics: any): number {
    return (metrics.readabilityScore * 0.5) + 
           (Math.min(1, metrics.specificityScore * 2) * 0.3) + 
           (Math.max(0, 1 - metrics.fillerRatio * 3) * 0.2);
  }

  /**
   * エンゲージメント計算
   */
  private calculateEngagement(text: string, content: any): number {
    const baseEngagement = content ? content.authenticity : 0.5;
    
    // 感情表現の検出
    const emotionalMarkers = ['！', '。', '感じ', '思い', '考え'];
    const emotionScore = emotionalMarkers.reduce((score, marker) => 
      score + (text.includes(marker) ? 0.1 : 0), 0);
    
    return Math.min(1, baseEngagement + emotionScore);
  }

  /**
   * 提案生成
   */
  private generateSuggestions(metrics: any, content: any, delivery: any): string[] {
    const suggestions: string[] = [];
    
    if (metrics.fillerRatio > 0.1) {
      suggestions.push('「えーと」「あの」などの言葉を減らしてみましょう');
    }
    
    if (metrics.specificityScore < 0.3) {
      suggestions.push('もう少し具体的な例を挙げてみてください');
    }
    
    if (metrics.emotionScore < 0.2) {
      suggestions.push('あなたの気持ちや感想を加えてください');
    }
    
    if (content && content.depth < 0.5) {
      suggestions.push('経験をより詳しく説明してみてください');
    }
    
    if (delivery && delivery.fluency < 0.6) {
      suggestions.push('少しゆっくり話してみましょう');
    }
    
    return suggestions;
  }

  /**
   * 強み特定
   */
  private identifyStrengths(metrics: any, content: any, delivery: any): string[] {
    const strengths: string[] = [];
    
    if (metrics.emotionScore > 0.4) {
      strengths.push('感情豊かに表現できています');
    }
    
    if (metrics.specificityScore > 0.5) {
      strengths.push('具体的で分かりやすい説明です');
    }
    
    if (metrics.readabilityScore > 0.8) {
      strengths.push('聞きやすい文章構成です');
    }
    
    if (content && content.authenticity > 0.7) {
      strengths.push('オリジナリティのある内容です');
    }
    
    if (delivery && delivery.confidence > 0.8) {
      strengths.push('自信を持って話せています');
    }
    
    return strengths;
  }

  /**
   * 警告特定
   */
  private identifyWarnings(metrics: any, content: any, delivery: any): string[] {
    const warnings: string[] = [];
    
    if (metrics.length < 50) {
      warnings.push('回答が短すぎます');
    }
    
    if (metrics.fillerRatio > 0.2) {
      warnings.push('つなぎ言葉が多すぎます');
    }
    
    if (content && content.relevance < 0.3) {
      warnings.push('質問に対する回答がずれています');
    }
    
    if (delivery && delivery.fluency < 0.4) {
      warnings.push('話すペースが不安定です');
    }
    
    return warnings;
  }

  /**
   * リアルタイムフィードバック生成
   */
  private generateRealtimeFeedback(analysis: RealtimeAnalysis, text: string) {
    const feedback: RealtimeFeedback[] = [];
    
    // ポジティブフィードバック
    if (analysis.confidence > 0.8) {
      feedback.push({
        type: 'positive',
        message: '素晴らしい回答です！',
        category: 'engagement',
        priority: 'medium',
        timestamp: Date.now()
      });
    }
    
    // 改善提案
    if (analysis.clarity < 0.5) {
      feedback.push({
        type: 'warning',
        message: 'もう少しはっきりと話してみましょう',
        category: 'delivery',
        priority: 'high',
        timestamp: Date.now()
      });
    }
    
    // 内容に関する助言
    if (analysis.completeness < 0.6) {
      feedback.push({
        type: 'neutral',
        message: 'もう少し詳しく説明してください',
        category: 'content',
        priority: 'medium',
        timestamp: Date.now()
      });
    }
    
    this.feedbackBuffer.push(...feedback);
  }

  /**
   * フィードバック取得
   */
  getRealtimeFeedback(): RealtimeFeedback[] {
    const feedback = [...this.feedbackBuffer];
    this.feedbackBuffer = [];
    return feedback;
  }

  /**
   * 最新の分析結果取得
   */
  private getLastAnalysis(): RealtimeAnalysis {
    return this.analysisHistory.length > 0 
      ? this.analysisHistory[this.analysisHistory.length - 1]
      : this.createEmptyAnalysis();
  }

  /**
   * 空の分析結果作成
   */
  private createEmptyAnalysis(): RealtimeAnalysis {
    return {
      confidence: 0,
      completeness: 0,
      clarity: 0,
      engagement: 0,
      suggestions: [],
      strengths: [],
      warnings: []
    };
  }

  /**
   * エラー時の分析結果作成
   */
  private createErrorAnalysis(): RealtimeAnalysis {
    return {
      confidence: 0.5,
      completeness: 0.5,
      clarity: 0.5,
      engagement: 0.5,
      suggestions: ['分析中にエラーが発生しました'],
      strengths: [],
      warnings: ['システムエラー']
    };
  }

  /**
   * 分析履歴クリア
   */
  clearHistory() {
    this.analysisHistory = [];
    this.feedbackBuffer = [];
  }
}

// シングルトンインスタンス
export const realtimeEvaluator = new RealtimeEvaluationEngine();