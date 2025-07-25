import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // プレミアムカラーパレット（心理学的配慮）
      colors: {
        // プライマリーカラー（信頼感・安心感）
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // メインブランドカラー
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        
        // セカンダリーカラー（親しみやすさ・温かみ）
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a', 
          300: '#fde047',
          400: '#facc15',
          500: '#eab308', // アクセントイエロー
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        
        // 成功・ポジティブフィードバック用
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0', 
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        
        // 注意・改善提案用
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d', 
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        
        // プレミアムグレー（上品さ）
        premium: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', 
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        
        // 小学生向けアクセント
        accent: {
          pink: '#f472b6',
          purple: '#a855f7', 
          cyan: '#06b6d4',
          orange: '#fb923c',
        },
      },
      
      // 黄金比ベーススペーシング
      spacing: {
        'golden-xs': '0.618rem',   // 9.888px ≈ 10px
        'golden-sm': '1rem',       // 16px
        'golden-md': '1.618rem',   // 25.888px ≈ 26px
        'golden-lg': '2.618rem',   // 41.888px ≈ 42px
        'golden-xl': '4.236rem',   // 67.776px ≈ 68px
        'golden-2xl': '6.854rem',  // 109.664px ≈ 110px
      },
      
      // フォントファミリー（読みやすさ重視）
      fontFamily: {
        'sans': ['Inter', 'Noto Sans JP', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Monaco', 'monospace'],
      },
      
      // フォントサイズ（小学生向けサイズ）
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.5' }],     // 14px
        'base': ['1rem', { lineHeight: '1.6' }],       // 16px - 最小推奨
        'lg': ['1.125rem', { lineHeight: '1.6' }],     // 18px - 推奨デフォルト
        'xl': ['1.25rem', { lineHeight: '1.6' }],      // 20px
        '2xl': ['1.5rem', { lineHeight: '1.5' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '1.4' }],    // 30px
        '4xl': ['2.25rem', { lineHeight: '1.3' }],     // 36px
        '5xl': ['3rem', { lineHeight: '1.2' }],        // 48px
      },
      
      // 角丸（親しみやすさ）
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',   // 4px
        'DEFAULT': '0.5rem',   // 8px
        'md': '0.75rem',   // 12px
        'lg': '1rem',      // 16px
        'xl': '1.5rem',    // 24px
        '2xl': '2rem',     // 32px
        'full': '9999px',
      },
      
      // プレミアムシャドウ
      boxShadow: {
        'premium-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 4px 16px -4px rgba(59, 130, 246, 0.1)',
        'premium': '0 4px 16px -4px rgba(0, 0, 0, 0.1), 0 8px 32px -8px rgba(59, 130, 246, 0.15)',
        'premium-lg': '0 8px 32px -8px rgba(0, 0, 0, 0.1), 0 16px 64px -16px rgba(59, 130, 246, 0.2)',
        'premium-xl': '0 16px 64px -16px rgba(0, 0, 0, 0.1), 0 24px 96px -24px rgba(59, 130, 246, 0.25)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.3)',
      },
      
      // アニメーション
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shine': 'shine 1.5s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out',
      },
      
      // カスタムキーフレーム
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '50%, 100%': { transform: 'translateX(100%)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.8' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      
      // モバイルファースト画面サイズ
      screens: {
        'xs': '375px',    // iPhone SE
        'sm': '640px',    // タブレット縦
        'md': '768px',    // タブレット横
        'lg': '1024px',   // ラップトップ
        'xl': '1280px',   // デスクトップ
        '2xl': '1536px',  // 大型ディスプレイ
      },
    },
  },
  plugins: [],
};

export default config;