/**
 * アニメーション設定とユーティリティ
 */

import { Variants } from 'framer-motion';

// ユーザーの動きを減らす設定を尊重
export const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// 基本的なアニメーション設定
export const animationConfig = {
  // 高速アニメーション（フィードバック）
  fast: {
    duration: 0.15,
    ease: [0.25, 0.46, 0.45, 0.94] as const
  },
  // 標準アニメーション（UI要素）
  medium: {
    duration: 0.3,
    ease: [0.25, 0.46, 0.45, 0.94] as const
  },
  // 緩やかなアニメーション（ページ遷移）
  slow: {
    duration: 0.5,
    ease: [0.25, 0.46, 0.45, 0.94] as const
  },
  // バウンス効果
  bounce: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20
  },
  // スムーズなスプリング
  spring: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25
  }
};

// フェードインアニメーション
export const fadeIn: Variants = {
  initial: { 
    opacity: 0 
  },
  animate: { 
    opacity: 1,
    transition: shouldReduceMotion() ? { duration: 0 } : animationConfig.medium
  },
  exit: { 
    opacity: 0,
    transition: shouldReduceMotion() ? { duration: 0 } : animationConfig.fast
  }
};

// スライドアップアニメーション
export const slideUp: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: shouldReduceMotion() ? { duration: 0 } : animationConfig.medium
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: shouldReduceMotion() ? { duration: 0 } : animationConfig.fast
  }
};

// スケールアニメーション
export const scaleIn: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: shouldReduceMotion() ? { duration: 0 } : animationConfig.spring
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: shouldReduceMotion() ? { duration: 0 } : animationConfig.fast
  }
};

// ステッガーアニメーション（子要素の順次表示）
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: shouldReduceMotion() ? 0 : 0.1,
      delayChildren: shouldReduceMotion() ? 0 : 0.2
    }
  }
};

export const staggerItem: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: shouldReduceMotion() ? { duration: 0 } : animationConfig.medium
  }
};

// ホバーアニメーション
export const hoverScale = {
  whileHover: shouldReduceMotion() ? {} : { 
    scale: 1.02,
    transition: animationConfig.fast
  },
  whileTap: shouldReduceMotion() ? {} : { 
    scale: 0.98,
    transition: animationConfig.fast
  }
};

// プログレスバーアニメーション
export const progressBar = (progress: number): Variants => ({
  initial: { 
    width: 0 
  },
  animate: { 
    width: `${progress}%`,
    transition: shouldReduceMotion() ? { duration: 0 } : {
      duration: 1,
      ease: 'easeOut'
    }
  }
});

// 成功アニメーション
export const successAnimation: Variants = {
  initial: { 
    scale: 0, 
    rotate: -180 
  },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: shouldReduceMotion() ? { duration: 0 } : {
      type: 'spring',
      stiffness: 200,
      damping: 15
    }
  }
};

// 学習効果を高めるアニメーション（注目を集める）
export const pulseAttention: Variants = {
  animate: shouldReduceMotion() ? {} : {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse'
    }
  }
};

// パフォーマンス最適化のため、アニメーションを条件付きで無効化
export const getOptimizedAnimation = (animation: Variants) => {
  if (shouldReduceMotion()) {
    return {
      initial: {},
      animate: {},
      exit: {}
    };
  }
  return animation;
};

// モバイルデバイス向けの軽量アニメーション
export const getMobileOptimizedAnimation = (animation: Variants) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (isMobile || shouldReduceMotion()) {
    return {
      ...animation,
      animate: {
        ...animation.animate,
        transition: animation.animate && typeof animation.animate === 'object' && 'transition' in animation.animate
          ? {
              ...(animation.animate.transition as object),
              duration: 0.15 // モバイルでは高速化
            }
          : { duration: 0.15 }
      }
    };
  }
  
  return animation;
};

// ゲーミフィケーション用アニメーション
export const achievementUnlock: Variants = {
  initial: { 
    scale: 0, 
    rotate: -180,
    opacity: 0 
  },
  animate: { 
    scale: 1, 
    rotate: 0,
    opacity: 1,
    transition: shouldReduceMotion() ? { duration: 0 } : {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: 0.1
    }
  }
};

// 紙吹雪エフェクト用のランダムアニメーション
export const confettiAnimation = (index: number) => ({
  initial: {
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1
  },
  animate: shouldReduceMotion() ? {} : {
    x: (Math.random() - 0.5) * 400,
    y: Math.random() * 400 + 200,
    rotate: Math.random() * 720,
    opacity: 0,
    transition: {
      duration: 2,
      delay: index * 0.05,
      ease: 'easeOut'
    }
  }
});