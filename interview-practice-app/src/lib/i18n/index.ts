/**
 * 国際化（i18n）システム
 * React Context を使用した多言語対応
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, flattenedTranslations, SupportedLocale, TranslationKey } from './translations';

export interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  supportedLocales: SupportedLocale[];
}

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: SupportedLocale;
}

/**
 * 国際化プロバイダー
 */
export function I18nProvider({ children, defaultLocale = 'ja' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(defaultLocale);

  // ブラウザの言語設定から初期ロケールを決定
  useEffect(() => {
    const browserLocale = detectBrowserLocale();
    const savedLocale = getSavedLocale();
    
    const initialLocale = savedLocale || browserLocale || defaultLocale;
    setLocaleState(initialLocale);
  }, [defaultLocale]);

  // ロケール変更時の処理
  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    saveLocale(newLocale);
    updateDocumentLang(newLocale);
    updateDocumentDir(newLocale);
  };

  // 翻訳関数
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = flattenedTranslations[locale][key] || 
                       flattenedTranslations.ja[key] || 
                       key;

    // パラメータの置換
    if (params) {
      return Object.entries(params).reduce((text, [param, value]) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      }, translation);
    }

    return translation;
  };

  // RTL言語の判定
  const isRTL = false; // 現在対応している言語にRTL言語はない

  const supportedLocales: SupportedLocale[] = ['ja', 'en', 'zh'];

  const contextValue: I18nContextType = {
    locale,
    setLocale,
    t,
    isRTL,
    supportedLocales,
  };

  return React.createElement(
    I18nContext.Provider,
    { value: contextValue },
    children
  );
}

/**
 * 国際化フック
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/**
 * 翻訳フック（簡単版）
 */
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}

/**
 * ブラウザの言語設定を検出
 */
function detectBrowserLocale(): SupportedLocale | null {
  if (typeof window === 'undefined') return null;

  const browserLang = navigator.language || (navigator as any).userLanguage;
  const langCode = browserLang.split('-')[0].toLowerCase();

  const supportedLocales: SupportedLocale[] = ['ja', 'en', 'zh'];
  
  if (supportedLocales.includes(langCode as SupportedLocale)) {
    return langCode as SupportedLocale;
  }

  return null;
}

/**
 * 保存されたロケールを取得
 */
function getSavedLocale(): SupportedLocale | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem('app-locale');
    if (saved && ['ja', 'en', 'zh'].includes(saved)) {
      return saved as SupportedLocale;
    }
  } catch (error) {
    console.warn('Failed to get saved locale:', error);
  }

  return null;
}

/**
 * ロケールを保存
 */
function saveLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('app-locale', locale);
  } catch (error) {
    console.warn('Failed to save locale:', error);
  }
}

/**
 * ドキュメントの言語属性を更新
 */
function updateDocumentLang(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return;

  const localeMap: Record<SupportedLocale, string> = {
    ja: 'ja-JP',
    en: 'en-US',
    zh: 'zh-CN',
  };

  document.documentElement.lang = localeMap[locale];
}

/**
 * ドキュメントの文字方向を更新
 */
function updateDocumentDir(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return;

  // 現在サポートしている言語はすべてLTR
  document.documentElement.dir = 'ltr';
}

/**
 * 数値のローカライズ
 */
export function formatNumber(
  value: number,
  locale: SupportedLocale,
  options?: Intl.NumberFormatOptions
): string {
  const localeMap: Record<SupportedLocale, string> = {
    ja: 'ja-JP',
    en: 'en-US',
    zh: 'zh-CN',
  };

  return new Intl.NumberFormat(localeMap[locale], options).format(value);
}

/**
 * 日付のローカライズ
 */
export function formatDate(
  date: Date,
  locale: SupportedLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  const localeMap: Record<SupportedLocale, string> = {
    ja: 'ja-JP',
    en: 'en-US',
    zh: 'zh-CN',
  };

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(localeMap[locale], options || defaultOptions).format(date);
}

/**
 * 相対時間のローカライズ
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: SupportedLocale
): string {
  const localeMap: Record<SupportedLocale, string> = {
    ja: 'ja-JP',
    en: 'en-US',
    zh: 'zh-CN',
  };

  const rtf = new Intl.RelativeTimeFormat(localeMap[locale], { numeric: 'auto' });
  return rtf.format(value, unit);
}

/**
 * 複数形の処理
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
  locale: SupportedLocale = 'ja'
): string {
  // 日本語と中国語は複数形の概念がない
  if (locale === 'ja' || locale === 'zh') {
    return singular;
  }

  // 英語の複数形処理
  if (locale === 'en') {
    if (count === 1) {
      return singular;
    }
    return plural || singular + 's';
  }

  return singular;
}

/**
 * 言語選択コンポーネント
 */
export function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale, supportedLocales } = useI18n();

  const languageNames: Record<SupportedLocale, string> = {
    ja: '日本語',
    en: 'English',
    zh: '中文',
  };

  const languageFlags: Record<SupportedLocale, string> = {
    ja: '🇯🇵',
    en: '🇺🇸',
    zh: '🇨🇳',
  };

  return React.createElement(
    'select',
    {
      value: locale,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setLocale(e.target.value as SupportedLocale),
      className: className,
      'aria-label': '言語を選択',
    },
    supportedLocales.map((lang) =>
      React.createElement(
        'option',
        { key: lang, value: lang },
        `${languageFlags[lang]} ${languageNames[lang]}`
      )
    )
  );
}

/**
 * 翻訳統計の取得
 */
export function getTranslationStats(): {
  totalKeys: number;
  translatedKeys: Record<SupportedLocale, number>;
  completionRates: Record<SupportedLocale, number>;
} {
  const totalKeys = Object.keys(flattenedTranslations.ja).length;
  const translatedKeys: Record<SupportedLocale, number> = {
    ja: totalKeys,
    en: Object.keys(flattenedTranslations.en).length,
    zh: Object.keys(flattenedTranslations.zh).length,
  };

  const completionRates: Record<SupportedLocale, number> = {
    ja: 100,
    en: Math.round((translatedKeys.en / totalKeys) * 100),
    zh: Math.round((translatedKeys.zh / totalKeys) * 100),
  };

  return {
    totalKeys,
    translatedKeys,
    completionRates,
  };
}

/**
 * 国際化システムの初期化
 */
export function initializeI18n(defaultLocale: SupportedLocale = 'ja'): void {
  if (typeof window === 'undefined') return;

  // 初期ロケールの設定
  const browserLocale = detectBrowserLocale();
  const savedLocale = getSavedLocale();
  const initialLocale = savedLocale || browserLocale || defaultLocale;

  updateDocumentLang(initialLocale);
  updateDocumentDir(initialLocale);

  console.log(`I18n initialized with locale: ${initialLocale}`);
}

// 便利な型定義
export type { SupportedLocale, TranslationKey };
export { translations, flattenedTranslations };

// エクスポート用のヘルパー
export const i18nHelpers = {
  formatNumber,
  formatDate,
  formatRelativeTime,
  pluralize,
  getTranslationStats,
};