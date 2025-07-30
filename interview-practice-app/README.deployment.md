# 明和面接練習アプリ - デプロイメントガイド

## 概要

このドキュメントは明和面接練習アプリの本番環境へのデプロイメント手順を説明します。

## システム要件

### ハードウェア要件
- **CPU**: 4コア以上推奨
- **メモリ**: 8GB以上推奨
- **ストレージ**: 100GB以上（ログ・バックアップ含む）
- **ネットワーク**: 安定したインターネット接続

### ソフトウェア要件
- **OS**: Ubuntu 20.04 LTS以上 または CentOS 8以上
- **Docker**: 20.10以上
- **Docker Compose**: 2.0以上
- **SSL証明書**: Let's Encrypt推奨

## 事前準備

### 1. ドメイン設定
```bash
# DNSでAレコードを設定
# 例: meiwa-interview.example.com → サーバーのIPアドレス
```

### 2. 必要な環境変数の準備
以下の値を事前に取得・生成してください：

- `NEXTAUTH_SECRET`: 32文字以上のランダム文字列
- `DATABASE_URL`: PostgreSQL接続文字列
- `GOOGLE_CLIENT_ID`: Google OAuthクライアントID
- `GOOGLE_CLIENT_SECRET`: Google OAuthクライアントシークレット
- `OPENAI_API_KEY`: OpenAI APIキー
- `ANTHROPIC_API_KEY`: Anthropic APIキー
- `NEXT_PUBLIC_GOOGLE_AI_API_KEY`: Google AI APIキー

### 3. サーバー初期設定
```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# Docker インストール
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose インストール
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 再ログイン
exit
```

## デプロイメント手順

### 1. プロジェクトのクローン
```bash
# アプリケーション用ディレクトリ作成
sudo mkdir -p /opt/meiwa-interview
sudo chown $USER:$USER /opt/meiwa-interview
cd /opt/meiwa-interview

# プロジェクトクローン
git clone https://github.com/your-org/interview-practice-app.git .
```

### 2. 環境設定
```bash
# 本番用環境変数ファイル作成
cp .env.production .env

# 環境変数を実際の値に更新
nano .env
```

**重要**: `.env`ファイルの設定例
```env
NODE_ENV=production
DATABASE_URL="postgresql://meiwa_user:YOUR_SECURE_PASSWORD@postgres:5432/meiwa_interview_db?schema=public"
NEXTAUTH_SECRET="YOUR_32_CHAR_SECRET"
NEXTAUTH_URL="https://your-domain.com"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"
NEXT_PUBLIC_GOOGLE_AI_API_KEY="your-google-ai-key"
REDIS_URL="redis://:YOUR_REDIS_PASSWORD@redis:6379"
```

### 3. Nginx設定の更新
```bash
# ドメイン名を実際の値に更新
sed -i 's/meiwa-interview.example.com/your-actual-domain.com/g' nginx/conf.d/default.conf
```

### 4. 初回デプロイ実行
```bash
# デプロイスクリプトを実行可能にする
chmod +x scripts/deploy.sh

# 初回デプロイ実行
sudo ./scripts/deploy.sh production
```

### 5. SSL証明書の設定
初回デプロイ後、手動でSSL証明書を取得する場合：
```bash
# Let's Encrypt証明書取得
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@your-domain.com \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com

# Nginx再起動
docker-compose restart nginx
```

## 運用管理

### 日次バックアップの設定
```bash
# バックアップスクリプトを実行可能にする
chmod +x scripts/backup.sh

# Cron設定
crontab -e

# 以下を追加（毎日午前2時にバックアップ実行）
0 2 * * * /opt/meiwa-interview/scripts/backup.sh
```

### ログ監視
```bash
# アプリケーションログ
docker-compose logs -f app

# Nginxログ
docker-compose logs -f nginx

# PostgreSQLログ
docker-compose logs -f postgres
```

### アプリケーション更新
```bash
# 最新コードを取得
git pull origin main

# アプリケーション再デプロイ
sudo ./scripts/deploy.sh production
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. データベース接続エラー
```bash
# PostgreSQLコンテナの状態確認
docker-compose ps postgres

# ログ確認
docker-compose logs postgres

# 手動接続テスト
docker-compose exec postgres psql -U meiwa_user -d meiwa_interview_db
```

#### 2. SSL証明書エラー
```bash
# 証明書の確認
sudo ls -la /etc/letsencrypt/live/your-domain.com/

# 証明書の更新
docker-compose run --rm certbot renew
docker-compose restart nginx
```

#### 3. メモリ不足
```bash
# メモリ使用量確認
free -h

# Docker使用量確認
docker system df

# 不要なイメージ削除
docker system prune -a
```

#### 4. ディスク容量不足
```bash
# ディスク使用量確認
df -h

# ログファイルのクリーンアップ
docker-compose exec app find /var/log -name "*.log" -mtime +7 -delete

# 古いバックアップ削除
find /var/backups/meiwa-interview -mtime +30 -delete
```

## セキュリティ設定

### ファイアウォール設定
```bash
# UFW有効化
sudo ufw enable

# 必要なポートのみ開放
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# 状態確認
sudo ufw status
```

### 自動セキュリティ更新
```bash
# unattended-upgradesの設定
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 監視設定

### ヘルスチェック
```bash
# アプリケーション状態確認
curl -f https://your-domain.com/api/health

# 詳細な監視（Zabbix, Prometheus等の設定は別途）
```

### パフォーマンス監視
```bash
# リソース使用量の定期チェック
watch -n 5 'docker stats --no-stream'
```

## バックアップとリストア

### データベースバックアップ
```bash
# 手動バックアップ
docker-compose exec postgres pg_dump -U meiwa_user meiwa_interview_db > backup.sql
```

### データベースリストア
```bash
# データベースリストア
docker-compose exec -T postgres psql -U meiwa_user -d meiwa_interview_db < backup.sql
```

## 追加の最適化

### Redis設定最適化
```bash
# Redis設定の確認
docker-compose exec redis redis-cli CONFIG GET maxmemory-policy
```

### PostgreSQL設定最適化
PostgreSQLの`postgresql.conf`を調整（大規模運用時）：
```sql
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

## サポート

技術的な問題や質問がある場合は、以下にお問い合わせください：
- メール: support@example.com
- 問題報告: GitHub Issues

---

**注意**: 本番環境では、定期的なバックアップ、モニタリング、セキュリティ更新を怠らないようにしてください。