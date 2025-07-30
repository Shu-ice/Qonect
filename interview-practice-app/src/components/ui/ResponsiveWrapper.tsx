'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  mobileFullWidth?: boolean;
  tabletCentered?: boolean;
}

export function ResponsiveWrapper({
  children,
  className,
  mobileFullWidth = true,
  tabletCentered = true
}: ResponsiveWrapperProps) {
  return (
    <div
      className={cn(
        // ベースレイアウト
        'w-full',
        // モバイル最適化（スマホ）
        mobileFullWidth && 'px-0 sm:px-4',
        // タブレット最適化（iPad）
        tabletCentered && 'md:max-w-4xl md:mx-auto',
        // デスクトップ
        'lg:max-w-6xl',
        // タッチデバイス向け最適化
        'touch-manipulation',
        className
      )}
    >
      {children}
    </div>
  );
}

// タッチ最適化ボタン
export function TouchOptimizedButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'default',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}) {
  const sizeClasses = {
    sm: 'min-h-[40px] px-3 py-2 text-sm',
    default: 'min-h-[48px] px-4 py-3 text-base',
    lg: 'min-h-[56px] px-6 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100',
    ghost: 'text-primary-500 hover:bg-primary-50 active:bg-primary-100'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // タッチターゲット最小サイズ（44px推奨）
        'inline-flex items-center justify-center',
        // タップフィードバック
        'transition-all duration-200',
        'active:scale-[0.98]',
        // アクセシビリティ
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        // 無効化状態
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // サイズバリエーション
        sizeClasses[size],
        // スタイルバリエーション
        variantClasses[variant],
        // 角丸
        'rounded-lg',
        // タッチ操作最適化
        'select-none touch-manipulation',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// レスポンシブグリッド
export function ResponsiveGrid({
  children,
  cols = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  },
  gap = 'default',
  className
}: {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const gapClasses = {
    sm: 'gap-3',
    default: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8'
  };

  return (
    <div
      className={cn(
        'grid',
        // モバイル
        cols.mobile === 1 && 'grid-cols-1',
        cols.mobile === 2 && 'grid-cols-2',
        // タブレット
        cols.tablet === 1 && 'md:grid-cols-1',
        cols.tablet === 2 && 'md:grid-cols-2',
        cols.tablet === 3 && 'md:grid-cols-3',
        // デスクトップ
        cols.desktop === 1 && 'lg:grid-cols-1',
        cols.desktop === 2 && 'lg:grid-cols-2',
        cols.desktop === 3 && 'lg:grid-cols-3',
        cols.desktop === 4 && 'lg:grid-cols-4',
        // ギャップ
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

// スワイプ対応カルーセル
export function SwipeableCarousel({
  children,
  currentIndex,
  onSwipeLeft,
  onSwipeRight,
  className
}: {
  children: React.ReactNode;
  currentIndex: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  className?: string;
}) {
  const [touchStart, setTouchStart] = React.useState(0);
  const [touchEnd, setTouchEnd] = React.useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'overflow-hidden touch-pan-y',
        className
      )}
    >
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`
        }}
      >
        {children}
      </div>
    </div>
  );
}