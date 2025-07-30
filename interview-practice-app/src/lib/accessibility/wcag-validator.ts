/**
 * WCAG準拠チェッカー
 * Web Content Accessibility Guidelines の自動検証
 */

export interface WCAGViolation {
  id: string;
  level: 'A' | 'AA' | 'AAA';
  guideline: string;
  criterion: string;
  element: HTMLElement;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
}

export interface AccessibilityAuditResult {
  violations: WCAGViolation[];
  passedChecks: number;
  totalChecks: number;
  score: number; // 0-100
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

class WCAGValidator {
  private static instance: WCAGValidator;
  private violations: WCAGViolation[] = [];

  static getInstance(): WCAGValidator {
    if (!WCAGValidator.instance) {
      WCAGValidator.instance = new WCAGValidator();
    }
    return WCAGValidator.instance;
  }

  /**
   * 完全なアクセシビリティ監査を実行
   */
  public auditPage(container: HTMLElement = document.body): AccessibilityAuditResult {
    this.violations = [];

    // 各カテゴリの検証を実行
    this.checkImages(container);
    this.checkHeadings(container);
    this.checkForms(container);
    this.checkLinks(container);
    this.checkColorContrast(container);
    this.checkKeyboardAccessibility(container);
    this.checkAriaLabels(container);
    this.checkLandmarks(container);
    this.checkFocus(container);
    this.checkLanguage();
    this.checkTables(container);
    this.checkMultimedia(container);

    return this.generateReport();
  }

  /**
   * 画像のアクセシビリティチェック (WCAG 1.1.1)
   */
  private checkImages(container: HTMLElement): void {
    const images = container.querySelectorAll('img');
    
    images.forEach((img) => {
      // alt属性の存在チェック
      if (!img.hasAttribute('alt')) {
        this.addViolation({
          id: 'img-alt-missing',
          level: 'A',
          guideline: '1.1 Text Alternatives',
          criterion: '1.1.1 Non-text Content',
          element: img as HTMLElement,
          message: '画像にalt属性がありません',
          severity: 'error',
          suggestion: 'alt属性を追加して画像の内容を説明してください',
        });
      }

      // 装飾的な画像のチェック
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src');
      
      if (alt === null || (alt === '' && !img.hasAttribute('role'))) {
        // 装飾的な画像の場合はrole="presentation"またはaria-hidden="true"が推奨
        if (src && !src.includes('icon') && !src.includes('decoration')) {
          this.addViolation({
            id: 'img-alt-empty-without-role',
            level: 'A',
            guideline: '1.1 Text Alternatives',
            criterion: '1.1.1 Non-text Content',
            element: img as HTMLElement,
            message: '装飾的でない画像のalt属性が空です',
            severity: 'warning',
            suggestion: '適切なalt文を追加するか、装飾的な画像の場合はrole="presentation"を追加してください',
          });
        }
      }

      // alt文の品質チェック
      if (alt && (alt.startsWith('image of') || alt.startsWith('picture of') || alt.includes('画像'))) {
        this.addViolation({
          id: 'img-alt-redundant',
          level: 'AA',
          guideline: '1.1 Text Alternatives',
          criterion: '1.1.1 Non-text Content',
          element: img as HTMLElement,
          message: 'alt文に不要な「画像」などの文言が含まれています',
          severity: 'warning',
          suggestion: 'alt文は画像の内容を直接説明し、「画像」「写真」などの語は省いてください',
        });
      }
    });
  }

  /**
   * 見出しの階層チェック (WCAG 1.3.1, 2.4.6)
   */
  private checkHeadings(container: HTMLElement): void {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels: number[] = [];

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.slice(1));
      headingLevels.push(level);

      // 見出しの空チェック
      if (!heading.textContent?.trim()) {
        this.addViolation({
          id: 'heading-empty',
          level: 'A',
          guideline: '1.3 Adaptable',
          criterion: '1.3.1 Info and Relationships',
          element: heading as HTMLElement,
          message: '見出しが空です',
          severity: 'error',
          suggestion: '見出しに適切なテキストを追加してください',
        });
      }

