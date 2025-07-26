/**
 * 志願理由書管理サービス
 * OCR処理とAI評価の永続化
 */

import { prisma } from '@/lib/prisma';
import { Essay, User } from '@/generated/prisma';
import { handwritingOCR, HandwritingOCRResult } from '@/lib/handwriting-ocr';
import { meiwaAIService } from '@/lib/meiwa-ai-service';

export interface CreateEssayData {
  userId: string;
  motivation: string;
  research: string;
  schoolLife: string;
  future: string;
  researchTopic: string;
  ocrSourceType?: 'handwritten' | 'typed' | 'voice';
  ocrResult?: HandwritingOCRResult;
}

export interface EssayWithUser extends Essay {
  user: Pick<User, 'studentName' | 'grade' | 'targetSchoolId'>;
}

export interface EssayAnalysis {
  essay: Essay;
  aiEvaluation: any;
  suggestions: string[];
  strengths: string[];
  improvementAreas: string[];
  readabilityScore: number;
  characterDistribution: {
    motivation: number;
    research: number;
    schoolLife: number;
    future: number;
  };
}

export class EssayService {
  /**
   * 志願理由書作成
   */
  async createEssay(data: CreateEssayData): Promise<Essay> {
    const characterCount = 
      data.motivation.length + 
      data.research.length + 
      data.schoolLife.length + 
      data.future.length;

    const essay = await prisma.essay.create({
      data: {
        userId: data.userId,
        motivation: data.motivation,
        research: data.research,
        schoolLife: data.schoolLife,
        future: data.future,
        researchTopic: data.researchTopic,
        characterCount,
        ocrSourceType: data.ocrSourceType,
        ocrConfidence: data.ocrResult?.confidence,
        ocrProcessedAt: data.ocrResult ? new Date() : undefined,
      },
    });

    // AI評価を非同期で実行
    this.evaluateEssayAsync(essay.id);

    console.log(`新規志願理由書作成: ${essay.id} (ユーザー: ${data.userId})`);
    return essay;
  }

  /**
   * 手書き志願理由書からの作成
   */
  async createEssayFromHandwriting(
    userId: string,
    pdfFile: File,
    researchTopic: string
  ): Promise<{ essay: Essay; ocrResult: HandwritingOCRResult }> {
    try {
      // 複数ページOCR処理
      const ocrResult = await handwritingOCR.processMultiplePages(pdfFile);
      
      if (!ocrResult.combinedText || ocrResult.combinedText.trim().length < 50) {
        throw new Error('手書き文字の認識に失敗しました。画像の品質を確認してください。');
      }

      // テキストを4つのセクションに分割（簡易実装）
      const sections = this.parseEssayContent(ocrResult.combinedText);

      const essay = await this.createEssay({
        userId,
        motivation: sections.motivation,
        research: sections.research,
        schoolLife: sections.schoolLife,
        future: sections.future,
        researchTopic,
        ocrSourceType: 'handwritten',
        ocrResult: {
          recognizedText: ocrResult.combinedText,
          confidence: ocrResult.overallConfidence,
          processingTime: ocrResult.totalProcessingTime,
          method: 'gemini-vision',
          preprocessingApplied: ['handwriting_optimization'],
        },
      });

      return { essay, ocrResult };
    } catch (error) {
      console.error('手書き志願理由書処理エラー:', error);
      throw error;
    }
  }

