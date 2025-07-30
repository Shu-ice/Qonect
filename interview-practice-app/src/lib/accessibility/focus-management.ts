/**
 * フォーカス管理システム
 * キーボードナビゲーションとスクリーンリーダー対応
 */

export class FocusManager {
  private static instance: FocusManager;
  private focusHistory: HTMLElement[] = [];
  private trapStack: HTMLElement[] = [];
  private isTrappingFocus = false;
  private lastActiveElement: HTMLElement | null = null;

  static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager();
    }
    return FocusManager.instance;
  }

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // フォーカス移動の追跡
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target && target !== this.lastActiveElement) {
        this.updateFocusHistory(target);
        this.lastActiveElement = target;
      }
    });

    // Escキーでフォーカストラップを解除
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isTrappingFocus) {
        this.releaseLastTrap();
      }
    });
  }

  /**
   * フォーカス履歴を更新
   */
  private updateFocusHistory(element: HTMLElement): void {
    // フォーカストラップ中は履歴を更新しない
    if (this.isTrappingFocus) return;

    this.focusHistory.push(element);
    
    // 履歴を最新20件まで保持
    if (this.focusHistory.length > 20) {
      this.focusHistory.shift();
    }
  }

  /**
   * 要素にフォーカスを設定
   */
  public focusElement(element: HTMLElement | null, options?: FocusOptions): boolean {
    if (!element) return false;

    try {
      element.focus(options);
      return document.activeElement === element;
    } catch {
      return false;
    }
  }

  /**
   * セレクターでフォーカスを設定
   */
  public focusSelector(selector: string, container?: HTMLElement): boolean {
    const element = (container || document).querySelector(selector) as HTMLElement;
    return this.focusElement(element);
  }

  /**
   * フォーカス可能な要素を取得
   */
  public getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      'iframe',
      'audio[controls]',
      'video[controls]',
      'details summary',
    ];

    const elements = container.querySelectorAll(focusableSelectors.join(',')) as NodeListOf<HTMLElement>;
    
    return Array.from(elements).filter(element => {
      return this.isElementVisible(element) && this.isElementFocusable(element);
    });
  }

  /**
   * 要素が見える状態かチェック
   */
  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  /**
   * 要素がフォーカス可能かチェック
   */
  private isElementFocusable(element: HTMLElement): boolean {
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex === '-1') return false;

    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }

    return true;
  }

  /**
   * フォーカストラップを設定
   */
  public trapFocus(container: HTMLElement): void {
    if (!container) return;

    this.trapStack.push(container);
    this.isTrappingFocus = true;

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // 最初の要素にフォーカス
    this.focusElement(firstElement);

    // Tab/Shift+Tabの処理
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const currentFocusableElements = this.getFocusableElements(container);
      const firstFocusable = currentFocusableElements[0];
      const lastFocusable = currentFocusableElements[currentFocusableElements.length - 1];

      if (event.shiftKey) {
        // Shift+Tab: 前の要素へ
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          this.focusElement(lastFocusable);
        }
      } else {
        // Tab: 次の要素へ
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          this.focusElement(firstFocusable);
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // トラップ解除時のクリーンアップ用にイベントリスナーを保存
    (container as any)._focusTrapHandler = handleTabKey;
  }

  /**
   * 最後のフォーカストラップを解除
   */
  public releaseLastTrap(): void {
    const container = this.trapStack.pop();
    if (!container) return;

    const handler = (container as any)._focusTrapHandler;
    if (handler) {
      container.removeEventListener('keydown', handler);
      delete (container as any)._focusTrapHandler;
    }

    this.isTrappingFocus = this.trapStack.length > 0;

    // 前のフォーカス位置に戻る
    this.restorePreviousFocus();
  }

  /**
   * 全てのフォーカストラップを解除
   */
  public releaseAllTraps(): void {
    while (this.trapStack.length > 0) {
      this.releaseLastTrap();
    }
  }

  /**
   * 前のフォーカス位置に戻る
   */
  public restorePreviousFocus(): void {
    // 履歴から現在のトラップ要素以外の最新の要素を探す
    for (let i = this.focusHistory.length - 1; i >= 0; i--) {
      const element = this.focusHistory[i];
      if (element && 
          document.contains(element) && 
          this.isElementVisible(element) &&
          this.isElementFocusable(element) &&
          !this.isElementInCurrentTrap(element)) {
        this.focusElement(element);
        return;
      }
    }

    // 適切な要素が見つからない場合は body にフォーカス
    document.body.focus();
  }

  /**
   * 要素が現在のフォーカストラップ内にあるかチェック
   */
  private isElementInCurrentTrap(element: HTMLElement): boolean {
    if (this.trapStack.length === 0) return false;
    
    const currentTrap = this.trapStack[this.trapStack.length - 1];
    return currentTrap.contains(element);
  }

  /**
   * 次/前のフォーカス可能要素を取得
   */
  public getNextFocusableElement(current: HTMLElement, direction: 'next' | 'previous' = 'next'): HTMLElement | null {
    const container = this.trapStack.length > 0 ? this.trapStack[this.trapStack.length - 1] : document.body;
    const focusableElements = this.getFocusableElements(container);
    
    const currentIndex = focusableElements.indexOf(current);
    if (currentIndex === -1) return null;

    if (direction === 'next') {
      return focusableElements[currentIndex + 1] || focusableElements[0];
    } else {
      return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
    }
  }

  /**
   * 指定方向の次のフォーカス可能要素にフォーカス
   */
  public moveFocus(direction: 'next' | 'previous' | 'first' | 'last', container?: HTMLElement): boolean {
    const focusContainer = container || (this.trapStack.length > 0 ? this.trapStack[this.trapStack.length - 1] : document.body);
    const focusableElements = this.getFocusableElements(focusContainer);
    
    if (focusableElements.length === 0) return false;

    let targetElement: HTMLElement | null = null;

    switch (direction) {
      case 'first':
        targetElement = focusableElements[0];
        break;
      case 'last':
        targetElement = focusableElements[focusableElements.length - 1];
        break;
      case 'next':
      case 'previous':
        const currentElement = document.activeElement as HTMLElement;
        targetElement = this.getNextFocusableElement(currentElement, direction);
        break;
    }

    return targetElement ? this.focusElement(targetElement) : false;
  }

  /**
   * ARIA属性を使用した関連要素へのフォーカス
   */
  public focusRelatedElement(element: HTMLElement, relationship: string): boolean {
    const relatedId = element.getAttribute(`aria-${relationship}`);
    if (!relatedId) return false;

    const relatedElement = document.getElementById(relatedId);
    return this.focusElement(relatedElement);
  }

  /**
   * フォーカス表示の強制
   */
  public showFocusIndicator(element: HTMLElement): void {
    element.style.outline = '2px solid #4F46E5';
    element.style.outlineOffset = '2px';
  }

  /**
   * フォーカス表示のクリア
   */
  public hideFocusIndicator(element: HTMLElement): void {
    element.style.outline = '';
    element.style.outlineOffset = '';
  }

  /**
   * スキップリンクの実装
   */
  public createSkipLink(targetSelector: string, text: string = 'メインコンテンツにスキップ'): HTMLElement {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetSelector.replace('#', '')}`;
    skipLink.textContent = text;
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded';
    
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.querySelector(targetSelector) as HTMLElement;
      if (target) {
        target.setAttribute('tabindex', '-1');
        this.focusElement(target);
        // フォーカス後にtabindexを削除
        target.addEventListener('blur', () => {
          target.removeAttribute('tabindex');
        }, { once: true });
      }
    });

    return skipLink;
  }

  /**
   * フォーカス状態のデバッグ情報
   */
  public getDebugInfo(): {
    currentFocus: string;
    focusHistory: string[];
    trapStack: string[];
    isTrapping: boolean;
  } {
    return {
      currentFocus: document.activeElement?.tagName || 'none',
      focusHistory: this.focusHistory.map(el => el.tagName).slice(-5),
      trapStack: this.trapStack.map(el => el.tagName),
      isTrapping: this.isTrappingFocus,
    };
  }
}

/**
 * フォーカス管理のReactフック
 */
export function useFocusManagement() {
  const focusManager = FocusManager.getInstance();

  return {
    focusElement: focusManager.focusElement.bind(focusManager),
    focusSelector: focusManager.focusSelector.bind(focusManager),
    trapFocus: focusManager.trapFocus.bind(focusManager),
    releaseTrap: focusManager.releaseLastTrap.bind(focusManager),
    restoreFocus: focusManager.restorePreviousFocus.bind(focusManager),
    moveFocus: focusManager.moveFocus.bind(focusManager),
    getFocusableElements: focusManager.getFocusableElements.bind(focusManager),
  };
}

// シングルトンインスタンス
export const focusManager = FocusManager.getInstance();