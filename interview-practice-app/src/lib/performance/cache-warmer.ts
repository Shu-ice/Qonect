/**
 * 🔥 Cache Warmer - インテリジェントキャッシュ予熱システム
 * 小学6年生の面接パターンを学習し、必要なデータを先読みキャッシュ
 */

import { responseOptimizer } from './response-optimizer';
import { concurrentProcessor } from './concurrent-processor';

interface CachePattern {
  stage: string;
  commonAnswers: string[];
  followUpQuestions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: number;
}

interface WarmupTask {
  key: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  generator: () => Promise<any>;
  prediction: number; // 使用予測確率 (0-1)
}

export class CacheWarmer {
  private static instance: CacheWarmer;
  private patterns: Map<string, CachePattern> = new Map();
  private warmupHistory: Set<string> = new Set();
  private isWarming: boolean = false;
  
  // 学習データ（実際の小学6年生の面接パターン）
  private readonly LEARNING_PATTERNS: CachePattern[] = [
    {
      stage: 'opening',
      commonAnswers: [
        '電車で来ました',
        '車で来ました', 
        '歩いて来ました',
        '自転車で来ました',
        'お母さんと来ました',
        '30分くらいかかりました'
      ],
      followUpQuestions: [
        'どれくらい時間がかかりましたか？',
        '一人で来られたのですね',
        '電車は混んでいましたか？',
        '道は分かりやすかったですか？'
      ],
      difficulty: 'easy',
      frequency: 0.95
    },
    {
      stage: 'exploration',
      commonAnswers: [
        '環境委員会でメダカを飼っています',
        '図書委員会で本の整理をしています',
        'プログラミングクラブに入っています',
        '合唱クラブで歌っています',
        '理科の実験が好きです',
        '野菜を育てています'
      ],
      followUpQuestions: [
        'どんなことが大変でしたか？',
        '失敗したことはありますか？',
        'どうやって調べましたか？',
        '誰かに教わりましたか？',
        '何がきっかけで始めましたか？'
      ],
      difficulty: 'medium',
      frequency: 0.85
    },
    {
      stage: 'metacognition',
      commonAnswers: [
        '継続することが大切だと思いました',
        '失敗から学ぶことが多いです',
        '協力することの大切さを知りました',
        '計画的に進めることが重要です',
        '観察することで新しい発見がありました'
      ],
      followUpQuestions: [
        'どのような学び方が合っていますか？',
        '他の活動にも活かせますか？',
        'この経験をどう感じますか？',
        '似ている経験はありますか？'
      ],
      difficulty: 'hard',
      frequency: 0.7
    },
    {
      stage: 'future',
      commonAnswers: [
        'もっと詳しく調べたいです',
        '今度は別のことも挑戦したいです',
        '中学校でも続けたいです',
        '友達にも教えたいです',
        '将来の職業に活かしたいです'
      ],
      followUpQuestions: [
        'なぜそう思うのですか？',
        'どんなことを調べたいですか？',
        '中学校でどう活かしますか？',
        '将来の夢はありますか？'
      ],
      difficulty: 'medium',
      frequency: 0.8
    }
  ];

  private constructor() {
    this.initializeLearningPatterns();
  }

  static getInstance(): CacheWarmer {
    if (!CacheWarmer.instance) {
      CacheWarmer.instance = new CacheWarmer();
    }
    return CacheWarmer.instance;
  }

  /**
   * 学習パターン初期化
   */
  private initializeLearningPatterns(): void {
    this.LEARNING_PATTERNS.forEach(pattern => {
      this.patterns.set(pattern.stage, pattern);
    });
    
    console.log('🧠 Cache Warmer 学習パターン初期化完了');
  }

