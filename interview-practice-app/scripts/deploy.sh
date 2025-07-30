#!/bin/bash

# 明和面接練習アプリ - デプロイメントスクリプト
# 本番環境への安全なデプロイメント

set -euo pipefail

# 色付きエコー
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 設定
DEPLOY_ENV=${1:-production}
DOMAIN=${DOMAIN:-meiwa-interview.example.com}
BACKUP_DIR="/var/backups/meiwa-interview"
LOG_FILE="/var/log/meiwa-interview-deploy.log"

echo_info "明和面接練習アプリのデプロイメントを開始します..."
echo_info "環境: $DEPLOY_ENV"
echo_info "ドメイン: $DOMAIN"

# 前提条件チェック
check_requirements() {
    echo_info "前提条件をチェックしています..."
    
    # Docker確認
    if ! command -v docker &> /dev/null; then
        echo_error "Dockerがインストールされていません"
        exit 1
    fi
    
    # Docker Compose確認
    if ! command -v docker-compose &> /dev/null; then
        echo_error "Docker Composeがインストールされていません"
        exit 1
    fi
    
    # 環境変数ファイル確認
    if [[ ! -f ".env.${DEPLOY_ENV}" ]]; then
        echo_error "環境設定ファイル .env.${DEPLOY_ENV} が見つかりません"
        exit 1
    fi
    
    # SSL証明書ディレクトリ確認
    if [[ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
        echo_warning "SSL証明書が見つかりません。初回セットアップを実行してください。"
    fi
    
    echo_success "前提条件チェック完了"
}

# データベースバックアップ
backup_database() {
    echo_info "データベースバックアップを作成しています..."
    
    mkdir -p "$BACKUP_DIR"
    
    # PostgreSQLバックアップ
    BACKUP_FILE="${BACKUP_DIR}/meiwa_db_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker-compose ps postgres | grep -q "Up"; then
        docker-compose exec -T postgres pg_dump -U "${POSTGRES_USER:-meiwa_user}" "${POSTGRES_DB:-meiwa_interview_db}" > "$BACKUP_FILE"
        echo_success "データベースバックアップ完了: $BACKUP_FILE"
    else
        echo_warning "PostgreSQLコンテナが動作していません。バックアップをスキップします。"
    fi
}

# 古いバックアップファイルのクリーンアップ（30日以上古いもの）
cleanup_old_backups() {
    echo_info "古いバックアップファイルをクリーンアップしています..."
    find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
    echo_success "バックアップクリーンアップ完了"
}

# SSL証明書の初回取得
setup_ssl() {
    echo_info "SSL証明書をセットアップしています..."
    
    if [[ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
        echo_info "Let's Encrypt証明書を取得しています..."
        
        # 一時的なNginx設定でHTTP接続を許可
        docker-compose up -d nginx
        
        # Certbot実行
        docker-compose run --rm certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email admin@${DOMAIN} \
            --agree-tos \
            --no-eff-email \
            -d ${DOMAIN}
        
        echo_success "SSL証明書取得完了"
    else
        echo_info "SSL証明書は既に存在します"
    fi
}

# アプリケーションデプロイ
deploy_application() {
    echo_info "アプリケーションをデプロイしています..."
    
    # 環境変数ファイルを適用
    cp ".env.${DEPLOY_ENV}" .env
    
    # Docker imageビルド
    echo_info "Dockerイメージをビルドしています..."
    docker-compose build --no-cache app
    
    # データベース移行
    echo_info "データベースマイグレーションを実行しています..."
    docker-compose run --rm app pnpm prisma migrate deploy
    
    # アプリケーション起動
    echo_info "アプリケーションを起動しています..."
    docker-compose up -d
    
    # ヘルスチェック
    echo_info "ヘルスチェックを実行しています..."
    sleep 30
    
    max_attempts=30
    attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f -s "http://localhost:3000/api/health" > /dev/null; then
            echo_success "アプリケーションが正常に起動しました"
            break
        fi
        
        attempt=$((attempt + 1))
        echo_info "ヘルスチェック実行中... ($attempt/$max_attempts)"
        sleep 10
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        echo_error "アプリケーションの起動に失敗しました"
        docker-compose logs app
        exit 1
    fi
}

# パフォーマンス最適化
optimize_performance() {
    echo_info "パフォーマンス最適化を実行しています..."
    
    # Dockerイメージのクリーンアップ
    docker image prune -f
    
    # システムリソースの確認
    echo_info "システムリソース使用状況:"
    echo "メモリ使用量:"
    free -h
    echo "ディスク使用量:"
    df -h
    
    echo_success "パフォーマンス最適化完了"
}

# 監視設定
setup_monitoring() {
    echo_info "監視設定を構成しています..."
    
    # ログローテーション設定
    if [[ ! -f "/etc/logrotate.d/meiwa-interview" ]]; then
        cat > /etc/logrotate.d/meiwa-interview << EOF
/var/log/meiwa-interview*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose restart nginx
    endscript
}
EOF
        echo_success "ログローテーション設定完了"
    fi
    
    # Cron設定
    if ! crontab -l | grep -q "meiwa-interview"; then
        (crontab -l 2>/dev/null; echo "0 2 * * * /opt/meiwa-interview/scripts/backup.sh") | crontab -
        echo_success "定期バックアップ設定完了"
    fi
}

# メイン実行
main() {
    echo_info "デプロイメント開始: $(date)"
    
    check_requirements
    backup_database
    cleanup_old_backups
    setup_ssl
    deploy_application
    optimize_performance
    setup_monitoring
    
    echo_success "デプロイメント完了: $(date)"
    echo_info "アプリケーションURL: https://${DOMAIN}"
    echo_info "管理ダッシュボード: https://${DOMAIN}/admin"
    
    # デプロイ情報を記録
    {
        echo "=== デプロイメント記録 ==="
        echo "日時: $(date)"
        echo "環境: $DEPLOY_ENV"
        echo "ドメイン: $DOMAIN"
        echo "Gitコミット: $(git rev-parse HEAD 2>/dev/null || echo 'N/A')"
        echo "=========================="
    } >> "$LOG_FILE"
}

# シグナルハンドラ
trap 'echo_error "デプロイメントが中断されました"; exit 1' INT TERM

# スクリプト実行
main "$@"