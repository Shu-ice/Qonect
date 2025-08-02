# 面接練習アプリ - 実装タスク

## 📋 タスク概要

要件定義と技術設計に基づき、プレミアム品質の面接練習アプリを段階的に実装する。
モバイルファースト設計、高級感×親しみやすさを両立したUI/UXを重視し、小学6年生が直感的に利用できるアプリを構築する。

## 🏗️ Phase 1: プロジェクト基盤構築

### 1.1 開発環境セットアップ
- [x] **プロジェクト初期化**
  - Next.js 14 + TypeScript + Tailwind CSS プロジェクト作成
  - PWA設定（Service Worker、manifest.json）
  - Prisma ORM設定（PostgreSQL/SQLite）
  - 開発用Docker環境構築

- [x] **UI基盤構築**
  - プレミアムデザインシステムのコンポーネントライブラリ実装
  - 黄金比ベースのレスポンシブグリッドシステム
  - カスタムTailwind設定（プレミアムカラーパレット、フォント）
  - アクセシビリティ対応（WCAG 2.1 AA準拠）

- [x] **開発ツール設定**
  - ESLint + Prettier設定
  - Husky + lint-staged（pre-commit hooks）
  - Storybook設定（コンポーネント開発環境）
  - TypeScript strict設定

### 1.2 基本アーキテクチャ実装
- [x] **認証システム基盤**
  - NextAuth.js設定（保護者同意システム）
  - 年齢確認・保護者同意フロー
  - セッション管理とセキュリティ設定

- [x] **データベース設計実装**
  - Prismaスキーマ定義（Users, Schools, Essays, Sessions等）
  - マイグレーション設定
  - テストデータ作成

- [x] **API基盤構築**
  - Next.js API Routes設定
  - OpenAI API + Claude API統合準備
  - エラーハンドリング・ログ設定
  - レート制限実装

## 🎨 Phase 2: プレミアムUI/UXコンポーネント実装

### 2.1 デザインシステム実装
- [x] **プレミアムコンポーネント**
  ```typescript
  // PremiumCard, PremiumButton, PremiumInput等
  - 高級感のあるshadow、hover効果
  - マイクロインタラクション（ripple, shine効果）
  - スムーズなトランジション（300-500ms）
  - 小学生向け大型タッチターゲット（44px以上）
  ```

- [x] **レスポンシブレイアウト**
  - モバイルファースト設計（320px～）
  - タブレット最適化（768px～）
  - デスクトップ対応（1024px～）
  - 縦横画面切り替え対応

- [x] **アクセシビリティ強化**
  - 高コントラストモード実装
  - 文字サイズ拡大機能（125%, 150%, 200%）
  - ふりがな表示切り替え機能
  - VoiceOver/TalkBack対応

### 2.2 マスコットキャラクター・アニメーション
- [x] **マスコットシステム**
  - SVGベースの表情豊かなキャラクター
  - 感情状態に応じた表情変化（嬉しい、励まし、困った等）
  - CSS animations + Framer Motion統合
  - パーソナライゼーション（好きなキャラクター選択）

- [x] **マイクロインタラクション**
  - ボタンタップ時のripple効果
  - ローディング時のskeleton animation
  - 成功/エラー時のフィードバックアニメーション
  - ページ遷移時のスムーズなトランジション

## 📚 Phase 3: 志願理由書管理システム

### 3.1 志願理由書入力・解析
- [x] **基本入力システム実装**
```typescript
interface EssaySection {
  motivation: string;      // 志望動機
  research: string;        // 探究活動の実績・経験
  schoolLife: string;      // 中学・高校生活の抱負
  future: string;          // 将来の目標
}
```

- [ ] **手書きPDF高精度OCRシステム** ⭐ 新規実装
  - PDF.js統合（高解像度画像変換）
  - **Gemini Pro Vision統合**（手書き文字特化認識）
  ```typescript
  interface HandwritingOCR {
    pdfToImages: (file: File) => Promise<ImageData[]>;
    geminiVisionOCR: (images: ImageData[]) => Promise<string>;
    preprocessForStudents: (image: ImageData) => ImageData; // 小学生手書き最適化
    confidenceThreshold: 0.8;
    fallbackToTesseract: boolean;
    manualReviewUI: boolean;
  }
  ```
  - 認識結果確認・修正UI
  - 中学受験生手書き特徴対応（薄鉛筆、消しゴム跡、文字個人差）
  - フォールバック：Tesseract.js + 手動入力誘導

- [x] **トリプルAI解析エンジン**
  - Gemini Pro（日本語特化） + OpenAI GPT-4 + Claude 3.5統合
  - キーワード抽出・重要度スコアリング
  - 明和高校特化：探究活動の詳細分析
  - 項目別改善提案生成

