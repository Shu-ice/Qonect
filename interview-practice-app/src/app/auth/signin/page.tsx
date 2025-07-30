'use client';

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { MascotCharacter } from '@/components/ui/MascotCharacter';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else if (result?.ok) {
        // セッション情報を取得して適切にリダイレクト
        const session = await getSession();
        if (session?.user?.parentConsent) {
          router.push(callbackUrl);
        } else {
          router.push('/auth/parental-consent');
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('ログインに失敗しました。しばらく後でもう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // テスト用ユーザーでログイン
  const handleTestLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signIn('credentials', {
        email: 'test@meiwa.com',
        password: 'test123',
        redirect: false,
      });

      if (result?.ok) {
        router.push(callbackUrl);
      } else {
        setError('テストユーザーでのログインに失敗しました');
      }
    } catch (error) {
      setError('ログインエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen particles-bg gradient-elegant flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }}
        >
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "backOut" }}
            >
              <MascotCharacter
                type="friendly-bear"
                size="lg"
                emotion="happy"
                animation="floating"
                message="おかえりなさい！"
                className="mb-6"
              />
            </motion.div>
            <motion.h1 
              className="text-4xl lg:text-5xl font-display font-bold text-gradient mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              ログイン
            </motion.h1>
            <motion.p 
              className="text-lg text-premium-600 font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              明和中学校面接練習アプリ
            </motion.p>
          </div>

          {/* サインインフォーム */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <PremiumCard variant="elevated" className="card-luxury p-8 mb-6 hover-lift">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* メールアドレス */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-premium-800 mb-3">
                    メールアドレス
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-premium-400 w-5 h-5 transition-colors group-focus-within:text-primary-500" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input pl-12 pr-4 py-3 text-lg hover:shadow-premium-sm focus:shadow-premium transition-all duration-300"
                      placeholder="student@example.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* パスワード */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-premium-800 mb-3">
                    パスワード
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-premium-400 w-5 h-5 transition-colors group-focus-within:text-primary-500" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="input pl-12 pr-14 py-3 text-lg hover:shadow-premium-sm focus:shadow-premium transition-all duration-300"
                      placeholder="パスワードを入力"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-premium-400 hover:text-premium-600 transition-colors interactive-hover"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* エラーメッセージ */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="glass-effect bg-destructive/10 border-2 border-destructive/20 text-destructive px-5 py-4 rounded-xl text-sm font-medium shadow-glow"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}

                {/* ログインボタン */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-8"
                >
                  <PremiumButton
                    type="submit"
                    size="xl"
                    variant="premium"
                    disabled={isLoading}
                    className="w-full btn-premium ripple-effect py-4 text-lg font-semibold"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                        ログイン中...
                      </div>
                    ) : (
                      <>
                        <User className="w-6 h-6 mr-3" />
                        ログイン
                      </>
                    )}
                  </PremiumButton>
                </motion.div>
              </form>
            </PremiumCard>
          </motion.div>

          {/* テストユーザーログイン */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <PremiumCard variant="outline" className="glass-effect p-6 mb-6 hover-lift">
              <div className="text-center">
                <p className="text-sm text-premium-600 mb-4 font-medium">
                  デモ用テストアカウント
                </p>
                <PremiumButton
                  onClick={handleTestLogin}
                  variant="outline"
                  size="lg"
                  disabled={isLoading}
                  className="w-full interactive-hover"
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  テストユーザーでログイン
                </PremiumButton>
              </div>
            </PremiumCard>
          </motion.div>

          {/* サインアップリンク */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <p className="text-sm text-premium-600">
              アカウントをお持ちでない方は{' '}
              <Link href="/auth/signup" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200 hover:underline decoration-2 underline-offset-2">
                新規登録
              </Link>
            </p>
          </motion.div>

          {/* 利用規約・プライバシー */}
          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <p className="text-xs text-premium-500 leading-relaxed">
              ログインすることで、
              <Link href="/terms" className="text-primary-600 hover:text-primary-700 transition-colors duration-200">
                利用規約
              </Link>
              と
              <Link href="/privacy" className="text-primary-600 hover:text-primary-700 transition-colors duration-200">
                プライバシーポリシー
              </Link>
              に同意したものとみなされます。
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}