/**
 * 手書きPDF高精度OCRシステム - Gemini Pro Vision特化
 * 小学生・中学生の手書き文字認識に最適化
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface HandwritingOCRConfig {
  model: string;
  maxRetries: number;
  confidenceThreshold: number;
  preprocessingEnabled: boolean;
  manualReviewMode: boolean;
  debugMode: boolean;
}

export interface HandwritingOCRResult {
  recognizedText: string;
  confidence: number;
  processingTime: number;
  method: 'gemini-vision';
  preprocessingApplied: string[];
  pageResults: PageOCRResult[];
  totalPages: number;
  overallConfidence: number;
  combinedText: string;
  errors?: string[];
}

export interface PageOCRResult {
  pageNumber: number;
  text: string;
  confidence: number;
  sections: TextSection[];
  processingTime: number;
  imageQuality: ImageQualityMetrics;
}

export interface TextSection {
  id: string;
  text: string;
  confidence: number;
  boundingBox?: BoundingBox;
  sectionType: 'motivation' | 'research' | 'schoolLife' | 'future' | 'general';
  keywords: string[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageQualityMetrics {
  resolution: { width: number; height: number };
  clarity: number; // 0-1
  contrast: number; // 0-1
  brightness: number; // 0-1
  handwritingDensity: number; // 0-1
  estimatedAge: 'elementary' | 'middle' | 'high' | 'adult';
}

export interface ImagePreprocessingOptions {
  enhanceContrast: boolean;
  adjustBrightness: boolean;
  denoiseImage: boolean;
  straightenText: boolean;
  cropMargins: boolean;
  handwritingOptimization: boolean;
}

class HandwritingGeminiOCR {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: HandwritingOCRConfig;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key is required for OCR functionality');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.config = {
      model: 'gemini-pro-vision',
      maxRetries: 3,
      confidenceThreshold: 0.8,
      preprocessingEnabled: true,
      manualReviewMode: true,
      debugMode: false,
    };

    this.model = this.genAI.getGenerativeModel({ model: this.config.model });
  }

  /**
   * 設定更新
   */
  public configure(config: Partial<HandwritingOCRConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * PDFファイルから複数ページOCR処理
   */
  public async processMultiplePages(
    pdfFile: File,
    options?: Partial<ImagePreprocessingOptions>
  ): Promise<HandwritingOCRResult> {
    const startTime = performance.now();
    const preprocessingApplied: string[] = [];

    try {
      // PDF to Images変換
      const images = await this.pdfToImages(pdfFile);
      console.log(`Converted PDF to ${images.length} images`);

      const pageResults: PageOCRResult[] = [];
      let totalConfidence = 0;
      const allTexts: string[] = [];

      // 各ページを処理
      for (let i = 0; i < images.length; i++) {
        try {
          console.log(`Processing page ${i + 1}/${images.length}`);
          
          // 前処理実行
          let processedImage = images[i];
          if (this.config.preprocessingEnabled) {
            const preprocessResult = await this.preprocessImage(processedImage, options);
            processedImage = preprocessResult.image;
            preprocessingApplied.push(...preprocessResult.applied);
          }

          // Gemini Vision OCR実行
          const pageResult = await this.processPage(processedImage, i + 1);
          pageResults.push(pageResult);
          allTexts.push(pageResult.text);
          totalConfidence += pageResult.confidence;

          console.log(`Page ${i + 1} processed: ${pageResult.text.length} characters, confidence: ${pageResult.confidence.toFixed(2)}`);

        } catch (error) {
          console.error(`Failed to process page ${i + 1}:`, error);
          
          // エラーページでもプレースホルダーを追加
          pageResults.push({
            pageNumber: i + 1,
            text: '',
            confidence: 0,
            sections: [],
            processingTime: 0,
            imageQuality: {
              resolution: { width: 0, height: 0 },
              clarity: 0,
              contrast: 0,
              brightness: 0,
              handwritingDensity: 0,
              estimatedAge: 'elementary',
            },
          });
        }
      }

      // 結果統合
      const combinedText = this.combinePageTexts(allTexts);
      const overallConfidence = pageResults.length > 0 ? totalConfidence / pageResults.length : 0;
      const processingTime = performance.now() - startTime;

      const result: HandwritingOCRResult = {
        recognizedText: combinedText,
        confidence: overallConfidence,
        processingTime,
        method: 'gemini-vision',
        preprocessingApplied: Array.from(new Set(preprocessingApplied)),
        pageResults,
        totalPages: images.length,
        overallConfidence,
        combinedText,
      };

      if (this.config.debugMode) {
        console.log('OCR Result:', result);
      }

      return result;

    } catch (error) {
      console.error('Multi-page OCR processing failed:', error);
      throw new Error(`OCR処理に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * PDFをImageDataの配列に変換
   */
  private async pdfToImages(pdfFile: File): Promise<ImageData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // PDF.jsを動的にロード
          const pdfjsLib = await import('pdfjs-dist');
          if (pdfjsLib.GlobalWorkerOptions) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          }

          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const images: ImageData[] = [];

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const scale = 2.0; // 高解像度化
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d')!;
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            images.push(imageData);
          }

          resolve(images);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('PDF読み込みに失敗しました'));
      reader.readAsArrayBuffer(pdfFile);
    });
  }

  /**
   * 単一ページの処理
   */
  private async processPage(imageData: ImageData, pageNumber: number): Promise<PageOCRResult> {
    const startTime = performance.now();

    try {
      // 画像品質評価
      const imageQuality = this.evaluateImageQuality(imageData);

      // Gemini Vision用の画像準備
      const imageBase64 = this.imageDataToBase64(imageData);

      // OCR実行
      const ocrText = await this.geminiVisionOCR(imageBase64, imageQuality);

      // テキスト構造化
      const sections = this.structureText(ocrText, pageNumber);

      // 信頼度計算
      const confidence = this.calculateConfidence(ocrText, imageQuality, sections);

      const processingTime = performance.now() - startTime;

      return {
        pageNumber,
        text: ocrText,
        confidence,
        sections,
        processingTime,
        imageQuality,
      };

    } catch (error) {
      console.error(`Page ${pageNumber} processing failed:`, error);
      throw error;
    }
  }

  /**
   * Gemini Pro Vision OCR実行
   */
  private async geminiVisionOCR(imageBase64: string, quality: ImageQualityMetrics): Promise<string> {
    const prompt = this.buildOptimizedPrompt(quality);

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/png',
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      return this.postProcessText(text);

    } catch (error) {
      console.error('Gemini Vision OCR failed:', error);
      throw new Error('Gemini Vision OCR処理に失敗しました');
    }
  }

  /**
   * 最適化されたプロンプト生成
   */
  private buildOptimizedPrompt(quality: ImageQualityMetrics): string {
    let prompt = `以下の手書き文書を正確にテキスト化してください。

特別な指示：
1. 手書き文字を丁寧に読み取り、誤字脱字を最小化してください
2. 文章の改行や段落構造を保持してください  
3. 読み取り不可能な文字は[?]で表記してください
4. 消しゴムで消された部分は無視してください
5. 文脈から推測できる漢字は適切に変換してください`;

    // 年齢別最適化
    if (quality.estimatedAge === 'elementary') {
      prompt += `
6. 小学生の手書き文字特有の特徴を考慮してください：
   - ひらがなが多い
   - 漢字の字形が不正確な場合がある
   - 文字のサイズが不均一`;
    } else if (quality.estimatedAge === 'middle') {
      prompt += `
6. 中学生の手書き文字特有の特徴を考慮してください：
   - 漢字の使用頻度が高い
   - 筆圧が強い
   - 行間が狭い場合がある`;
    }

    // 画質に応じた調整
    if (quality.clarity < 0.7) {
      prompt += `
7. 画像の鮮明度が低いため、文脈からの推測を積極的に活用してください`;
    }

    prompt += `

出力形式：認識したテキストのみを出力し、説明文は含めないでください。`;

    return prompt;
  }

  /**
   * テキスト後処理
   */
  private postProcessText(text: string): string {
    // 一般的なOCRエラーの修正
    let processed = text
      .replace(/ヽ/g, '、') // カタカナの「ヽ」を読点に
      .replace(/ー/g, '一') // 長音記号を漢字の「一」に（文脈によって調整が必要）
      .replace(/[０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFF10 + 0x30)) // 全角数字を半角に
      .replace(/\s+/g, ' ') // 連続する空白を単一に
      .trim();

    // 明らかな誤認識パターンの修正
    const corrections = [
      { pattern: /志望動機/g, replacement: '志望動機' },
      { pattern: /探究活動/g, replacement: '探究活動' },
      { pattern: /中学校/g, replacement: '中学校' },
      { pattern: /高等学校/g, replacement: '高等学校' },
    ];

    corrections.forEach(({ pattern, replacement }) => {
      processed = processed.replace(pattern, replacement);
    });

    return processed;
  }

  /**
   * 画像品質評価
   */
  private evaluateImageQuality(imageData: ImageData): ImageQualityMetrics {
    const { data, width, height } = imageData;
    
    let brightness = 0;
    let contrast = 0;
    let handwritingPixels = 0;
    const pixelCount = width * height;

    // 基本的な品質メトリクス計算
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1]; 
      const b = data[i + 2];
      
      const gray = (r + g + b) / 3;
      brightness += gray;
      
      // 手書き文字検出（暗いピクセル）
      if (gray < 128) {
        handwritingPixels++;
      }
    }

    brightness = brightness / pixelCount / 255;
    const handwritingDensity = handwritingPixels / pixelCount;

    // コントラスト計算（簡易版）
    contrast = Math.min(1, handwritingDensity * 2);

    // 鮮明度推定
    const clarity = Math.min(1, contrast * brightness * 2);

    // 年齢推定（簡易版）
    let estimatedAge: ImageQualityMetrics['estimatedAge'] = 'elementary';
    if (handwritingDensity > 0.15) estimatedAge = 'middle';
    if (handwritingDensity > 0.25) estimatedAge = 'high';

    return {
      resolution: { width, height },
      clarity,
      contrast,
      brightness,
      handwritingDensity,
      estimatedAge,
    };
  }

  /**
   * 画像前処理
   */
  private async preprocessImage(
    imageData: ImageData,
    options?: Partial<ImagePreprocessingOptions>
  ): Promise<{ image: ImageData; applied: string[] }> {
    const applied: string[] = [];
    let processedData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    const defaultOptions: ImagePreprocessingOptions = {
      enhanceContrast: true,
      adjustBrightness: true,
      denoiseImage: true,
      straightenText: false,
      cropMargins: true,
      handwritingOptimization: true,
    };

    const finalOptions = { ...defaultOptions, ...options };

    // コントラスト強化
    if (finalOptions.enhanceContrast) {
      processedData = this.enhanceContrast(processedData);
      applied.push('contrast_enhancement');
    }

    // 明度調整
    if (finalOptions.adjustBrightness) {
      processedData = this.adjustBrightness(processedData);
      applied.push('brightness_adjustment');
    }

    // ノイズ除去
    if (finalOptions.denoiseImage) {
      processedData = this.denoiseImage(processedData);
      applied.push('noise_reduction');
    }

    // 手書き最適化
    if (finalOptions.handwritingOptimization) {
      processedData = this.optimizeForHandwriting(processedData);
      applied.push('handwriting_optimization');
    }

    return { image: processedData, applied };
  }

  /**
   * コントラスト強化
   */
  private enhanceContrast(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const factor = 1.5; // コントラスト倍率

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));     // R
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128)); // G
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128)); // B
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * 明度調整
   */
  private adjustBrightness(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const adjustment = 20; // 明度調整値

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] + adjustment));     // R
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment)); // G
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment)); // B
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * ノイズ除去（簡易版）
   */
  private denoiseImage(imageData: ImageData): ImageData {
    // 簡易的なメディアンフィルタ
    const data = new Uint8ClampedArray(imageData.data);
    const { width, height } = imageData;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4;
        
        // 3x3近傍の中央値を計算（簡易版）
        const neighbors: number[] = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ni = ((y + dy) * width + (x + dx)) * 4;
            neighbors.push((data[ni] + data[ni + 1] + data[ni + 2]) / 3);
          }
        }
        
        neighbors.sort((a, b) => a - b);
        const median = neighbors[4]; // 中央値
        
        data[i] = median;     // R
        data[i + 1] = median; // G  
        data[i + 2] = median; // B
      }
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * 手書き文字最適化
   */
  private optimizeForHandwriting(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);

    // 二値化処理（手書き文字強調）
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const binary = gray < 200 ? 0 : 255; // 閾値調整
      
      data[i] = binary;     // R
      data[i + 1] = binary; // G
      data[i + 2] = binary; // B
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * ImageDataをBase64に変換
   */
  private imageDataToBase64(imageData: ImageData): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
    
    return canvas.toDataURL('image/png').split(',')[1];
  }

  /**
   * テキスト構造化
   */
  private structureText(text: string, pageNumber: number): TextSection[] {
    const sections: TextSection[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    let currentSection: TextSection = {
      id: `page-${pageNumber}-section-0`,
      text: '',
      confidence: 0.8,
      sectionType: 'general',
      keywords: [],
    };

    // セクション分割ロジック（キーワードベース）
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // セクション境界検出
      const sectionKeywords = {
        motivation: ['志望動機', '志望理由', 'なぜ'],
        research: ['探究', '研究', '調べ', '調査'],
        schoolLife: ['学校生活', '中学', '高校', '生活'],
        future: ['将来', '夢', '目標', '未来'],
      };

      let sectionType: TextSection['sectionType'] = 'general';
      
      for (const [type, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.some(keyword => trimmedLine.includes(keyword))) {
          sectionType = type as TextSection['sectionType'];
          break;
        }
      }

      // 新しいセクション開始判定
      if (sectionType !== 'general' && sectionType !== currentSection.sectionType) {
        if (currentSection.text.trim()) {
          sections.push(currentSection);
        }
        
        currentSection = {
          id: `page-${pageNumber}-section-${sections.length}`,
          text: '',
          confidence: 0.8,
          sectionType,
          keywords: [],
        };
      }

      currentSection.text += (currentSection.text ? '\n' : '') + trimmedLine;
    });

    // 最後のセクションを追加
    if (currentSection.text.trim()) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * 信頼度計算
   */
  private calculateConfidence(
    text: string,
    imageQuality: ImageQualityMetrics,
    sections: TextSection[]
  ): number {
    let confidence = 0.7; // ベース信頼度

    // 画質による調整
    confidence += imageQuality.clarity * 0.2;
    confidence += imageQuality.contrast * 0.1;

    // テキスト品質による調整
    const unknownCharRatio = (text.match(/\[?\?\]?/g) || []).length / Math.max(1, text.length);
    confidence -= unknownCharRatio * 0.3;

    // 文字数による調整
    if (text.length < 50) {
      confidence -= 0.1; // 短すぎる
    } else if (text.length > 100) {
      confidence += 0.1; // 適切な長さ
    }

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * ページテキスト統合
   */
  private combinePageTexts(pageTexts: string[]): string {
    return pageTexts
      .filter(text => text.trim().length > 0)
      .join('\n\n--- ページ区切り ---\n\n');
  }
}

// シングルトンインスタンス
export const handwritingOCR = new HandwritingGeminiOCR();