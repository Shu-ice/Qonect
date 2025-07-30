/**
 * アクセシビリティプロバイダー
 * アプリケーション全体のアクセシビリティ機能を管理
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { focusManager } from '@/lib/accessibility/focus-management';
import { ariaAnnouncer } from '@/lib/accessibility/aria-announcer';
import { keyboardNavigation } from '@/lib/accessibility/keyboard-navigation';

export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
  announcements: boolean;
}

export interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreference: (key: keyof AccessibilityPreferences, value: boolean) => void;
  announce: (message: string, type?: 'polite' | 'assertive' | 'status') => void;
  focusElement: (element: HTMLElement | null) => boolean;
  isScreenReaderActive: boolean;
  isTouchDevice: boolean;
  isHighContrastMode: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    keyboardNavigation: true,
    screenReader: false,
    announcements: true,
  });

  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHighContrastMode, setIsHighContrastMode] = useState(false);

  // 初期化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ユーザー設定の読み込み
    loadUserPreferences();

    // システム設定の検出
    detectSystemPreferences();

    // デバイス種別の検出
    detectDeviceCapabilities();

    // スクリーンリーダーの検出
    detectScreenReader();

    // アクセシビリティ設定の適用
    applyAccessibilitySettings();

    // イベントリスナーの設定
    setupEventListeners();

  }, []);

  // 設定変更時の処理
  useEffect(() => {
    applyAccessibilitySettings();
    saveUserPreferences();
  }, [preferences]);

  const loadUserPreferences = () => {
    try {
      const saved = localStorage.getItem('accessibility-preferences');
      if (saved) {
        const savedPreferences = JSON.parse(saved);
        setPreferences(prev => ({ ...prev, ...savedPreferences }));
      }
    } catch (error) {
      console.warn('Failed to load accessibility preferences:', error);
    }
  };

  const saveUserPreferences = () => {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  };

  const detectSystemPreferences = () => {
    if (typeof window === 'undefined') return;

    // prefers-reduced-motion の検出
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPreferences(prev => ({ ...prev, reducedMotion: reducedMotionQuery.matches }));

    // prefers-contrast の検出
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrastMode(highContrastQuery.matches);
    setPreferences(prev => ({ ...prev, highContrast: highContrastQuery.matches }));

    // リスナーの設定
    reducedMotionQuery.addEventListener('change', (e) => {
      setPreferences(prev => ({ ...prev, reducedMotion: e.matches }));
    });

    highContrastQuery.addEventListener('change', (e) => {
      setIsHighContrastMode(e.matches);
      setPreferences(prev => ({ ...prev, highContrast: e.matches }));
    });
  };

  const detectDeviceCapabilities = () => {
    if (typeof window === 'undefined') return;

    // タッチデバイスの検出
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);

    // ポインタデバイスの検出
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    if (coarsePointer.matches) {
      setIsTouchDevice(true);
    }
  };

  const detectScreenReader = () => {
    if (typeof window === 'undefined') return;

    // スクリーンリーダーの一般的な検出方法
    let screenReaderDetected = false;

    // 1. User Agentベースの検出
    const userAgent = navigator.userAgent.toLowerCase();
    const screenReaderUAs = ['nvda', 'jaws', 'dragon', 'zoomtext', 'fusion', 'webkit2'];
    screenReaderDetected = screenReaderUAs.some(sr => userAgent.includes(sr));

    // 2. アクセシビリティAPIの存在確認
    if ((window as any).speechSynthesis || (window as any).SpeechSynthesisUtterance) {
      // 音声合成APIが利用可能（間接的な指標）
    }

    // 3. キーボードナビゲーションパターンの検出
    let keyboardNavigationDetected = false;
    const detectKeyboardUsage = () => {
      keyboardNavigationDetected = true;
      document.removeEventListener('keydown', detectKeyboardUsage);
    };
    document.addEventListener('keydown', detectKeyboardUsage);

    // 4. フォーカス表示の検出
    const detectFocusUsage = () => {
      screenReaderDetected = true;
      setIsScreenReaderActive(true);
      setPreferences(prev => ({ ...prev, screenReader: true }));
    };

    // 最初のTab押下でスクリーンリーダー使用を仮定
    let tabPressed = false;
    const handleTabPress = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !tabPressed) {
        tabPressed = true;
        detectFocusUsage();
        document.removeEventListener('keydown', handleTabPress);
      }
    };
    document.addEventListener('keydown', handleTabPress);

    setIsScreenReaderActive(screenReaderDetected);
  };

  const applyAccessibilitySettings = () => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // CSSカスタムプロパティの設定
    root.style.setProperty('--motion-duration', preferences.reducedMotion ? '0s' : '0.3s');
    root.style.setProperty('--motion-scale', preferences.reducedMotion ? '1' : '1.05');

    // CSSクラスの適用
    root.classList.toggle('reduced-motion', preferences.reducedMotion);
    root.classList.toggle('high-contrast', preferences.highContrast);
    root.classList.toggle('large-text', preferences.largeText);
    root.classList.toggle('keyboard-navigation', preferences.keyboardNavigation);
    root.classList.toggle('screen-reader-active', preferences.screenReader);

    // キーボードナビゲーションの有効/無効
    keyboardNavigation.setEnabled(preferences.keyboardNavigation);

    // フォーカス表示の強化
    if (preferences.keyboardNavigation || preferences.screenReader) {
      root.style.setProperty('--focus-outline-width', '3px');
      root.style.setProperty('--focus-outline-color', '#4F46E5');
    } else {
      root.style.setProperty('--focus-outline-width', '2px');
      root.style.setProperty('--focus-outline-color', '#94A3B8');
    }
  };

  const setupEventListeners = () => {
    if (typeof window === 'undefined') return;

    // ページ読み込み完了時の通知
    const announcePageLoad = () => {
      if (preferences.announcements) {
        ariaAnnouncer.announce('ページの読み込みが完了しました', { type: 'polite' });
      }
    };

    if (document.readyState === 'complete') {
      announcePageLoad();
    } else {
      window.addEventListener('load', announcePageLoad, { once: true });
    }

    // ルート変更の検出（Next.js）
    let currentPath = window.location.pathname;
    const checkPathChange = () => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        if (preferences.announcements) {
          ariaAnnouncer.announcePageChange(document.title);
        }
      }
    };

    // URLの変更を監視
    window.addEventListener('popstate', checkPathChange);
    
    // SPAナビゲーション用のMutationObserver
    const observer = new MutationObserver(() => {
      checkPathChange();
    });
    
    observer.observe(document.head, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.removeEventListener('popstate', checkPathChange);
      observer.disconnect();
    };
  };

  const updatePreference = (key: keyof AccessibilityPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    
    // 設定変更を通知
    if (preferences.announcements) {
      const setting = key === 'reducedMotion' ? 'アニメーション減少' :
                     key === 'highContrast' ? 'ハイコントラスト' :
                     key === 'largeText' ? '大きなテキスト' :
                     key === 'keyboardNavigation' ? 'キーボードナビゲーション' :
                     key === 'screenReader' ? 'スクリーンリーダー' :
                     key === 'announcements' ? '音声通知' : '設定';
      
      const action = value ? '有効' : '無効';
      ariaAnnouncer.announce(`${setting}を${action}にしました`, { type: 'polite' });
    }
  };

  const announce = (message: string, type: 'polite' | 'assertive' | 'status' = 'polite') => {
    if (preferences.announcements) {
      ariaAnnouncer.announce(message, { type });
    }
  };

  const focusElement = (element: HTMLElement | null): boolean => {
    return focusManager.focusElement(element);
  };

  const contextValue: AccessibilityContextType = {
    preferences,
    updatePreference,
    announce,
    focusElement,
    isScreenReaderActive,
    isTouchDevice,
    isHighContrastMode,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

/**
 * アクセシビリティ設定パネル用のコンポーネント
 */
