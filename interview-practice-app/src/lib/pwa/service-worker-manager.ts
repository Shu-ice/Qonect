/**
 * Service Worker 管理システム
 * PWA機能の制御とオフライン対応
 */

'use client';

export interface ServiceWorkerManager {
  register(): Promise<ServiceWorkerRegistration | null>;
  update(): Promise<void>;
  getRegistration(): Promise<ServiceWorkerRegistration | null>;
  isSupported(): boolean;
  isInstalled(): boolean;
  enableNotifications(): Promise<boolean>;
  getCacheStatus(): Promise<Record<string, number>>;
  clearCache(): Promise<void>;
}

class ServiceWorkerManagerImpl implements ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  /**
   * Service Worker登録
   */
  public async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('Service Workers are not supported');
      return null;
    }

    try {
      console.log('Registering Service Worker...');
      
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log('Service Worker registered successfully:', this.registration);

      // 更新チェック
      this.setupUpdateListener();
      
      // 定期的な更新チェック
      this.startPeriodicUpdateCheck();

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Service Worker更新
   */
  public async update(): Promise<void> {
    if (!this.registration) {
      console.warn('Service Worker is not registered');
      return;
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  /**
   * 登録情報取得
   */
  public async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration || null;
    } catch (error) {
      console.error('Failed to get Service Worker registration:', error);
      return null;
    }
  }

  /**
   * Service Workerサポート確認
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }

  /**
   * インストール状態確認
   */
  public isInstalled(): boolean {
    return this.registration !== null && this.registration.active !== null;
  }

  /**
   * プッシュ通知の有効化
   */
  public async enableNotifications(): Promise<boolean> {
    if (!this.isSupported() || !this.registration) {
      return false;
    }

    try {
      // 通知許可を要求
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }

      // プッシュ通知の購読
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      });

      // サーバーに購読情報を送信
      await this.sendSubscriptionToServer(subscription);
      
      console.log('Push notifications enabled');
      return true;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  }

  /**
   * キャッシュ状況取得
   */
  public async getCacheStatus(): Promise<Record<string, number>> {
    if (!this.isSupported() || !this.registration) {
      return {};
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATUS_RESULT') {
          resolve(event.data.cacheStatus);
        }
      };

      this.registration?.active?.postMessage(
        { type: 'CACHE_STATUS' },
        [messageChannel.port2]
      );

      // タイムアウト処理
      setTimeout(() => resolve({}), 5000);
    });
  }

  /**
   * キャッシュクリア
   */
  public async clearCache(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * 更新リスナーの設定
   */
  private setupUpdateListener(): void {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新しいバージョンが利用可能
            this.updateAvailable = true;
            this.notifyUpdateAvailable();
          }
        });
      }
    });

    // コントローラーの変更を監視
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.updateAvailable) {
        window.location.reload();
      }
    });

    // メッセージ受信
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });
  }

  /**
   * 定期的な更新チェック
   */
  private startPeriodicUpdateCheck(): void {
    // 1時間ごとに更新をチェック
    setInterval(() => {
      this.update();
    }, 60 * 60 * 1000);
  }

  /**
   * アップデート通知
   */
  private notifyUpdateAvailable(): void {
    // カスタムイベントを発火してアプリに通知
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: {
        registration: this.registration,
        updateAvailable: true,
      }
    }));
  }

  /**
   * Service Workerからのメッセージ処理
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;
    
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data.cacheName);
        break;
      case 'OFFLINE_READY':
        console.log('App is ready for offline use');
        break;
      case 'UPDATE_AVAILABLE':
        this.notifyUpdateAvailable();
        break;
      default:
        console.log('Unknown message from Service Worker:', data);
    }
  }

  /**
   * Base64文字列をUint8Arrayに変換（VAPID用）
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * プッシュ通知購読情報をサーバーに送信
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }
}

// シングルトンインスタンス
export const serviceWorkerManager = new ServiceWorkerManagerImpl();

/**
 * PWAインストール管理
 */
export class PWAInstallManager {
  private deferredPrompt: any = null;
  private isInstalled = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupInstallPrompt();
      this.checkInstallStatus();
    }
  }

  /**
   * インストールプロンプトの設定
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      
      // インストール可能イベントを発火
      window.dispatchEvent(new CustomEvent('pwa-install-available'));
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      
      // インストール完了イベントを発火
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
  }

  /**
   * インストール状態の確認
   */
  private checkInstallStatus(): void {
    // スタンドアロンモードで起動されているかチェック
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }

    // iOSのホーム画面追加チェック
    if ((navigator as any).standalone === true) {
      this.isInstalled = true;
    }
  }

  /**
   * インストールプロンプト表示
   */
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('Install prompt is not available');
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const result = await this.deferredPrompt.userChoice;
      
      this.deferredPrompt = null;
      
      return result.outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  /**
   * インストール可能かどうか
   */
  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  /**
   * インストール済みかどうか
   */
  public isAppInstalled(): boolean {
    return this.isInstalled;
  }
}

// PWAインストール管理のインスタンス
export const pwaInstallManager = new PWAInstallManager();