/**
 * SEO最適化ライブラリのエントリーポイント
 * 全てのSEO機能をエクスポート
 */

// メタデータ管理
import { metadataManager } from './metadata-manager';
export {
  metadataManager,
  type PageMetadata,
  type SEOConfig,
} from './metadata-manager';

// サイトマップ生成
import { sitemapGenerator } from './sitemap-generator';
export {
  sitemapGenerator,
  type SitemapUrl,
  type SitemapConfig,
} from './sitemap-generator';

// 構造化データ
import { structuredDataManager } from './structured-data';
export {
  structuredDataManager,
  type Organization,
  type WebSite,
  type WebPage,
  type Course,
  type QAPage,
  type VideoObject,
  type BreadcrumbList,
} from './structured-data';

/**
 * SEOシステムの初期化
 * アプリケーション起動時に呼び出す
 */
export function initializeSEO(config?: {
  siteUrl?: string;
  siteName?: string;
  defaultTitle?: string;
  defaultDescription?: string;
}): void {
  if (typeof window === 'undefined') return;

  // メタデータマネージャーの設定
  if (config) {
    metadataManager.updateConfig({
      siteUrl: config.siteUrl || metadataManager.getConfig().siteUrl,
      siteName: config.siteName || metadataManager.getConfig().siteName,
      defaultTitle: config.defaultTitle || metadataManager.getConfig().defaultTitle,
      defaultDescription: config.defaultDescription || metadataManager.getConfig().defaultDescription,
    });
  }

  // 構造化データマネージャーの設定
  if (config?.siteUrl) {
    structuredDataManager.updateBaseUrl(config.siteUrl);
  }

  // サイトマップジェネレーターの設定
  if (config?.siteUrl) {
    sitemapGenerator.updateConfig({
      baseUrl: config.siteUrl,
    });
  }

  // 基本的な構造化データを追加
  const websiteSchema = structuredDataManager.generateWebSiteSchema();
  structuredDataManager.addStructuredData(websiteSchema);

  console.log('SEO system initialized');
}

/**
 * ページごとのSEO設定を適用
 */
export function applySEOForPage(pageConfig: {
  type: 'homepage' | 'practice' | 'guide' | 'faq' | 'about' | 'contact' | 'results';
  title?: string;
  description?: string;
  url?: string;
  image?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  breadcrumbs?: Array<{ name: string; url?: string }>;
  publishedDate?: string;
  modifiedDate?: string;
  keywords?: string[];
}): void {
  // メタデータの設定
  const presets = metadataManager.getPagePresets();
  const preset = presets[pageConfig.type] || presets.homepage;
  
  metadataManager.setPageMetadata({
    title: pageConfig.title || preset.title,
    description: pageConfig.description || preset.description,
    keywords: pageConfig.keywords || preset.keywords,
    canonical: pageConfig.url ? `${metadataManager.getConfig().siteUrl}${pageConfig.url}` : undefined,
    type: preset.type,
    image: pageConfig.image || preset.image,
    publishedTime: pageConfig.publishedDate,
    modifiedTime: pageConfig.modifiedDate,
  });

  // 構造化データの追加
  if (pageConfig.type === 'homepage') {
    const schemas = [
      structuredDataManager.generateWebSiteSchema(),
      structuredDataManager.generateCourseSchema(),
      structuredDataManager.generateLocalBusinessSchema(),
    ];
    structuredDataManager.addMultipleStructuredData(schemas);
  } else if (pageConfig.type === 'faq') {
    const faqSchemas = structuredDataManager.generateInterviewFAQSchema();
    structuredDataManager.addMultipleStructuredData(faqSchemas);
  } else {
    const webPageSchema = structuredDataManager.generateWebPageSchema({
      title: pageConfig.title || preset.title!,
      url: pageConfig.url || '',
      description: pageConfig.description || preset.description,
      publishedDate: pageConfig.publishedDate,
      modifiedDate: pageConfig.modifiedDate,
      image: pageConfig.image ? {
        '@type': 'ImageObject' as const,
        url: pageConfig.image.url,
        width: pageConfig.image.width,
        height: pageConfig.image.height,
      } : undefined,
      breadcrumbs: pageConfig.breadcrumbs,
    });
    structuredDataManager.addStructuredData(webPageSchema);
  }

  // パンくずリストの構造化データ
  if (pageConfig.breadcrumbs && pageConfig.breadcrumbs.length > 1) {
    const breadcrumbSchema = structuredDataManager.generateBreadcrumbSchema(pageConfig.breadcrumbs);
    structuredDataManager.addStructuredData(breadcrumbSchema);
  }
}

/**
 * 動的コンテンツのSEO設定
 */
