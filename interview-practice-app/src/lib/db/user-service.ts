/**
 * ユーザー管理サービス
 * データベース操作と認証機能を統合
 */

import { hash, compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { User, Essay, InterviewSession } from '@/generated/prisma';

export interface CreateUserData {
  email: string;
  password: string;
  studentName: string;
  grade: number;
  targetSchoolId: string;
  parentEmail?: string;
  accessibilitySettings?: {
    highContrast: boolean;
    fontSize: string;
    furigana: boolean;
  };
  preferredMascot?: string;
}

export interface UserProfile extends Omit<User, 'passwordHash'> {
  targetSchool: {
    id: string;
    name: string;
    type: string;
  };
  _count: {
    essays: number;
    interviewSessions: number;
    achievements: number;
  };
}

export class UserService {
  /**
   * 新規ユーザー登録
   */
  async createUser(data: CreateUserData): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('このメールアドレスは既に登録されています');
    }

    // パスワードハッシュ化
    const passwordHash = await hash(data.password, 12);

    // データ保持期限（1年後）
    const dataRetentionUntil = new Date();
    dataRetentionUntil.setFullYear(dataRetentionUntil.getFullYear() + 1);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        studentName: data.studentName,
        grade: data.grade,
        targetSchoolId: data.targetSchoolId,
        parentEmail: data.parentEmail,
        accessibilitySettings: data.accessibilitySettings,
        preferredMascot: data.preferredMascot || 'wise-owl',
        dataRetentionUntil,
        languagePreference: 'ja',
        parentConsent: false, // 初期は未同意
      },
    });

    // 保護者への同意依頼メール送信（後で実装）
    if (data.parentEmail) {
      await this.requestParentConsent(user.id);
    }

    return user;
  }

  /**
   * ユーザー認証
   */
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        targetSchool: true,
      },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // データ保持期限チェック
    if (user.dataRetentionUntil < new Date()) {
      throw new Error('データ保持期限が過ぎています。再登録が必要です。');
    }

    // 保護者同意チェック
    if (!user.parentConsent) {
      throw new Error('保護者の同意が必要です。保護者のメールを確認してください。');
    }

    // 最終ログイン時刻更新
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return user;
  }

  /**
   * ユーザープロフィール取得
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        targetSchool: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            essays: true,
            interviewSessions: true,
            achievements: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // パスワードハッシュを除外
    const { passwordHash, ...userProfile } = user;
    return userProfile as UserProfile;
  }

  /**
   * ユーザー設定更新
   */
  async updateUserSettings(
    userId: string,
    settings: {
      accessibilitySettings?: any;
      preferredMascot?: string;
      languagePreference?: string;
    }
  ): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: settings,
    });
  }

  /**
   * パスワード変更
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new Error('ユーザーが見つかりません');
    }

    const isCurrentPasswordValid = await compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('現在のパスワードが間違っています');
    }

    const newPasswordHash = await hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  /**
   * 保護者同意申請
   */
  async requestParentConsent(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.parentEmail) {
      throw new Error('保護者のメールアドレスが設定されていません');
    }

    // 保護者向け通信レコード作成
    await prisma.parentCommunication.create({
      data: {
        userId,
        type: 'consent_request',
        subject: '【明和中面接練習アプリ】利用同意のお願い',
        content: `
お子様（${user.studentName}さん）が明和高校附属中学校の面接練習アプリの利用を希望されています。

このアプリでは、お子様の学習データを以下の目的で使用します：
- 面接練習の進捗管理
- AI による回答評価とフィードバック
- 学習成果の記録

データは安全に管理され、1年後に自動削除されます。
利用に同意いただける場合は、以下のリンクから同意手続きをお願いします。

同意URL: ${process.env.NEXTAUTH_URL}/consent/${userId}
        `,
      },
    });

    // 実際のメール送信（後で実装）
    console.log(`保護者同意依頼を送信: ${user.parentEmail}`);
  }

  /**
   * 保護者同意処理
   */
  async processParentConsent(userId: string, consentToken: string): Promise<void> {
    // トークン検証（簡易実装）
    const expectedToken = `consent_${userId}_${process.env.NEXTAUTH_SECRET}`;
    // 実際の実装では、より安全なトークン検証を行う

    await prisma.user.update({
      where: { id: userId },
      data: {
        parentConsent: true,
        consentDate: new Date(),
      },
    });

    // 同意完了の保護者向け通信
    await prisma.parentCommunication.create({
      data: {
        userId,
        type: 'consent_confirmed',
        subject: '【明和中面接練習アプリ】利用同意完了',
        content: 'お子様のアプリ利用同意が完了しました。安全にご利用いただけます。',
      },
    });
  }

  /**
   * ユーザーデータの完全削除
   */
  async deleteUserData(userId: string): Promise<void> {
    // 関連データを全て削除（カスケード削除）
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`ユーザーデータを削除しました: ${userId}`);
  }

  /**
   * データ保持期限チェック（定期実行用）
   */
  async cleanupExpiredData(): Promise<number> {
    const expiredUsers = await prisma.user.findMany({
      where: {
        dataRetentionUntil: {
          lt: new Date(),
        },
      },
      select: { id: true, email: true },
    });

    let deletedCount = 0;
    for (const user of expiredUsers) {
      await this.deleteUserData(user.id);
      deletedCount++;
      console.log(`期限切れユーザーを削除: ${user.email}`);
    }

    return deletedCount;
  }

  /**
   * 学習統計取得
   */
  async getUserLearningStats(userId: string) {
    const stats = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        essays: {
          select: {
            id: true,
            createdAt: true,
            aiEvaluation: true,
          },
        },
        interviewSessions: {
          select: {
            id: true,
            createdAt: true,
            overallScore: true,
            duration: true,
            questionCount: true,
          },
        },
        achievements: {
          select: {
            type: true,
            unlockedAt: true,
            score: true,
          },
        },
      },
    });

    if (!stats) {
      return null;
    }

    // 統計計算
    const totalSessions = stats.interviewSessions.length;
    const totalEssays = stats.essays.length;
    const totalAchievements = stats.achievements.length;

    const averageScore = stats.interviewSessions.length > 0
      ? stats.interviewSessions
          .filter(s => s.overallScore !== null)
          .reduce((sum, s) => sum + (s.overallScore || 0), 0) / 
        stats.interviewSessions.filter(s => s.overallScore !== null).length
      : 0;

    const totalPracticeTime = stats.interviewSessions
      .reduce((sum, s) => sum + (s.duration || 0), 0);

    return {
      totalSessions,
      totalEssays,
      totalAchievements,
      averageScore: Math.round(averageScore * 10) / 10,
      totalPracticeTime, // 秒数
      recentSessions: stats.interviewSessions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
      recentAchievements: stats.achievements
        .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
        .slice(0, 3),
    };
  }
}

// シングルトンインスタンス
export const userService = new UserService();