# 面接練習アプリ - Claude開発ガイド

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

## 注意事項
- 環境変数は`.env`ファイルで管理
- OpenAI APIキーが必要
- Node.js 18以上必須