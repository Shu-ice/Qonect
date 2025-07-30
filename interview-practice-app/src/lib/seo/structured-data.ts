/**
 * 構造化データ（JSON-LD）管理
 * Schema.org準拠の構造化データ生成
 */

// 基本的なSchemaタイプのインターface
export interface Organization {
  '@type': 'Organization' | 'EducationalOrganization';
  name: string;
  url: string;
  logo?: {
    '@type': 'ImageObject';
    url: string;
    width?: number;
    height?: number;
  };
  address?: PostalAddress;
  contactPoint?: ContactPoint;
  sameAs?: string[];
}

export interface PostalAddress {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  addressCountry: string;
}

export interface ContactPoint {
  '@type': 'ContactPoint';
  telephone?: string;
  email?: string;
  contactType: string;
  areaServed?: string;
  availableLanguage?: string[];
}

export interface Person {
  '@type': 'Person';
  name: string;
  givenName?: string;
  familyName?: string;
  jobTitle?: string;
  affiliation?: Organization;
  email?: string;
  url?: string;
}

export interface WebSite {
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  inLanguage?: string;
  publisher?: Organization;
  potentialAction?: SearchAction;
}

export interface SearchAction {
  '@type': 'SearchAction';
  target: {
    '@type': 'EntryPoint';
    urlTemplate: string;
  };
  'query-input': string;
}

export interface WebPage {
  '@type': 'WebPage';
  name: string;
  url: string;
  description?: string;
  inLanguage?: string;
  isPartOf?: WebSite;
  author?: Person | Organization;
  publisher?: Organization;
  datePublished?: string;
  dateModified?: string;
  image?: ImageObject;
  breadcrumb?: BreadcrumbList;
}

export interface ImageObject {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
  caption?: string;
  contentUrl?: string;
}

export interface BreadcrumbList {
  '@type': 'BreadcrumbList';
  itemListElement: ListItem[];
}

export interface ListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
}

export interface Course {
  '@type': 'Course';
  name: string;
  description: string;
  provider: Organization;
  url?: string;
  courseCode?: string;
  hasCourseInstance?: CourseInstance[];
  teaches?: string[];
  educationalLevel?: string;
  inLanguage?: string;
  image?: ImageObject;
}

export interface CourseInstance {
  '@type': 'CourseInstance';
  courseMode: string;
  instructor?: Person;
  startDate?: string;
  endDate?: string;
  location?: Place;
}

export interface Place {
  '@type': 'Place';
  name: string;
  address?: PostalAddress;
  url?: string;
}

export interface QAPage {
  '@type': 'QAPage';
  name: string;
  url: string;
  description?: string;
  mainEntity: Question;
}

export interface Question {
  '@type': 'Question';
  name: string;
  text: string;
  answerCount: number;
  acceptedAnswer?: Answer;
  suggestedAnswer?: Answer[];
  author?: Person;
  dateCreated?: string;
  upvoteCount?: number;
}

export interface Answer {
  '@type': 'Answer';
  text: string;
  author?: Person;
  dateCreated?: string;
  upvoteCount?: number;
  url?: string;
}

export interface VideoObject {
  '@type': 'VideoObject';
  name: string;
  description: string;
  thumbnailUrl: string[];
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
  publisher?: Organization;
  creator?: Person;
}

class StructuredDataManager {
  private static instance: StructuredDataManager;
  private baseUrl: string;
  private organization: Organization;

