/**
 * アクセシビリティライブラリのエントリーポイント
 * 全てのアクセシビリティ機能をエクスポート
 */

// フォーカス管理
export {
  FocusManager,
  focusManager,
  useFocusManagement,
} from './focus-management';

// ARIA アナウンサー
export {
  ariaAnnouncer,
  useAriaAnnouncer,
  type AnnounceType,
  type AnnouncementOptions,
} from './aria-announcer';

// キーボードナビゲーション
export {
  keyboardNavigation,
  useKeyboardNavigation,
  type KeyboardShortcut,
  type NavigationContext,
} from './keyboard-navigation';

// WCAG バリデーター
export {
  wcagValidator,
  type WCAGViolation,
  type AccessibilityAuditResult,
} from './wcag-validator';

// アクセシビリティプロバイダー
export {
  AccessibilityProvider,
  useAccessibility,
  AccessibilitySettings,
  type AccessibilityPreferences,
  type AccessibilityContextType,
} from '@/components/accessibility/AccessibilityProvider';

// ローカル型定義（フォールバック）
interface AccessibilityPreferencesLocal {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
  announcements: boolean;
}

/**
 * アクセシビリティシステムの初期化
 * アプリケーション起動時に呼び出す
 */
export async function initializeAccessibility(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // フォーカス管理の初期化
    const { focusManager: fm } = await import('./focus-management');
    
    // ARIAアナウンサーの初期化
    const { ariaAnnouncer: aa } = await import('./aria-announcer');
    
    // キーボードナビゲーションの初期化
    const { keyboardNavigation: kn } = await import('./keyboard-navigation');
    
    // スキップリンクの追加
    addSkipLinks(fm);

    // アクセシビリティ強化CSSの追加
    addAccessibilityStyles();

    console.log('Accessibility system initialized');
  } catch (error) {
    console.warn('Failed to initialize accessibility system:', error);
  }
}

/**
 * スキップリンクを動的に追加
 */
function addSkipLinks(fm?: any): void {
  const skipLinksContainer = document.createElement('div');
  skipLinksContainer.className = 'skip-links';
  skipLinksContainer.setAttribute('role', 'navigation');
  skipLinksContainer.setAttribute('aria-label', 'スキップナビゲーション');

  // メインコンテンツへのスキップリンク
  const skipToMain = createSkipLink('main', 'メインコンテンツにスキップ');
  skipLinksContainer.appendChild(skipToMain);

  // ナビゲーションへのスキップリンク
  const skipToNav = createSkipLink('nav', 'ナビゲーションにスキップ');
  skipLinksContainer.appendChild(skipToNav);

  // フォームへのスキップリンク（ページに存在する場合）
  if (document.querySelector('form')) {
    const skipToForm = createSkipLink('form', 'フォームにスキップ');
    skipLinksContainer.appendChild(skipToForm);
  }

  // body の最初に挿入
  document.body.insertBefore(skipLinksContainer, document.body.firstChild);
}

/**
 * スキップリンクを作成
 */
function createSkipLink(targetId: string, text: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.textContent = text;
  link.className = 'sr-only';
  
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId) || document.querySelector(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
  
  return link;
}

/**
 * アクセシビリティ強化のためのCSSスタイルを追加
 */
function addAccessibilityStyles(): void {
  const styles = document.createElement('style');
  styles.textContent = `
    /* スクリーンリーダー専用 */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* フォーカス時に表示 */
    .sr-only:focus {
      position: static;
      width: auto;
      height: auto;
      padding: 0.5rem;
      margin: 0;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }

    /* スキップリンク */
    .skip-links {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
    }

    .skip-links a {
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 0 0 4px 4px;
      font-weight: bold;
      transition: top 0.3s;
    }

    .skip-links a:focus {
      top: 0;
    }

    /* 高コントラストモード */
    .high-contrast {
      filter: contrast(150%);
    }

    .high-contrast * {
      background-color: white !important;
      color: black !important;
      border-color: black !important;
    }

    .high-contrast a {
      color: #0000FF !important;
    }

    .high-contrast a:visited {
      color: #800080 !important;
    }

    /* 大きなテキスト */
    .large-text {
      font-size: 120% !important;
      line-height: 1.6 !important;
    }

    /* アニメーション減少 */
    .reduced-motion *,
    .reduced-motion *::before,
    .reduced-motion *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }

    /* フォーカス表示の強化 */
    .keyboard-navigation *:focus {
      outline: var(--focus-outline-width, 2px) solid var(--focus-outline-color, #4F46E5) !important;
      outline-offset: 2px !important;
    }

    /* タッチターゲットサイズの確保 */
    button, 
    a, 
    input[type="button"], 
    input[type="submit"], 
    [role="button"] {
      min-height: 44px;
      min-width: 44px;
    }

    /* フォーム要素の改善 */
    input:invalid {
      border-color: #DC2626;
      background-color: #FEF2F2;
    }

    input[aria-invalid="true"] {
      border-color: #DC2626;
      background-color: #FEF2F2;
    }

    /* 必須フィールドの表示 */
    [aria-required="true"]::after,
    [required]::after {
      content: " *";
      color: #DC2626;
      font-weight: bold;
    }

    /* エラーメッセージのスタイル */
    [role="alert"],
    .error-message {
      color: #DC2626;
      font-weight: bold;
      margin-top: 0.25rem;
    }

    /* ライブリージョンの基本スタイル */
    [aria-live] {
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }

    /* ツールチップの改善 */
    [role="tooltip"] {
      background: #000;
      color: #fff;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      max-width: 200px;
      z-index: 1000;
    }

    /* プログレスバーの改善 */
    [role="progressbar"] {
      background-color: #E5E7EB;
      border-radius: 4px;
      overflow: hidden;
    }

    /* テーブルの改善 */
    table {
      border-collapse: collapse;
    }

    th {
      background-color: #F3F4F6;
      font-weight: bold;
      text-align: left;
    }

    th, td {
      border: 1px solid #D1D5DB;
      padding: 0.5rem;
    }

    /* モーダルの改善 */
    [role="dialog"],
    [role="alertdialog"] {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #374151;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-height: 90vh;
      overflow-y: auto;
      z-index: 1000;
    }

    /* オーバーレイ */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }
  `;

  document.head.appendChild(styles);
}

