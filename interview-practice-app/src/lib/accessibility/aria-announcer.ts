/**
 * ARIA ライブリージョン管理
 * スクリーンリーダー用の動的コンテンツ通知
 */

export type AnnounceType = 'polite' | 'assertive' | 'status';

export interface AnnouncementOptions {
  type?: AnnounceType;
  delay?: number;
  clearPrevious?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

class AriaAnnouncer {
  private static instance: AriaAnnouncer;
  private announceContainers: Map<AnnounceType, HTMLElement> = new Map();
  private announceQueue: Array<{
    message: string;
    type: AnnounceType;
    priority: 'low' | 'medium' | 'high';
    timestamp: number;
  }> = [];
  private isProcessingQueue = false;

  static getInstance(): AriaAnnouncer {
    if (!AriaAnnouncer.instance) {
      AriaAnnouncer.instance = new AriaAnnouncer();
    }
    return AriaAnnouncer.instance;
  }

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // ライブリージョンコンテナを作成
    this.createLiveRegions();
  }

  private createLiveRegions(): void {
    const types: AnnounceType[] = ['polite', 'assertive', 'status'];

    types.forEach(type => {
      const container = document.createElement('div');
      container.setAttribute('aria-live', type === 'status' ? 'polite' : type);
      container.setAttribute('aria-atomic', 'true');
      container.setAttribute('aria-relevant', 'additions text');
      container.className = 'sr-only'; // スクリーンリーダー専用
      container.id = `aria-live-${type}`;
      
      // statusタイプの場合はrole="status"を追加
      if (type === 'status') {
        container.setAttribute('role', 'status');
      }

      document.body.appendChild(container);
      this.announceContainers.set(type, container);
    });
  }

  /**
   * メッセージをアナウンス
   */
  public announce(message: string, options: AnnouncementOptions = {}): void {
    if (!message.trim()) return;

    const {
      type = 'polite',
      delay = 0,
      clearPrevious = false,
      priority = 'medium'
    } = options;

    // 前のメッセージをクリア
    if (clearPrevious) {
      this.clearAnnouncements(type);
    }

    // キューに追加
    this.announceQueue.push({
      message: message.trim(),
      type,
      priority,
      timestamp: Date.now()
    });

    // 優先度でソート
    this.announceQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // 遅延実行
    setTimeout(() => {
      this.processQueue();
    }, delay);
  }

  /**
   * キューを処理してアナウンス実行
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.announceQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.announceQueue.length > 0) {
      const announcement = this.announceQueue.shift()!;
      await this.performAnnouncement(announcement);
      
      // アナウンス間に少し間隔を空ける
      await this.delay(200);
    }

    this.isProcessingQueue = false;
  }

  /**
   * 実際のアナウンス実行
   */
  private async performAnnouncement(announcement: {
    message: string;
    type: AnnounceType;
    priority: 'low' | 'medium' | 'high';
    timestamp: number;
  }): Promise<void> {
    const container = this.announceContainers.get(announcement.type);
    if (!container) return;

    // メッセージを設定
    container.textContent = announcement.message;

    // ログ出力（開発環境）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ARIA Announce] ${announcement.type.toUpperCase()}: ${announcement.message}`);
    }