  static getInstance(): StructuredDataManager {
    if (!StructuredDataManager.instance) {
      StructuredDataManager.instance = new StructuredDataManager();
    }
    return StructuredDataManager.instance;
  }

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://interview-practice.example.com';
    this.organization = this.createOrganization();
  }

  /**
   * 基本的な組織情報を作成
   */
  private createOrganization(): Organization {
    return {
      '@type': 'EducationalOrganization',
      name: '明和中学校入試面接練習アプリ',
      url: this.baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${this.baseUrl}/images/logo.png`,
        width: 200,
        height: 60,
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: '名古屋市',
        addressRegion: '愛知県',
        addressCountry: 'JP',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        areaServed: 'JP',
        availableLanguage: ['Japanese'],
      },
    };
  }

  /**
   * WebSiteスキーマを生成
   */
  public generateWebSiteSchema(): WebSite {
    return {
      '@type': 'WebSite',
      name: '明和中学校入試面接練習アプリ',
      url: this.baseUrl,
      description: '愛知県公立中高一貫校（明和高校附属中学校）の入試面接練習ができるアプリです。AI技術を活用した本格的な面接シミュレーションで合格をサポートします。',
      inLanguage: 'ja-JP',
      publisher: this.organization,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.baseUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
  }

  /**
   * WebPageスキーマを生成
   */
  public generateWebPageSchema(page: {
    title: string;
    url: string;
    description?: string;
    author?: Person;
    publishedDate?: string;
    modifiedDate?: string;
    image?: ImageObject;
    breadcrumbs?: Array<{ name: string; url?: string }>;
  }): WebPage {
    const breadcrumbList: BreadcrumbList | undefined = page.breadcrumbs ? {
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url ? `${this.baseUrl}${crumb.url}` : undefined,
      })),
    } : undefined;

    return {
      '@type': 'WebPage',
      name: page.title,
      url: `${this.baseUrl}${page.url}`,
      description: page.description,
      inLanguage: 'ja-JP',
      isPartOf: this.generateWebSiteSchema(),
      author: page.author,
      publisher: this.organization,
      datePublished: page.publishedDate,
      dateModified: page.modifiedDate || new Date().toISOString(),
      image: page.image,
      breadcrumb: breadcrumbList,
    };
  }

  /**
   * 面接練習コースのスキーマを生成
   */
  public generateCourseSchema(): Course {
    return {
      '@type': 'Course',
      name: '明和中学校入試面接練習コース',
      description: 'AI技術を活用した明和高校附属中学校の入試面接対策コース。実際の面接を想定した練習で合格力を向上させます。',
      provider: this.organization,
      url: `${this.baseUrl}/practice`,
      courseCode: 'MEIWA-INTERVIEW-2024',
      teaches: [
        '面接における適切な話し方',
        '志望動機の表現方法',
        '自己PRの効果的な伝え方',
        '面接官とのコミュニケーション',
        '緊張対策と心構え',
      ],
      educationalLevel: '中学校入学前',
      inLanguage: 'ja-JP',
      image: {
        '@type': 'ImageObject',
        url: `${this.baseUrl}/images/course-thumbnail.jpg`,
        width: 1200,
        height: 630,
        caption: '明和中学校入試面接練習コース',
      },
      hasCourseInstance: [{
        '@type': 'CourseInstance',
        courseMode: 'online',
        location: {
          '@type': 'Place',
          name: 'オンライン',
          url: this.baseUrl,
        },
      }],
    };
  }

  /**
   * FAQ（Q&A）ページのスキーマを生成
   */
  public generateQAPageSchema(qa: {
    title: string;
    url: string;
    question: string;
    answer: string;
    author?: Person;
    publishedDate?: string;
    upvotes?: number;
  }): QAPage {
    return {
      '@type': 'QAPage',
      name: qa.title,
      url: `${this.baseUrl}${qa.url}`,
      mainEntity: {
        '@type': 'Question',
        name: qa.question,
        text: qa.question,
        answerCount: 1,
        author: qa.author,
        dateCreated: qa.publishedDate,
        upvoteCount: qa.upvotes || 0,
        acceptedAnswer: {
          '@type': 'Answer',
          text: qa.answer,
          author: qa.author,
          dateCreated: qa.publishedDate,
          upvoteCount: qa.upvotes || 0,
        },
      },
    };
  }

  /**
   * 面接質問のFAQリストを生成
   */
  public generateInterviewFAQSchema(): QAPage[] {
    const commonQuestions = [
      {
        question: '明和高校附属中学校を志望する理由は何ですか？',
        answer: '明和高校附属中学校は中高一貫教育により深い学びが可能で、将来の大学進学に向けて充実した環境が整っているからです。特に理数系の教育が充実しており、私の将来の夢である研究者になるために必要な基礎力を身につけることができると考えています。',
      },
      {
        question: '中学校生活で頑張りたいことは何ですか？',
        answer: '学習面では特に数学と理科に力を入れ、将来の進路に向けた基礎力を身につけたいです。また、生徒会活動やクラブ活動にも積極的に参加し、リーダーシップや協調性を身につけて充実した中学校生活を送りたいと考えています。',
      },
      {
        question: '小学校時代に最も印象に残っている出来事は？',
        answer: '6年生の文化祭で実行委員長を務めたことです。クラス全員の意見をまとめることの難しさを学びましたが、最終的に素晴らしい発表ができ、協力することの大切さと達成感を得ることができました。',
      },
    ];

    return commonQuestions.map((qa, index) => ({
      '@type': 'QAPage',
      name: `面接質問${index + 1}：${qa.question}`,
      url: `${this.baseUrl}/guide/faq#question-${index + 1}`,
      mainEntity: {
        '@type': 'Question',
        name: qa.question,
        text: qa.question,
        answerCount: 1,
        dateCreated: new Date().toISOString(),
        acceptedAnswer: {
          '@type': 'Answer',
          text: qa.answer,
          dateCreated: new Date().toISOString(),
        },
      },
    }));
  }

  /**
   * 動画コンテンツのスキーマを生成
   */
  public generateVideoSchema(video: {
    title: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration?: string;
    contentUrl?: string;
    embedUrl?: string;
    creator?: Person;
  }): VideoObject {
    return {
      '@type': 'VideoObject',
      name: video.title,
      description: video.description,
      thumbnailUrl: [video.thumbnailUrl],
      uploadDate: video.uploadDate,
      duration: video.duration,
      contentUrl: video.contentUrl,
      embedUrl: video.embedUrl,
      publisher: this.organization,
      creator: video.creator,
    };
  }

  /**
   * パンくずリストのスキーマを生成
   */
  public generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url?: string }>): BreadcrumbList {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url ? `${this.baseUrl}${crumb.url}` : undefined,
      })),
    };
  }

  /**
   * 教育機関（明和高校附属中学校）のスキーマを生成
   */
  public generateSchoolSchema(): Organization {
    return {
      '@type': 'EducationalOrganization',
      name: '明和高校附属中学校',
      url: 'https://meiwa-h.aichi-c.ed.jp/',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '津田町3丁目25番地',
        addressLocality: '名古屋市瑞穂区',
        addressRegion: '愛知県',
        postalCode: '467-0026',
        addressCountry: 'JP',
      },
      sameAs: [
        'https://meiwa-h.aichi-c.ed.jp/',
      ],
    };
  }

  /**
   * ローカルビジネス（学習塾等）のスキーマを生成
   */
  public generateLocalBusinessSchema(): Organization {
    return {
      '@type': 'Organization',
      name: '明和中学校入試面接練習サービス',
      url: this.baseUrl,
      address: {
        '@type': 'PostalAddress',
        addressLocality: '名古屋市',
        addressRegion: '愛知県',
        addressCountry: 'JP',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        areaServed: 'JP',
        availableLanguage: ['Japanese'],
      },
      sameAs: [
        this.baseUrl,
      ],
    };
  }

  /**
   * JSON-LDを生成して文書に追加
   */
  public addStructuredData(schema: any): void {
    if (typeof window === 'undefined') return;

    const jsonLD = {
      '@context': 'https://schema.org',
      ...schema,
    };

    // 既存のスキーマタグを検索
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    
    let script: HTMLScriptElement;
    if (existingScript) {
      script = existingScript as HTMLScriptElement;
    } else {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(jsonLD, null, 2);
  }

  /**
   * 複数のスキーマを配列として追加
   */
  public addMultipleStructuredData(schemas: any[]): void {
    if (typeof window === 'undefined') return;

    const jsonLD = schemas.map(schema => ({
      '@context': 'https://schema.org',
      ...schema,
    }));

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLD, null, 2);
    document.head.appendChild(script);
  }

  /**
   * ページタイプに応じたスキーマを自動生成
   */
  public generatePageSchema(pageType: string, pageData: any): any {
    switch (pageType) {
      case 'homepage':
        return this.generateWebSiteSchema();
      
      case 'course':
        return this.generateCourseSchema();
      
      case 'faq':
        return this.generateInterviewFAQSchema();
      
      case 'video':
        return this.generateVideoSchema(pageData);
      
      case 'school':
        return this.generateSchoolSchema();
      
      default:
        return this.generateWebPageSchema(pageData);
    }
  }

  /**
   * 組織情報を更新
   */
  public updateOrganization(org: Partial<Organization>): void {
    this.organization = { ...this.organization, ...org };
  }

  /**
   * ベースURLを更新
   */
  public updateBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

// シングルトンインスタンス
export const structuredDataManager = StructuredDataManager.getInstance();