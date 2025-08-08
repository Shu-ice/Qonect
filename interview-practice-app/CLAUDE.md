# 面接練習アプリ - Claude開発ガイド

## 🚨 最重要原則（絶対遵守）🚨
**「メインはAIチャット」** - 固定セリフは基本不要。AIが動的に質問生成。
詳細: ../.kiro/steering/principles.md 参照必須

## プロジェクト概要
愛知県公立中高一貫校（明和高校附属中学校）の面接練習に特化したWebアプリケーション

## 技術スタック
- **フロントエンド**: Next.js 14 + TypeScript + Tailwind CSS
- **バックエンド**: Node.js + Express + Prisma
- **データベース**: SQLite (開発) / PostgreSQL (本番)
- **AI**: OpenAI GPT-4 API
- **音声**: Web Speech API

## 開発コマンド
```bash
# 開発サーバー起動
npm run dev

# TypeScriptチェック
npm run typecheck

# Lint実行
npm run lint

# ビルド
npm run build

# データベース操作
npm run db:generate  # Prismaスキーマ生成
npm run db:migrate   # マイグレーション実行
npm run db:seed      # 初期データ投入
npm run db:studio    # Prisma Studio起動
```

## 重要なUI/UX要件
- **タブレット・スマホ優先設計**: iPad (10.2〜12.9インチ) での最適表示
- **タッチ操作最適化**: 最小タップエリア44px
- **スマートな外観**: モダンで洗練されたビジュアルデザイン
- **学習効果重視**: ゲーミフィケーション要素とプログレス可視化
- **直感的操作**: 小学6年生が説明なしで使えるUI

## ディレクトリ構造
```
interview-practice-app/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Reactコンポーネント
│   │   ├── ui/          # 基本UIコンポーネント
│   │   └── features/    # 機能別コンポーネント
│   ├── lib/             # ユーティリティ・サービス
│   ├── hooks/           # カスタムフック
│   └── types/           # TypeScript型定義
├── prisma/              # データベーススキーマ
└── public/              # 静的ファイル
```

## 主要機能
1. **志願理由書アップロード**: PDF/画像からテキスト抽出
2. **AI面接セッション**: 明和高校特化の質問生成
3. **音声入力/出力**: リアルタイム音声認識
4. **進捗管理**: 学習履歴とスコア追跡
5. **PWA対応**: オフライン利用可能

## パフォーマンス最適化
- コード分割とlazy loading実装済み
- 画像最適化（WebP対応）
- Service Worker によるキャッシング
- メモリ管理クラスでリソース管理

## セキュリティ
- JWT認証実装
- 個人情報暗号化（AES-256-GCM）
- XSS/CSRF対策済み
- レート制限実装

## テスト環境
- ローカル: http://localhost:3000
- 開発DB: SQLite（prisma/dev.db）

## AI柔軟生成システム

### 設計思想
- **固定セリフの廃止**: 質問文を固定せず、AIが文脈に応じて柔軟に生成
- **意図ベース設計**: 質問の「意図」「方向性」「評価ポイント」のみを定義
- **文脈理解**: 受験生の回答内容を理解し、自然な相槌と質問を生成
- **面接例の再現**: HさんやTさんのような実際の合格者面接パターンを動的に再現

### 実装アーキテクチャ

#### 1. Deep Dive Engine
```typescript
interface DeepDiveQuestion {
  id: string;
  intent: QuestionIntent; // 質問の意図
  evaluationFocus: MeiwaAxis; // 評価軸
  expectedDepth: ResponseDepth; // 期待する回答深度
  guidanceForAI: {
    topic: string; // 質問トピック
    style: 'formal' | 'friendly' | 'encouraging'; // スタイル
    elements: string[]; // 含めるべき要素
    context?: string; // 追加文脈
  };
}
```

#### 2. AI質問生成プロセス
1. **段階管理**: Opening → Exploration → Metacognition → Future
2. **意図選択**: 現在の段階・深度に応じた質問意図を決定
3. **文脈分析**: 会話履歴と受験生回答を分析
4. **動的生成**: guidanceForAIを基にAIが実際の質問文を生成
5. **自然な流れ**: 相槌→質問の自然な組み合わせ

#### 3. 品質保証
- **一貫性**: 面接官の品格を保つシステムプロンプト
- **適応性**: 受験生の反応に応じたスタイル調整
- **評価連動**: 7つの明和軸に基づく質問方向性
- **年齢配慮**: 小学6年生に適した言葉選択

### 面接パターン例

**従来（固定）**：
- 「どれくらい時間がかかりましたか？」
- 「それでは探究活動について説明してください」

**新方式（AI生成）**：
- 「歩いて2分ですか、本当にお近くですね。それでは〜」
- 「電車で30分もかけて、朝早くからお疲れさまでした。〜」
- 「自転車でいらしたんですね、今日は天気も良くてよかったです。〜」

### 技術仕様
- **AI生成エンジン**: multiAI（Gemini API優先）
- **フォールバック**: 複数AI切り替え対応
- **レスポンス時間**: 平均2-3秒（AI生成込み）
- **品質管理**: システムプロンプト + ガイダンス制約

## 注意事項
- 環境変数は`.env`ファイルで管理
- OpenAI APIキーが必要
- Node.js 18以上必須
- **AI生成**: Gemini APIキーが質問生成に必須