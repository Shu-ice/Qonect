/**
 * 画像最適化とフォーマット変換
 * WebP/AVIF対応、遅延読み込み、リサイズ機能
 */

// サポートされている画像フォーマットの検出
export class ImageFormatDetector {
  private static supportCache = new Map<string, boolean>();

  /**
   * WebP サポート検出
   */
  static async supportsWebP(): Promise<boolean> {
    if (this.supportCache.has('webp')) {
      return this.supportCache.get('webp')!;
    }

    return new Promise((resolve) => {
      const webp = new Image();
      webp.onload = webp.onerror = () => {
        const supported = webp.height === 2;
        this.supportCache.set('webp', supported);
        resolve(supported);
      };
      webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * AVIF サポート検出
   */
  static async supportsAVIF(): Promise<boolean> {
    if (this.supportCache.has('avif')) {
      return this.supportCache.get('avif')!;
    }

    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        const supported = avif.height === 2;
        this.supportCache.set('avif', supported);
        resolve(supported);
      };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADyY29sch+PgAAADGTfIBAAAAAA';
    });
  }

  /**
   * 最適なフォーマットを決定
   */
  static async getBestFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
    if (await this.supportsAVIF()) return 'avif';
    if (await this.supportsWebP()) return 'webp';
    return 'jpeg';
  }
}

/**
 * 画像最適化クラス
 */
export class ImageOptimizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * 画像をリサイズ
   */
  async resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
  ): Promise<Blob> {
    const img = await this.loadImage(file);
    const { width, height } = this.calculateDimensions(img, maxWidth, maxHeight);

    this.canvas.width = width;
    this.canvas.height = height;

    // 高品質なリサイズのためのスムージング設定
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    this.ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve) => {
      this.canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        quality
      );
    });
  }

  /**
   * WebP形式に変換
   */
  async convertToWebP(file: File, quality: number = 0.8): Promise<Blob> {
    const img = await this.loadImage(file);
    
    this.canvas.width = img.naturalWidth;
    this.canvas.height = img.naturalHeight;
    
    this.ctx.drawImage(img, 0, 0);

    return new Promise((resolve) => {
      this.canvas.toBlob(
        (blob) => resolve(blob!),
        'image/webp',
        quality
      );
    });
  }

  /**
   * 画像を最適化（自動フォーマット選択 + リサイズ）
   */
  async optimizeImage(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      autoFormat?: boolean;
    } = {}
  ): Promise<{
    blob: Blob;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    format: string;
  }> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      autoFormat = true
    } = options;

    const originalSize = file.size;
    let optimizedBlob: Blob;
    let format: string;

    if (autoFormat) {
      const bestFormat = await ImageFormatDetector.getBestFormat();
      format = bestFormat;

      const img = await this.loadImage(file);
      const { width, height } = this.calculateDimensions(img, maxWidth, maxHeight);

      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
      this.ctx.drawImage(img, 0, 0, width, height);

      optimizedBlob = await new Promise((resolve) => {
        this.canvas.toBlob(
          (blob) => resolve(blob!),
          `image/${bestFormat}`,
          quality
        );
      });
    } else {
      optimizedBlob = await this.resizeImage(file, maxWidth, maxHeight, quality);
      format = 'jpeg';
    }

    const optimizedSize = optimizedBlob.size;
    const compressionRatio = (1 - optimizedSize / originalSize) * 100;

    return {
      blob: optimizedBlob,
      originalSize,
      optimizedSize,
      compressionRatio,
      format,
    };
  }

  /**
   * プログレッシブJPEG生成（疑似実装）
   */
  async createProgressiveJPEG(file: File): Promise<Blob> {
    // ブラウザ環境では真のプログレッシブJPEGは生成できないため、
    // 高品質なJPEGを生成する
    return this.resizeImage(file, 1920, 1080, 0.9);
  }

  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateDimensions(
    img: HTMLImageElement,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const { naturalWidth, naturalHeight } = img;
    
    if (naturalWidth <= maxWidth && naturalHeight <= maxHeight) {
      return { width: naturalWidth, height: naturalHeight };
    }

    const ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
    return {
      width: Math.round(naturalWidth * ratio),
      height: Math.round(naturalHeight * ratio),
    };
  }
}

/**
 * 遅延読み込み画像コンポーネント用のユーティリティ
 */