export function applySEOForDynamicContent(content: {
  type: 'question' | 'result' | 'guide-article';
  id: string;
  title: string;
  description: string;
  content?: string;
  category?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}): void {
  const baseUrl = metadataManager.getConfig().siteUrl;
  const url = `/${content.type}/${content.id}`;

  // メタデータ設定
  metadataManager.setPageMetadata({
    title: content.title,
    description: content.description,
    canonical: `${baseUrl}${url}`,
    type: 'article',
    keywords: content.tags || [],
    publishedTime: content.createdAt?.toISOString(),
    modifiedTime: content.updatedAt?.toISOString(),
  });

  // 構造化データ設定
  if (content.type === 'question') {
    // 質問ページの構造化データ
    const qaSchema = structuredDataManager.generateQAPageSchema({
      title: content.title,
      url,
      question: content.title,
      answer: content.description,
      publishedDate: content.createdAt?.toISOString(),
    });
    structuredDataManager.addStructuredData(qaSchema);
  } else if (content.type === 'guide-article') {
    // ガイド記事の構造化データ
    const articleSchema = {
      '@type': 'Article',
      headline: content.title,
      description: content.description,
      url: `${baseUrl}${url}`,
      datePublished: content.createdAt?.toISOString(),
      dateModified: content.updatedAt?.toISOString(),
      author: {
        '@type': 'Organization',
        name: '明和中学校入試面接練習アプリ',
      },
      publisher: structuredDataManager['organization'],
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}${url}`,
      },
      image: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/guide-default.jpg`,
        width: 1200,
        height: 630,
      },
    };
    structuredDataManager.addStructuredData(articleSchema);
  }

  // サイトマップに追加
  sitemapGenerator.addUrl({
    url,
    lastModified: content.updatedAt || content.createdAt || new Date(),
    changeFrequency: content.type === 'question' ? 'monthly' : 'weekly',
    priority: content.type === 'guide-article' ? 0.7 : 0.6,
  });
}

/**
 * サイトマップを生成してファイルとして出力
 */
export function generateSitemapFiles(): Array<{ name: string; content: string }> {
  // 動的なURLを追加（実際のデータから生成）
  const questionIds = getQuestionIds(); // 実装時に実際の質問IDを取得
  const categories = getCategories(); // 実装時に実際のカテゴリを取得
  const guides = getGuideArticles(); // 実装時に実際のガイド記事を取得

  sitemapGenerator.generateQuestionUrls(questionIds);
  sitemapGenerator.generateCategoryUrls(categories);
  sitemapGenerator.generateGuideUrls(guides);

  // サイトマップファイルを生成
  const sitemapFiles = sitemapGenerator.splitSitemap();
  
  // robots.txtも追加
  sitemapFiles.push({
    name: 'robots.txt',
    content: sitemapGenerator.generateRobotsTxt(),
  });

  return sitemapFiles;
}

/**
 * SEOパフォーマンス指標を取得
 */
export function getSEOMetrics(): {
  metadata: {
    hasTitle: boolean;
    titleLength: number;
    hasDescription: boolean;
    descriptionLength: number;
    hasKeywords: boolean;
    hasCanonical: boolean;
    hasOGTags: boolean;
    hasTwitterCard: boolean;
  };
  structuredData: {
    hasJsonLD: boolean;
    schemaCount: number;
    schemaTypes: string[];
  };
  sitemap: {
    totalUrls: number;
    validUrls: number;
    avgPriority: number;
  };
  performance: {
    pageLoadTime?: number;
    coreWebVitals?: {
      lcp?: number;
      fid?: number;
      cls?: number;
    };
  };
} {
  if (typeof window === 'undefined') {
    return {
      metadata: {
        hasTitle: false,
        titleLength: 0,
        hasDescription: false,
        descriptionLength: 0,
        hasKeywords: false,
        hasCanonical: false,
        hasOGTags: false,
        hasTwitterCard: false,
      },
      structuredData: {
        hasJsonLD: false,
        schemaCount: 0,
        schemaTypes: [],
      },
      sitemap: {
        totalUrls: 0,
        validUrls: 0,
        avgPriority: 0,
      },
      performance: {},
    };
  }

  // メタデータの分析
  const title = document.title;
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
  const canonical = document.querySelector('link[rel="canonical"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const twitterCard = document.querySelector('meta[name="twitter:card"]');

  // 構造化データの分析
  const jsonLDScripts = document.querySelectorAll('script[type="application/ld+json"]');
  const schemaTypes: string[] = [];
  
  jsonLDScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '');
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item['@type']) schemaTypes.push(item['@type']);
        });
      } else if (data['@type']) {
        schemaTypes.push(data['@type']);
      }
    } catch (e) {
      // JSON解析エラーは無視
    }
  });

  // サイトマップ統計
  const sitemapStats = sitemapGenerator.getStats();

  return {
    metadata: {
      hasTitle: !!title,
      titleLength: title.length,
      hasDescription: !!description,
      descriptionLength: description.length,
      hasKeywords: !!keywords,
      hasCanonical: !!canonical,
      hasOGTags: !!ogTitle,
      hasTwitterCard: !!twitterCard,
    },
    structuredData: {
      hasJsonLD: jsonLDScripts.length > 0,
      schemaCount: jsonLDScripts.length,
      schemaTypes: Array.from(new Set(schemaTypes)),
    },
    sitemap: {
      totalUrls: sitemapStats.totalUrls,
      validUrls: sitemapStats.validUrls,
      avgPriority: sitemapStats.avgPriority,
    },
    performance: {
      // Performance APIから取得（実装時に追加）
    },
  };
}

