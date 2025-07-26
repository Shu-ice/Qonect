import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24時間
    updateAge: 60 * 60, // 1時間ごとに更新
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'メールアドレス', 
          type: 'email',
          placeholder: 'student@example.com'
        },
        password: { 
          label: 'パスワード', 
          type: 'password' 
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          // ユーザーを検索
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              targetSchool: true,
            },
          });

          if (!user) {
            console.log('User not found:', credentials.email);
            return null;
          }

          // パスワードの検証（実際の実装では省略）
          // const isPasswordValid = await compare(credentials.password, user.password_hash);
          // if (!isPasswordValid) {
          //   console.log('Invalid password for user:', credentials.email);
          //   return null;
          // }

          // 保護者同意の確認
          if (!user.parentConsent) {
            console.log('Parent consent required for user:', credentials.email);
            throw new Error('保護者の同意が必要です');
          }

          // データ保持期限の確認
          if (user.dataRetentionUntil < new Date()) {
            console.log('Data retention period expired for user:', credentials.email);
            throw new Error('データ保持期限が過ぎています。再登録が必要です。');
          }

          // 最終ログイン時刻を更新
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          console.log('User authenticated successfully:', user.email);

          return {
            id: user.id,
            email: user.email,
            name: user.studentName,
            studentName: user.studentName,
            grade: user.grade,
            targetSchoolId: user.targetSchoolId,
            targetSchoolName: user.targetSchool.name,
            parentEmail: user.parentEmail,
            parentConsent: user.parentConsent,
            accessibilitySettings: user.accessibilitySettings as any,
            preferredMascot: user.preferredMascot,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 初回ログイン時
      if (user) {
        token.id = user.id;
        token.studentName = user.studentName;
        token.grade = user.grade;
        token.targetSchoolId = user.targetSchoolId;
        token.targetSchoolName = user.targetSchoolName;
        token.parentEmail = user.parentEmail;
        token.parentConsent = user.parentConsent;
        token.accessibilitySettings = user.accessibilitySettings;
        token.preferredMascot = user.preferredMascot;
      }

      // セッション更新時
      if (trigger === 'update' && session) {
        // セッション情報を更新
        if (session.accessibilitySettings) {
          token.accessibilitySettings = session.accessibilitySettings;
        }
        if (session.preferredMascot) {
          token.preferredMascot = session.preferredMascot;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.studentName = token.studentName as string;
        session.user.grade = token.grade as number;
        session.user.targetSchoolId = token.targetSchoolId as string;
        session.user.targetSchoolName = token.targetSchoolName as string;
        session.user.parentEmail = token.parentEmail as string;
        session.user.parentConsent = token.parentConsent as boolean;
        session.user.accessibilitySettings = token.accessibilitySettings as any;
        session.user.preferredMascot = token.preferredMascot as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 相対URLの場合は baseUrl と結合
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // 同じオリジンの場合はそのまま返す
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // それ以外はホームページにリダイレクト
      return baseUrl;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('Sign in event:', { 
        user: user?.email, 
        account: account?.provider,
        isNewUser 
      });
      
      // 新規ユーザーの場合の処理
      if (isNewUser) {
        // ウェルカムメール送信など
        console.log('New user registered:', user?.email);
      }
    },
    async signOut({ session, token }) {
      console.log('Sign out event:', { userId: token?.id || session?.user?.id });
    },
    async createUser({ user }) {
      console.log('User created:', user.email);
    },
    async updateUser({ user }) {
      console.log('User updated:', user.email);
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24時間
      },
    },
  },
};

// TypeScript型拡張
declare module 'next-auth' {
  interface User {
    id: string;
    studentName: string;
    grade: number;
    targetSchoolId: string;
    targetSchoolName: string;
    parentEmail?: string;
    parentConsent: boolean;
    accessibilitySettings?: {
      highContrast: boolean;
      fontSize: string;
      furigana: boolean;
    };
    preferredMascot?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      studentName: string;
      grade: number;
      targetSchoolId: string;
      targetSchoolName: string;
      parentEmail?: string;
      parentConsent: boolean;
      accessibilitySettings?: {
        highContrast: boolean;
        fontSize: string;
        furigana: boolean;
      };
      preferredMascot?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    studentName: string;
    grade: number;
    targetSchoolId: string;
    targetSchoolName: string;
    parentEmail?: string;
    parentConsent: boolean;
    accessibilitySettings?: {
      highContrast: boolean;
      fontSize: string;
      furigana: boolean;
    };
    preferredMascot?: string;
  }
}