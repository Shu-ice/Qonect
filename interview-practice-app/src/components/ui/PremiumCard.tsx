'use client';

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  // ベースクラス
  [
    'relative overflow-hidden transition-all duration-500',
    'before:absolute before:inset-0 before:bg-gradient-to-r',
    'before:from-transparent before:via-white/10 before:to-transparent',
    'before:translate-x-[-100%] before:transition-transform before:duration-700',
    'hover:before:translate-x-[100%]', // ホバー時のシャイン効果
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-white shadow-premium border border-premium-200',
          'hover:shadow-premium-lg hover:-translate-y-1',
        ],
        outline: [
          'bg-white border-2 border-primary-200',
          'hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5',
          'transition-all duration-300',
        ],
        elevated: [
          'bg-white shadow-premium-lg border border-premium-100',
          'hover:shadow-premium-xl hover:-translate-y-2',
          'transform transition-transform duration-500',
        ],
        glass: [
          'bg-white/80 backdrop-blur-md border border-white/20',
          'shadow-premium-lg hover:shadow-premium-xl',
          'hover:bg-white/90 hover:-translate-y-1',
        ],
        gradient: [
          'bg-gradient-to-br from-white via-primary-50 to-primary-100',
          'shadow-premium-lg border border-primary-200',
          'hover:shadow-premium-xl hover:-translate-y-1',
          'hover:from-white hover:via-primary-100 hover:to-primary-200',
        ],
        premium: [
          'bg-gradient-to-br from-white via-primary-50 to-primary-100',
          'shadow-premium-xl border border-primary-200',
          'hover:shadow-glow hover:-translate-y-2',
          'hover:from-white hover:via-primary-100 hover:to-primary-200',
          'relative overflow-hidden',
        ],
        success: [
          'bg-gradient-to-br from-white via-success-50 to-success-100',
          'shadow-glow-success border border-success-200',
          'hover:shadow-premium-xl hover:-translate-y-1',
        ],
        warning: [
          'bg-gradient-to-br from-white via-warning-50 to-warning-100',
          'shadow-glow-warning border border-warning-200',
          'hover:shadow-premium-xl hover:-translate-y-1',
        ],
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
        none: 'p-0',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        default: 'rounded-lg',
        lg: 'rounded-xl',
        xl: 'rounded-2xl',
        '2xl': 'rounded-3xl',
      },
      interactive: {
        true: 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'default',
      interactive: false,
    },
  }
);

export interface PremiumCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  shine?: boolean;
  glow?: boolean;
}

const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      interactive,
      asChild = false,
      shine = false,
      glow = false,
      children,
      ...props
    },
    ref
  ) => {
    const cardClasses = cn(
      cardVariants({ variant, size, rounded, interactive }),
      {
        // シャイン効果を常時有効化
        'before:animate-shine': shine,
        // グロー効果
        'shadow-glow hover:shadow-glow': glow && variant === 'default',
      },
      className
    );

    return (
      <div className={cardClasses} ref={ref} {...props}>
        {/* プレミアムバリアント用の追加エフェクト */}
        {variant === 'premium' && (
          <>
            {/* 角の装飾 */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-300 rounded-tl-lg opacity-60" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-300 rounded-tr-lg opacity-60" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-300 rounded-bl-lg opacity-60" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary-300 rounded-br-lg opacity-60" />
            
            {/* 中央の微細な装飾線 */}
            <div className="absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent opacity-50" />
            <div className="absolute inset-x-4 bottom-4 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent opacity-50" />
          </>
        )}

        {/* メインコンテンツ */}
        <div className="relative z-10">
          {children}
        </div>

        {/* グロー効果用の追加レイヤー */}
        {glow && (
          <div 
            className={cn(
              'absolute inset-0 opacity-0 transition-opacity duration-300',
              'hover:opacity-100 pointer-events-none',
              'bg-gradient-to-r from-primary-500/5 via-primary-400/10 to-primary-500/5',
              'animate-pulse-soft'
            )}
          />
        )}
      </div>
    );
  }
);

PremiumCard.displayName = 'PremiumCard';

// カード内で使用する便利なサブコンポーネント
const PremiumCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 pb-golden-sm',
      'border-b border-premium-200/50',
      className
    )}
    {...props}
  />
));
PremiumCardHeader.displayName = 'PremiumCardHeader';

const PremiumCardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      'text-premium-900',
      className
    )}
    {...props}
  />
));
PremiumCardTitle.displayName = 'PremiumCardTitle';

const PremiumCardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-lg text-premium-600 leading-relaxed',
      className
    )}
    {...props}
  />
));
PremiumCardDescription.displayName = 'PremiumCardDescription';

const PremiumCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('pt-golden-sm', className)}
    {...props}
  />
));
PremiumCardContent.displayName = 'PremiumCardContent';

const PremiumCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center pt-golden-sm',
      'border-t border-premium-200/50',
      className
    )}
    {...props}
  />
));
PremiumCardFooter.displayName = 'PremiumCardFooter';

export { 
  PremiumCard, 
  PremiumCardHeader, 
  PremiumCardFooter, 
  PremiumCardTitle, 
  PremiumCardDescription, 
  PremiumCardContent,
  cardVariants 
};