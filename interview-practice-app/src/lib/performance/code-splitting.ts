/**
 * コード分割とチャンク最適化
 * 必要な機能のみを読み込むための戦略的分割
 */

/**
 * 機能別のモジュール分割
 */

// AI関連モジュールの遅延読み込み
export const loadAIModule = () => import('@/lib/ai/adapter');
export const loadRealtimeEvaluation = () => import('@/lib/realtime-evaluation');
export const loadMeiwaAIEngine = () => import('@/lib/meiwa-ai-engine');
export const loadMeiwaAIService = () => import('@/lib/meiwa-ai-service');

// OCR関連モジュールの遅延読み込み
export const loadHandwritingOCR = () => import('@/lib/handwriting-ocr');
export const loadTesseractOCR = () => import('tesseract.js');

// データベース関連モジュールの遅延読み込み
export const loadUserService = () => import('@/lib/db/user-service');
export const loadInterviewService = () => import('@/lib/db/interview-service');
export const loadEssayService = () => import('@/lib/db/essay-service');
export const loadAnalyticsService = () => import('@/lib/db/analytics-service');

// 音声処理関連の遅延読み込み
export const loadVoiceProcessing = () => import('@/lib/speech/voice-recognition');

// 統計・チャート関連の遅延読み込み（チャートライブラリは必要に応じてインストール）
// export const loadChartLibrary = () => import('react-chartjs-2');

/**
 * 条件付きモジュール読み込み
 */
export class ConditionalLoader {
  private static loadedModules = new Set<string>();
  private static loadingPromises = new Map<string, Promise<any>>();

  /**
   * 機能フラグベースの条件読み込み
   */
  static async loadIfEnabled<T>(
    moduleId: string,
    loader: () => Promise<T>,
    enabledCheck: () => boolean
  ): Promise<T | null> {
    if (!enabledCheck()) {
      return null;
    }

    if (this.loadedModules.has(moduleId)) {
      return loader();
    }

    if (this.loadingPromises.has(moduleId)) {
      return this.loadingPromises.get(moduleId)!;
    }

    const loadingPromise = loader().then(module => {
      this.loadedModules.add(moduleId);
      this.loadingPromises.delete(moduleId);
      return module;
    }).catch(error => {
      this.loadingPromises.delete(moduleId);
      throw error;
    });

    this.loadingPromises.set(moduleId, loadingPromise);
    return loadingPromise;
  }

  /**
   * ユーザー権限ベースの読み込み
   */
  static async loadForRole<T>(
    moduleId: string,
    loader: () => Promise<T>,
    userRole: string,
    requiredRoles: string[]
  ): Promise<T | null> {
    return this.loadIfEnabled(
      moduleId,
      loader,
      () => requiredRoles.includes(userRole)
    );
  }

  /**
   * デバイス能力ベースの読み込み
   */
  static async loadForDevice<T>(
    moduleId: string,
    loader: () => Promise<T>,
    deviceCheck: () => boolean
  ): Promise<T | null> {
    return this.loadIfEnabled(moduleId, loader, deviceCheck);
  }
}

/**
 * 使用例関数
 */

// AI機能の条件付き読み込み
export const loadAIIfEnabled = () => 
  ConditionalLoader.loadIfEnabled(
    'ai-clients',
    loadAIModule,
    () => process.env.NEXT_PUBLIC_AI_ENABLED === 'true'
  );

// 管理者機能の読み込み（将来実装）
export const loadAdminFeaturesIfAuthorized = (userRole: string) => {
  // 管理者機能は必要に応じて実装
  console.log('Admin features not implemented yet for role:', userRole);
  return Promise.resolve(null);
};

// モバイル専用機能の読み込み（将来実装）
export const loadMobileFeaturesIfMobile = () => {
  if (typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)) {
    console.log('Mobile features not implemented yet');
  }
  return Promise.resolve(null);
};

// OCR機能の条件付き読み込み（ファイルアップロード対応デバイスのみ）
export const loadOCRIfSupported = () =>
  ConditionalLoader.loadForDevice(
    'ocr-features',
    loadHandwritingOCR,
    () => 'FileReader' in window && 'File' in window
  );