      // 見出し階層の跳躍チェック
      if (index > 0) {
        const previousLevel = headingLevels[index - 1];
        if (level > previousLevel + 1) {
          this.addViolation({
            id: 'heading-skip-level',
            level: 'AA',
            guideline: '2.4 Navigable',
            criterion: '2.4.6 Headings and Labels',
            element: heading as HTMLElement,
            message: `見出しレベルが${previousLevel}から${level}に跳躍しています`,
            severity: 'warning',
            suggestion: '見出しレベルは順次的に使用してください',
          });
        }
      }

      // h1の複数存在チェック
      if (level === 1) {
        const h1Count = container.querySelectorAll('h1').length;
        if (h1Count > 1) {
          this.addViolation({
            id: 'multiple-h1',
            level: 'AA',
            guideline: '2.4 Navigable',
            criterion: '2.4.6 Headings and Labels',
            element: heading as HTMLElement,
            message: 'ページに複数のh1要素があります',
            severity: 'warning',
            suggestion: '1ページには1つのh1要素のみを使用してください',
          });
        }
      }
    });
  }

  /**
   * フォームのアクセシビリティチェック (WCAG 1.3.1, 3.3.2)
   */
  private checkForms(container: HTMLElement): void {
    const formControls = container.querySelectorAll('input, select, textarea');

    formControls.forEach((control) => {
      const input = control as HTMLInputElement;
      
      // ラベルの存在チェック
      const hasLabel = this.hasAssociatedLabel(input);
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel) {
        this.addViolation({
          id: 'form-label-missing',
          level: 'A',
          guideline: '1.3 Adaptable',
          criterion: '1.3.1 Info and Relationships',
          element: input as HTMLElement,
          message: 'フォームコントロールにラベルがありません',
          severity: 'error',
          suggestion: 'label要素またはaria-label属性を追加してください',
        });
      }

      // 必須フィールドのマーキング
      if (input.hasAttribute('required') || input.getAttribute('aria-required') === 'true') {
        const hasRequiredIndicator = this.hasRequiredIndicator(input);
        if (!hasRequiredIndicator) {
          this.addViolation({
            id: 'required-field-not-indicated',
            level: 'A',
            guideline: '3.3 Input Assistance',
            criterion: '3.3.2 Labels or Instructions',
            element: input as HTMLElement,
            message: '必須フィールドが明示されていません',
            severity: 'warning',
            suggestion: 'aria-required="true"またはvisual indicatorを追加してください',
          });
        }
      }

      // エラーメッセージの関連付け
      if (input.getAttribute('aria-invalid') === 'true') {
        const hasErrorDescription = input.hasAttribute('aria-describedby');
        if (!hasErrorDescription) {
          this.addViolation({
            id: 'error-message-not-associated',
            level: 'AA',
            guideline: '3.3 Input Assistance',
            criterion: '3.3.3 Error Suggestion',
            element: input as HTMLElement,
            message: 'エラーメッセージがフィールドに関連付けられていません',
            severity: 'error',
            suggestion: 'aria-describedby属性でエラーメッセージを関連付けてください',
          });
        }
      }
    });
  }

  /**
   * リンクのアクセシビリティチェック (WCAG 2.4.4)
   */
  private checkLinks(container: HTMLElement): void {
    const links = container.querySelectorAll('a');

    links.forEach((link) => {
      // リンクテキストの存在チェック
      const linkText = this.getLinkText(link);
      if (!linkText.trim()) {
        this.addViolation({
          id: 'link-empty',
          level: 'A',
          guideline: '2.4 Navigable',
          criterion: '2.4.4 Link Purpose (In Context)',
          element: link as HTMLElement,
          message: 'リンクテキストが空です',
          severity: 'error',
          suggestion: 'リンクの目的を説明するテキストを追加してください',
        });
      }

      // 曖昧なリンクテキスト
      const ambiguousTexts = ['こちら', 'click here', 'read more', '詳細', 'more'];
      if (ambiguousTexts.some(text => linkText.toLowerCase().includes(text.toLowerCase()))) {
        this.addViolation({
          id: 'link-ambiguous',
          level: 'AA',
          guideline: '2.4 Navigable',
          criterion: '2.4.4 Link Purpose (In Context)',
          element: link as HTMLElement,
          message: 'リンクテキストが曖昧です',
          severity: 'warning',
          suggestion: 'リンクの目的を明確に説明するテキストを使用してください',
        });
      }

      // 外部リンクの表示
      const isExternal = link.hostname && link.hostname !== window.location.hostname;
      if (isExternal && !link.hasAttribute('aria-label') && !linkText.includes('外部')) {
        this.addViolation({
          id: 'external-link-not-indicated',
          level: 'AAA',
          guideline: '2.4 Navigable',
          criterion: '2.4.4 Link Purpose (In Context)',
          element: link as HTMLElement,
          message: '外部リンクが明示されていません',
          severity: 'info',
          suggestion: '外部リンクであることを示すテキストやアイコンを追加してください',
        });
      }
    });
  }

  /**
   * 色のコントラストチェック (WCAG 1.4.3)
   */
  private checkColorContrast(container: HTMLElement): void {
    const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');

    textElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const styles = window.getComputedStyle(htmlElement);
      
      // テキストが存在し、可視である場合のみチェック
      if (!htmlElement.textContent?.trim() || styles.display === 'none' || styles.visibility === 'hidden') {
        return;
      }

      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));

      const contrast = this.calculateContrast(styles.color, styles.backgroundColor);
      const minContrast = isLargeText ? 3 : 4.5; // WCAG AA基準

      if (contrast < minContrast) {
        this.addViolation({
          id: 'color-contrast-insufficient',
          level: 'AA',
          guideline: '1.4 Distinguishable',
          criterion: '1.4.3 Contrast (Minimum)',
          element: htmlElement,
          message: `色のコントラスト比が不十分です (${contrast.toFixed(2)}:1, 必要: ${minContrast}:1)`,
          severity: 'error',
          suggestion: 'テキストと背景色のコントラストを高めてください',
        });
      }
    });
  }

  /**
   * キーボードアクセシビリティチェック (WCAG 2.1.1)
   */
  private checkKeyboardAccessibility(container: HTMLElement): void {
    const interactiveElements = container.querySelectorAll('button, a, input, select, textarea, [tabindex], [role="button"], [role="link"]');

    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      
      // tabindex="-1"以外の負の値をチェック
      const tabIndex = htmlElement.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) < -1) {
        this.addViolation({
          id: 'invalid-tabindex',
          level: 'A',
          guideline: '2.1 Keyboard Accessible',
          criterion: '2.1.1 Keyboard',
          element: htmlElement,
          message: '無効なtabindex値です',
          severity: 'error',
          suggestion: 'tabindexは0、-1、または正の整数を使用してください',
        });
      }

      // カスタムコントロールのキーボードサポート
      const role = htmlElement.getAttribute('role');
      if ((role === 'button' || role === 'link') && htmlElement.tagName.toLowerCase() !== 'button' && htmlElement.tagName.toLowerCase() !== 'a') {
        const hasKeyboardHandler = htmlElement.hasAttribute('onkeydown') || htmlElement.hasAttribute('onkeyup');
        if (!hasKeyboardHandler) {
          this.addViolation({
            id: 'custom-control-no-keyboard',
            level: 'A',
            guideline: '2.1 Keyboard Accessible',
            criterion: '2.1.1 Keyboard',
            element: htmlElement,
            message: 'カスタムコントロールにキーボードサポートがありません',
            severity: 'error',
            suggestion: 'EnterキーやSpaceキーでの操作に対応してください',
          });
        }
      }
    });
  }

  /**
   * ARIAラベルのチェック (WCAG 4.1.2)
   */
  private checkAriaLabels(container: HTMLElement): void {
    const elementsWithAria = container.querySelectorAll('[aria-labelledby], [aria-describedby]');

    elementsWithAria.forEach((element) => {
      // aria-labelledbyの参照チェック
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const ids = labelledBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            this.addViolation({
              id: 'aria-labelledby-invalid-reference',
              level: 'A',
              guideline: '4.1 Compatible',
              criterion: '4.1.2 Name, Role, Value',
              element: element as HTMLElement,
              message: `aria-labelledbyが存在しない要素を参照しています: ${id}`,
              severity: 'error',
              suggestion: '正しいIDを参照するか、該当する要素を追加してください',
            });
          }
        });
      }

      // aria-describedbyの参照チェック
      const describedBy = element.getAttribute('aria-describedby');
      if (describedBy) {
        const ids = describedBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            this.addViolation({
              id: 'aria-describedby-invalid-reference',
              level: 'A',
              guideline: '4.1 Compatible',
              criterion: '4.1.2 Name, Role, Value',
              element: element as HTMLElement,
              message: `aria-describedbyが存在しない要素を参照しています: ${id}`,
              severity: 'error',
              suggestion: '正しいIDを参照するか、該当する要素を追加してください',
            });
          }
        });
      }
    });
  }

  /**
   * ランドマークのチェック (WCAG 1.3.1)
   */
  private checkLandmarks(container: HTMLElement): void {
    const landmarks = container.querySelectorAll('main, nav, header, footer, aside, section, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]');
    
    // メインランドマークの存在チェック
    const mainLandmarks = container.querySelectorAll('main, [role="main"]');
    if (mainLandmarks.length === 0) {
      this.addViolation({
        id: 'main-landmark-missing',
        level: 'AA',
        guideline: '1.3 Adaptable',
        criterion: '1.3.1 Info and Relationships',
        element: container as HTMLElement,
        message: 'メインランドマークがありません',
        severity: 'warning',
        suggestion: 'main要素またはrole="main"を追加してください',
      });
    } else if (mainLandmarks.length > 1) {
      this.addViolation({
        id: 'multiple-main-landmarks',
        level: 'AA',
        guideline: '1.3 Adaptable',
        criterion: '1.3.1 Info and Relationships',
        element: container as HTMLElement,
        message: '複数のメインランドマークがあります',
        severity: 'error',
        suggestion: 'メインランドマークは1つのみにしてください',
      });
    }
  }

  /**
   * フォーカス管理のチェック (WCAG 2.4.3)
   */
  private checkFocus(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    // フォーカス順序の論理性チェック（簡易版）
    let hasPositiveTabIndex = false;
    focusableElements.forEach((element) => {
      const tabIndex = parseInt(element.getAttribute('tabindex') || '0');
      if (tabIndex > 0) {
        hasPositiveTabIndex = true;
      }
    });

    if (hasPositiveTabIndex) {
      this.addViolation({
        id: 'positive-tabindex-used',
        level: 'A',
        guideline: '2.4 Navigable',
        criterion: '2.4.3 Focus Order',
        element: container as HTMLElement,
        message: '正の値のtabindexが使用されています',
        severity: 'warning',
        suggestion: 'DOM順序でフォーカス順序を制御し、正のtabindexは避けてください',
      });
    }
  }

  /**
   * 言語属性のチェック (WCAG 3.1.1)
   */
  private checkLanguage(): void {
    const html = document.documentElement;
    if (!html.hasAttribute('lang')) {
      this.addViolation({
        id: 'html-lang-missing',
        level: 'A',
        guideline: '3.1 Readable',
        criterion: '3.1.1 Language of Page',
        element: html as HTMLElement,
        message: 'html要素にlang属性がありません',
        severity: 'error',
        suggestion: 'html要素にlang="ja"を追加してください',
      });
    }
  }

  /**
   * テーブルのアクセシビリティチェック (WCAG 1.3.1)
   */
  private checkTables(container: HTMLElement): void {
    const tables = container.querySelectorAll('table');

    tables.forEach((table) => {
      // キャプションの存在チェック
      const caption = table.querySelector('caption');
      const hasAriaLabel = table.hasAttribute('aria-label') || table.hasAttribute('aria-labelledby');
      
      if (!caption && !hasAriaLabel) {
        this.addViolation({
          id: 'table-caption-missing',
          level: 'A',
          guideline: '1.3 Adaptable',
          criterion: '1.3.1 Info and Relationships',
          element: table as HTMLElement,
          message: 'テーブルにキャプションまたはラベルがありません',
          severity: 'warning',
          suggestion: 'caption要素またはaria-label属性を追加してください',
        });
      }

      // ヘッダー行の存在チェック
      const hasHeaders = table.querySelector('th') || table.querySelector('[scope]');
      if (!hasHeaders && table.querySelectorAll('tr').length > 1) {
        this.addViolation({
          id: 'table-headers-missing',
          level: 'A',
          guideline: '1.3 Adaptable',
          criterion: '1.3.1 Info and Relationships',
          element: table as HTMLElement,
          message: 'テーブルにヘッダーがありません',
          severity: 'error',
          suggestion: 'th要素またはscope属性を使用してヘッダーを定義してください',
        });
      }
    });
  }

  /**
   * マルチメディアのチェック (WCAG 1.2.1)
   */
  private checkMultimedia(container: HTMLElement): void {
    const videos = container.querySelectorAll('video');
    const audios = container.querySelectorAll('audio');

    Array.from([...Array.from(videos), ...Array.from(audios)]).forEach((media) => {
      // キャプション/字幕の存在チェック
      const hasTrack = media.querySelector('track[kind="captions"], track[kind="subtitles"]');
      if (!hasTrack) {
        this.addViolation({
          id: 'media-captions-missing',
          level: 'A',
          guideline: '1.2 Time-based Media',
          criterion: '1.2.1 Audio-only and Video-only (Prerecorded)',
          element: media as HTMLElement,
          message: 'メディアにキャプションまたは字幕がありません',
          severity: 'error',
          suggestion: 'track要素でキャプションを提供してください',
        });
      }

      // 自動再生のチェック
      if (media.hasAttribute('autoplay')) {
        this.addViolation({
          id: 'media-autoplay',
          level: 'AA',
          guideline: '1.4 Distinguishable',
          criterion: '1.4.2 Audio Control',
          element: media as HTMLElement,
          message: 'メディアが自動再生されます',
          severity: 'warning',
          suggestion: '自動再生を避けるか、停止/一時停止コントロールを提供してください',
        });
      }
    });
  }

  // ヘルパーメソッド

  private hasAssociatedLabel(input: HTMLInputElement): boolean {
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return true;
    }

    // 親要素のlabelをチェック
    const parentLabel = input.closest('label');
    return !!parentLabel;
  }

  private hasRequiredIndicator(input: HTMLInputElement): boolean {
    return input.hasAttribute('aria-required') ||
           input.getAttribute('aria-label')?.includes('必須') ||
           input.getAttribute('aria-labelledby') && 
           document.getElementById(input.getAttribute('aria-labelledby')!)?.textContent?.includes('必須') ||
           false;
  }

  private getLinkText(link: HTMLAnchorElement): string {
    // aria-labelが優先
    if (link.hasAttribute('aria-label')) {
      return link.getAttribute('aria-label')!;
    }

    // aria-labelledbyを確認
    if (link.hasAttribute('aria-labelledby')) {
      const ids = link.getAttribute('aria-labelledby')!.split(' ');
      const texts = ids.map(id => document.getElementById(id)?.textContent || '');
      return texts.join(' ').trim();
    }

    // 通常のテキストコンテンツ
    return link.textContent?.trim() || '';
  }

  private calculateContrast(foreground: string, background: string): number {
    // 簡易的なコントラスト計算（実際の実装ではより詳細な計算が必要）
    const fLum = this.getLuminance(foreground);
    const bLum = this.getLuminance(background);
    
    const lighter = Math.max(fLum, bLum);
    const darker = Math.min(fLum, bLum);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private getLuminance(color: string): number {
    // RGB値を正規化した輝度計算の簡易版
    // 実際の実装ではより正確な計算が必要
    const rgb = this.parseColor(color);
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private parseColor(color: string): [number, number, number] {
    // 簡易的な色解析（実際の実装ではより詳細な解析が必要）
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        return [parseInt(matches[0]), parseInt(matches[1]), parseInt(matches[2])];
      }
    }
    
    // デフォルト値
    return [0, 0, 0];
  }

  private addViolation(violation: WCAGViolation): void {
    this.violations.push(violation);
  }

  private generateReport(): AccessibilityAuditResult {
    const errors = this.violations.filter(v => v.severity === 'error').length;
    const warnings = this.violations.filter(v => v.severity === 'warning').length;
    const info = this.violations.filter(v => v.severity === 'info').length;
    
    const totalChecks = this.violations.length + (this.violations.length > 0 ? 50 : 100); // 仮の総チェック数
    const passedChecks = totalChecks - this.violations.length;
    const score = Math.max(0, Math.round((passedChecks / totalChecks) * 100));

    return {
      violations: this.violations,
      passedChecks,
      totalChecks,
      score,
      summary: {
        errors,
        warnings,
        info,
      },
    };
  }
}

// シングルトンインスタンス
export const wcagValidator = WCAGValidator.getInstance();