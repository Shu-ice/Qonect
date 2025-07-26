/**
 * API レート制限管理
 * 1日3セッション/ユーザー制限、API利用量管理
 */

interface RateLimitData {
  count: number;
  resetTime: number;
}

interface UserUsage {
  daily: RateLimitData;
  hourly: RateLimitData;
}

export class RateLimiter {
  private userUsage = new Map<string, UserUsage>();
  
  private readonly limits = {
    dailyLimit: parseInt(process.env.API_RATE_LIMIT_PER_DAY || '300'),
    hourlyLimit: parseInt(process.env.API_RATE_LIMIT_PER_HOUR || '100'),
  };

  /**
   * レート制限チェック
   */
  checkRateLimit(userId: string): { allowed: boolean; resetTime?: number; message?: string } {
    const now = Date.now();
    const usage = this.getUserUsage(userId);

    // 時間リセットチェック
    if (now > usage.hourly.resetTime) {
      usage.hourly = { count: 0, resetTime: now + 60 * 60 * 1000 }; // 1時間後
    }
    if (now > usage.daily.resetTime) {
      usage.daily = { count: 0, resetTime: now + 24 * 60 * 60 * 1000 }; // 24時間後
    }

    // 時間制限チェック
    if (usage.hourly.count >= this.limits.hourlyLimit) {
      return {
        allowed: false,
        resetTime: usage.hourly.resetTime,
        message: `時間あたりの利用制限に達しました。${new Date(usage.hourly.resetTime).toLocaleTimeString()}に制限がリセットされます。`
      };
    }

    // 日制限チェック
    if (usage.daily.count >= this.limits.dailyLimit) {
      return {
        allowed: false,
        resetTime: usage.daily.resetTime,
        message: `1日の利用制限に達しました。${new Date(usage.daily.resetTime).toLocaleDateString()}に制限がリセットされます。`
      };
    }

    return { allowed: true };
  }

  /**
   * 使用量を記録
   */
  recordUsage(userId: string): void {
    const usage = this.getUserUsage(userId);
    usage.hourly.count++;
    usage.daily.count++;
    this.userUsage.set(userId, usage);
  }

  /**
   * 現在の使用状況を取得
   */
  getUsageStats(userId: string): {
    hourly: { used: number; limit: number; resetTime: number };
    daily: { used: number; limit: number; resetTime: number };
  } {
    const usage = this.getUserUsage(userId);
    
    return {
      hourly: {
        used: usage.hourly.count,
        limit: this.limits.hourlyLimit,
        resetTime: usage.hourly.resetTime
      },
      daily: {
        used: usage.daily.count,
        limit: this.limits.dailyLimit,
        resetTime: usage.daily.resetTime
      }
    };
  }

  private getUserUsage(userId: string): UserUsage {
    if (!this.userUsage.has(userId)) {
      const now = Date.now();
      this.userUsage.set(userId, {
        hourly: { count: 0, resetTime: now + 60 * 60 * 1000 },
        daily: { count: 0, resetTime: now + 24 * 60 * 60 * 1000 }
      });
    }
    return this.userUsage.get(userId)!;
  }

  /**
   * クリーンアップ（古いデータ削除）
   */
  cleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    this.userUsage.forEach((usage, userId) => {
      if (now > usage.daily.resetTime + 24 * 60 * 60 * 1000) {
        entriesToDelete.push(userId);
      }
    });
    
    entriesToDelete.forEach(userId => {
      this.userUsage.delete(userId);
    });
  }
}

// シングルトンインスタンス
export const rateLimiter = new RateLimiter();

// 定期クリーンアップ（24時間ごと）
if (typeof window === 'undefined') { // サーバーサイドでのみ実行
  setInterval(() => {
    rateLimiter.cleanup();
  }, 24 * 60 * 60 * 1000);
}