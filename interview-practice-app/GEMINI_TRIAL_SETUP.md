# Gemini無料版試験運用セットアップガイド

## 🚀 Gemini無料版での試験運用設定

### 1. Google AI Studio APIキー取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. 「Create API Key」をクリック
4. APIキーをコピー

### 2. 環境変数設定

`.env`ファイルで以下を設定：

```env
# Gemini APIキーのみ設定
GOOGLE_GENERATIVE_AI_API_KEY="あなたのAPIキー"

# 他のAI APIは無効化
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Gemini単体運用モード
AI_PRIMARY_PROVIDER="gemini"
AI_ENABLE_TRIPLE_BACKUP="false"
AI_COST_OPTIMIZATION="cost_efficient"
```

### 3. Gemini無料版の制限

#### リクエスト制限
- **1分間**: 15リクエスト
- **1日**: 1,500リクエスト
- **1ヶ月**: 100,000リクエスト

#### トークン制限
- **入力**: 30,720トークン/分
- **出力**: 2,048トークン/分

### 4. 試験運用に最適化された機能

#### 自動フォールバック無効化
```typescript
// トリプルAI統合が無効になり、Geminiのみ使用
AI_ENABLE_TRIPLE_BACKUP="false"
```

#### コスト効率モード
```typescript
// 最も効率的な設定で動作
AI_COST_OPTIMIZATION="cost_efficient"
```

#### レート制限調整
```env
# Gemini無料版に合わせた制限
API_RATE_LIMIT_PER_HOUR=50    # 15req/min * 60min = 900, 余裕を持って50
API_RATE_LIMIT_PER_DAY=200    # 1500req/day, 余裕を持って200
```

### 5. 試験運用での動作

1. **質問生成**: Gemini Proが日本語最適化プロンプトで生成
2. **回答評価**: Gemini Proが明和中7項目評価を実行
3. **最終評価**: Gemini Proが総合判断を提供
4. **エラー時**: モック応答で継続（サービス停止なし）

### 6. 監視項目

#### 使用量監視
- 1日のリクエスト数追跡
- 1分間のリクエスト頻度監視
- エラー率チェック

#### 品質監視
- 日本語応答の自然さ
- 評価精度の確認
- 小学生への適切性

### 7. 本格運用への移行準備

#### データ収集
- Gemini単体での評価精度データ
- ユーザー満足度フィードバック
- システム安定性メトリクス

#### 改善点特定
- Geminiで不足する評価観点
- OpenAI/Claudeが必要な場面の特定
- コスト対効果の分析

### 8. 実際の設定手順

```bash
# 1. APIキー設定
nano .env
# GOOGLE_GENERATIVE_AI_API_KEY="your-actual-api-key"

# 2. アプリケーション起動
npm run dev

# 3. 動作確認
# http://localhost:3000 でアクセスして面接セッション開始
```

## 📊 期待される効果

### コスト面
- **完全無料**: Gemini無料版のみ使用
- **月間コスト**: ¥0（制限内利用時）

### 機能面
- **日本語特化**: Gemini Proの日本語理解力活用
- **文化的適切性**: 日本の教育制度理解
- **安定性**: エラー時モック応答で継続

### 評価面
- **十分な品質**: 小学生面接練習には十分
- **継続改善**: 使用データで精度向上
- **将来拡張**: 必要時に他AI追加可能

## ⚠️ 注意事項

1. **制限超過時**: モック応答に自動切り替え
2. **品質確認**: 初期段階では人間による評価確認推奨
3. **データ保存**: 評価ログを保存して品質分析に活用

この設定により、コストゼロでの試験運用が可能になります！