    // 一定時間後にクリア（重複を防ぐため）
    setTimeout(() => {
      if (container.textContent === announcement.message) {
        container.textContent = '';
      }
    }, 1000);
  }

  /**
   * 指定タイプのアナウンスをクリア
   */
  public clearAnnouncements(type?: AnnounceType): void {
    if (type) {
      const container = this.announceContainers.get(type);
      if (container) {
        container.textContent = '';
      }
      // キューからも該当タイプを削除
      this.announceQueue = this.announceQueue.filter(item => item.type !== type);
    } else {
      // 全てクリア
      this.announceContainers.forEach(container => {
        container.textContent = '';
      });
      this.announceQueue = [];
    }
  }

  /**
   * フォーム関連のアナウンス
   */
  public announceFormError(fieldName: string, errorMessage: string): void {
    this.announce(`${fieldName}にエラーがあります: ${errorMessage}`, {
      type: 'assertive',
      priority: 'high'
    });
  }

  public announceFormSuccess(message: string = 'フォームが正常に送信されました'): void {
    this.announce(message, {
      type: 'status',
      priority: 'medium'
    });
  }

  /**
   * ナビゲーション関連のアナウンス
   */
  public announcePageChange(pageName: string): void {
    this.announce(`${pageName}ページに移動しました`, {
      type: 'polite',
      priority: 'medium'
    });
  }

  public announceRouteChange(routeName: string): void {
    this.announce(`${routeName}に移動しました`, {
      type: 'polite',
      delay: 500
    });
  }

  /**
   * データ読み込み関連のアナウンス
   */
  public announceLoading(message: string = 'データを読み込み中です'): void {
    this.announce(message, {
      type: 'polite',
      priority: 'low'
    });
  }

  public announceLoadComplete(itemCount?: number): void {
    const message = itemCount 
      ? `${itemCount}件のデータを読み込みました`
      : 'データの読み込みが完了しました';
    
    this.announce(message, {
      type: 'status',
      priority: 'medium'
    });
  }

  /**
   * 面接練習特有のアナウンス
   */
  public announceInterviewStart(): void {
    this.announce('面接練習を開始します。質問に回答してください。', {
      type: 'assertive',
      priority: 'high'
    });
  }

  public announceQuestionChange(questionNumber: number, totalQuestions: number): void {
    this.announce(`質問${questionNumber}/${totalQuestions}が表示されました`, {
      type: 'polite',
      priority: 'medium'
    });
  }

  public announceTimeWarning(remainingTime: number): void {
    this.announce(`残り時間${remainingTime}秒です`, {
      type: 'assertive',
      priority: 'high'
    });
  }

  public announceAIFeedback(): void {
    this.announce('AIからのフィードバックが表示されました', {
      type: 'polite',
      priority: 'medium'
    });
  }

  /**
   * エラー・警告関連のアナウンス
   */
  public announceError(errorMessage: string): void {
    this.announce(`エラーが発生しました: ${errorMessage}`, {
      type: 'assertive',
      priority: 'high',
      clearPrevious: true
    });
  }

  public announceWarning(warningMessage: string): void {
    this.announce(`警告: ${warningMessage}`, {
      type: 'assertive',
      priority: 'medium'
    });
  }

  /**
   * 操作フィードバック
   */
  public announceAction(action: string, target?: string): void {
    const message = target ? `${target}を${action}しました` : `${action}しました`;
    this.announce(message, {
      type: 'status',
      priority: 'low'
    });
  }

  public announceSelection(itemName: string, position?: string): void {
    const message = position 
      ? `${position}の${itemName}を選択しました`
      : `${itemName}を選択しました`;
    
    this.announce(message, {
      type: 'polite',
      priority: 'low'
    });
  }

  /**
   * 動的コンテンツの変更
   */
  public announceContentUpdate(updateType: string, details?: string): void {
    const message = details 
      ? `${updateType}が更新されました: ${details}`
      : `${updateType}が更新されました`;
    
    this.announce(message, {
      type: 'polite',
      priority: 'low'
    });
  }

  /**
   * 遅延実行ヘルパー
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * デバッグ情報の取得
   */
  public getDebugInfo(): {
    queueLength: number;
    isProcessing: boolean;
    containers: string[];
  } {
    return {
      queueLength: this.announceQueue.length,
      isProcessing: this.isProcessingQueue,
      containers: Array.from(this.announceContainers.keys())
    };
  }
}

// シングルトンインスタンス
export const ariaAnnouncer = AriaAnnouncer.getInstance();

/**
 * React フック版
 */
export function useAriaAnnouncer() {
  const announcer = AriaAnnouncer.getInstance();

  return {
    announce: announcer.announce.bind(announcer),
    announceError: announcer.announceError.bind(announcer),
    announceSuccess: announcer.announceFormSuccess.bind(announcer),
    announceLoading: announcer.announceLoading.bind(announcer),
    announceLoadComplete: announcer.announceLoadComplete.bind(announcer),
    announcePageChange: announcer.announcePageChange.bind(announcer),
    announceAction: announcer.announceAction.bind(announcer),
    clear: announcer.clearAnnouncements.bind(announcer),
  };
}