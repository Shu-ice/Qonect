-- 明和面接練習アプリ データベース初期化
-- 日本語対応とパフォーマンス最適化

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 日本語全文検索用の辞書設定
CREATE TEXT SEARCH CONFIGURATION japanese (COPY = simple);

-- インデックス作成（Prismaで作成されないもの）
-- ユーザー関連
CREATE INDEX IF NOT EXISTS idx_users_email_active ON "User"(email) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_target_school ON "User"("targetSchoolId");
CREATE INDEX IF NOT EXISTS idx_users_created_at ON "User"("createdAt");

-- 小論文関連
CREATE INDEX IF NOT EXISTS idx_essays_user_created ON "Essay"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_essays_status ON "Essay"("status");
CREATE INDEX IF NOT EXISTS idx_essays_topic_gin ON "Essay" USING gin(to_tsvector('japanese', "researchTopic"));

-- 面接セッション関連
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON "InterviewSession"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_sessions_status_type ON "InterviewSession"("status", "sessionType");
CREATE INDEX IF NOT EXISTS idx_sessions_completion ON "InterviewSession"("completionPercentage") WHERE "status" = 'completed';

-- 質問・回答関連
CREATE INDEX IF NOT EXISTS idx_questions_session_order ON "InterviewQuestion"("sessionId", "orderIndex");
CREATE INDEX IF NOT EXISTS idx_responses_session_created ON "InterviewResponse"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_responses_evaluation ON "InterviewResponse"("overallScore") WHERE "overallScore" IS NOT NULL;

-- AI評価関連
CREATE INDEX IF NOT EXISTS idx_evaluations_user_date ON "MeiwaEvaluation"("userId", "evaluatedAt");
CREATE INDEX IF NOT EXISTS idx_evaluations_scores ON "MeiwaEvaluation"("totalScore", "researchScore", "motivationScore");

-- アクティビティログ関連
CREATE INDEX IF NOT EXISTS idx_activity_user_action ON "ActivityLog"("userId", "action", "createdAt");
CREATE INDEX IF NOT EXISTS idx_activity_session ON "ActivityLog"("sessionId") WHERE "sessionId" IS NOT NULL;

-- パフォーマンス統計関連
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON "UserAnalytics"("userId", "date");
CREATE INDEX IF NOT EXISTS idx_analytics_metrics ON "UserAnalytics"("practiceTime", "completionRate");

-- 学校情報関連
CREATE INDEX IF NOT EXISTS idx_schools_prefecture ON "School"("prefecture");
CREATE INDEX IF NOT EXISTS idx_schools_active ON "School"("isActive") WHERE "isActive" = true;

-- OCR結果関連
CREATE INDEX IF NOT EXISTS idx_ocr_user_created ON "OCRResult"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_ocr_confidence ON "OCRResult"("confidence") WHERE "confidence" > 0.8;

-- パーティション（将来的なデータ量増加に備えて）
-- ログテーブルのパーティション化の準備
COMMENT ON TABLE "ActivityLog" IS 'Consider partitioning by createdAt when data grows';
COMMENT ON TABLE "UserAnalytics" IS 'Consider partitioning by date when data grows';

-- 統計情報更新の自動化
-- PostgreSQLの自動統計更新を確実にするための設定確認
SELECT 
    schemaname, 
    tablename, 
    n_tup_ins + n_tup_upd + n_tup_del as total_modifications,
    last_autoanalyze,
    last_autovacuum
FROM pg_stat_user_tables 
WHERE schemaname = 'public';

-- 定期メンテナンス用のコメント
COMMENT ON DATABASE meiwa_interview_db IS 'Production database for Meiwa Interview Practice App - requires regular maintenance';