  /**
   * 志願理由書取得
   */
  async getEssay(essayId: string): Promise<EssayWithUser | null> {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      include: {
        user: {
          select: {
            studentName: true,
            grade: true,
            targetSchoolId: true,
          },
        },
      },
    });

    return essay as EssayWithUser | null;
  }

  /**
   * ユーザーの志願理由書一覧取得
   */
  async getUserEssays(userId: string): Promise<Essay[]> {
    return await prisma.essay.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 志願理由書更新
   */
  async updateEssay(
    essayId: string,
    updates: {
      motivation?: string;
      research?: string;
      schoolLife?: string;
      future?: string;
      researchTopic?: string;
    }
  ): Promise<Essay> {
    // 文字数を再計算
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
    });

    if (!essay) {
      throw new Error('志願理由書が見つかりません');
    }

    const updatedContent = {
      motivation: updates.motivation || essay.motivation,
      research: updates.research || essay.research,
      schoolLife: updates.schoolLife || essay.schoolLife,
      future: updates.future || essay.future,
    };

    const characterCount = 
      updatedContent.motivation.length + 
      updatedContent.research.length + 
      updatedContent.schoolLife.length + 
      updatedContent.future.length;

    const updatedEssay = await prisma.essay.update({
      where: { id: essayId },
      data: {
        ...updates,
        characterCount,
        version: essay.version + 1,
      },
    });

    // 更新後に再評価
    this.evaluateEssayAsync(essayId);

    return updatedEssay;
  }

  /**
   * 志願理由書分析
   */
  async analyzeEssay(essayId: string): Promise<EssayAnalysis | null> {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      include: {
        user: {
          include: {
            targetSchool: true,
          },
        },
      },
    });

    if (!essay) {
      return null;
    }

    // AI評価がない場合は実行
    let aiEvaluation = essay.aiEvaluation;
    if (!aiEvaluation) {
      aiEvaluation = await this.performAIEvaluation(essay);
      
      await prisma.essay.update({
        where: { id: essayId },
        data: {
          aiEvaluation: aiEvaluation as any,
          evaluatedAt: new Date(),
        },
      });
    }

    // 文字数分布計算
    const characterDistribution = {
      motivation: essay.motivation.length,
      research: essay.research.length,
      schoolLife: essay.schoolLife.length,
      future: essay.future.length,
    };

    // 読みやすさスコア計算
    const readabilityScore = this.calculateReadabilityScore(essay);

    // 改善提案生成
    const suggestions = this.generateSuggestions(essay, aiEvaluation);
    const strengths = this.identifyStrengths(essay, aiEvaluation);
    const improvementAreas = this.identifyImprovementAreas(essay, aiEvaluation);

    return {
      essay,
      aiEvaluation,
      suggestions,
      strengths,
      improvementAreas,
      readabilityScore,
      characterDistribution,
    };
  }

  /**
   * 志願理由書比較
   */
  async compareEssayVersions(essayId: string): Promise<{
    current: Essay;
    previous?: Essay;
    improvements: string[];
    regressions: string[];
  }> {
    const currentEssay = await prisma.essay.findUnique({
      where: { id: essayId },
    });

    if (!currentEssay) {
      throw new Error('志願理由書が見つかりません');
    }

    // 前のバージョンを取得
    const previousEssay = await prisma.essay.findFirst({
      where: {
        userId: currentEssay.userId,
        researchTopic: currentEssay.researchTopic,
        version: currentEssay.version - 1,
      },
    });

    const improvements: string[] = [];
    const regressions: string[] = [];

    if (previousEssay) {
      // 文字数の変化
      if (currentEssay.characterCount > previousEssay.characterCount) {
        improvements.push('内容がより詳しくなりました');
      } else if (currentEssay.characterCount < previousEssay.characterCount) {
        regressions.push('内容が簡潔になりました');
      }

      // AI評価の比較（実装予定）
      // if (currentEssay.aiEvaluation && previousEssay.aiEvaluation) {
      //   // スコア比較ロジック
      // }
    }

    return {
      current: currentEssay,
      previous: previousEssay || undefined,
      improvements,
      regressions,
    };
  }

  /**
   * プライベートヘルパーメソッド
   */
  private async evaluateEssayAsync(essayId: string): Promise<void> {
    try {
      const essay = await prisma.essay.findUnique({
        where: { id: essayId },
        include: {
          user: {
            include: {
              targetSchool: true,
            },
          },
        },
      });

      if (!essay) {
        return;
      }

      const aiEvaluation = await this.performAIEvaluation(essay);

      await prisma.essay.update({
        where: { id: essayId },
        data: {
          aiEvaluation: aiEvaluation as any,
          evaluatedAt: new Date(),
        },
      });

      console.log(`志願理由書AI評価完了: ${essayId}`);
    } catch (error) {
      console.error(`志願理由書AI評価エラー: ${essayId}`, error);
    }
  }

  private async performAIEvaluation(essay: any): Promise<any> {
    try {
      // 明和中の評価基準を使用
      const evaluation = await meiwaAIService.evaluateEssay(
        essay.researchTopic,
        {
          motivation: essay.motivation,
          research: essay.research,
          schoolLife: essay.schoolLife,
          future: essay.future,
        }
      );

      return evaluation;
    } catch (error) {
      console.error('AI評価エラー:', error);
      
      // フォールバック評価
      return {
        overallScore: 3.0,
        strengths: ['内容が入力されています'],
        improvements: ['AI評価が利用できませんでした'],
        feedback: 'システム評価を実行できませんでした。後で再試行してください。',
      };
    }
  }

  private parseEssayContent(text: string): {
    motivation: string;
    research: string;
    schoolLife: string;
    future: string;
  } {
    // 簡易的なセクション分割（実際の実装ではより高度な解析を行う）
    const sections = text.split(/\n\s*\n/).filter(section => section.trim().length > 0);
    
    return {
      motivation: sections[0] || '',
      research: sections[1] || '',
      schoolLife: sections[2] || '',
      future: sections[3] || '',
    };
  }

  private calculateReadabilityScore(essay: Essay): number {
    const totalText = essay.motivation + essay.research + essay.schoolLife + essay.future;
    const sentences = totalText.split(/[。！？]/).filter(s => s.trim().length > 0);
    const characters = totalText.replace(/[。、！？\s]/g, '').length;
    
    if (sentences.length === 0) return 0;
    
    const avgSentenceLength = characters / sentences.length;
    
    // 適切な文章長（10-25文字）を基準にスコア算出
    let score = 1;
    if (avgSentenceLength < 5) score = 0.6;
    else if (avgSentenceLength > 35) score = 0.7;
    else if (avgSentenceLength >= 10 && avgSentenceLength <= 25) score = 1;
    
    return Math.round(score * 100) / 100;
  }

  private generateSuggestions(essay: Essay, aiEvaluation: any): string[] {
    const suggestions: string[] = [];
    
    // 文字数チェック
    if (essay.characterCount < 400) {
      suggestions.push('もう少し詳しく書いてみましょう（目安：400-600文字）');
    }
    
    // バランスチェック
    const sections = [essay.motivation, essay.research, essay.schoolLife, essay.future];
    const avgLength = essay.characterCount / 4;
    
    sections.forEach((section, index) => {
      const sectionNames = ['志望動機', '探究活動', '学校生活', '将来の目標'];
      if (section.length < avgLength * 0.5) {
        suggestions.push(`${sectionNames[index]}の部分をもう少し詳しく書いてみましょう`);
      }
    });
    
    // AI評価からの提案
    if (aiEvaluation?.improvements) {
      suggestions.push(...aiEvaluation.improvements);
    }
    
    return suggestions;
  }

  private identifyStrengths(essay: Essay, aiEvaluation: any): string[] {
    const strengths: string[] = [];
    
    // 文字数が適切
    if (essay.characterCount >= 400 && essay.characterCount <= 600) {
      strengths.push('適切な文字数で書けています');
    }
    
    // 具体性チェック
    const concreteWords = ['例えば', '実際に', '具体的に', '詳しく', '実験', '観察', '調査'];
    const totalText = essay.motivation + essay.research + essay.schoolLife + essay.future;
    const concreteCount = concreteWords.filter(word => totalText.includes(word)).length;
    
    if (concreteCount >= 2) {
      strengths.push('具体的な体験や例を挙げて説明できています');
    }
    
    // AI評価からの強み
    if (aiEvaluation?.strengths) {
      strengths.push(...aiEvaluation.strengths);
    }
    
    return strengths;
  }

  private identifyImprovementAreas(essay: Essay, aiEvaluation: any): string[] {
    const improvementAreas: string[] = [];
    
    // 短すぎる場合
    if (essay.characterCount < 300) {
      improvementAreas.push('内容の詳細化');
    }
    
    // 長すぎる場合
    if (essay.characterCount > 800) {
      improvementAreas.push('内容の簡潔化');
    }
    
    // AI評価からの改善点
    if (aiEvaluation?.weaknesses) {
      improvementAreas.push(...aiEvaluation.weaknesses);
    }
    
    return improvementAreas;
  }

  /**
   * 志願理由書削除
   */
  async deleteEssay(essayId: string): Promise<void> {
    await prisma.essay.delete({
      where: { id: essayId },
    });
    
    console.log(`志願理由書を削除: ${essayId}`);
  }

  /**
   * 統計情報取得
   */
  async getEssayStatistics(userId: string) {
    const essays = await prisma.essay.findMany({
      where: { userId },
      select: {
        characterCount: true,
        createdAt: true,
        aiEvaluation: true,
        version: true,
      },
    });

    const totalEssays = essays.length;
    const averageCharacterCount = totalEssays > 0
      ? essays.reduce((sum, e) => sum + e.characterCount, 0) / totalEssays
      : 0;

    const versionsData = essays.reduce((acc, essay) => {
      acc[essay.version] = (acc[essay.version] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalEssays,
      averageCharacterCount: Math.round(averageCharacterCount),
      versionsDistribution: versionsData,
      recentEssays: essays
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
    };
  }
}

// シングルトンインスタンス
export const essayService = new EssayService();