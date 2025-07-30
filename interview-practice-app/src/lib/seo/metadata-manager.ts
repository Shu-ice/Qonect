/**
 * SEOメタデータ管理
 * 動的なメタタグとOGタグの管理
 */

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  type?: 'website' | 'article' | 'profile' | 'book';
  image?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  locale?: string;
  alternateLocales?: string[];
}

export interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  titleTemplate: string; // "%s | Site Name"
  defaultDescription: string;
  defaultImage: {
    url: string;
    alt: string;
    width: number;
    height: number;
  };
  defaultKeywords: string[];
  twitterHandle?: string;
  facebookAppId?: string;
  defaultLocale: string;
  supportedLocales: string[];
}

class MetadataManager {
  private static instance: MetadataManager;
  private config: SEOConfig;
  private currentMetadata: PageMetadata | null = null;

  static getInstance(): MetadataManager {
    if (!MetadataManager.instance) {
      MetadataManager.instance = new MetadataManager();
    }
    return MetadataManager.instance;
  }

  constructor() {
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): SEOConfig {
    return {
      siteName: '明和中学校入試面接練習アプリ',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://interview-practice.example.com',
      defaultTitle: '明和中学校入試面接練習アプリ',
      titleTemplate: '%s | 明和中学校入試面接練習',
      defaultDescription: '愛知県公立中高一貫校（明和高校附属中学校）の入試面接練習ができるアプリです。AI技術を活用した本格的な面接シミュレーションで合格をサポートします。',
      defaultImage: {
        url: '/images/og-default.jpg',
        alt: '明和中学校入試面接練習アプリ',
        width: 1200,
        height: 630,
      },
      defaultKeywords: [
        '明和中学校',
        '明和高校附属中学校',
        '愛知県',
        '公立中高一貫校',
        '入試面接',
        '面接練習',
        'AI面接',
        '受験対策',
        '中学受験',
        '面接シミュレーション'
      ],
      twitterHandle: '@meiwa_interview',
      defaultLocale: 'ja-JP',
      supportedLocales: ['ja-JP'],
    };
  }