/**
 * アクセシビリティ監査の実行
 */
export async function runAccessibilityAudit(container?: HTMLElement) {
  try {
    const { wcagValidator } = await import('./wcag-validator');
    return wcagValidator.auditPage(container);
  } catch (error) {
    console.warn('Failed to run accessibility audit:', error);
    return { violations: [], warnings: [], score: 0 };
  }
}

/**
 * アクセシビリティ設定の取得
 */
export function getAccessibilityPreferences(): AccessibilityPreferencesLocal | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem('accessibility-preferences');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * アクセシビリティ設定の保存
 */
export function saveAccessibilityPreferences(preferences: AccessibilityPreferencesLocal): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save accessibility preferences:', error);
  }
}

/**
 * アクセシビリティ機能の有効性チェック
 */
export function checkAccessibilitySupport(): {
  hasScreenReader: boolean;
  hasKeyboardNavigation: boolean;
  hasHighContrast: boolean;
  hasReducedMotion: boolean;
  hasAccessibilityAPI: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      hasScreenReader: false,
      hasKeyboardNavigation: false,
      hasHighContrast: false,
      hasReducedMotion: false,
      hasAccessibilityAPI: false,
    };
  }

  return {
    hasScreenReader: !!(window as any).speechSynthesis,
    hasKeyboardNavigation: true, // キーボードナビゲーションは常に利用可能
    hasHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
    hasReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hasAccessibilityAPI: !!(document as any).elementsFromPoint,
  };
}

/**
 * アクセシビリティのデバッグ情報を取得
 */
export async function getAccessibilityDebugInfo() {
  try {
    const { focusManager: fm } = await import('./focus-management');
    const { ariaAnnouncer: aa } = await import('./aria-announcer');
    const { keyboardNavigation: kn } = await import('./keyboard-navigation');
    
    return {
      focusManager: fm?.getDebugInfo?.() || 'Not available',
      ariaAnnouncer: aa?.getDebugInfo?.() || 'Not available',
      keyboardNavigation: kn?.getState?.() || 'Not available',
      support: checkAccessibilitySupport(),
    };
  } catch (error) {
    return {
      error: 'Failed to load accessibility modules',
      support: checkAccessibilitySupport(),
    };
  }
}

/**
 * アクセシビリティ設定のプリセット
 */
export const accessibilityPresets: Record<string, AccessibilityPreferencesLocal> = {
  // スクリーンリーダー用
  screenReader: {
    reducedMotion: true,
    highContrast: false,
    largeText: false,
    keyboardNavigation: true,
    screenReader: true,
    announcements: true,
  },

  // 視覚障害者用
  visualImpairment: {
    reducedMotion: false,
    highContrast: true,
    largeText: true,
    keyboardNavigation: true,
    screenReader: false,
    announcements: true,
  },

  // 運動障害者用
  motorImpairment: {
    reducedMotion: true,
    highContrast: false,
    largeText: true,
    keyboardNavigation: true,
    screenReader: false,
    announcements: false,
  },

  // 認知障害者用
  cognitiveImpairment: {
    reducedMotion: true,
    highContrast: false,
    largeText: true,
    keyboardNavigation: true,
    screenReader: false,
    announcements: true,
  },

  // デフォルト
  default: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    keyboardNavigation: true,
    screenReader: false,
    announcements: true,
  },
};