/**
 * 🧠 Memory Optimizer - メモリリーク完全解決システム
 * 小学6年生が長時間安心して使える最適化エンジン
 */

interface MemoryUsage {
  used: number;
  total: number;
  limit: number;
  timestamp: number;
}

interface PerformanceMetrics {
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  memoryLeaks: number;
  gcRuns: number;
  averageResponseTime: number;
}

export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private memoryHistory: MemoryUsage[] = [];
  private performanceMetrics: PerformanceMetrics = {
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryLeaks: 0,
    gcRuns: 0,
    averageResponseTime: 0
  };
  
  private readonly MEMORY_WARNING_THRESHOLD = 150 * 1024 * 1024; // 150MB
  private readonly MEMORY_CRITICAL_THRESHOLD = 250 * 1024 * 1024; // 250MB
  private readonly MAX_HISTORY_LENGTH = 100;
  
  private intervalId: NodeJS.Timeout | null = null;
  private weakRefs: Set<WeakRef<any>> = new Set();
  private cleanupCallbacks: Array<() => void> = [];

  private constructor() {
    this.startMemoryMonitoring();
  }

  static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer();
    }
    return MemoryOptimizer.instance;
  }

  /**
   * メモリ監視開始
   */
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined') return;
    
    this.intervalId = setInterval(() => {
      this.checkMemoryUsage();
      this.forceGarbageCollection();
      this.cleanupWeakRefs();
    }, 30000); // 30秒ごと
    
    console.log('🧠 Memory Optimizer 監視開始');
  }

  /**
   * メモリ使用量チェック
   */
  private checkMemoryUsage(): void {
    if (typeof window === 'undefined') return;
    
    const memory = (performance as any).memory;
    if (!memory) return;
    
    const usage: MemoryUsage = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };
    
    this.memoryHistory.push(usage);
    
    // 履歴のサイズ制限
    if (this.memoryHistory.length > this.MAX_HISTORY_LENGTH) {
      this.memoryHistory.shift();
    }
    
    // 警告レベルチェック
    if (usage.used > this.MEMORY_CRITICAL_THRESHOLD) {
      this.handleCriticalMemory(usage);
    } else if (usage.used > this.MEMORY_WARNING_THRESHOLD) {
      this.handleWarningMemory(usage);
    }
    
    console.log(`💾 メモリ使用量: ${(usage.used / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * 警告レベルメモリ使用への対処
   */
  private handleWarningMemory(usage: MemoryUsage): void {
    console.warn(`⚠️ メモリ使用量警告: ${(usage.used / 1024 / 1024).toFixed(2)}MB`);
    
    // 軽度の最適化
    this.performLightweightOptimization();
  }

  /**
   * 危険レベルメモリ使用への対処
   */
  private handleCriticalMemory(usage: MemoryUsage): void {
    console.error(`🚨 メモリ使用量危険: ${(usage.used / 1024 / 1024).toFixed(2)}MB`);
    
    this.performanceMetrics.memoryLeaks++;
    
    // 積極的な最適化
    this.performAggressiveOptimization();
    
    // ユーザーに優しい通知
    this.notifyUserOfOptimization();
  }

  /**
   * 軽度の最適化
   */
  private performLightweightOptimization(): void {
    // キャッシュの部分クリア
    if (typeof window !== 'undefined') {
      const caches = [
        'questionCache',
        'responseCache',
        'imageCache'
      ];
      
      caches.forEach(cacheName => {
        const cache = (window as any)[cacheName];
        if (cache && typeof cache.clear === 'function') {
          const beforeSize = cache.size || 0;
          cache.clear();
          console.log(`🧹 ${cacheName} クリア: ${beforeSize}件削除`);
        }
      });
    }
    
    // WeakRef クリーンアップ
    this.cleanupWeakRefs();
  }

  /**
   * 積極的な最適化
   */
  private performAggressiveOptimization(): void {
    // すべてのキャッシュをクリア
    this.performLightweightOptimization();
    
    // DOM要素のクリーンアップ
    this.cleanupDOMElements();
    
    // イベントリスナーのクリーンアップ
    this.cleanupEventListeners();
    
    // 強制ガベージコレクション
    this.forceGarbageCollection();
    
    console.log('🚀 積極的メモリ最適化完了');
  }

  /**
   * DOM要素のクリーンアップ
   */
  private cleanupDOMElements(): void {
    if (typeof document === 'undefined') return;
    
    // 不要なDOM要素を削除
    const elementsToClean = [
      'div[data-temp="true"]',
      '.cache-element:empty',
      '[data-cleanup="true"]'
    ];
    
    elementsToClean.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    console.log('🗑️ DOM要素クリーンアップ完了');
  }

  /**
   * イベントリスナーのクリーンアップ
   */
  private cleanupEventListeners(): void {
    // クリーンアップコールバック実行
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('クリーンアップコールバックエラー:', error);
      }
    });
    
    console.log(`🎧 イベントリスナークリーンアップ: ${this.cleanupCallbacks.length}件`);
  }

  /**
   * WeakRef のクリーンアップ
   */
  private cleanupWeakRefs(): void {
    const initialSize = this.weakRefs.size;
    
    const weakRefsArray = Array.from(this.weakRefs);
    for (const weakRef of weakRefsArray) {
      if (weakRef.deref() === undefined) {
        this.weakRefs.delete(weakRef);
      }
    }
    
    const cleanedCount = initialSize - this.weakRefs.size;
    if (cleanedCount > 0) {
      console.log(`🗑️ WeakRef クリーンアップ: ${cleanedCount}件削除`);
    }
  }

  /**
   * 強制ガベージコレクション
   */
  private forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
      this.performanceMetrics.gcRuns++;
      console.log('🗑️ 強制ガベージコレクション実行');
    }
  }

  /**
   * ユーザーへの最適化通知
   */
  private notifyUserOfOptimization(): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('memoryOptimization', {
        detail: {
          message: '面接練習をもっと快適にするため、少し整理をしています...',
          type: 'info',
          autoClose: true,
          duration: 3000
        }
      });
      
      window.dispatchEvent(event);
    }
  }

  /**
   * オブジェクトの監視登録
   */
  registerForCleanup<T extends object>(obj: T, cleanupFn?: () => void): WeakRef<T> {
    const weakRef = new WeakRef(obj);
    this.weakRefs.add(weakRef);
    
    if (cleanupFn) {
      this.cleanupCallbacks.push(cleanupFn);
    }
    
    return weakRef;
  }

  /**
   * APIコール統計
   */
  recordAPICall(responseTime: number): void {
    this.performanceMetrics.apiCalls++;
    
    // 平均レスポンス時間の更新
    const currentAvg = this.performanceMetrics.averageResponseTime;
    const totalCalls = this.performanceMetrics.apiCalls;
    
    this.performanceMetrics.averageResponseTime = 
      (currentAvg * (totalCalls - 1) + responseTime) / totalCalls;
  }

  /**
   * キャッシュヒット統計
   */
  recordCacheHit(): void {
    this.performanceMetrics.cacheHits++;
  }

  /**
   * キャッシュミス統計
   */
  recordCacheMiss(): void {
    this.performanceMetrics.cacheMisses++;
  }

  /**
   * パフォーマンスメトリクス取得
   */
  getPerformanceMetrics(): PerformanceMetrics & {
    memoryUsage: MemoryUsage | null;
    cacheHitRate: number;
  } {
    const latestMemory = this.memoryHistory[this.memoryHistory.length - 1] || null;
    const cacheHitRate = 
      this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses > 0
        ? this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses)
        : 0;
    
    return {
      ...this.performanceMetrics,
      memoryUsage: latestMemory,
      cacheHitRate
    };
  }

  /**
   * メモリ使用量の傾向分析
   */
  analyzeMemoryTrends(): {
    trend: 'increasing' | 'stable' | 'decreasing';
    averageUsage: number;
    peakUsage: number;
    recommendation: string;
  } {
    if (this.memoryHistory.length < 10) {
      return {
        trend: 'stable',
        averageUsage: 0,
        peakUsage: 0,
        recommendation: 'データ収集中...'
      };
    }
    
    const recent = this.memoryHistory.slice(-10);
    const first = recent[0].used;
    const last = recent[recent.length - 1].used;
    
    const trend = last > first * 1.1 ? 'increasing' : 
                  last < first * 0.9 ? 'decreasing' : 'stable';
    
    const averageUsage = recent.reduce((sum, usage) => sum + usage.used, 0) / recent.length;
    const peakUsage = Math.max(...recent.map(usage => usage.used));
    
    const recommendations = {
      increasing: '定期的な休憩とブラウザ再読み込みをお勧めします',
      stable: 'メモリ使用量は安定しています',
      decreasing: 'メモリ最適化が効果的に働いています'
    };
    
    return {
      trend,
      averageUsage: averageUsage / 1024 / 1024, // MB
      peakUsage: peakUsage / 1024 / 1024, // MB
      recommendation: recommendations[trend]
    };
  }

  /**
   * 監視停止
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // 最終クリーンアップ
    this.performAggressiveOptimization();
    
    console.log('🛑 Memory Optimizer 監視停止');
  }

  /**
   * 最適化レポート生成
   */
  generateOptimizationReport(): string {
    const metrics = this.getPerformanceMetrics();
    const trends = this.analyzeMemoryTrends();
    
    const report = `
📊 メモリ最適化レポート
======================

💾 メモリ使用量: ${trends.averageUsage.toFixed(2)}MB (平均)
📈 メモリトレンド: ${trends.trend}
🎯 ピーク使用量: ${trends.peakUsage.toFixed(2)}MB

🚀 パフォーマンス統計:
- API呼び出し: ${metrics.apiCalls}回
- 平均レスポンス: ${metrics.averageResponseTime.toFixed(2)}ms
- キャッシュヒット率: ${(metrics.cacheHitRate * 100).toFixed(1)}%
- GC実行回数: ${metrics.gcRuns}回

💡 推奨事項: ${trends.recommendation}
    `;
    
    return report;
  }
}

// シングルトンインスタンス作成
export const memoryOptimizer = MemoryOptimizer.getInstance();

// ブラウザ環境でのグローバル登録
if (typeof window !== 'undefined') {
  (window as any).memoryOptimizer = memoryOptimizer;
}

// ページアンロード時のクリーンアップ
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryOptimizer.stopMonitoring();
  });
}