  /**
   * 設定を更新
   */
  public updateConfig(config: Partial<SEOConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * ページメタデータを設定
   */
  public setPageMetadata(metadata: Partial<PageMetadata>): void {
    this.currentMetadata = {
      title: metadata.title || this.config.defaultTitle,
      description: metadata.description || this.config.defaultDescription,
      keywords: metadata.keywords || this.config.defaultKeywords,
      canonical: metadata.canonical,
      robots: metadata.robots || 'index,follow',
      author: metadata.author,
      publishedTime: metadata.publishedTime,
      modifiedTime: metadata.modifiedTime || new Date().toISOString(),
      type: metadata.type || 'website',
      image: metadata.image || this.config.defaultImage,
      locale: metadata.locale || this.config.defaultLocale,
      alternateLocales: metadata.alternateLocales || this.config.supportedLocales,
    };

    this.updateDocumentHead();
  }

  /**
   * ドキュメントのheadを更新
   */
  private updateDocumentHead(): void {
    if (typeof window === 'undefined' || !this.currentMetadata) return;

    this.updateTitle();
    this.updateBasicMeta();
    this.updateOpenGraph();
    this.updateTwitterCard();
    this.updateJsonLD();
  }

  /**
   * タイトルを更新
   */
  private updateTitle(): void {
    if (!this.currentMetadata) return;

    const title = this.currentMetadata.title === this.config.defaultTitle
      ? this.currentMetadata.title
      : this.config.titleTemplate.replace('%s', this.currentMetadata.title);

    document.title = title;

    // canonical titleタグを更新
    let titleElement = document.querySelector('meta[property="og:title"]');
    if (!titleElement) {
      titleElement = document.createElement('meta');
      titleElement.setAttribute('property', 'og:title');
      document.head.appendChild(titleElement);
    }
    titleElement.setAttribute('content', title);
  }

  /**
   * 基本メタタグを更新
   */
  private updateBasicMeta(): void {
    if (!this.currentMetadata) return;

    const metaTags = [
      { name: 'description', content: this.currentMetadata.description },
      { name: 'keywords', content: this.currentMetadata.keywords?.join(', ') || '' },
      { name: 'robots', content: this.currentMetadata.robots || 'index,follow' },
      { name: 'author', content: this.currentMetadata.author || '' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { 'http-equiv': 'Content-Language', content: this.currentMetadata.locale || 'ja-JP' },
    ];

    metaTags.forEach(tag => {
      if (!tag.content) return;

      const selector = tag.name ? `meta[name="${tag.name}"]` : `meta[http-equiv="${tag['http-equiv']}"]`;
      let element = document.querySelector(selector);
      
      if (!element) {
        element = document.createElement('meta');
        if (tag.name) {
          element.setAttribute('name', tag.name);
        } else if (tag['http-equiv']) {
          element.setAttribute('http-equiv', tag['http-equiv']);
        }
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', tag.content);
    });

    // canonical URL
    if (this.currentMetadata.canonical) {
      let canonicalElement = document.querySelector('link[rel="canonical"]');
      if (!canonicalElement) {
        canonicalElement = document.createElement('link');
        canonicalElement.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalElement);
      }
      canonicalElement.setAttribute('href', this.currentMetadata.canonical);
    }

    // alternate languages
    this.currentMetadata.alternateLocales?.forEach(locale => {
      if (locale === this.currentMetadata!.locale) return;

      let alternateElement = document.querySelector(`link[hreflang="${locale}"]`);
      if (!alternateElement) {
        alternateElement = document.createElement('link');
        alternateElement.setAttribute('rel', 'alternate');
        alternateElement.setAttribute('hreflang', locale);
        document.head.appendChild(alternateElement);
      }
      
      const url = this.generateLocaleUrl(locale);
      alternateElement.setAttribute('href', url);
    });
  }

  /**
   * Open Graphタグを更新
   */
  private updateOpenGraph(): void {
    if (!this.currentMetadata) return;

    const ogTags = [
      { property: 'og:type', content: this.currentMetadata.type || 'website' },
      { property: 'og:site_name', content: this.config.siteName },
      { property: 'og:description', content: this.currentMetadata.description },
      { property: 'og:url', content: this.currentMetadata.canonical || window.location.href },
      { property: 'og:locale', content: this.currentMetadata.locale || 'ja_JP' },
    ];

    // 画像情報
    if (this.currentMetadata.image) {
      ogTags.push(
        { property: 'og:image', content: this.getAbsoluteUrl(this.currentMetadata.image.url) },
        { property: 'og:image:alt', content: this.currentMetadata.image.alt },
        { property: 'og:image:width', content: this.currentMetadata.image.width?.toString() || '1200' },
        { property: 'og:image:height', content: this.currentMetadata.image.height?.toString() || '630' },
        { property: 'og:image:type', content: 'image/jpeg' }
      );
    }

    // 記事の場合の追加情報
    if (this.currentMetadata.type === 'article') {
      if (this.currentMetadata.author) {
        ogTags.push({ property: 'article:author', content: this.currentMetadata.author });
      }
      if (this.currentMetadata.publishedTime) {
        ogTags.push({ property: 'article:published_time', content: this.currentMetadata.publishedTime });
      }
      if (this.currentMetadata.modifiedTime) {
        ogTags.push({ property: 'article:modified_time', content: this.currentMetadata.modifiedTime });
      }
    }

    // 代替ロケール
    this.currentMetadata.alternateLocales?.forEach(locale => {
      if (locale !== this.currentMetadata!.locale) {
        ogTags.push({ property: 'og:locale:alternate', content: locale.replace('-', '_') });
      }
    });

    ogTags.forEach(tag => {
      if (!tag.content) return;

      let element = document.querySelector(`meta[property="${tag.property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', tag.property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content);
    });

    // Facebook App ID
    if (this.config.facebookAppId) {
      let fbAppElement = document.querySelector('meta[property="fb:app_id"]');
      if (!fbAppElement) {
        fbAppElement = document.createElement('meta');
        fbAppElement.setAttribute('property', 'fb:app_id');
        document.head.appendChild(fbAppElement);
      }
      fbAppElement.setAttribute('content', this.config.facebookAppId);
    }
  }

  /**
   * Twitter Cardタグを更新
   */
  private updateTwitterCard(): void {
    if (!this.currentMetadata) return;

    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: this.currentMetadata.title },
      { name: 'twitter:description', content: this.currentMetadata.description },
    ];

    if (this.config.twitterHandle) {
      twitterTags.push(
        { name: 'twitter:site', content: this.config.twitterHandle },
        { name: 'twitter:creator', content: this.config.twitterHandle }
      );
    }

    if (this.currentMetadata.image) {
      twitterTags.push(
        { name: 'twitter:image', content: this.getAbsoluteUrl(this.currentMetadata.image.url) },
        { name: 'twitter:image:alt', content: this.currentMetadata.image.alt }
      );
    }

    twitterTags.forEach(tag => {
      if (!tag.content) return;

      let element = document.querySelector(`meta[name="${tag.name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', tag.name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content);
    });
  }

  /**
   * JSON-LDを更新
   */
  private updateJsonLD(): void {
    if (!this.currentMetadata) return;

    const jsonLD = {
      '@context': 'https://schema.org',
      '@type': this.getSchemaType(),
      name: this.currentMetadata.title,
      description: this.currentMetadata.description,
      url: this.currentMetadata.canonical || window.location.href,
      image: this.currentMetadata.image ? {
        '@type': 'ImageObject',
        url: this.getAbsoluteUrl(this.currentMetadata.image.url),
        width: this.currentMetadata.image.width || 1200,
        height: this.currentMetadata.image.height || 630,
        caption: this.currentMetadata.image.alt,
      } : undefined,
      publisher: {
        '@type': 'Organization',
        name: this.config.siteName,
        url: this.config.siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: this.getAbsoluteUrl('/images/logo.png'),
          width: 200,
          height: 60,
        },
      },
      author: this.currentMetadata.author ? {
        '@type': 'Person',
        name: this.currentMetadata.author,
      } : undefined,
      datePublished: this.currentMetadata.publishedTime,
      dateModified: this.currentMetadata.modifiedTime,
      inLanguage: this.currentMetadata.locale,
      isAccessibleForFree: true,
      // 教育関連の情報
      about: {
        '@type': 'EducationalOrganization',
        name: '明和高校附属中学校',
        address: {
          '@type': 'PostalAddress',
          addressLocality: '名古屋市',
          addressRegion: '愛知県',
          addressCountry: 'JP',
        },
      },
      educationalLevel: '中学校',
      teaches: '面接スキル',
      educationalUse: '受験対策',
    };

    // 既存のJSON-LDを削除
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // 新しいJSON-LDを追加
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLD, null, 2);
    document.head.appendChild(script);
  }

  /**
   * ページタイプからSchema.orgタイプを取得
   */
  private getSchemaType(): string {
    if (!this.currentMetadata) return 'WebPage';

    switch (this.currentMetadata.type) {
      case 'article':
        return 'Article';
      case 'profile':
        return 'ProfilePage';
      case 'book':
        return 'Book';
      default:
        return 'WebPage';
    }
  }

  /**
   * 相対URLを絶対URLに変換
   */
  private getAbsoluteUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return this.config.siteUrl + (url.startsWith('/') ? url : '/' + url);
  }

  /**
   * ロケール用URLを生成
   */
  private generateLocaleUrl(locale: string): string {
    const currentPath = window.location.pathname;
    const baseUrl = this.config.siteUrl;
    
    if (locale === this.config.defaultLocale) {
      return baseUrl + currentPath;
    }
    
    return baseUrl + '/' + locale + currentPath;
  }

  /**
   * ページ別のメタデータプリセット
   */
  public getPagePresets(): Record<string, Partial<PageMetadata>> {
    return {
      home: {
        title: this.config.defaultTitle,
        description: this.config.defaultDescription,
        type: 'website',
        image: this.config.defaultImage,
      },
      
      practice: {
        title: '面接練習',
        description: 'AI技術を活用した明和中学校入試の面接練習。本格的なシミュレーションで面接スキルを向上させましょう。',
        type: 'website',
        keywords: [...this.config.defaultKeywords, '面接練習', 'AIシミュレーション'],
      },

      questions: {
        title: '練習問題一覧',
        description: '明和中学校入試でよく出題される面接質問の一覧。過去問を参考にした実践的な問題で練習できます。',
        type: 'website',
        keywords: [...this.config.defaultKeywords, '面接質問', '過去問', '練習問題'],
      },

      results: {
        title: '練習結果',
        description: 'AI分析による面接練習の詳細な評価結果。改善点やアドバイスを確認して次回の練習に活かしましょう。',
        type: 'website',
        keywords: [...this.config.defaultKeywords, '結果分析', 'AI評価', 'フィードバック'],
      },

      guide: {
        title: '面接対策ガイド',
        description: '明和中学校入試面接の対策方法、よくある質問、合格のコツをまとめたガイド。',
        type: 'article',
        keywords: [...this.config.defaultKeywords, '面接対策', '合格のコツ', '入試ガイド'],
      },

      about: {
        title: 'アプリについて',
        description: '明和中学校入試面接練習アプリの機能紹介、使い方、開発背景について。',
        type: 'website',
        keywords: [...this.config.defaultKeywords, 'アプリ紹介', '使い方'],
      },

      privacy: {
        title: 'プライバシーポリシー',
        description: '個人情報の取り扱いについて詳しく説明したプライバシーポリシー。',
        type: 'website',
        robots: 'index,follow',
      },

      terms: {
        title: '利用規約',
        description: 'サービス利用時の規約と条件について。',
        type: 'website',
        robots: 'index,follow',
      },
    };
  }

  /**
   * 現在のメタデータを取得
   */
  public getCurrentMetadata(): PageMetadata | null {
    return this.currentMetadata;
  }

  /**
   * SEO設定を取得
   */
  public getConfig(): SEOConfig {
    return this.config;
  }

  /**
   * メタデータをリセット
   */
  public reset(): void {
    this.currentMetadata = null;
  }
}

// シングルトンインスタンス
export const metadataManager = MetadataManager.getInstance();