// 音声機能の条件付き読み込み（マイク対応デバイスのみ）
export const loadVoiceIfSupported = () =>
  ConditionalLoader.loadForDevice(
    'voice-features',
    loadVoiceProcessing,
    () => 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
  );

/**
 * プリロード戦略
 */
export class PreloadManager {
  private static preloadQueue: Array<() => Promise<any>> = [];
  private static isPreloading = false;

  /**
   * 重要な機能を事前読み込み
   */
  static preloadCriticalModules(): void {
    if (typeof window === 'undefined') return;

    // ページロード後に重要なモジュールを事前読み込み
    window.addEventListener('load', () => {
      this.schedulePreload([
        loadAIModule,
        loadUserService,
        loadInterviewService,
      ]);
    });
  }

  /**
   * ユーザーインタラクションに基づく先読み
   */
  static preloadOnHover(moduleLoader: () => Promise<any>): void {
    if (typeof window === 'undefined') return;

    // マウスオーバー時に先読み（モバイルでは無効）
    if (!/Mobi|Android/i.test(navigator.userAgent)) {
      this.addToPreloadQueue(moduleLoader);
    }
  }

  /**
   * アイドル時間の活用
   */
  static preloadOnIdle(moduleLoaders: Array<() => Promise<any>>): void {
    if (typeof window === 'undefined') return;

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        this.schedulePreload(moduleLoaders);
      });
    } else {
      // フォールバック: setTimeout使用
      setTimeout(() => {
        this.schedulePreload(moduleLoaders);
      }, 1000);
    }
  }

  private static addToPreloadQueue(loader: () => Promise<any>): void {
    this.preloadQueue.push(loader);
    if (!this.isPreloading) {
      this.processPreloadQueue();
    }
  }

  private static schedulePreload(loaders: Array<() => Promise<any>>): void {
    this.preloadQueue.push(...loaders);
    if (!this.isPreloading) {
      this.processPreloadQueue();
    }
  }

  private static async processPreloadQueue(): Promise<void> {
    if (this.preloadQueue.length === 0) return;
    
    this.isPreloading = true;
    
    while (this.preloadQueue.length > 0) {
      const loader = this.preloadQueue.shift()!;
      try {
        await loader();
        // 各プリロード間に短い間隔を設ける（メインスレッドをブロックしないため）
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('Preload failed:', error);
      }
    }
    
    this.isPreloading = false;
  }
}

/**
 * バンドル分析とサイズ最適化
 */
export class BundleOptimizer {
  /**
   * 未使用のモジュール検出
   */
  static detectUnusedModules(): void {
    if (process.env.NODE_ENV !== 'development') return;

    // Webpack bundle analyzer の結果を基に最適化提案を出力
    console.group('Bundle Optimization Suggestions');
    console.log('💡 Consider lazy loading these heavy modules:');
    console.log('  - Tesseract.js (OCR): Only load when user uploads images');
    console.log('  - Chart libraries: Only load for analytics pages');
    console.log('  - AI modules: Only load when AI features are used');
    console.log('💡 Consider removing unused dependencies:');
    console.log('  - Check for unused imports in components');
    console.log('  - Remove unused CSS classes');
    console.groupEnd();
  }

  /**
   * モジュールサイズの監視
   */
  static monitorModuleSize(moduleName: string, module: any): void {
    if (process.env.NODE_ENV !== 'development') return;

    const size = JSON.stringify(module).length;
    const sizeKB = (size / 1024).toFixed(2);
    
    if (size > 100 * 1024) { // 100KB以上
      console.warn(`⚠️ Large module detected: ${moduleName} (${sizeKB}KB)`);
    }
  }
}

// 初期化
if (typeof window !== 'undefined') {
  PreloadManager.preloadCriticalModules();
  
  if (process.env.NODE_ENV === 'development') {
    BundleOptimizer.detectUnusedModules();
  }
}