/**
 * SEO最適化の推奨事項を取得
 */
export function getSEORecommendations(): Array<{
  type: 'error' | 'warning' | 'info';
  category: 'metadata' | 'structured-data' | 'performance' | 'content';
  message: string;
  action: string;
}> {
  const metrics = getSEOMetrics();
  const recommendations: Array<{
    type: 'error' | 'warning' | 'info';
    category: 'metadata' | 'structured-data' | 'performance' | 'content';
    message: string;
    action: string;
  }> = [];

  // メタデータのチェック
  if (!metrics.metadata.hasTitle) {
    recommendations.push({
      type: 'error',
      category: 'metadata',
      message: 'ページタイトルが設定されていません',
      action: 'titleタグを追加してください',
    });
  } else if (metrics.metadata.titleLength > 60) {
    recommendations.push({
      type: 'warning',
      category: 'metadata',
      message: 'ページタイトルが長すぎます',
      action: 'タイトルを60文字以内に調整してください',
    });
  }

  if (!metrics.metadata.hasDescription) {
    recommendations.push({
      type: 'error',
      category: 'metadata',
      message: 'メタディスクリプションが設定されていません',
      action: 'meta description タグを追加してください',
    });
  } else if (metrics.metadata.descriptionLength > 160) {
    recommendations.push({
      type: 'warning',
      category: 'metadata',
      message: 'メタディスクリプションが長すぎます',
      action: 'ディスクリプションを160文字以内に調整してください',
    });
  }

  if (!metrics.metadata.hasCanonical) {
    recommendations.push({
      type: 'warning',
      category: 'metadata',
      message: 'canonical URLが設定されていません',
      action: 'canonical linkタグを追加してください',
    });
  }

  if (!metrics.metadata.hasOGTags) {
    recommendations.push({
      type: 'warning',
      category: 'metadata',
      message: 'Open Graphタグが設定されていません',
      action: 'OGタグを追加してSNSでの表示を最適化してください',
    });
  }

  // 構造化データのチェック
  if (!metrics.structuredData.hasJsonLD) {
    recommendations.push({
      type: 'warning',
      category: 'structured-data',
      message: '構造化データが設定されていません',
      action: 'JSON-LDで構造化データを追加してください',
    });
  }

  // サイトマップのチェック
  if (metrics.sitemap.validUrls === 0) {
    recommendations.push({
      type: 'error',
      category: 'content',
      message: 'サイトマップにURLが登録されていません',
      action: 'サイトマップを生成して検索エンジンに送信してください',
    });
  }

  return recommendations;
}

// ヘルパー関数（実装時に実際のデータアクセス関数に置き換え）
function getQuestionIds(): string[] {
  // 実装時に実際の質問IDを取得
  return ['q1', 'q2', 'q3', 'q4', 'q5'];
}

function getCategories(): string[] {
  // 実装時に実際のカテゴリを取得
  return ['志望動機', '自己PR', '将来の夢', '学校生活'];
}

function getGuideArticles(): Array<{ slug: string; updatedAt: Date }> {
  // 実装時に実際のガイド記事を取得
  return [
    { slug: 'interview-tips', updatedAt: new Date() },
    { slug: 'school-info', updatedAt: new Date() },
    { slug: 'preparation-guide', updatedAt: new Date() },
  ];
}

/**
 * 開発環境でのSEOデバッグ情報を取得
 */
export function getSEODebugInfo() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return {
    metadata: metadataManager.getCurrentMetadata(),
    config: metadataManager.getConfig(),
    sitemapStats: sitemapGenerator.getStats(),
    metrics: getSEOMetrics(),
    recommendations: getSEORecommendations(),
  };
}