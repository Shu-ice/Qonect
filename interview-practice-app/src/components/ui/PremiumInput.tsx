'use client';

import React, { forwardRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const inputVariants = cva(
  [
    'flex w-full rounded-lg border bg-white px-4 py-3',
    'text-lg placeholder:text-premium-400',
    'transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'shadow-premium-sm hover:shadow-premium',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-premium-300 focus:border-primary-500 focus:ring-primary-500/20',
          'hover:border-premium-400',
        ],
        success: [
          'border-success-300 focus:border-success-500 focus:ring-success-500/20',
          'hover:border-success-400 bg-success-50/50',
        ],
        error: [
          'border-red-300 focus:border-red-500 focus:ring-red-500/20',
          'hover:border-red-400 bg-red-50/50',
        ],
        premium: [
          'border-primary-300 focus:border-primary-500 focus:ring-primary-500/20',
          'bg-gradient-to-r from-white to-primary-50/30',
          'hover:border-primary-400 focus:shadow-glow',
        ],
      },
      size: {
        sm: 'h-9 px-3 py-2 text-sm',
        default: 'h-11 px-4 py-3 text-lg',
        lg: 'h-12 px-5 py-3 text-xl',
        xl: 'h-14 px-6 py-4 text-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface PremiumInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  showPasswordToggle?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  furigana?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  (
    {
      className,
      variant,
      size,
      type = 'text',
      label,
      description,
      error,
      success,
      showPasswordToggle = false,
      leftIcon,
      rightIcon,
      furigana = false,
      maxLength,
      showCount = false,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);
    const [currentValue, setCurrentValue] = useState(value || '');

    // バリアントを状態に応じて調整
    const currentVariant = error ? 'error' : success ? 'success' : variant;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      if (onChange) {
        onChange(e);
      }
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;
    const characterCount = String(currentValue).length;
    const isOverLimit = maxLength ? characterCount > maxLength : false;

    return (
      <div className="w-full space-y-2">
        {/* ラベル */}
        {label && (
          <label
            className={cn(
              'block text-lg font-medium text-premium-700',
              furigana && 'with-furigana',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-500" aria-label="必須">
                *
              </span>
            )}
          </label>
        )}

        {/* 説明文 */}
        {description && (
          <p className="text-sm text-premium-600">{description}</p>
        )}

        {/* 入力フィールドコンテナ */}
        <div className="relative">
          {/* 左側アイコン */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-premium-400">
              {leftIcon}
            </div>
          )}

          {/* メイン入力フィールド */}
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: currentVariant, size }),
              {
                'pl-10': leftIcon,
                'pr-10': rightIcon || showPasswordToggle || success || error,
                'pr-16': (rightIcon || showPasswordToggle) && (success || error),
                'border-red-500 focus:border-red-500': isOverLimit,
                'shadow-glow': focused && currentVariant === 'premium',
              },
              className
            )}
            ref={ref}
            disabled={disabled}
            value={currentValue}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={maxLength}
            {...props}
          />

          {/* 右側のアイコン類 */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            {/* カスタム右側アイコン */}
            {rightIcon && !success && !error && (
              <div className="text-premium-400">{rightIcon}</div>
            )}

            {/* 成功アイコン */}
            {success && (
              <CheckCircle className="h-5 w-5 text-success-500" />
            )}

            {/* エラーアイコン */}
            {error && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}

            {/* パスワード表示切り替えボタン */}
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={cn(
                  'text-premium-400 hover:text-premium-600 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
                disabled={disabled}
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            )}
          </div>

          {/* フォーカス時のグロー効果 */}
          {focused && currentVariant === 'premium' && (
            <div className="absolute inset-0 rounded-lg bg-primary-500/10 animate-pulse-soft pointer-events-none" />
          )}
        </div>

        {/* 文字数カウンター */}
        {showCount && maxLength && (
          <div className="flex justify-end">
            <span
              className={cn(
                'text-sm',
                isOverLimit ? 'text-red-500' : 'text-premium-500'
              )}
            >
              {characterCount} / {maxLength}
            </span>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {/* 成功メッセージ */}
        {success && (
          <p className="text-sm text-success-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

PremiumInput.displayName = 'PremiumInput';

// テキストエリア版
const PremiumTextarea = forwardRef<
  HTMLTextAreaElement,
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & {
    label?: string;
    description?: string;
    error?: string;
    success?: string;
    variant?: 'default' | 'success' | 'error' | 'premium';
    furigana?: boolean;
    maxLength?: number;
    showCount?: boolean;
    resize?: boolean;
  }
>(
  (
    {
      className,
      variant = 'default',
      label,
      description,
      error,
      success,
      furigana = false,
      maxLength,
      showCount = false,
      resize = true,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [currentValue, setCurrentValue] = useState(value || '');
    const [focused, setFocused] = useState(false);

    const currentVariant = error ? 'error' : success ? 'success' : variant;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      if (onChange) {
        onChange(e);
      }
    };

    const characterCount = String(currentValue).length;
    const isOverLimit = maxLength ? characterCount > maxLength : false;

    return (
      <div className="w-full space-y-2">
        {/* ラベル */}
        {label && (
          <label
            className={cn(
              'block text-lg font-medium text-premium-700',
              furigana && 'with-furigana',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-500" aria-label="必須">
                *
              </span>
            )}
          </label>
        )}

        {/* 説明文 */}
        {description && (
          <p className="text-sm text-premium-600">{description}</p>
        )}

        {/* テキストエリア */}
        <div className="relative">
          <textarea
            className={cn(
              'flex min-h-[80px] w-full rounded-lg border bg-white px-4 py-3',
              'text-lg placeholder:text-premium-400',
              'transition-all duration-300',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'shadow-premium-sm hover:shadow-premium',
              {
                'border-premium-300 focus:border-primary-500 focus:ring-primary-500/20 hover:border-premium-400':
                  currentVariant === 'default',
                'border-success-300 focus:border-success-500 focus:ring-success-500/20 hover:border-success-400 bg-success-50/50':
                  currentVariant === 'success',
                'border-red-300 focus:border-red-500 focus:ring-red-500/20 hover:border-red-400 bg-red-50/50':
                  currentVariant === 'error',
                'border-primary-300 focus:border-primary-500 focus:ring-primary-500/20 bg-gradient-to-br from-white to-primary-50/30 hover:border-primary-400 focus:shadow-glow':
                  currentVariant === 'premium',
                'border-red-500 focus:border-red-500': isOverLimit,
                'resize-none': !resize,
                'shadow-glow': focused && currentVariant === 'premium',
              },
              className
            )}
            ref={ref}
            disabled={disabled}
            value={currentValue}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={maxLength}
            {...props}
          />

          {/* フォーカス時のグロー効果 */}
          {focused && currentVariant === 'premium' && (
            <div className="absolute inset-0 rounded-lg bg-primary-500/10 animate-pulse-soft pointer-events-none" />
          )}
        </div>

        {/* 文字数カウンター */}
        {showCount && maxLength && (
          <div className="flex justify-end">
            <span
              className={cn(
                'text-sm',
                isOverLimit ? 'text-red-500' : 'text-premium-500'
              )}
            >
              {characterCount} / {maxLength}
            </span>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {/* 成功メッセージ */}
        {success && (
          <p className="text-sm text-success-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

PremiumTextarea.displayName = 'PremiumTextarea';

export { PremiumInput, PremiumTextarea, inputVariants };