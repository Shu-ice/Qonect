# 小学生面接練習アプリ - 本番デプロイ用Dockerfile
FROM node:18-alpine AS base

# pnpm インストール
RUN npm install -g pnpm

# 依存関係段階
FROM base AS deps
WORKDIR /app

# パッケージファイルをコピー
COPY package.json pnpm-lock.yaml* ./

# 依存関係インストール
RUN pnpm install --frozen-lockfile

# ビルド段階
FROM base AS builder
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 環境変数の設定
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# プリズマクライアント生成
RUN pnpm prisma generate

# Next.js アプリケーションビルド
RUN pnpm build

# 本番段階
FROM base AS production
WORKDIR /app

# システムユーザー作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルのみコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# 本番用node_modules
COPY --from=builder /app/node_modules ./node_modules

# Next.js スタンドアロンビルド
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prismaファイル
COPY --from=builder /app/prisma ./prisma

# アップロードディレクトリ作成
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

# 日本語ロケール設定
RUN apk add --no-cache \
    tzdata \
    curl \
    && cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime \
    && echo "Asia/Tokyo" > /etc/timezone

# 実行ユーザー変更
USER nextjs

# ポート公開
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# アプリケーション起動
CMD ["node", "server.js"]