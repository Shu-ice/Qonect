/**
 * 🚀 Response Optimizer - レスポンス速度最適化エンジン
 * 小学6年生が快適に使える1秒台レスポンス実現システム
 */

import { memoryOptimizer } from './memory-optimizer';
import { enhancedDeepDiveEngine } from '../interview/enhanced-deep-dive-engine';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hitCount: number;
  ttl: number;
}

interface PerformanceMetrics {
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
}

interface ResponseOptimization {
  preload: boolean;
  cache: boolean;
  compress: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class ResponseOptimizer {
  private static instance: ResponseOptimizer;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private responseTimings: number[] = [];
  private preloadQueue: Set<string> = new Set();
  private metrics: PerformanceMetrics = {
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    p95ResponseTime: 0,
    errorRate: 0
  };
  
  // 速度最適化設定
  private readonly MAX_CACHE_SIZE = 200;
  private readonly CACHE_TTL_DEFAULT = 30 * 60 * 1000; // 30分
  private readonly CACHE_TTL_CRITICAL = 5 * 60 * 1000; // 5分
  private readonly TARGET_RESPONSE_TIME = 1500; // 1.5秒目標
  private readonly PRELOAD_THRESHOLD = 100; // 100ms以内なら先読み
  
  private constructor() {
    this.initializeOptimization();
  }

  static getInstance(): ResponseOptimizer {
    if (!ResponseOptimizer.instance) {
      ResponseOptimizer.instance = new ResponseOptimizer();
    }
    return ResponseOptimizer.instance;
  }

  /**
   * 最適化初期化
   */
  private initializeOptimization(): void {
    // クリティカルキャッシュのプリロード
    this.preloadCriticalData();
    
    // パフォーマンス監視開始
    this.startPerformanceMonitoring();
    
    // 定期的なキャッシュ最適化
    setInterval(() => {
      this.optimizeCache();
    }, 60000); // 1分ごと
    
    console.log('🚀 Response Optimizer 初期化完了');
  }

  /**
   * クリティカルデータのプリロード
   */
  private preloadCriticalData(): void {
    const criticalKeys = [
      'initial_question_templates',
      'common_follow_up_patterns',
      'inappropriate_response_patterns',
      'stage_transition_rules'
    ];
    
    criticalKeys.forEach(key => {
      this.preloadQueue.add(key);
    });
    
    console.log('💾 クリティカルデータプリロード開始');
  }

  /**
   * インテリジェントキャッシング
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    options: Partial<ResponseOptimization> = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    // キャッシュヒット確認
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      
      // TTL確認
      if (Date.now() - entry.timestamp < entry.ttl) {
        entry.hitCount++;
        this.metrics.cacheHits++;
        memoryOptimizer.recordCacheHit();
        
        console.log(`⚡ キャッシュヒット: ${key} (${entry.hitCount}回目)`);
        return entry.data;
      } else {
        // 期限切れキャッシュを削除
        this.cache.delete(key);
      }
    }
    
    // キャッシュミス - データ生成
    this.metrics.cacheMisses++;
    memoryOptimizer.recordCacheMiss();
    
    try {
      const data = await factory();
      const responseTime = Date.now() - startTime;
      
      // 応答時間記録
      this.recordResponseTime(responseTime);
      
      // キャッシュ保存
      if (options.cache !== false) {
        const ttl = options.priority === 'critical' ? 
                   this.CACHE_TTL_CRITICAL : 
                   this.CACHE_TTL_DEFAULT;
        
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          hitCount: 0,
          ttl
        });
        
        // キャッシュサイズ制限
        this.evictOldEntries();
      }
      
      console.log(`📊 データ生成完了: ${key} (${responseTime}ms)`);
      return data;
      
    } catch (error) {
      this.metrics.errorRate++;
      console.error(`❌ データ生成エラー: ${key}`, error);
      throw error;
    }
  }

  /**
   * 応答時間記録と分析
   */
  private recordResponseTime(time: number): void {
    this.responseTimings.push(time);
    
    // 最新1000件のみ保持
    if (this.responseTimings.length > 1000) {
      this.responseTimings.shift();
    }
    
    // メトリクス更新
    this.updateMetrics();
    
    // 遅延アラート
    if (time > this.TARGET_RESPONSE_TIME) {
      console.warn(`⚠️ レスポンス遅延検出: ${time}ms (目標: ${this.TARGET_RESPONSE_TIME}ms)`);
      this.triggerOptimization();
    }
    
    // メモリオプティマイザーに記録
    memoryOptimizer.recordAPICall(time);
  }

  /**
   * メトリクス更新
   */
  private updateMetrics(): void {
    if (this.responseTimings.length === 0) return;
    
    const timings = [...this.responseTimings];
    timings.sort((a, b) => a - b);
    
    this.metrics.averageResponseTime = 
      timings.reduce((sum, time) => sum + time, 0) / timings.length;
    
    const p95Index = Math.floor(timings.length * 0.95);
    this.metrics.p95ResponseTime = timings[p95Index] || 0;
  }

  /**
   * 自動最適化トリガー
   */
  private triggerOptimization(): void {
    console.log('🔧 自動最適化実行中...');
    
    // 低優先度キャッシュを削除
    this.evictLowPriorityCache();
    
    // メモリ最適化
    memoryOptimizer.recordCacheMiss(); // 最適化トリガー
    
    // Deep Dive Engineキャッシュクリア
    enhancedDeepDiveEngine.clearCache();
    
    console.log('✅ 自動最適化完了');
  }

  /**
   * キャッシュ最適化
   */
  private optimizeCache(): void {
    const beforeSize = this.cache.size;
    
    // 使用頻度とTTLに基づく最適化
    this.evictOldEntries();
    this.evictLowHitEntries();
    
    const afterSize = this.cache.size;
    
    if (beforeSize !== afterSize) {
      console.log(`🧹 キャッシュ最適化: ${beforeSize} → ${afterSize}件`);
    }
  }

  /**
   * 古いエントリの削除
   */
  private evictOldEntries(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    const entriesArray = Array.from(this.cache.entries());
    for (const [key, entry] of entriesArray) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.cache.delete(key));
    
    // サイズ制限
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const excessCount = this.cache.size - this.MAX_CACHE_SIZE;
      for (let i = 0; i < excessCount; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * 低ヒット率エントリの削除
   */
  private evictLowHitEntries(): void {
    const entries = Array.from(this.cache.entries())
      .filter(([_, entry]) => entry.hitCount === 0)
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // 古い未使用エントリを削除（最大20%）
    const deleteCount = Math.min(entries.length, Math.floor(this.cache.size * 0.2));
    
    for (let i = 0; i < deleteCount; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * 低優先度キャッシュ削除
   */
  private evictLowPriorityCache(): void {
    const lowPriorityKeys = Array.from(this.cache.keys())
      .filter(key => !key.includes('critical') && !key.includes('essential'));
    
    lowPriorityKeys.forEach(key => this.cache.delete(key));
    
    console.log(`🗑️ 低優先度キャッシュ削除: ${lowPriorityKeys.length}件`);
  }

  /**
   * パフォーマンス監視開始
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      const metrics = this.getPerformanceMetrics();
      
      // パフォーマンス警告
      if (metrics.averageResponseTime > this.TARGET_RESPONSE_TIME) {
        console.warn(`⚠️ 平均応答時間が目標を超過: ${metrics.averageResponseTime.toFixed(2)}ms`);
      }
      
      if (metrics.cacheHitRate < 0.6) {
        console.warn(`⚠️ キャッシュヒット率が低下: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
      }
      
    }, 120000); // 2分ごと
  }

  /**
   * プリフェッチ実行
   */
  async prefetch(key: string, factory: () => Promise<any>): Promise<void> {
    if (!this.cache.has(key)) {
      try {
        const startTime = Date.now();
        const data = await factory();
        const responseTime = Date.now() - startTime;
        
        if (responseTime < this.PRELOAD_THRESHOLD) {
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
            hitCount: 0,
            ttl: this.CACHE_TTL_DEFAULT
          });
          
          console.log(`⚡ プリフェッチ成功: ${key} (${responseTime}ms)`);
        }
      } catch (error) {
        console.warn(`⚠️ プリフェッチ失敗: ${key}`, error);
      }
    }
  }

  /**
   * 並列実行最適化
   */
  async optimizedParallel<T>(
    tasks: Array<() => Promise<T>>,
    maxConcurrency: number = 3
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<any>[] = [];

    for (const task of tasks) {
      const promise = task();
      results.push(promise as any);

      if (results.length >= maxConcurrency) {
        await Promise.race(executing);
      }
      executing.push(promise);
    }

    return Promise.all(results);
  }

  /**
   * パフォーマンスメトリクス取得
   */
  getPerformanceMetrics() {
    const cacheTotal = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = cacheTotal > 0 ? this.metrics.cacheHits / cacheTotal : 0;
    
    return {
      ...this.metrics,
      cacheHitRate,
      cacheSize: this.cache.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
      targetResponseTime: this.TARGET_RESPONSE_TIME,
      recentResponseTimes: this.responseTimings.slice(-10)
    };
  }

  /**
   * 完全なリセット
   */
  reset(): void {
    this.cache.clear();
    this.responseTimings = [];
    this.preloadQueue.clear();
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      errorRate: 0
    };
    
    console.log('🔄 Response Optimizer リセット完了');
  }

  /**
   * 最適化レポート生成
   */
  generateOptimizationReport(): string {
    const metrics = this.getPerformanceMetrics();
    
    const report = `
🚀 レスポンス速度最適化レポート
====================================

📊 パフォーマンス指標:
- 平均応答時間: ${metrics.averageResponseTime.toFixed(2)}ms
- P95応答時間: ${metrics.p95ResponseTime.toFixed(2)}ms
- 目標応答時間: ${metrics.targetResponseTime}ms

💾 キャッシュ効率:
- ヒット率: ${(metrics.cacheHitRate * 100).toFixed(1)}%
- キャッシュサイズ: ${metrics.cacheSize}/${metrics.maxCacheSize}件
- ヒット数: ${metrics.cacheHits}回
- ミス数: ${metrics.cacheMisses}回

🔧 最適化状況:
- API呼び出し: ${metrics.apiCalls}回
- エラー率: ${(metrics.errorRate * 100).toFixed(2)}%
- 直近10回: [${metrics.recentResponseTimes.map(t => `${t}ms`).join(', ')}]

💡 推奨事項:
${metrics.averageResponseTime > metrics.targetResponseTime ? 
  '- レスポンス時間が目標を超過しています。キャッシュ戦略の見直しを検討してください' : 
  '- レスポンス時間は目標範囲内です'}
${metrics.cacheHitRate < 0.6 ? 
  '- キャッシュヒット率が低下しています。プリフェッチ戦略の改善を推奨します' : 
  '- キャッシュ効率は良好です'}
    `;
    
    return report;
  }
}

// シングルトンインスタンス作成
export const responseOptimizer = ResponseOptimizer.getInstance();

// ブラウザ環境でのグローバル登録
if (typeof window !== 'undefined') {
  (window as any).responseOptimizer = responseOptimizer;
}