/**
 * AI API モニタリング・エラーハンドリングシステム
 */

export interface AIUsageMetrics {
  timestamp: number;
  provider: 'openai' | 'anthropic' | 'gemini';
  model: string;
  tokensUsed: number;
  requestDuration: number;
  success: boolean;
  errorType?: string;
  userId?: string;
  operation: 'question_generation' | 'evaluation' | 'final_evaluation';
}

export class AIMonitor {
  private metrics: AIUsageMetrics[] = [];
  private readonly maxMetricsHistory = 10000;

  /**
   * API使用状況を記録
   */
  recordUsage(metrics: AIUsageMetrics): void {
    this.metrics.push(metrics);
    
    // メモリ使用量制限
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // デバッグモードでログ出力
    if (process.env.ENABLE_DEBUG_MODE === 'true') {
      console.log('AI API Usage:', {
        provider: metrics.provider,
        model: metrics.model,
        tokens: metrics.tokensUsed,
        duration: `${metrics.requestDuration}ms`,
        success: metrics.success,
        operation: metrics.operation
      });
    }
  }

  /**
   * エラー統計取得
   */
  getErrorStats(timeRange: number = 24 * 60 * 60 * 1000): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    errorRate: number;
    providerStats: Record<string, {
      total: number;
      errors: number;
      errorRate: number;
    }>;
    commonErrors: Record<string, number>;
  } {
    const cutoff = Date.now() - timeRange;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

    // プロバイダー別統計
    const providerStats: Record<string, { total: number; errors: number; errorRate: number }> = {};
    const commonErrors: Record<string, number> = {};

    for (const metric of recentMetrics) {
      // プロバイダー統計
      if (!providerStats[metric.provider]) {
        providerStats[metric.provider] = { total: 0, errors: 0, errorRate: 0 };
      }
      providerStats[metric.provider].total++;
      if (!metric.success) {
        providerStats[metric.provider].errors++;
        
        // エラータイプ集計
        if (metric.errorType) {
          commonErrors[metric.errorType] = (commonErrors[metric.errorType] || 0) + 1;
        }
      }
    }

    // エラー率計算
    Object.keys(providerStats).forEach(provider => {
      const stats = providerStats[provider];
      stats.errorRate = stats.total > 0 ? (stats.errors / stats.total) * 100 : 0;
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRate,
      providerStats,
      commonErrors
    };
  }

  /**
   * 使用量統計取得
   */
  getUsageStats(timeRange: number = 24 * 60 * 60 * 1000): {
    totalTokens: number;
    avgResponseTime: number;
    requestsByProvider: Record<string, number>;
    tokensByProvider: Record<string, number>;
    requestsByOperation: Record<string, number>;
    costEstimate: {
      openai: number;
      anthropic: number;
      total: number;
    };
  } {
    const cutoff = Date.now() - timeRange;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff && m.success);

    const totalTokens = recentMetrics.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
    const avgResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.requestDuration, 0) / recentMetrics.length 
      : 0;

    const requestsByProvider: Record<string, number> = {};
    const tokensByProvider: Record<string, number> = {};
    const requestsByOperation: Record<string, number> = {};

    for (const metric of recentMetrics) {
      // プロバイダー別集計
      requestsByProvider[metric.provider] = (requestsByProvider[metric.provider] || 0) + 1;
      tokensByProvider[metric.provider] = (tokensByProvider[metric.provider] || 0) + (metric.tokensUsed || 0);
      
      // 操作別集計
      requestsByOperation[metric.operation] = (requestsByOperation[metric.operation] || 0) + 1;
    }

    // コスト推定（概算）
    const costEstimate = {
      openai: (tokensByProvider.openai || 0) * 0.00002, // GPT-4 Turbo概算: $0.02/1K tokens
      anthropic: (tokensByProvider.anthropic || 0) * 0.000015, // Claude 3.5 Sonnet概算: $0.015/1K tokens
      total: 0
    };
    costEstimate.total = costEstimate.openai + costEstimate.anthropic;

    return {
      totalTokens,
      avgResponseTime,
      requestsByProvider,
      tokensByProvider,
      requestsByOperation,
      costEstimate
    };
  }

  /**
   * アラート条件チェック
   */
  checkAlerts(): {
    alerts: Array<{
      type: 'error_rate' | 'cost' | 'latency';
      severity: 'warning' | 'critical';
      message: string;
      value: number;
    }>;
  } {
    const alerts: Array<{
      type: 'error_rate' | 'cost' | 'latency';
      severity: 'warning' | 'critical';
      message: string;
      value: number;
    }> = [];

    const stats = this.getErrorStats();
    const usageStats = this.getUsageStats();

    // エラー率アラート
    if (stats.errorRate > 50) {
      alerts.push({
        type: 'error_rate',
        severity: 'critical',
        message: `AI APIエラー率が高すぎます: ${stats.errorRate.toFixed(1)}%`,
        value: stats.errorRate
      });
    } else if (stats.errorRate > 20) {
      alerts.push({
        type: 'error_rate',
        severity: 'warning',
        message: `AI APIエラー率が上昇しています: ${stats.errorRate.toFixed(1)}%`,
        value: stats.errorRate
      });
    }

    // コストアラート
    if (usageStats.costEstimate.total > 50) {
      alerts.push({
        type: 'cost',
        severity: 'critical',
        message: `AI APIコストが高額です: $${usageStats.costEstimate.total.toFixed(2)}`,
        value: usageStats.costEstimate.total
      });
    } else if (usageStats.costEstimate.total > 20) {
      alerts.push({
        type: 'cost',
        severity: 'warning',
        message: `AI APIコストが増加しています: $${usageStats.costEstimate.total.toFixed(2)}`,
        value: usageStats.costEstimate.total
      });
    }

    // レイテンシアラート
    if (usageStats.avgResponseTime > 30000) {
      alerts.push({
        type: 'latency',
        severity: 'critical',
        message: `AI API応答時間が遅すぎます: ${(usageStats.avgResponseTime / 1000).toFixed(1)}秒`,
        value: usageStats.avgResponseTime
      });
    } else if (usageStats.avgResponseTime > 15000) {
      alerts.push({
        type: 'latency',
        severity: 'warning',
        message: `AI API応答時間が長くなっています: ${(usageStats.avgResponseTime / 1000).toFixed(1)}秒`,
        value: usageStats.avgResponseTime
      });
    }

    return { alerts };
  }

  /**
   * ヘルスチェック
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    checks: {
      apiAvailability: boolean;
      errorRate: number;
      avgLatency: number;
      costBudget: number;
    };
    recommendations: string[];
  } {
    const errorStats = this.getErrorStats(60 * 60 * 1000); // 1時間
    const usageStats = this.getUsageStats(60 * 60 * 1000);
    const alerts = this.checkAlerts();

    const checks = {
      apiAvailability: errorStats.errorRate < 50,
      errorRate: errorStats.errorRate,
      avgLatency: usageStats.avgResponseTime,
      costBudget: usageStats.costEstimate.total
    };

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const recommendations: string[] = [];

    // 状態判定
    if (alerts.alerts.some(a => a.severity === 'critical')) {
      status = 'critical';
    } else if (alerts.alerts.some(a => a.severity === 'warning')) {
      status = 'warning';
    }

    // 推奨事項
    if (errorStats.errorRate > 10) {
      recommendations.push('API エラー率が高いため、フォールバック機能の確認をお勧めします');
    }
    if (usageStats.avgResponseTime > 10000) {
      recommendations.push('応答時間が長いため、タイムアウト設定の調整をお勧めします');
    }
    if (usageStats.costEstimate.total > 10) {
      recommendations.push('API利用コストが増加しているため、キャッシュ機能の活用をお勧めします');
    }

    return {
      status,
      checks,
      recommendations
    };
  }

  /**
   * メトリクス履歴クリア
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// シングルトンインスタンス
export const aiMonitor = new AIMonitor();