### 3.2 学校別教育理念統合
- [x] **教育理念データベース**
```json
{
  "meiwa": {
    "focusAreas": {
      "research": 0.6,    // 探究活動重視60%
      "motivation": 0.15,
      "future": 0.15,
      "schoolLife": 0.1
    },
    "deepDiveQuestions": [
      "〇〇について、もう少し詳しく教えてください",
      "その調べ学習で、一番印象に残ったことは何ですか？"
    ]
  }
}
```

- [x] **質問生成アルゴリズム**
  - 学校別重み付けシステム
  - 個人の志願理由書内容×教育理念のマッチング
  - 質問難易度の段階的調整
  - 15分間の最適な質問配分計算

## 🎤 Phase 4: 音声入力・面接セッション

### 4.1 音声認識システム
- [ ] **Web Speech API統合**
```typescript
interface VoiceRecognition {
  startRecording(): Promise<void>;
  stopRecording(): Promise<string>;
  realTimeTranscription: boolean;
  confidenceScore: number;
  languageSettings: 'ja-JP';
}
```

- [ ] **音声UI最適化**
  - 大型録音ボタン（視覚的フィードバック付き）
  - 音声波形リアルタイム表示
  - ノイズキャンセリング案内
  - オフライン対応（Service Worker活用）

- [ ] **音声品質向上**
  - Google Cloud Speech API統合（プレミアム品質）
  - Azure Speech Service併用（冗長性確保）
  - 方言・口調補正機能
  - 音声認識エラー時の自動再試行

### 4.2 面接セッション管理
- [ ] **セッション制御システム**
  - 15分タイマー（視覚的進捗表示）
  - 質問間インターバル管理
  - 緊急停止・再開機能
  - セッション状態の永続化

- [ ] **リアルタイム評価**
```typescript
interface RealTimeEvaluation {
  contentRelevance: number;    // 内容関連性
  specificity: number;         // 具体性
  logicalStructure: number;    // 論理構成
  schoolAlignment: number;     // 学校適合性
  improvementTips: string[];   // 改善提案
}
```

## 🤖 Phase 5: マルチAI統合・評価システム

### 5.1 トリプルAI統合（OpenAI + Claude + Gemini）

- [x] **デュアルAI処理システム（OpenAI + Claude）**
- [x] **Gemini Pro API統合** ⭐ 新規実装
```typescript
interface TripleAIService {
  openai: {
    models: ['gpt-4-turbo', 'gpt-3.5-turbo'];
    useCase: '質問生成・詳細評価・構造化';
    allocation: '40%';
  };
  anthropic: {
    model: 'claude-3-5-sonnet';
    useCase: '創造的評価・総合判断・フィードバック';
    allocation: '35%';
  };
  google: {
    model: 'gemini-pro';
    useCase: '多角的検証・品質保証・コスト効率';
    allocation: '25%';
  };
  intelligentRouting: boolean;
  tripleBackupStrategy: 'priority' | 'round_robin' | 'cost_aware';
}
```

- [x] **Gemini Pro SDK統合・認証設定**
  - Google AI Studio APIキー設定
  - @google/generative-ai パッケージ統合
  - レート制限・エラーハンドリング
  - 日本語最適化設定

- [x] **3AI負荷分散アルゴリズム**
  ```typescript
  interface LoadBalancer {
    costThreshold: number;        // コスト上限
    qualityPriority: 'high' | 'balanced' | 'cost_efficient';
    failoverSequence: ['openai', 'anthropic', 'google'];
    responseTimeTarget: 5000;     // 5秒以内
  }
  ```

- [x] **明和中特化：探究活動質問生成エンジン**
  ```typescript
  interface MeiwaQuestionGenerator {
    researchAnalysis: {
      topic: string;
      personalExperience: string;
      socialConnection: string;
      openEndedness: boolean; // 正解がないか判定
    };
    questionTypes: {
      deepDive: string[];      // 60% 探究活動深掘り
      socialLink: string[];    // 20% 社会・日常関連
      selfGrowth: string[];    // 15% 自己変容確認
      future: string[];        // 5% 将来展望
    };
    followUpStrategy: 'deeper' | 'broader' | 'clarification';
  }
  ```