export function AccessibilitySettings() {
  const { preferences, updatePreference } = useAccessibility();

  const settings = [
    {
      key: 'reducedMotion' as const,
      label: 'アニメーションを減らす',
      description: 'ページアニメーションと動きを最小限にします',
    },
    {
      key: 'highContrast' as const,
      label: 'ハイコントラストモード',
      description: 'テキストと背景のコントラストを高めます',
    },
    {
      key: 'largeText' as const,
      label: '大きなテキスト',
      description: 'フォントサイズを大きくします',
    },
    {
      key: 'keyboardNavigation' as const,
      label: 'キーボードナビゲーション',
      description: 'キーボードでのナビゲーションを強化します',
    },
    {
      key: 'announcements' as const,
      label: '音声通知',
      description: 'スクリーンリーダー用の音声通知を有効にします',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">アクセシビリティ設定</h2>
      
      {settings.map((setting) => (
        <div key={setting.key} className="flex items-start space-x-3">
          <input
            type="checkbox"
            id={setting.key}
            checked={preferences[setting.key]}
            onChange={(e) => updatePreference(setting.key, e.target.checked)}
            className="mt-1"
          />
          <div className="flex-1">
            <label htmlFor={setting.key} className="font-medium cursor-pointer">
              {setting.label}
            </label>
            <p className="text-sm text-gray-600 mt-1">
              {setting.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}