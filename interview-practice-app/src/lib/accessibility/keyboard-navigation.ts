/**
 * キーボードナビゲーション管理
 * カスタムキーボードショートカットとナビゲーション
 */

export interface KeyboardShortcut {
  id: string;
  keys: string[]; // 例: ['Ctrl', 'Shift', 'S']
  action: (event: KeyboardEvent) => void;
  description: string;
  contexts?: string[]; // 特定のコンテキストでのみ有効
  preventDefault?: boolean;
  enabled?: boolean;
}

export interface NavigationContext {
  id: string;
  name: string;
  shortcuts: KeyboardShortcut[];
  isActive: boolean;
}

class KeyboardNavigationManager {
  private static instance: KeyboardNavigationManager;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private contexts: Map<string, NavigationContext> = new Map();
  private activeContexts: Set<string> = new Set();
  private pressedKeys: Set<string> = new Set();
  private isEnabled = true;

  static getInstance(): KeyboardNavigationManager {
    if (!KeyboardNavigationManager.instance) {
      KeyboardNavigationManager.instance = new KeyboardNavigationManager();
    }
    return KeyboardNavigationManager.instance;
  }

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    this.setupEventListeners();
    this.registerDefaultShortcuts();
  }

  private setupEventListeners(): void {
    // キー押下の追跡
    document.addEventListener('keydown', (event) => {
      this.pressedKeys.add(this.normalizeKey(event.key));
      this.pressedKeys.add(this.normalizeKey(event.code));
      
      if (event.ctrlKey) this.pressedKeys.add('Ctrl');
      if (event.shiftKey) this.pressedKeys.add('Shift');
      if (event.altKey) this.pressedKeys.add('Alt');
      if (event.metaKey) this.pressedKeys.add('Meta');

      this.handleKeyDown(event);
    });

    document.addEventListener('keyup', (event) => {
      this.pressedKeys.delete(this.normalizeKey(event.key));
      this.pressedKeys.delete(this.normalizeKey(event.code));
      
      if (!event.ctrlKey) this.pressedKeys.delete('Ctrl');
      if (!event.shiftKey) this.pressedKeys.delete('Shift');
      if (!event.altKey) this.pressedKeys.delete('Alt');
      if (!event.metaKey) this.pressedKeys.delete('Meta');
    });

    // ウィンドウフォーカス変更時にキー状態をクリア
    window.addEventListener('blur', () => {
      this.pressedKeys.clear();
    });
  }

  private normalizeKey(key: string): string {
    const keyMap: Record<string, string> = {
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'Escape': 'Esc',
      ' ': 'Space',
      'Control': 'Ctrl',
      'Cmd': 'Meta',
    };

    return keyMap[key] || key;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // ショートカットをチェック
    Array.from(this.shortcuts.entries()).forEach(([id, shortcut]) => {
      if (!shortcut.enabled) return;
      
      // コンテキストチェック
      if (shortcut.contexts && shortcut.contexts.length > 0) {
        const hasActiveContext = shortcut.contexts.some(context => 
          this.activeContexts.has(context)
        );
        if (!hasActiveContext) return;
      }

      // キーマッチング
      if (this.isShortcutMatch(shortcut.keys)) {
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        
        shortcut.action(event);
        return;
      }
    });

    // デフォルトキーボードナビゲーション
    this.handleDefaultNavigation(event);
  }

  private isShortcutMatch(keys: string[]): boolean {
    if (keys.length !== this.pressedKeys.size) return false;
    
    return keys.every(key => this.pressedKeys.has(key));
  }

  private handleDefaultNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // フォーム要素での特別な処理
    if (this.isFormElement(target)) {
      this.handleFormElementNavigation(event, target);
    }

    // リスト・メニューナビゲーション
    if (target.getAttribute('role') === 'listbox' || 
        target.getAttribute('role') === 'menu' ||
        target.closest('[role="listbox"]') ||
        target.closest('[role="menu"]')) {
      this.handleListNavigation(event, target);
    }

    // タブナビゲーション
    if (target.getAttribute('role') === 'tab' || target.closest('[role="tablist"]')) {
      this.handleTabNavigation(event, target);
    }
  }

  private isFormElement(element: HTMLElement): boolean {
    const formTags = ['input', 'textarea', 'select', 'button'];
    return formTags.includes(element.tagName.toLowerCase()) ||
           element.getAttribute('contenteditable') === 'true';
  }

  private handleFormElementNavigation(event: KeyboardEvent, target: HTMLElement): void {
    switch (event.key) {
      case 'Tab':
        // デフォルトのTab動作を許可
        break;
      case 'Enter':
        if (target.tagName.toLowerCase() === 'button' || target.getAttribute('role') === 'button') {
          target.click();
        }
        break;
      case 'Escape':
        target.blur();
        break;
    }
  }

  private handleListNavigation(event: KeyboardEvent, target: HTMLElement): void {
    const listContainer = target.closest('[role="listbox"], [role="menu"]') as HTMLElement;
    if (!listContainer) return;

    const items = Array.from(listContainer.querySelectorAll('[role="option"], [role="menuitem"]')) as HTMLElement[];
    const currentIndex = items.indexOf(target);

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        target.click();
        return;
      case 'Escape':
        event.preventDefault();
        listContainer.focus();
        return;
    }

    if (nextIndex !== currentIndex && items[nextIndex]) {
      items[nextIndex].focus();
    }
  }

  private handleTabNavigation(event: KeyboardEvent, target: HTMLElement): void {
    const tabList = target.closest('[role="tablist"]') as HTMLElement;
    if (!tabList) return;

    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]')) as HTMLElement[];
    const currentIndex = tabs.indexOf(target);

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = tabs.length - 1;
        break;
    }

    if (nextIndex !== currentIndex && tabs[nextIndex]) {
      tabs[nextIndex].focus();
      tabs[nextIndex].click(); // タブを自動的にアクティブ化
    }
  }

  /**
   * ショートカットを登録
   */
  public registerShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.id, {
      ...shortcut,
      enabled: shortcut.enabled !== false,
      preventDefault: shortcut.preventDefault !== false,
    });
  }

  /**
   * ショートカットを削除
   */
  public unregisterShortcut(id: string): void {
    this.shortcuts.delete(id);
  }

  /**
   * コンテキストを登録
   */
  public registerContext(context: NavigationContext): void {
    this.contexts.set(context.id, context);
    
    // コンテキストのショートカットを登録
    context.shortcuts.forEach(shortcut => {
      shortcut.contexts = shortcut.contexts || [];
      if (!shortcut.contexts.includes(context.id)) {
        shortcut.contexts.push(context.id);
      }
      this.registerShortcut(shortcut);
    });
  }

  /**
   * コンテキストをアクティブ化
   */
  public activateContext(contextId: string): void {
    this.activeContexts.add(contextId);
    const context = this.contexts.get(contextId);
    if (context) {
      context.isActive = true;
    }
  }

  /**
   * コンテキストを非アクティブ化
   */
  public deactivateContext(contextId: string): void {
    this.activeContexts.delete(contextId);
    const context = this.contexts.get(contextId);
    if (context) {
      context.isActive = false;
    }
  }

  /**
   * デフォルトショートカットの登録
   */
  private registerDefaultShortcuts(): void {
    // アプリケーション全体のショートカット
    this.registerShortcut({
      id: 'toggle-accessibility-help',
      keys: ['Ctrl', 'Shift', 'H'],
      action: () => this.showAccessibilityHelp(),
      description: 'アクセシビリティヘルプを表示',
      preventDefault: true,
    });

    this.registerShortcut({
      id: 'skip-to-main',
      keys: ['Ctrl', 'Shift', 'M'],
      action: () => this.skipToMain(),
      description: 'メインコンテンツにスキップ',
      preventDefault: true,
    });

    this.registerShortcut({
      id: 'toggle-high-contrast',
      keys: ['Ctrl', 'Shift', 'C'],
      action: () => this.toggleHighContrast(),
      description: 'ハイコントラストモードの切替',
      preventDefault: true,
    });

    // 面接練習特有のショートカット
    this.registerShortcut({
      id: 'start-recording',
      keys: ['Ctrl', 'R'],
      action: (event) => this.triggerRecording(event),
      description: '録音開始/停止',
      contexts: ['interview'],
      preventDefault: true,
    });

    this.registerShortcut({
      id: 'next-question',
      keys: ['Ctrl', 'N'],
      action: () => this.nextQuestion(),
      description: '次の質問',
      contexts: ['interview'],
      preventDefault: true,
    });

    this.registerShortcut({
      id: 'previous-question',
      keys: ['Ctrl', 'P'],
      action: () => this.previousQuestion(),
      description: '前の質問',
      contexts: ['interview'],
      preventDefault: true,
    });
  }

  /**
   * アクセシビリティヘルプを表示
   */
  private showAccessibilityHelp(): void {
    const helpDialog = this.createHelpDialog();
    document.body.appendChild(helpDialog);
    
    // ダイアログにフォーカス
    const firstFocusable = helpDialog.querySelector('button') as HTMLElement;
    firstFocusable?.focus();
  }

  private createHelpDialog(): HTMLElement {
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-labelledby', 'help-title');
    dialog.setAttribute('aria-modal', 'true');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    const content = document.createElement('div');
    content.className = 'bg-white rounded-lg p-6 max-w-2xl max-h-96 overflow-y-auto';

    const title = document.createElement('h2');
    title.id = 'help-title';
    title.textContent = 'キーボードショートカット';
    title.className = 'text-xl font-bold mb-4';

    const shortcutList = document.createElement('ul');
    shortcutList.className = 'space-y-2 mb-4';

    // アクティブなショートカットをリスト化
    Array.from(this.shortcuts.entries()).forEach(([id, shortcut]) => {
      if (!shortcut.enabled) return;
      
      const item = document.createElement('li');
      item.className = 'flex justify-between';
      
      const keys = document.createElement('span');
      keys.textContent = shortcut.keys.join(' + ');
      keys.className = 'font-mono bg-gray-100 px-2 py-1 rounded';
      
      const description = document.createElement('span');
      description.textContent = shortcut.description;
      
      item.appendChild(keys);
      item.appendChild(description);
      shortcutList.appendChild(item);
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = '閉じる';
    closeButton.className = 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });

    content.appendChild(title);
    content.appendChild(shortcutList);
    content.appendChild(closeButton);
    dialog.appendChild(content);

    // Escapeキーで閉じる
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        document.body.removeChild(dialog);
      }
    });

    return dialog;
  }

  private skipToMain(): void {
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (main) {
      (main as HTMLElement).focus();
    }
  }

  private toggleHighContrast(): void {
    document.body.classList.toggle('high-contrast');
  }

  private triggerRecording(event: KeyboardEvent): void {
    const recordButton = document.querySelector('[data-testid="record-button"]') as HTMLElement;
    recordButton?.click();
  }

  private nextQuestion(): void {
    const nextButton = document.querySelector('[data-testid="next-question"]') as HTMLElement;
    nextButton?.click();
  }

  private previousQuestion(): void {
    const prevButton = document.querySelector('[data-testid="prev-question"]') as HTMLElement;
    prevButton?.click();
  }

  /**
   * キーボードナビゲーションを有効/無効化
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * 現在の状態を取得
   */
  public getState(): {
    isEnabled: boolean;
    activeContexts: string[];
    registeredShortcuts: number;
    pressedKeys: string[];
  } {
    return {
      isEnabled: this.isEnabled,
      activeContexts: Array.from(this.activeContexts),
      registeredShortcuts: this.shortcuts.size,
      pressedKeys: Array.from(this.pressedKeys),
    };
  }
}

// シングルトンインスタンス
export const keyboardNavigation = KeyboardNavigationManager.getInstance();

/**
 * React フック版
 */
export function useKeyboardNavigation() {
  const manager = KeyboardNavigationManager.getInstance();

  return {
    registerShortcut: manager.registerShortcut.bind(manager),
    unregisterShortcut: manager.unregisterShortcut.bind(manager),
    activateContext: manager.activateContext.bind(manager),
    deactivateContext: manager.deactivateContext.bind(manager),
    setEnabled: manager.setEnabled.bind(manager),
    getState: manager.getState.bind(manager),
  };
}