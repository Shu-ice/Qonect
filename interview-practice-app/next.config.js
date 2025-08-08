/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番環境最適化
  output: 'standalone',
  
  // 実験的機能
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // 画像最適化
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // PWA設定
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },

  // セキュリティヘッダー
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Webpack設定
  webpack: (config, { isServer }) => {
    // PDF.js設定
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // サーバーサイドでのファイルシステムアクセス
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }

    return config;
  },

  // 環境変数設定
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },

  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint設定（開発中は一時的に無効化）
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 圧縮設定
  compress: true,
  
  // 静的ファイル最適化
  trailingSlash: false,
};

module.exports = nextConfig;