- [x] **7項目探究活動評価システム**
  ```typescript
  interface MeiwaResearchEvaluator {
    genuineInterest: {
      score: number;           // 1-5段階
      indicators: string[];    // 熱意の証拠
      concerns: string[];      // 懸念点
    };
    experienceBase: {
      score: number;
      realExperiences: string[];
      learningProcess: string[];
    };
    socialConnection: {
      score: number;
      dailyLifeLinks: string[];
      societalRelevance: string[];
    };
    noDefinitiveAnswer: {
      score: number;
      // ⚠️重要：否定疑問文対応
      // 正解がない = 高スコア、正解がある = 低スコア
      complexity: string[];
      multipleViews: boolean;
    };
    otherUnderstanding: {
      score: number;
      clarity: string[];
      empathy: string[];
    };
    selfTransformation: {
      score: number;
      behaviorChanges: string[];
      valueShifts: string[];
    };
    originalExpression: {
      score: number;
      personalVocab: string[];
      uniquePhrases: string[];
    };
  }
  ```
  - 過去セッションとの比較分析
  - 成長トラッキングと可視化

- [x] **Gemini Pro特化機能** ⭐ 新規実装
  ```typescript
  interface GeminiSpecializedFeatures {
    qualityAssurance: {
      crossValidation: boolean;      // 他AI結果の検証
      biasDetection: string[];       // 評価バイアス検出
      consistencyCheck: boolean;     // 一貫性チェック
    };
    japaneseOptimization: {
      culturalContext: boolean;      // 日本文化理解
      educationSystemAwareness: boolean; // 日本教育制度理解
      linguisticNuance: boolean;     // 日本語ニュアンス
    };
    costEfficiencyMode: {
      bulkProcessing: boolean;       // バッチ処理対応
      cacheOptimization: boolean;    // キャッシュ最適化
      fallbackPrimary: boolean;      // 第一候補フォールバック
    };
  }
  ```

### 5.2 パフォーマンス最適化
- [x] **キャッシュ戦略**
  - 教育理念データの事前キャッシュ
  - 類似質問パターンの再利用
  - API レスポンスのローカル保存
  - Service Workerによるオフライン対応

- [x] **レート制限・コスト管理**
  - 1日3セッション/ユーザー制限
  - API利用量のリアルタイム監視
  - 優先順位付きキューイング
  - 緊急時のフォールバック機能

## 📊 Phase 6: 進捗管理・分析ダッシュボード

### 6.1 学習分析システム
- [x] **進捗追跡ダッシュボード**
```typescript
interface ProgressAnalytics {
  sessionHistory: SessionRecord[];
  improvementTrends: {
    motivation: TrendData;
    research: TrendData;
    schoolLife: TrendData;
    future: TrendData;
  };
  weaknessIdentification: string[];
  recommendedFocus: string[];
}
```

- [x] **可視化コンポーネント**
  - Chart.js/Recharts統合
  - レーダーチャート（5軸評価）
  - 時系列グラフ（成長推移）
  - ヒートマップ（質問タイプ別スコア）

- [x] **AI推奨システム**
  - 個別学習計画の自動生成
  - 弱点克服のための特化練習提案
  - 本番面接直前の総合チェックリスト
  - 同レベル受験生との匿名化比較

### 6.2 保護者向け機能
- [x] **保護者ダッシュボード**
  - 子供の練習状況サマリー
  - 成長グラフの共有機能
  - 家庭でのサポート方法ガイド
  - 面接同席練習モード

- [x] **サポート機能**
  - 質問内容の事前確認
  - 回答改善のためのヒント表示
  - 本番面接チェックリスト生成
  - 緊急時の連絡・サポート体制

## 🛡️ Phase 7: セキュリティ・プライバシー強化

### 7.1 個人情報保護
- [x] **プライバシー基盤**
```typescript
interface PrivacySettings {
  dataEncryption: 'AES-256';
  dataRetention: '1年間';
  parentalConsent: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
}
```

- [x] **同意管理システム**
  - 保護者同意の電子署名
  - データ利用目的の明確化
  - 同意撤回の簡単な仕組み
  - GDPR準拠のデータ管理

- [x] **アクセス制御**
  - 学生×保護者の適切な権限分離
  - セッションタイムアウト設定
  - 不正アクセス検知・ログ記録
  - 定期的なセキュリティ監査

### 7.2 データ安全性
- [x] **暗号化システム**
  - 保存データの暗号化
  - 通信データのTLS 1.3
  - API キーの環境変数管理
  - 定期的なキーローテーション

## 🚀 Phase 8: デプロイメント・本番運用

