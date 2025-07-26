import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * クラス名を統合するユーティリティ関数
 * clsxとtailwind-mergeを組み合わせて競合するTailwindクラスを適切にマージ
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 小学生向けフォントサイズ調整
 */
export const fontSizes = {
  xs: 'text-xs',      // 12px - 補助情報用
  sm: 'text-sm',      // 14px - キャプション用
  base: 'text-base',  // 16px - 最小推奨
  lg: 'text-lg',      // 18px - デフォルト推奨
  xl: 'text-xl',      // 20px - 見出し小
  '2xl': 'text-2xl',  // 24px - 見出し中
  '3xl': 'text-3xl',  // 30px - 見出し大
  '4xl': 'text-4xl',  // 36px - タイトル
  '5xl': 'text-5xl',  // 48px - メインタイトル
} as const;

/**
 * アクセシビリティレベルに応じたフォントサイズ調整
 */
export function getAccessibleFontSize(
  baseSize: keyof typeof fontSizes,
  accessibilityLevel: 'normal' | 'large' | 'extra-large' = 'normal'
): string {
  const sizeMap = {
    normal: {
      xs: fontSizes.xs,
      sm: fontSizes.sm,
      base: fontSizes.base,
      lg: fontSizes.lg,
      xl: fontSizes.xl,
      '2xl': fontSizes['2xl'],
      '3xl': fontSizes['3xl'],
      '4xl': fontSizes['4xl'],
      '5xl': fontSizes['5xl'],
    },
    large: {
      xs: fontSizes.sm,
      sm: fontSizes.base,
      base: fontSizes.lg,
      lg: fontSizes.xl,
      xl: fontSizes['2xl'],
      '2xl': fontSizes['3xl'],
      '3xl': fontSizes['4xl'],
      '4xl': fontSizes['5xl'],
      '5xl': fontSizes['5xl'],
    },
    'extra-large': {
      xs: fontSizes.base,
      sm: fontSizes.lg,
      base: fontSizes.xl,
      lg: fontSizes['2xl'],
      xl: fontSizes['3xl'],
      '2xl': fontSizes['4xl'],
      '3xl': fontSizes['5xl'],
      '4xl': fontSizes['5xl'],
      '5xl': fontSizes['5xl'],
    },
  };

  return sizeMap[accessibilityLevel][baseSize];
}

/**
 * プレミアムボタンのバリアント定義
 */
export const buttonVariants = {
  variant: {
    default: 'bg-primary-500 hover:bg-primary-600 text-white shadow-premium hover:shadow-premium-lg',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-premium hover:shadow-premium-lg',
    success: 'bg-success-500 hover:bg-success-600 text-white shadow-glow-success hover:shadow-premium-lg',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white shadow-glow-warning hover:shadow-premium-lg',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 shadow-premium-sm hover:shadow-premium',
    ghost: 'text-primary-500 hover:bg-primary-50 hover:shadow-premium-sm',
    premium: 'bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white shadow-premium-lg hover:shadow-premium-xl',
  },
  size: {
    sm: 'h-9 px-3 text-sm',
    default: 'h-11 px-4 py-2 text-lg',
    lg: 'h-12 px-6 text-xl',
    xl: 'h-14 px-8 text-2xl',
    touch: 'min-h-[44px] min-w-[44px] px-4 py-2 text-lg', // iOS推奨タッチサイズ
  },
} as const;

/**
 * プレミアムカードのバリアント定義
 */
export const cardVariants = {
  variant: {
    default: 'bg-white shadow-premium border border-premium-200',
    elevated: 'bg-white shadow-premium-lg hover:shadow-premium-xl transition-all duration-500 transform hover:-translate-y-1',
    glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-premium-lg',
    gradient: 'bg-gradient-to-br from-white via-primary-50 to-primary-100 shadow-premium-lg',
    premium: 'bg-gradient-to-br from-white via-primary-50 to-primary-100 shadow-premium-xl border border-primary-200',
  },
  padding: {
    none: 'p-0',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  },
  rounded: {
    none: 'rounded-none',
    sm: 'rounded-sm',
    default: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
  },
} as const;

/**
 * アニメーション用ユーティリティ
 */
export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  scaleIn: 'animate-scale-in',
  bounceGentle: 'animate-bounce-gentle',
  pulseSoft: 'animate-pulse-soft',
  shine: 'animate-shine',
  ripple: 'animate-ripple',
} as const;

/**
 * レスポンシブ設計用ブレークポイント
 */
export const breakpoints = {
  xs: '375px',   // iPhone SE
  sm: '640px',   // タブレット縦
  md: '768px',   // タブレット横
  lg: '1024px',  // ラップトップ
  xl: '1280px',  // デスクトップ
  '2xl': '1536px', // 大型ディスプレイ
} as const;

/**
 * 黄金比ベーススペーシング
 */
export const goldenSpacing = {
  xs: 'golden-xs',    // ~10px
  sm: 'golden-sm',    // 16px
  md: 'golden-md',    // ~26px
  lg: 'golden-lg',    // ~42px
  xl: 'golden-xl',    // ~68px
  '2xl': 'golden-2xl', // ~110px
} as const;

/**
 * プレミアムカラーパレット参照用
 */
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  secondary: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  premium: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  accent: {
    pink: '#f472b6',
    purple: '#a855f7',
    cyan: '#06b6d4',
    orange: '#fb923c',
  },
} as const;

/**
 * 日本語テキスト処理用ユーティリティ
 */
export function addFurigana(text: string, furigana: string): string {
  return `<ruby>${text}<rt>${furigana}</rt></ruby>`;
}

/**
 * タッチデバイス判定
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * デバイスタイプ判定
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * アクセシビリティ支援機能
 */
export const accessibility = {
  /**
   * 高コントラストモード用クラス
   */
  highContrast: 'high-contrast',
  
  /**
   * フォーカス時の視覚的フィードバック
   */
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  
  /**
   * スクリーンリーダー用の隠しテキスト
   */
  srOnly: 'sr-only',
  
  /**
   * ふりがな表示用クラス
   */
  withFurigana: 'with-furigana',
};

/**
 * エラーハンドリング用ユーティリティ
 */
export function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '予期せぬエラーが発生しました';
}

/**
 * 文字数カウント（日本語対応）
 */
export function countCharacters(text: string): number {
  // 日本語文字を考慮した文字数カウント
  return Array.from(text).length;
}

/**
 * テキスト省略用ユーティリティ
 */
export function truncateText(text: string, maxLength: number): string {
  if (countCharacters(text) <= maxLength) return text;
  return Array.from(text).slice(0, maxLength).join('') + '...';
}