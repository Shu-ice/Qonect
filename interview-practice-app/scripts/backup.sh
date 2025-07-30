#!/bin/bash

# 明和面接練習アプリ - 自動バックアップスクリプト
# 日次バックアップとデータ保護

set -euo pipefail

# 設定
BACKUP_DIR="/var/backups/meiwa-interview"
APP_DIR="/opt/meiwa-interview"
RETENTION_DAYS=30
LOG_FILE="/var/log/meiwa-interview-backup.log"
DATE=$(date +%Y%m%d_%H%M%S)

# S3設定（オプション）
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"

# 色付きエコー
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" | tee -a "$LOG_FILE"
}

# バックアップディレクトリ作成
mkdir -p "$BACKUP_DIR"/{database,files,config}

# データベースバックアップ
backup_database() {
    log_info "データベースバックアップを開始..."
    
    local backup_file="${BACKUP_DIR}/database/meiwa_db_${DATE}.sql"
    local compressed_file="${backup_file}.gz"
    
    cd "$APP_DIR"
    
    if docker-compose ps postgres | grep -q "Up"; then
        # PostgreSQLダンプ
        docker-compose exec -T postgres pg_dump \
            -U "${POSTGRES_USER:-meiwa_user}" \
            -d "${POSTGRES_DB:-meiwa_interview_db}" \
            --verbose \
            --clean \
            --if-exists \
            --create > "$backup_file"
        
        # 圧縮
        gzip "$backup_file"
        
        # ファイルサイズ確認
        local file_size=$(du -h "$compressed_file" | cut -f1)
        log_success "データベースバックアップ完了: $compressed_file (サイズ: $file_size)"
        
        # 検証（gzipファイルの整合性チェック）
        if gzip -t "$compressed_file"; then
            log_success "バックアップファイルの整合性確認完了"
        else
            log_error "バックアップファイルが破損しています"
            return 1
        fi
    else
        log_error "PostgreSQLコンテナが動作していません"
        return 1
    fi
}

# アップロードファイルのバックアップ
backup_files() {
    log_info "アップロードファイルのバックアップを開始..."
    
    local upload_backup="${BACKUP_DIR}/files/uploads_${DATE}.tar.gz"
    
    if [[ -d "/var/lib/interview-app/uploads" ]]; then
        tar -czf "$upload_backup" -C /var/lib/interview-app uploads/
        
        local file_size=$(du -h "$upload_backup" | cut -f1)
        log_success "ファイルバックアップ完了: $upload_backup (サイズ: $file_size)"
    else
        log_info "アップロードディレクトリが存在しません。スキップします。"
    fi
}

# 設定ファイルのバックアップ
backup_config() {
    log_info "設定ファイルのバックアップを開始..."
    
    local config_backup="${BACKUP_DIR}/config/config_${DATE}.tar.gz"
    
    cd "$APP_DIR"
    tar -czf "$config_backup" \
        docker-compose.yml \
        nginx/ \
        .env.production \
        scripts/ \
        --exclude='*.log' \
        --exclude='node_modules' \
        --exclude='.git'
    
    local file_size=$(du -h "$config_backup" | cut -f1)
    log_success "設定バックアップ完了: $config_backup (サイズ: $file_size)"
}

# S3へのアップロード（オプション）
upload_to_s3() {
    if [[ -z "$S3_BUCKET" ]]; then
        log_info "S3バックアップが設定されていません。スキップします。"
        return 0
    fi
    
    log_info "S3へのバックアップアップロードを開始..."
    
    if command -v aws &> /dev/null; then
        # 今日のバックアップをS3にアップロード
        aws s3 sync "${BACKUP_DIR}" "s3://${S3_BUCKET}/meiwa-interview/${DATE}/" \
            --region "$AWS_REGION" \
            --storage-class GLACIER_IR \
            --exclude "*" \
            --include "*${DATE}*"
        
        log_success "S3アップロード完了"
    else
        log_error "AWS CLIがインストールされていません"
    fi
}

# 古いバックアップの削除
cleanup_old_backups() {
    log_info "古いバックアップファイルをクリーンアップ中..."
    
    # ローカルバックアップのクリーンアップ
    find "$BACKUP_DIR" -type f \( -name "*.sql.gz" -o -name "*.tar.gz" \) -mtime +$RETENTION_DAYS -delete
    
    # S3の古いバックアップクリーンアップ（60日以上）
    if [[ -n "$S3_BUCKET" ]] && command -v aws &> /dev/null; then
        local cutoff_date=$(date -d "60 days ago" +%Y%m%d)
        aws s3 ls "s3://${S3_BUCKET}/meiwa-interview/" | while read -r line; do
            local folder_date=$(echo "$line" | awk '{print $2}' | tr -d '/' | head -c 8)
            if [[ "$folder_date" < "$cutoff_date" ]]; then
                aws s3 rm "s3://${S3_BUCKET}/meiwa-interview/${folder_date}/" --recursive
                log_info "S3の古いバックアップを削除: ${folder_date}"
            fi
        done
    fi
    
    log_success "クリーンアップ完了"
}

# システム状態の記録
record_system_status() {
    log_info "システム状態を記録中..."
    
    local status_file="${BACKUP_DIR}/system_status_${DATE}.txt"
    
    {
        echo "=== システム状態レポート ==="
        echo "日時: $(date)"
        echo "ホスト: $(hostname)"
        echo ""
        echo "=== ディスク使用量 ==="
        df -h
        echo ""
        echo "=== メモリ使用量 ==="
        free -h
        echo ""
        echo "=== Docker状態 ==="
        cd "$APP_DIR"
        docker-compose ps
        echo ""
        echo "=== アプリケーション状態 ==="
        curl -s http://localhost:3000/api/health || echo "ヘルスチェック失敗"
        echo ""
        echo "=== ログファイルサイズ ==="
        find /var/log -name "*meiwa*" -type f -exec ls -lh {} \;
    } > "$status_file"
    
    log_success "システム状態記録完了: $status_file"
}

# バックアップ結果の通知
send_notification() {
    local status=$1
    local message=$2
    
    # メール通知（postfixが設定されている場合）
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "明和面接アプリ バックアップ $status" "${ADMIN_EMAIL:-admin@localhost}"
    fi
    
    # Slack通知（webhookが設定されている場合）
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"明和面接アプリ バックアップ $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
}

# メイン実行
main() {
    log_info "バックアップ処理開始"
    
    local success=true
    local error_message=""
    
    # 各バックアップ処理を実行
    if ! backup_database; then
        success=false
        error_message+="データベースバックアップ失敗 "
    fi
    
    if ! backup_files; then
        success=false
        error_message+="ファイルバックアップ失敗 "
    fi
    
    if ! backup_config; then
        success=false
        error_message+="設定バックアップ失敗 "
    fi
    
    # S3アップロード（エラーでも継続）
    upload_to_s3 || log_error "S3アップロードに失敗しましたが、処理を継続します"
    
    # クリーンアップとステータス記録
    cleanup_old_backups
    record_system_status
    
    # 結果の報告
    if $success; then
        local message="バックアップが正常に完了しました。日時: $(date)"
        log_success "$message"
        send_notification "SUCCESS" "$message"
    else
        local message="バックアップ中にエラーが発生しました: $error_message 日時: $(date)"
        log_error "$message"
        send_notification "FAILED" "$message"
        exit 1
    fi
}

# エラートラップ
trap 'log_error "バックアップ処理が異常終了しました"' ERR

# スクリプト実行
main "$@"