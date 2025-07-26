/**
 * メモリ管理とパフォーマンス最適化
 * 重いオブジェクトの適切な管理とガベージコレクション支援
 */

// メモリリークを防ぐためのクリーンアップマネージャー
export class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTasks: (() => void)[] = [];
  private intervalIds: Set<NodeJS.Timeout> = new Set();
  private timeoutIds: Set<NodeJS.Timeout> = new Set();
  private eventListeners: Map<EventTarget, Map<string, EventListener>> = new Map();
  private workers: Set<Worker> = new Set();
  private mediaStreams: Set<MediaStream> = new Set();

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * インターバルの登録と自動クリーンアップ
   */
  registerInterval(callback: () => void, ms: number): NodeJS.Timeout {
    const id = setInterval(callback, ms);
    this.intervalIds.add(id);
    return id;
  }

  /**
   * タイムアウトの登録と自動クリーンアップ
   */
  registerTimeout(callback: () => void, ms: number): NodeJS.Timeout {
    const id = setTimeout(() => {
      callback();
      this.timeoutIds.delete(id);
    }, ms);
    this.timeoutIds.add(id);
    return id;
  }

  /**
   * イベントリスナーの登録と自動クリーンアップ
   */
  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, new Map());
    }
    this.eventListeners.get(target)!.set(type, listener);
  }

  /**
   * Web Workerの登録と自動クリーンアップ
   */
  registerWorker(worker: Worker): Worker {
    this.workers.add(worker);
    worker.addEventListener('error', () => this.workers.delete(worker));
    return worker;
  }

  /**
   * MediaStreamの登録と自動クリーンアップ
   */
  registerMediaStream(stream: MediaStream): MediaStream {
    this.mediaStreams.add(stream);
    return stream;
  }

  /**
   * カスタムクリーンアップタスクの登録
   */
  registerCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  /**
   * すべてのリソースをクリーンアップ
   */
  cleanup(): void {
    // インターバルをクリア
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds.clear();

    // タイムアウトをクリア
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds.clear();

    // イベントリスナーを削除
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, type) => {
        target.removeEventListener(type, listener);
      });
    });
    this.eventListeners.clear();

    // Web Workersを終了
    this.workers.forEach(worker => {
      worker.terminate();
    });
    this.workers.clear();

    // MediaStreamsを停止
    this.mediaStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    this.mediaStreams.clear();

    // カスタムクリーンアップタスクを実行
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });
    this.cleanupTasks = [];
  }

  /**
   * メモリ使用量の監視
   */
  getMemoryUsage(): {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
    memoryPressure: 'low' | 'medium' | 'high';
  } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      let memoryPressure: 'low' | 'medium' | 'high' = 'low';
      if (usage > 0.8) memoryPressure = 'high';
      else if (usage > 0.6) memoryPressure = 'medium';

      return {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
        memoryPressure,
      };
    }
    return null;
  }

  /**
   * ガベージコレクションの手動実行（可能な場合）
   */
  forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }
}

/**
 * React Hook: コンポーネントアンマウント時の自動クリーンアップ
 */
import React from 'react';

export function useMemoryCleanup() {
  const memoryManager = MemoryManager.getInstance();

  const registerCleanup = (task: () => void) => {
    memoryManager.registerCleanupTask(task);
  };

  // コンポーネントアンマウント時にクリーンアップを実行
  React.useEffect(() => {
    return () => {
      memoryManager.cleanup();
    };
  }, [memoryManager]);

  return {
    registerInterval: memoryManager.registerInterval.bind(memoryManager),
    registerTimeout: memoryManager.registerTimeout.bind(memoryManager),
    addEventListener: memoryManager.addEventListener.bind(memoryManager),
    registerWorker: memoryManager.registerWorker.bind(memoryManager),
    registerMediaStream: memoryManager.registerMediaStream.bind(memoryManager),
    registerCleanup,
    getMemoryUsage: memoryManager.getMemoryUsage.bind(memoryManager),
  };
}

/**
 * 大きなオブジェクトのキャッシュ管理
 */
export class ObjectCache<T> {
  private cache: Map<string, { value: T; timestamp: number; accessCount: number }> = new Map();
  private maxSize: number;
  private maxAge: number; // ミリ秒

  constructor(maxSize: number = 100, maxAge: number = 5 * 60 * 1000) { // 5分
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  set(key: string, value: T): void {
    // 容量制限チェック
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0,
    });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // 期限切れチェック
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    // アクセス回数を更新
    item.accessCount++;
    return item.value;
  }

  has(key: string): boolean {
    return this.cache.has(key) && !this.isExpired(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private isExpired(key: string): boolean {
    const item = this.cache.get(key);
    return !item || (Date.now() - item.timestamp > this.maxAge);
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let lruAccessCount = Infinity;

    for (const [key, item] of this.cache) {
      if (item.accessCount < lruAccessCount) {
        lruAccessCount = item.accessCount;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    const totalAccess = Array.from(this.cache.values()).reduce(
      (sum, item) => sum + item.accessCount, 0
    );
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccess / Math.max(this.cache.size, 1),
    };
  }
}

/**
 * AI応答のキャッシュ（メモリ効率的）
 */
export const aiResponseCache = new ObjectCache<any>(50, 10 * 60 * 1000); // 10分

/**
 * 画像データのキャッシュ
 */
export const imageCache = new ObjectCache<ImageData>(20, 30 * 60 * 1000); // 30分

/**
 * パフォーマンス監視とメトリクス
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 処理時間を測定
   */
  measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.recordMetric(name, duration);
    return result;
  }

  /**
   * 非同期処理時間を測定
   */
  async measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.recordMetric(name, duration);
    return result;
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // 最新100件のみ保持
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * メトリクスの統計を取得
   */
  getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return { count, average, min, max, p95 };
  }

  /**
   * すべてのメトリクスを取得
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const stats: Record<string, ReturnType<typeof this.getStats>> = {};
    for (const name of this.metrics.keys()) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }
}

// グローバルインスタンス
export const memoryManager = MemoryManager.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();