/**
 * サイトマップ生成
 * 動的なサイトマップとrobot.txtの生成
 */

export interface SitemapUrl {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number; // 0.0 - 1.0
  alternates?: Array<{
    lang: string;
    url: string;
  }>;
}

export interface SitemapConfig {
  baseUrl: string;
  defaultChangeFreq: 'daily' | 'weekly' | 'monthly';
  defaultPriority: number;
  excludePatterns: string[];
  includeTrailingSlash: boolean;
  maxUrls: number;
}

class SitemapGenerator {
  private static instance: SitemapGenerator;
  private config: SitemapConfig;
  private urls: SitemapUrl[] = [];

  static getInstance(): SitemapGenerator {
    if (!SitemapGenerator.instance) {
      SitemapGenerator.instance = new SitemapGenerator();
    }
    return SitemapGenerator.instance;
  }

  constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://interview-practice.example.com',
      defaultChangeFreq: 'weekly',
      defaultPriority: 0.7,
      excludePatterns: [
        '/api/*',
        '/admin/*',
        '/_next/*',
        '/private/*',
        '*.json',
        '*.xml',
        '/temp/*',
      ],
      includeTrailingSlash: false,
      maxUrls: 50000, // Googleの制限
    };

    this.initializeStaticUrls();
  }

  /**
   * 設定を更新
   */
  public updateConfig(config: Partial<SitemapConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 静的なURLを初期化
   */
  private initializeStaticUrls(): void {
    const staticUrls: SitemapUrl[] = [
      {
        url: '/',
        changeFrequency: 'weekly',
        priority: 1.0,
        lastModified: new Date(),
      },
      {
        url: '/practice',
        changeFrequency: 'daily',
        priority: 0.9,
        lastModified: new Date(),
      },
      {
        url: '/practice/questions',
        changeFrequency: 'weekly',
        priority: 0.8,
        lastModified: new Date(),
      },
      {
        url: '/practice/interview',
        changeFrequency: 'daily',
        priority: 0.9,
        lastModified: new Date(),
      },
      {
        url: '/results',
        changeFrequency: 'daily',
        priority: 0.7,
        lastModified: new Date(),
      },
      {
        url: '/guide',
        changeFrequency: 'monthly',
        priority: 0.8,
        lastModified: new Date(),
      },
      {
        url: '/guide/interview-tips',
        changeFrequency: 'monthly',
        priority: 0.7,
        lastModified: new Date(),
      },
      {
        url: '/guide/school-info',
        changeFrequency: 'monthly',
        priority: 0.6,
        lastModified: new Date(),
      },
      {
        url: '/guide/faq',
        changeFrequency: 'monthly',
        priority: 0.6,
        lastModified: new Date(),
      },
      {
        url: '/about',
        changeFrequency: 'monthly',
        priority: 0.5,
        lastModified: new Date(),
      },
      {
        url: '/contact',
        changeFrequency: 'monthly',
        priority: 0.5,
        lastModified: new Date(),
      },
      {
        url: '/privacy',
        changeFrequency: 'yearly',
        priority: 0.3,
        lastModified: new Date(),
      },
      {
        url: '/terms',
        changeFrequency: 'yearly',
        priority: 0.3,
        lastModified: new Date(),
      },
    ];

    this.urls = staticUrls.map(url => ({
      ...url,
      url: this.normalizeUrl(url.url),
    }));
  }

  /**
   * 動的URLを追加
   */
  public addUrl(url: SitemapUrl): void {
    if (this.urls.length >= this.config.maxUrls) {
      console.warn('Sitemap URL limit reached');
      return;
    }

    const normalizedUrl = {
      ...url,
      url: this.normalizeUrl(url.url),
      changeFrequency: url.changeFrequency || this.config.defaultChangeFreq,
      priority: url.priority || this.config.defaultPriority,
      lastModified: url.lastModified || new Date(),
    };

    // 既存URLの重複チェック
    const existingIndex = this.urls.findIndex(existing => existing.url === normalizedUrl.url);
    if (existingIndex >= 0) {
      this.urls[existingIndex] = normalizedUrl;
    } else {
      this.urls.push(normalizedUrl);
    }
  }

  /**
   * 複数のURLを一括追加
   */
  public addUrls(urls: SitemapUrl[]): void {
    urls.forEach(url => this.addUrl(url));
  }

  /**
   * URLを削除
   */
  public removeUrl(url: string): void {
    const normalizedUrl = this.normalizeUrl(url);
    this.urls = this.urls.filter(item => item.url !== normalizedUrl);
  }

  /**
   * 練習問題のURLを動的生成
   */
  public generateQuestionUrls(questionIds: string[]): void {
    const questionUrls: SitemapUrl[] = questionIds.map(id => ({
      url: `/practice/questions/${id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      lastModified: new Date(),
    }));

    this.addUrls(questionUrls);
  }

  /**
   * カテゴリページのURLを生成
   */
  public generateCategoryUrls(categories: string[]): void {
    const categoryUrls: SitemapUrl[] = categories.map(category => ({
      url: `/practice/category/${encodeURIComponent(category)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      lastModified: new Date(),
    }));

    this.addUrls(categoryUrls);
  }

  /**
   * ガイド記事のURLを生成
   */
  public generateGuideUrls(guides: Array<{ slug: string; updatedAt: Date }>): void {
    const guideUrls: SitemapUrl[] = guides.map(guide => ({
      url: `/guide/${guide.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      lastModified: guide.updatedAt,
    }));

    this.addUrls(guideUrls);
  }

  /**
   * URLを正規化
   */
  private normalizeUrl(url: string): string {
    // 先頭にスラッシュを追加
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    // 末尾のスラッシュを処理
    if (this.config.includeTrailingSlash && url.length > 1 && !url.endsWith('/')) {
      url += '/';
    } else if (!this.config.includeTrailingSlash && url.length > 1 && url.endsWith('/')) {
      url = url.slice(0, -1);
    }

    return url;
  }

  /**
   * URLが除外パターンに一致するかチェック
   */
  private isExcluded(url: string): boolean {
    return this.config.excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(url);
    });
  }

  /**
   * XMLサイトマップを生成
   */
  public generateXMLSitemap(): string {
    const validUrls = this.urls.filter(url => !this.isExcluded(url.url));

    const urlElements = validUrls.map(url => {
      const fullUrl = this.config.baseUrl + url.url;
      
      let urlElement = `    <url>\n`;
      urlElement += `      <loc>${this.escapeXml(fullUrl)}</loc>\n`;
      
      if (url.lastModified) {
        urlElement += `      <lastmod>${url.lastModified.toISOString().split('T')[0]}</lastmod>\n`;
      }
      
      if (url.changeFrequency) {
        urlElement += `      <changefreq>${url.changeFrequency}</changefreq>\n`;
      }
      
      if (url.priority !== undefined) {
        urlElement += `      <priority>${url.priority.toFixed(1)}</priority>\n`;
      }

      // 多言語対応
      if (url.alternates && url.alternates.length > 0) {
        url.alternates.forEach(alternate => {
          urlElement += `      <xhtml:link rel="alternate" hreflang="${alternate.lang}" href="${this.escapeXml(alternate.url)}" />\n`;
        });
      }
      
      urlElement += `    </url>\n`;
      
      return urlElement;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlElements}</urlset>`;
  }

  /**
   * サイトマップインデックスを生成（大量のURLがある場合）
   */
  public generateSitemapIndex(sitemapFiles: string[]): string {
    const sitemapElements = sitemapFiles.map(file => {
      const fullUrl = this.config.baseUrl + '/' + file;
      
      return `    <sitemap>
      <loc>${this.escapeXml(fullUrl)}</loc>
      <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    </sitemap>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapElements}
</sitemapindex>`;
  }

  /**
   * robots.txtを生成
   */
  public generateRobotsTxt(): string {
    const sitemapUrl = this.config.baseUrl + '/sitemap.xml';
    
    return `# Robots.txt for 明和中学校入試面接練習アプリ

# すべてのロボットに対する基本ルール
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /private/
Disallow: /temp/
Disallow: /*.json$
Disallow: /*?*utm_*
Disallow: /*?*ref=*

# 検索エンジン最適化
Crawl-delay: 1

# サイトマップの場所
Sitemap: ${sitemapUrl}

# 主要検索エンジンのための特別なルール
User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /admin/

# 悪意のあるボットをブロック
User-agent: BadBot
Disallow: /

User-agent: Scrapy
Disallow: /

User-agent: SemrushBot
Disallow: /

# メディアファイルへのアクセス許可
User-agent: Googlebot-Image
Allow: /images/
Allow: /*.jpg$
Allow: /*.jpeg$
Allow: /*.png$
Allow: /*.gif$
Allow: /*.webp$

# その他の有用な情報
# Host: ${this.config.baseUrl.replace('https://', '').replace('http://', '')}
`;
  }

  /**
   * XMLエスケープ
   */
  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  /**
   * サイトマップを分割（大量のURL対応）
   */
  public splitSitemap(): { name: string; content: string }[] {
    const maxUrlsPerSitemap = 50000; // Googleの制限
    const validUrls = this.urls.filter(url => !this.isExcluded(url.url));
    
    if (validUrls.length <= maxUrlsPerSitemap) {
      return [{
        name: 'sitemap.xml',
        content: this.generateXMLSitemap(),
      }];
    }

    const sitemaps: { name: string; content: string }[] = [];
    const chunks = this.chunkArray(validUrls, maxUrlsPerSitemap);
    
    chunks.forEach((chunk, index) => {
      const sitemapGenerator = new SitemapGenerator();
      sitemapGenerator.updateConfig(this.config);
      sitemapGenerator.urls = chunk;
      
      sitemaps.push({
        name: `sitemap-${index + 1}.xml`,
        content: sitemapGenerator.generateXMLSitemap(),
      });
    });

    // サイトマップインデックスを作成
    const indexContent = this.generateSitemapIndex(
      sitemaps.map(s => s.name)
    );
    
    sitemaps.unshift({
      name: 'sitemap.xml',
      content: indexContent,
    });

    return sitemaps;
  }

  /**
   * 配列を指定サイズで分割
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 現在のURLリストを取得
   */
  public getUrls(): SitemapUrl[] {
    return [...this.urls];
  }

  /**
   * 統計情報を取得
   */
  public getStats(): {
    totalUrls: number;
    validUrls: number;
    excludedUrls: number;
    lastGenerated: Date;
    avgPriority: number;
  } {
    const validUrls = this.urls.filter(url => !this.isExcluded(url.url));
    const excludedUrls = this.urls.length - validUrls.length;
    const avgPriority = validUrls.reduce((sum, url) => sum + (url.priority || 0), 0) / validUrls.length;

    return {
      totalUrls: this.urls.length,
      validUrls: validUrls.length,
      excludedUrls,
      lastGenerated: new Date(),
      avgPriority: Number(avgPriority.toFixed(2)),
    };
  }

  /**
   * URLをクリア
   */
  public clear(): void {
    this.urls = [];
    this.initializeStaticUrls();
  }

  /**
   * 設定をリセット
   */
  public reset(): void {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://interview-practice.example.com',
      defaultChangeFreq: 'weekly',
      defaultPriority: 0.7,
      excludePatterns: [
        '/api/*',
        '/admin/*',
        '/_next/*',
        '/private/*',
        '*.json',
        '*.xml',
        '/temp/*',
      ],
      includeTrailingSlash: false,
      maxUrls: 50000,
    };
    this.clear();
  }
}

// シングルトンインスタンス
export const sitemapGenerator = SitemapGenerator.getInstance();