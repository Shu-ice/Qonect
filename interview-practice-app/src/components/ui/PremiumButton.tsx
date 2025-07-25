'use client';

import React, { forwardRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // ベースクラス（共通のスタイル）
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-lg',
    'font-medium ring-offset-white transition-all duration-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'relative overflow-hidden',
    'transform active:scale-95', // タップ時の視覚的フィードバック
    'select-none', // テキスト選択を無効化
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary-500 text-white shadow-premium',
          'hover:bg-primary-600 hover:shadow-premium-lg hover:-translate-y-0.5',
          'active:bg-primary-700',
        ],
        secondary: [
          'bg-secondary-500 text-white shadow-premium',
          'hover:bg-secondary-600 hover:shadow-premium-lg hover:-translate-y-0.5',
          'active:bg-secondary-700',
        ],
        success: [
          'bg-success-500 text-white shadow-glow-success',
          'hover:bg-success-600 hover:shadow-premium-lg hover:-translate-y-0.5',
          'active:bg-success-700',
        ],
        warning: [
          'bg-warning-500 text-white shadow-glow-warning',
          'hover:bg-warning-600 hover:shadow-premium-lg hover:-translate-y-0.5',
          'active:bg-warning-700',
        ],
        outline: [
          'border-2 border-primary-500 text-primary-500 bg-white shadow-premium-sm',
          'hover:bg-primary-50 hover:shadow-premium hover:-translate-y-0.5',
          'active:bg-primary-100',
        ],
        ghost: [
          'text-primary-500 bg-transparent',
          'hover:bg-primary-50 hover:shadow-premium-sm',
          'active:bg-primary-100',
        ],
        premium: [
          'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700',
          'text-white shadow-premium-lg',
          'hover:from-primary-600 hover:via-primary-700 hover:to-primary-800',
          'hover:shadow-premium-xl hover:-translate-y-1',
          'active:from-primary-700 active:via-primary-800 active:to-primary-900',
          'before:absolute before:inset-0 before:bg-gradient-to-r',
          'before:from-transparent before:via-white/20 before:to-transparent',
          'before:translate-x-[-100%] before:animate-shine',
          'before:transition-transform before:duration-1000',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-sm min-w-[36px]',
        default: 'h-11 px-4 py-2 text-lg min-w-[44px]', // iOS推奨最小タッチサイズ
        lg: 'h-12 px-6 text-xl min-w-[48px]',
        xl: 'h-14 px-8 text-2xl min-w-[56px]',
        icon: 'h-11 w-11', // 正方形アイコンボタン
        'icon-sm': 'h-9 w-9',
        'icon-lg': 'h-12 w-12',
        'icon-xl': 'h-14 w-14',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        default: 'rounded-lg',
        lg: 'rounded-xl',
        xl: 'rounded-2xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'default',
    },
  }
);

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  ripple?: boolean;
  shine?: boolean;
  children: React.ReactNode;
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      asChild = false,
      loading = false,
      ripple = true,
      shine = false,
      disabled,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const [rippleElements, setRippleElements] = useState<JSX.Element[]>([]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // リップル効果の実装
      if (ripple && !disabled && !loading) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const rippleElement = (
          <span
            key={Date.now()}
            className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
            style={{
              left: x,
              top: y,
              width: size,
              height: size,
            }}
          />
        );

        setRippleElements((prev) => [...prev, rippleElement]);

        setTimeout(() => {
          setRippleElements((prev) => prev.slice(1));
        }, 600);
      }

      if (onClick && !disabled && !loading) {
        onClick(event);
      }
    };

    const buttonClasses = cn(
      buttonVariants({ variant, size, rounded }),
      {
        'cursor-not-allowed': disabled,
        'cursor-progress': loading,
        'animate-pulse': loading,
      },
      className
    );

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {/* ローディング状態のスピナー */}
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* メインコンテンツ */}
        <span className={cn('flex items-center gap-2', loading && 'opacity-70')}>
          {children}
        </span>

        {/* シャイン効果（プレミアムバリアント用） */}
        {(shine || variant === 'premium') && (
          <span
            className={cn(
              'absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent',
              'translate-x-[-100%] transition-transform duration-1000',
              'animate-shine'
            )}
          />
        )}

        {/* リップル効果 */}
        {rippleElements.map((ripple) => ripple)}
      </button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';

export { PremiumButton, buttonVariants };