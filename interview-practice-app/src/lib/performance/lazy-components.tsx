/**
 * 遅延読み込みコンポーネント
 * パフォーマンス最適化のための動的インポート
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// ローディングコンポーネント
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
  </div>
);

const LoadingCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-lg h-32 w-full" />
  </div>
);

// 重要でないコンポーネントの遅延読み込み
export const LazyMeiwaInterviewSession = dynamic(
  () => import('@/components/features/interview/MeiwaInterviewSession').then(mod => ({ default: mod.MeiwaInterviewSession })),
  {
    loading: LoadingSpinner,
    ssr: false, // サーバーサイドレンダリングを無効化（重い処理のため）
  }
);

export const LazyRealtimeFeedback = dynamic(
  () => import('@/components/features/interview/RealtimeFeedback'),
  {
    loading: LoadingCard,
    ssr: false,
  }
);

export const LazyVoiceRecorder = dynamic(
  () => import('@/components/ui/VoiceRecorder').then(mod => ({ default: mod.VoiceRecorder })),
  {
    loading: LoadingCard,
    ssr: false, // ブラウザAPIを使用するため
  }
);

export const LazyHandwritingUpload = dynamic(
  () => import('@/components/features/essay/HandwritingUpload'),
  {
    loading: LoadingCard,
    ssr: false,
  }
);

// AI関連の重いコンポーネント
export const LazyAIAnalysis = dynamic(
  () => import('@/components/features/analysis/AIAnalysisDisplay'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const LazyStatsDashboard = dynamic(
  () => import('@/components/features/dashboard/StatsDashboard'),
  {
    loading: LoadingCard,
  }
);

// 管理者向けコンポーネント（使用頻度が低い）
export const LazyAdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
  {
    loading: LoadingSpinner,
    ssr: false,
  }
);

export const LazyAnalyticsChart = dynamic(
  () => import('@/components/charts/AnalyticsChart'),
  {
    loading: LoadingCard,
    ssr: false,
  }
);

// PWA関連（必要に応じて遅延読み込み）
export const LazyInstallPrompt = dynamic(
  () => import('@/components/pwa/InstallPrompt'),
  {
    loading: () => null,
    ssr: false,
  }
);

// テスト・デバッグ用コンポーネント
export const LazyDebugPanel = dynamic(
  () => import('@/components/debug/DebugPanel'),
  {
    loading: LoadingCard,
    ssr: false,
  }
);

/**
 * 条件付き遅延読み込みヘルパー
 */
export function createConditionalLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  condition: () => boolean,
  fallback?: ComponentType
) {
  return dynamic(
    async () => {
      if (condition()) {
        return importFunc();
      }
      return { default: fallback || (() => null) };
    },
    {
      loading: LoadingSpinner,
      ssr: false,
    }
  );
}

// 使用例：開発環境でのみデバッグパネルを読み込み
export const ConditionalDebugPanel = createConditionalLazyComponent(
  () => import('@/components/debug/DebugPanel'),
  () => process.env.NODE_ENV === 'development'
);

// 使用例：特定の機能フラグが有効な場合のみ読み込み
export const ConditionalFeature = createConditionalLazyComponent(
  () => import('@/components/features/experimental/NewFeature'),
  () => process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES === 'true'
);