### 8.1 インフラ構築
- [ ] **AWS ECS Fargate デプロイ**
```yaml
# docker-compose.yml
services:
  app:
    image: interview-app:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

- [ ] **CDN・キャッシュ設定**
  - CloudFront + S3構成
  - 静的アセットの最適化
  - 画像圧縮・次世代フォーマット対応
  - グローバル配信の高速化

- [ ] **モニタリング体制**
  - DataDog統合（APM, Infrastructure, Logs）
  - Sentry エラートラッキング
  - リアルタイムアラート設定
  - パフォーマンス監視ダッシュボード

### 8.2 品質保証・テスト
- [ ] **テスト環境構築**
  - Jest + React Testing Library
  - E2Eテスト（Playwright）
  - 音声認識テスト環境
  - 負荷テスト（Apache JMeter）

- [ ] **品質管理プロセス**
  - 継続的インテグレーション（GitHub Actions）
  - 自動デプロイメントパイプライン
  - セキュリティスキャン（Snyk, OWASP ZAP）
  - アクセシビリティテスト（axe-core）

## 📱 Phase 9: PWA・モバイル最適化

### 9.1 Progressive Web App
- [ ] **PWA コア機能**
```json
// manifest.json
{
  "name": "面接練習アプリ",
  "short_name": "面接練習",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1e40af",
  "background_color": "#ffffff"
}
```

- [ ] **Service Worker実装**
  - オフライン機能（基本操作）
  - バックグラウンド同期
  - プッシュ通知（練習リマインダー）
  - キャッシュ戦略の最適化

- [ ] **モバイル体験向上**
  - ネイティブアプリライクなナビゲーション
  - タッチジェスチャー対応
  - バイブレーション・触覚フィードバック
  - バッテリー消費の最適化

### 9.2 パフォーマンス最適化
- [ ] **Core Web Vitals対応**
  - LCP（Largest Contentful Paint）< 2.5s
  - FID（First Input Delay）< 100ms
  - CLS（Cumulative Layout Shift）< 0.1
  - 画像最適化（WebP, AVIF対応）

- [ ] **モバイル特化最適化**
  - 低速回線対応（3G環境）
  - データ使用量最小化
  - メモリ使用量制限（256MB以下）
  - CPU使用率の効率化

## 🎯 Phase 10: 最終調整・リリース準備

### 10.1 ユーザビリティテスト
- [ ] **小学生向けユーザビリティ**
  - 実際の小学6年生によるテスト
  - 操作のわかりやすさ検証
  - マスコットキャラクターの親しみやすさ評価
  - 保護者との協力体制テスト

- [ ] **アクセシビリティ最終確認**
  - スクリーンリーダー対応確認
  - キーボードナビゲーション
  - 色覚多様性対応
  - 認知負荷軽減の最適化

### 10.2 本番リリース
- [ ] **段階的ロールアウト**
  - ベータテスト（20名限定）
  - フィードバック収集・改善
  - 正式リリース（2026年1月）
  - 24時間サポート体制

- [ ] **継続改善プロセス**
  - 週次アップデート計画
  - ユーザーフィードバック収集システム
  - A/Bテスト基盤構築
  - 新機能開発ロードマップ

## 📈 Phase 11: 運用・スケーリング

### 11.1 運用監視
- [ ] **運用ダッシュボード**
  - リアルタイム利用状況監視
  - API利用量・コスト追跡
  - エラー率・レスポンス時間監視
  - ユーザー満足度指標

- [ ] **自動スケーリング**
  - トラフィック増加時の自動拡張
  - データベース接続プール最適化
  - CDNキャッシュ効率化
  - コスト最適化の自動化

### 11.2 データ分析・改善
- [ ] **学習効果分析**
  - 実際の面接合格率追跡
  - 練習回数と成績向上の相関分析
  - 学校別傾向分析
  - AI評価精度の継続改善

## ✅ 完了基準

各フェーズの完了基準：

| Phase | 完了基準 | 品質指標 |
|-------|----------|----------|
| 1-2 | プレミアムUI完成 | Lighthouse Score 95+ |
| 3-4 | 基本機能動作 | 音声認識精度90%+ |
| 5-6 | AI統合完了 | 評価精度85%+ |
| 7-8 | セキュリティ対応 | セキュリティ監査合格 |
| 9-10 | モバイル最適化 | PWA完全対応 |
| 11 | 本番運用開始 | 99.5%可用性達成 |

## 🎉 成功指標

- **技術指標**: Core Web Vitals全項目グリーン、PWA完全対応
- **品質指標**: 小学生ユーザビリティテスト90%満足度
- **効果指標**: 練習前後での面接スコア20%向上
- **運用指標**: 99.5%可用性、24時間以内のサポート対応

---

**実装推定期間**: 3ヶ月（集中開発）
**開発者**: 1名フルタイム
**予算**: 月額109,000円（プレミアム品質）
**ROI**: 1.77M円/月の収益ポテンシャル