  /**
   * インテリジェント予熱開始
   */
  async startIntelligentWarmup(currentStage: string = 'opening'): Promise<void> {
    if (this.isWarming) {
      console.log('⚠️ 既にキャッシュ予熱実行中');
      return;
    }

    this.isWarming = true;
    console.log('🔥 インテリジェントキャッシュ予熱開始');

    try {
      const warmupTasks = this.generateWarmupTasks(currentStage);
      
      // 優先度別にタスクを並行実行
      const criticalTasks = warmupTasks.filter(task => task.priority === 'critical');
      const highTasks = warmupTasks.filter(task => task.priority === 'high');
      const mediumTasks = warmupTasks.filter(task => task.priority === 'medium');

      // クリティカルタスクを最優先実行
      if (criticalTasks.length > 0) {
        await this.executeConcurrentWarmup(criticalTasks, 'critical');
      }

      // 高優先度タスクを並行実行
      if (highTasks.length > 0) {
        concurrentProcessor.processBatch(
          highTasks.map(task => ({
            id: `warmup_${task.key}`,
            name: `Cache Warmup: ${task.key}`,
            executor: task.generator,
            priority: 'high'
          }))
        );
      }

      // 中優先度タスクをバックグラウンド実行
      if (mediumTasks.length > 0) {
        this.executeBackgroundWarmup(mediumTasks);
      }

      console.log(`🔥 予熱タスク生成完了: ${warmupTasks.length}件`);
      
    } catch (error) {
      console.error('❌ キャッシュ予熱エラー:', error);
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * 段階別予熱タスク生成
   */
  private generateWarmupTasks(currentStage: string): WarmupTask[] {
    const tasks: WarmupTask[] = [];
    const pattern = this.patterns.get(currentStage);
    
    if (!pattern) return tasks;

    // 現在段階の共通回答パターンをキャッシュ
    pattern.commonAnswers.forEach((answer, index) => {
      pattern.followUpQuestions.forEach(question => {
        const key = `reflection_${currentStage}_${index + 1}_${answer.substring(0, 20)}`;
        
        if (!this.warmupHistory.has(key)) {
          tasks.push({
            key,
            priority: this.determinePriority(pattern.frequency, index),
            prediction: this.calculatePrediction(pattern.frequency, index),
            generator: async () => {
              // 質問生成のシミュレーション
              return {
                question: question,
                needsFollowUp: true,
                followUpType: 'good'
              };
            }
          });
          
          this.warmupHistory.add(key);
        }
      });
    });

    // 次の段階の予測キャッシュ
    const nextStage = this.getNextStage(currentStage);
    if (nextStage) {
      const nextPattern = this.patterns.get(nextStage);
      if (nextPattern) {
        nextPattern.commonAnswers.slice(0, 3).forEach((answer, index) => {
          const key = `reflection_${nextStage}_1_${answer.substring(0, 20)}`;
          
          tasks.push({
            key,
            priority: 'medium',
            prediction: nextPattern.frequency * 0.6, // 60%の確率で次段階に進む
            generator: async () => {
              return {
                question: nextPattern.followUpQuestions[0],
                needsFollowUp: true,
                followUpType: 'good'
              };
            }
          });
        });
      }
    }

    // 不適切回答検出の予熱
    const inappropriateAnswers = [
      '吾輩は猫である',
      'あああ',
      'テスト',
      'ふざけてます'
    ];
    
    inappropriateAnswers.forEach(answer => {
      const key = `inappropriate_check_${answer}`;
      tasks.push({
        key,
        priority: 'critical',
        prediction: 0.1, // 10%の確率で不適切回答
        generator: async () => {
          return {
            isInappropriate: true,
            reason: 'キャッシュ予熱データ'
          };
        }
      });
    });

    // 予測確率でソート（高い順）
    return tasks.sort((a, b) => b.prediction - a.prediction);
  }

  /**
   * 優先度決定
   */
  private determinePriority(
    frequency: number, 
    index: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (frequency > 0.9 && index < 2) return 'critical';
    if (frequency > 0.8 && index < 3) return 'high';
    if (frequency > 0.6) return 'medium';
    return 'low';
  }

  /**
   * 使用予測確率計算
   */
  private calculatePrediction(frequency: number, index: number): number {
    // 頻度とインデックス（人気度）を組み合わせた予測
    const baseFrequency = frequency;
    const popularityBonus = Math.max(0, (5 - index) * 0.1); // 上位5位までボーナス
    const randomFactor = Math.random() * 0.1; // 10%のランダム要素
    
    return Math.min(1, baseFrequency + popularityBonus + randomFactor);
  }

  /**
   * 次の段階取得
   */
  private getNextStage(currentStage: string): string | null {
    const stageOrder = ['opening', 'exploration', 'metacognition', 'future'];
    const currentIndex = stageOrder.indexOf(currentStage);
    
    return currentIndex >= 0 && currentIndex < stageOrder.length - 1 ? 
           stageOrder[currentIndex + 1] : null;
  }

  /**
   * 並行予熱実行
   */
  private async executeConcurrentWarmup(
    tasks: WarmupTask[], 
    priority: string
  ): Promise<void> {
    console.log(`🔥 ${priority}優先度予熱開始: ${tasks.length}件`);
    
    const batchTasks = tasks.map(task => ({
      id: `warmup_${task.key}`,
      name: `Warmup: ${task.key.substring(0, 30)}...`,
      executor: async () => {
        try {
          const data = await task.generator();
          
          // Response Optimizerに直接キャッシュ
          await responseOptimizer.getOrSet(task.key, async () => data, {
            priority: task.priority as any,
            cache: true
          });
          
          console.log(`✅ 予熱完了: ${task.key.substring(0, 30)}...`);
          return data;
        } catch (error) {
          console.warn(`⚠️ 予熱失敗: ${task.key}`, error);
          return null;
        }
      },
      priority: priority as any
    }));

    await concurrentProcessor.processBatch(batchTasks);
    console.log(`🔥 ${priority}優先度予熱完了`);
  }

  /**
   * バックグラウンド予熱
   */
  private executeBackgroundWarmup(tasks: WarmupTask[]): void {
    console.log(`🔄 バックグラウンド予熱開始: ${tasks.length}件`);
    
    // 段階的に実行（システム負荷を避けるため）
    let index = 0;
    const executeNext = () => {
      if (index >= tasks.length) {
        console.log('🔄 バックグラウンド予熱完了');
        return;
      }
      
      const task = tasks[index++];
      
      concurrentProcessor.addTask(
        `bg_warmup_${task.key}`,
        `Background Warmup: ${task.key}`,
        task.generator,
        'low'
      );
      
      // 次のタスクを500ms後に実行
      setTimeout(executeNext, 500);
    };
    
    executeNext();
  }

  /**
   * 学習データ更新
   */
  updateLearningData(
    stage: string, 
    userAnswer: string, 
    generatedQuestion: string
  ): void {
    const pattern = this.patterns.get(stage);
    if (!pattern) return;

    // 新しい回答パターンを学習
    if (!pattern.commonAnswers.includes(userAnswer) && userAnswer.length > 5) {
      pattern.commonAnswers.push(userAnswer);
      pattern.frequency = Math.min(1, pattern.frequency + 0.01); // 頻度を少し上げる
      
      console.log(`📚 学習データ更新: ${stage} - "${userAnswer.substring(0, 20)}..."`);
    }

    // 生成された質問も学習
    if (!pattern.followUpQuestions.includes(generatedQuestion)) {
      pattern.followUpQuestions.push(generatedQuestion);
    }
  }

  /**
   * 予熱統計取得
   */
  getWarmupStatistics() {
    return {
      totalPatterns: this.patterns.size,
      warmupHistory: this.warmupHistory.size,
      isWarming: this.isWarming,
      patternsByStage: Object.fromEntries(
        Array.from(this.patterns.entries()).map(([stage, pattern]) => [
          stage,
          {
            commonAnswers: pattern.commonAnswers.length,
            followUpQuestions: pattern.followUpQuestions.length,
            frequency: pattern.frequency,
            difficulty: pattern.difficulty
          }
        ])
      )
    };
  }

  /**
   * リセット
   */
  reset(): void {
    this.warmupHistory.clear();
    this.isWarming = false;
    this.initializeLearningPatterns();
    
    console.log('🔄 Cache Warmer リセット完了');
  }
}

// シングルトンインスタンス
export const cacheWarmer = CacheWarmer.getInstance();

// ブラウザ環境でのグローバル登録
if (typeof window !== 'undefined') {
  (window as any).cacheWarmer = cacheWarmer;
}