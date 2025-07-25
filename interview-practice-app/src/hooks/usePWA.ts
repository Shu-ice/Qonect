'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  isInstalling: boolean;
}

export interface PWAActions {
  installApp: () => Promise<boolean>;
  updateApp: () => void;
  checkForUpdates: () => void;
  clearCache: () => Promise<void>;
}

export type UsePWAReturn = PWAState & PWAActions;

/**
 * PWA機能を管理するカスタムフック
 * インストール、更新、オフライン状態の管理
 */
export function usePWA(): UsePWAReturn {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false,
    isUpdateAvailable: false,
    isInstalling: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Service Workerの登録と管理
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Service Workerの登録
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
          
          // 更新の確認
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, isUpdateAvailable: true }));
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    }

    // インストール可能状態の監視
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    // インストール完了の監視
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        isInstallable: false,
        isInstalling: false 
      }));
      setDeferredPrompt(null);
    };

    // オンライン/オフライン状態の監視
    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初期状態の設定
    setState(prev => ({
      ...prev,
      isOffline: !navigator.onLine,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches ||
                   window.matchMedia('(display-mode: fullscreen)').matches
    }));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // アプリのインストール
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    setState(prev => ({ ...prev, isInstalling: true }));

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('Install prompt outcome:', outcome);
      
      if (outcome === 'accepted') {
        setState(prev => ({ 
          ...prev, 
          isInstalling: false,
          isInstallable: false 
        }));
        setDeferredPrompt(null);
        return true;
      } else {
        setState(prev => ({ ...prev, isInstalling: false }));
        return false;
      }
    } catch (error) {
      console.error('Install failed:', error);
      setState(prev => ({ ...prev, isInstalling: false }));
      return false;
    }
  }, [deferredPrompt]);

  // アプリの更新
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          // Service Workerに更新を通知
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // ページをリロード
          window.location.reload();
        }
      });
    }
  }, []);

  // 更新の確認
  const checkForUpdates = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update();
        }
      });
    }
  }, []);

  // キャッシュのクリア
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          // Service Workerにキャッシュクリアを依頼
          const messageChannel = new MessageChannel();
          
          return new Promise((resolve) => {
            messageChannel.port1.onmessage = (event) => {
              if (event.data.type === 'CACHE_CLEARED') {
                console.log('Cache cleared successfully');
                resolve();
              }
            };
            
            registration.active!.postMessage(
              { type: 'CLEAR_CACHE' },
              [messageChannel.port2]
            );
          });
        }
      }
      
      // フォールバック：ブラウザのキャッシュAPIを直接使用
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Cache cleared via CacheAPI');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }, []);

  return {
    // State
    isInstallable: state.isInstallable,
    isInstalled: state.isInstalled,
    isOffline: state.isOffline,
    isUpdateAvailable: state.isUpdateAvailable,
    isInstalling: state.isInstalling,
    
    // Actions
    installApp,
    updateApp,
    checkForUpdates,
    clearCache,
  };
}

/**
 * PWA関連のユーティリティ関数
 */
export const PWAUtils = {
  /**
   * デバイスがモバイルかどうかを判定
   */
  isMobile: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * インストール可能なブラウザかどうかを判定
   */
  isInstallSupported: (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
  },

  /**
   * スタンドアロンモードかどうかを判定
   */
  isStandalone: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true; // iOS Safari
  },

  /**
   * プッシュ通知の許可を要求
   */
  requestNotificationPermission: async (): Promise<NotificationPermission> => {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  },

  /**
   * バックグラウンド同期を登録
   */
  registerBackgroundSync: async (tag: string): Promise<void> => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.sync.register(tag);
      }
    }
  },

  /**
   * アプリの共有
   */
  shareApp: async (data?: ShareData): Promise<boolean> => {
    const defaultData: ShareData = {
      title: '面接練習アプリ',
      text: '愛知県公立中高一貫校の面接練習に特化したアプリです',
      url: window.location.origin,
    };

    const shareData = { ...defaultData, ...data };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return true;
      } else {
        // フォールバック：クリップボードにコピー
        await navigator.clipboard.writeText(shareData.url || window.location.href);
        console.log('URL copied to clipboard');
        return true;
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      return false;
    }
  },

  /**
   * ネットワーク情報の取得
   */
  getNetworkInfo: (): { effectiveType?: string; downlink?: number; rtt?: number } => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      };
    }
    
    return {};
  },
};