export class LazyImageLoader {
  private static observer: IntersectionObserver | null = null;
  private static imageQueue = new Set<HTMLImageElement>();

  /**
   * Intersection Observer の初期化
   */
  static initialize(): void {
    if (typeof window === 'undefined' || this.observer) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer!.unobserve(img);
            this.imageQueue.delete(img);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px', // 50px手前で読み込み開始
        threshold: 0.1,
      }
    );
  }

  /**
   * 画像を遅延読み込みキューに追加
   */
  static observe(img: HTMLImageElement): void {
    if (!this.observer) {
      this.initialize();
    }

    this.imageQueue.add(img);
    this.observer!.observe(img);
  }

  /**
   * 画像の読み込み実行
   */
  private static loadImage(img: HTMLImageElement): void {
    const dataSrc = img.dataset.src;
    const dataSrcset = img.dataset.srcset;

    if (dataSrc) {
      img.src = dataSrc;
    }

    if (dataSrcset) {
      img.srcset = dataSrcset;
    }

    img.classList.remove('lazy');
    img.classList.add('loaded');
  }

  /**
   * すべての画像を即座に読み込み（プリフェッチ用）
   */
  static loadAll(): void {
    this.imageQueue.forEach((img) => {
      this.loadImage(img);
      this.observer?.unobserve(img);
    });
    this.imageQueue.clear();
  }
}

/**
 * 画像プリロード管理
 */
export class ImagePreloader {
  private static preloadCache = new Map<string, HTMLImageElement>();

  /**
   * 重要な画像を事前読み込み
   */
  static preload(src: string, priority: 'high' | 'low' = 'low'): Promise<HTMLImageElement> {
    if (this.preloadCache.has(src)) {
      return Promise.resolve(this.preloadCache.get(src)!);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // 優先度に応じた読み込み設定
      if (priority === 'high') {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      } else {
        img.loading = 'lazy';
        img.fetchPriority = 'low';
      }

      img.onload = () => {
        this.preloadCache.set(src, img);
        resolve(img);
      };
      
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * 複数画像の並列プリロード
   */
  static async preloadMultiple(
    sources: Array<{ src: string; priority?: 'high' | 'low' }>
  ): Promise<HTMLImageElement[]> {
    const promises = sources.map(({ src, priority = 'low' }) =>
      this.preload(src, priority)
    );

    return Promise.all(promises);
  }

  /**
   * 次のページの画像をプリロード
   */
  static preloadNextPage(imageSources: string[]): void {
    // アイドル時間を利用してプリロード
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        imageSources.forEach(src => this.preload(src, 'low'));
      });
    } else {
      setTimeout(() => {
        imageSources.forEach(src => this.preload(src, 'low'));
      }, 1000);
    }
  }
}

/**
 * レスポンシブ画像生成
 */
export class ResponsiveImageGenerator {
  /**
   * srcset 文字列を生成
   */
  static generateSrcSet(baseSrc: string, sizes: number[]): string {
    return sizes
      .map(size => `${baseSrc}?w=${size} ${size}w`)
      .join(', ');
  }

  /**
   * sizes 属性を生成
   */
  static generateSizes(breakpoints: Array<{ minWidth: number; size: string }>): string {
    const sizesArray = breakpoints.map(
      ({ minWidth, size }) => `(min-width: ${minWidth}px) ${size}`
    );
    
    // デフォルトサイズを最後に追加
    sizesArray.push('100vw');
    
    return sizesArray.join(', ');
  }

  /**
   * 画像の最適なサイズを計算
   */
  static calculateOptimalSizes(
    containerWidth: number,
    devicePixelRatio: number = window.devicePixelRatio || 1
  ): number[] {
    const baseSize = containerWidth * devicePixelRatio;
    
    // 異なる画面密度に対応したサイズを生成
    return [
      Math.round(baseSize * 0.5),  // 小さいサイズ
      Math.round(baseSize),        // 基本サイズ
      Math.round(baseSize * 1.5),  // 高密度ディスプレイ用
      Math.round(baseSize * 2),    // 非常に高密度ディスプレイ用
    ].filter((size, index, arr) => arr.indexOf(size) === index); // 重複除去
  }
}

// 初期化
if (typeof window !== 'undefined') {
  LazyImageLoader.initialize();
}