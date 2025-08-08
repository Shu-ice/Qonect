/**
 * 🚀 Concurrent Processor - 並行処理最適化エンジン
 * 複数のAI処理を効率的に並行実行し、レスポンス速度を最大化
 */

interface ProcessingTask<T> {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  executor: () => Promise<T>;
}

interface ProcessingResult<T> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
  executionTime: number;
}

export class ConcurrentProcessor {
  private static instance: ConcurrentProcessor;
  private processingQueue: ProcessingTask<any>[] = [];
  private activeProcesses: Map<string, Promise<any>> = new Map();
  private completedTasks: ProcessingResult<any>[] = [];
  
  // 並行処理設定
  private readonly MAX_CONCURRENT_TASKS = 4;
  private readonly DEFAULT_TIMEOUT = 5000; // 5秒
  private readonly PRIORITY_TIMEOUT = {
    critical: 3000,  // 3秒
    high: 5000,      // 5秒
    medium: 8000,    // 8秒
    low: 15000       // 15秒
  };

  private constructor() {}

  static getInstance(): ConcurrentProcessor {
    if (!ConcurrentProcessor.instance) {
      ConcurrentProcessor.instance = new ConcurrentProcessor();
    }
    return ConcurrentProcessor.instance;
  }

  /**
   * 優先度付きタスク追加
   */
  addTask<T>(
    id: string,
    name: string,
    executor: () => Promise<T>,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const task: ProcessingTask<T> = {
      id,
      name,
      priority,
      timeout: this.PRIORITY_TIMEOUT[priority],
      executor
    };

    // 優先度に基づいて挿入位置を決定
    const insertIndex = this.findInsertPosition(priority);
    this.processingQueue.splice(insertIndex, 0, task);

    console.log(`📋 タスク追加: ${name} (優先度: ${priority})`);
    
    // 即座に処理開始
    this.processNext();
  }

  /**
   * 並行バッチ処理
   */
  async processBatch<T>(
    tasks: Array<{
      id: string;
      name: string;
      executor: () => Promise<T>;
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }>
  ): Promise<ProcessingResult<T>[]> {
    console.log(`🚀 バッチ処理開始: ${tasks.length}件`);
    
    // タスクをキューに追加
    tasks.forEach(task => {
      this.addTask(task.id, task.name, task.executor, task.priority);
    });

    // すべてのタスクが完了するまで待機
    const taskIds = tasks.map(task => task.id);
    return this.waitForTasks(taskIds);
  }

  /**
   * 高速並列実行（結果の最初の成功を返す）
   */
  async raceToFirst<T>(
    tasks: Array<{
      id: string;
      name: string;
      executor: () => Promise<T>;
    }>
  ): Promise<T> {
    console.log(`⚡ 競合実行開始: ${tasks.length}件`);
    
    const promises = tasks.map(async task => {
      const startTime = Date.now();
      try {
        const result = await Promise.race([
          task.executor(),
          this.createTimeoutPromise<T>(3000) // 3秒タイムアウト
        ]);
        
        const executionTime = Date.now() - startTime;
        console.log(`✅ 最速完了: ${task.name} (${executionTime}ms)`);
        return result;
      } catch (error) {
        console.warn(`⚠️ 競合失敗: ${task.name}`, error);
        throw error;
      }
    });

    return Promise.any(promises);
  }

  /**
   * タイムアウト付き処理実行
   */
  private async executeWithTimeout<T>(
    task: ProcessingTask<T>
  ): Promise<ProcessingResult<T>> {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        task.executor(),
        this.createTimeoutPromise<T>(task.timeout)
      ]);
      
      const executionTime = Date.now() - startTime;
      
      const processResult: ProcessingResult<T> = {
        id: task.id,
        success: true,
        data: result,
        executionTime
      };
      
      this.completedTasks.push(processResult);
      console.log(`✅ タスク完了: ${task.name} (${executionTime}ms)`);
      
      return processResult;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const processResult: ProcessingResult<T> = {
        id: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      };
      
      this.completedTasks.push(processResult);
      console.error(`❌ タスク失敗: ${task.name} (${executionTime}ms)`, error);
      
      return processResult;
    }
  }

  /**
   * 次のタスク処理
   */
  private async processNext(): Promise<void> {
    // 同時実行数制限チェック
    if (this.activeProcesses.size >= this.MAX_CONCURRENT_TASKS) {
      return;
    }

    // キューからタスク取得
    const task = this.processingQueue.shift();
    if (!task) {
      return;
    }

    console.log(`🔄 タスク開始: ${task.name}`);
    
    // 処理開始
    const promise = this.executeWithTimeout(task);
    this.activeProcesses.set(task.id, promise);

    // 完了時のクリーンアップ
    promise.finally(() => {
      this.activeProcesses.delete(task.id);
      this.processNext(); // 次のタスクを処理
    });
  }

  /**
   * タスク完了待機
   */
  private async waitForTasks<T>(taskIds: string[]): Promise<ProcessingResult<T>[]> {
    const checkInterval = 100; // 100ms間隔でチェック
    
    while (true) {
      const completedIds = this.completedTasks
        .filter(task => taskIds.includes(task.id))
        .map(task => task.id);
      
      // すべてのタスクが完了したかチェック
      if (completedIds.length === taskIds.length) {
        return this.completedTasks.filter(task => taskIds.includes(task.id)) as ProcessingResult<T>[];
      }
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }

  /**
   * 優先度に基づく挿入位置決定
   */
  private findInsertPosition(priority: 'low' | 'medium' | 'high' | 'critical'): number {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const targetPriority = priorityOrder[priority];
    
    for (let i = 0; i < this.processingQueue.length; i++) {
      const queuePriority = priorityOrder[this.processingQueue[i].priority];
      if (queuePriority > targetPriority) {
        return i;
      }
    }
    
    return this.processingQueue.length;
  }

  /**
   * タイムアウトプロミス生成
   */
  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`処理がタイムアウトしました (${timeout}ms)`));
      }, timeout);
    });
  }

  /**
   * 統計情報取得
   */
  getStatistics() {
    const completed = this.completedTasks;
    const successful = completed.filter(task => task.success);
    const failed = completed.filter(task => !task.success);
    
    const executionTimes = successful.map(task => task.executionTime);
    const averageTime = executionTimes.length > 0 ? 
      executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length : 0;
    
    return {
      totalTasks: completed.length,
      successfulTasks: successful.length,
      failedTasks: failed.length,
      successRate: completed.length > 0 ? successful.length / completed.length : 0,
      averageExecutionTime: averageTime,
      activeTasks: this.activeProcesses.size,
      queuedTasks: this.processingQueue.length,
      maxConcurrentTasks: this.MAX_CONCURRENT_TASKS
    };
  }

  /**
   * リセット
   */
  reset(): void {
    this.processingQueue = [];
    this.activeProcesses.clear();
    this.completedTasks = [];
    
    console.log('🔄 Concurrent Processor リセット完了');
  }

  /**
   * 緊急停止
   */
  emergency(): void {
    console.log('🚨 緊急停止実行中...');
    
    // すべての処理を停止
    this.processingQueue = [];
    this.activeProcesses.clear();
    
    console.log('🛑 Concurrent Processor 緊急停止完了');
  }
}

// シングルトンインスタンス
export const concurrentProcessor = ConcurrentProcessor.getInstance();