/**
 * 🚀 AIリフレクション質問キャッシュシステム
 * 小学6年生のための高速レスポンス実現
 */

interface CachedQuestion {
  question: string;
  stage: string;
  depth: number;
  keywords: string[];
  activityType: string;
  timestamp: number;
  hitCount: number;
}

class QuestionCacheManager {
  private cache: Map<string, CachedQuestion>;
  private readonly maxSize: number = 100;
  private readonly ttl: number = 3600000; // 1時間

  constructor() {
    this.cache = new Map();
  }

  /**
   * キャッシュキー生成
   */
  private generateKey(
    stage: string,
    keywords: string[],
    activityType: string,
    depth: number
  ): string {
    return `${stage}_${activityType}_${depth}_${keywords.sort().join('_')}`;
  }

  /**
   * 質問をキャッシュに保存
   */
  set(
    question: string,
    stage: string,
    keywords: string[],
    activityType: string,
    depth: number
  ): void {
    const key = this.generateKey(stage, keywords, activityType, depth);
    
    // キャッシュサイズ制限
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      question,
      stage,
      depth,
      keywords,
      activityType,
      timestamp: Date.now(),
      hitCount: 0
    });

    console.log(`💾 質問キャッシュ保存: ${key}`);
  }

  /**
   * キャッシュから質問を取得
   */
  get(
    stage: string,
    keywords: string[],
    activityType: string,
    depth: number
  ): string | null {
    const key = this.generateKey(stage, keywords, activityType, depth);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // TTLチェック
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      console.log(`⏰ キャッシュ期限切れ: ${key}`);
      return null;
    }

    // ヒットカウント更新
    cached.hitCount++;
    console.log(`✅ キャッシュヒット: ${key} (${cached.hitCount}回目)`);
    
    return cached.question;
  }

  /**
   * 最も古いエントリを削除
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, value] of Array.from(this.cache.entries())) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ 古いキャッシュ削除: ${oldestKey}`);
    }
  }

  /**
   * 類似質問の検索（キーワードの部分一致）
   */
  findSimilar(
    stage: string,
    keywords: string[],
    activityType: string
  ): string | null {
    // 完全一致がない場合、類似検索
    for (const [key, value] of Array.from(this.cache.entries())) {
      if (value.stage === stage && value.activityType === activityType) {
        // キーワードの50%以上が一致
        const matchCount = keywords.filter(kw => 
          value.keywords.includes(kw)
        ).length;
        
        if (matchCount >= keywords.length * 0.5) {
          console.log(`🔍 類似キャッシュ発見: ${key}`);
          return value.question;
        }
      }
    }
    
    return null;
  }

  /**
   * キャッシュ統計情報
   */
  getStats(): {
    size: number;
    totalHits: number;
    averageHitRate: number;
  } {
    let totalHits = 0;
    for (const value of Array.from(this.cache.values())) {
      totalHits += value.hitCount;
    }

    return {
      size: this.cache.size,
      totalHits,
      averageHitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0
    };
  }

  /**
   * キャッシュクリア
   */
  clear(): void {
    this.cache.clear();
    console.log('🧹 キャッシュ全削除');
  }
}

// シングルトンインスタンス
export const questionCache = new QuestionCacheManager();

/**
 * パフォーマンス測定デコレータ
 */
export function measurePerformance(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(...args: any[]) {
    const start = performance.now();
    const result = await originalMethod.apply(this, args);
    const end = performance.now();
    
    console.log(`⚡ ${propertyKey} 実行時間: ${(end - start).toFixed(2)}ms`);
    
    return result;
  };

  return descriptor;
}

/**
 * レスポンス最適化ユーティリティ
 */
export class ResponseOptimizer {
  /**
   * 質問文の最適化（不要な部分を削除）
   */
  static optimizeQuestion(question: string): string {
    // 冗長な敬語を簡潔に
    question = question.replace(/いただけませんでしょうか/g, 'いただけますか');
    question = question.replace(/させていただきます/g, 'します');
    
    // 長すぎる質問を分割
    if (question.length > 100) {
      const sentences = question.split('。');
      if (sentences.length > 2) {
        // 最も重要な2文だけ残す
        question = sentences.slice(0, 2).join('。') + '。';
      }
    }
    
    return question;
  }

  /**
   * バッチ処理用のキュー管理
   */
  static batchQuestions(
    questions: Array<{stage: string, keywords: string[], activityType: string}>
  ): Promise<string[]> {
    // 複数の質問生成を並列処理
    return Promise.all(
      questions.map(async (q) => {
        // キャッシュチェック
        const cached = questionCache.get(
          q.stage,
          q.keywords,
          q.activityType,
          1
        );
        
        if (cached) {
          return cached;
        }
        
        // ここで実際のAI生成を呼ぶ
        return '質問生成中...';
      })
    );
  }
}

/**
 * メモリ使用量監視
 */
export class MemoryMonitor {
  private static readonly WARNING_THRESHOLD = 100 * 1024 * 1024; // 100MB
  
  static checkMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMemory = memory.usedJSHeapSize;
        const totalMemory = memory.totalJSHeapSize;
        
        if (usedMemory > this.WARNING_THRESHOLD) {
          console.warn(`⚠️ メモリ使用量警告: ${(usedMemory / 1024 / 1024).toFixed(2)}MB`);
          
          // キャッシュの一部をクリア
          const stats = questionCache.getStats();
          if (stats.size > 50) {
            console.log('🧹 メモリ節約のためキャッシュをクリア');
            questionCache.clear();
          }
        }
      }
    }
  }
}

// 定期的なメモリチェック（5分ごと）
if (typeof window !== 'undefined') {
  setInterval(() => {
    MemoryMonitor.checkMemoryUsage();
  }, 5 * 60 * 1000);
}