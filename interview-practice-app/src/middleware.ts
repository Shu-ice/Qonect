import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // 認証が必要なページのパス
    const protectedPaths = [
      '/dashboard',
      '/interview',
      '/chat',
      '/essay',
      '/practice',
      '/progress',
      '/settings',
      '/api/interview',
      '/api/sessions',
      '/api/essays',
      '/api/progress',
      '/api/user',
    ];

    // 管理者専用パス
    const adminPaths = [
      '/admin',
      '/api/admin',
    ];

    // APIルートの保護
    if (pathname.startsWith('/api/')) {
      // 認証APIは除外
      if (pathname.startsWith('/api/auth/')) {
        return NextResponse.next();
      }

      // 保護されたAPIルートの場合、認証チェック
      const isProtectedApi = protectedPaths.some(path => 
        pathname.startsWith(path) || pathname === path
      );

      if (isProtectedApi && !token) {
        return NextResponse.json(
          { error: '認証が必要です' },
          { status: 401 }
        );
      }

      // 管理者APIの場合、管理者権限チェック
      const isAdminApi = adminPaths.some(path => 
        pathname.startsWith(path)
      );

      if (isAdminApi && (!token || token.role !== 'admin')) {
        return NextResponse.json(
          { error: '管理者権限が必要です' },
          { status: 403 }
        );
      }

      return NextResponse.next();
    }

    // ページルートの保護
    const isProtectedPage = protectedPaths.some(path => 
      pathname.startsWith(path) || pathname === path
    );

    if (isProtectedPage && !token) {
      // 未認証の場合はサインインページにリダイレクト
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // 保護者同意が必要な場合
    if (token && !token.parentConsent && isProtectedPage) {
      const consentUrl = new URL('/auth/parental-consent', req.url);
      return NextResponse.redirect(consentUrl);
    }

    // データ保持期限が切れている場合
    if (token && token.dataRetentionUntil) {
      const retentionDate = new Date(token.dataRetentionUntil as string);
      if (retentionDate < new Date() && isProtectedPage) {
        const expiredUrl = new URL('/auth/data-expired', req.url);
        return NextResponse.redirect(expiredUrl);
      }
    }

    // 管理者ページの保護
    const isAdminPage = adminPaths.some(path => 
      pathname.startsWith(path)
    );

    if (isAdminPage && (!token || token.role !== 'admin')) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // 認証済みユーザーが認証ページにアクセスした場合
    if (token && (
      pathname === '/auth/signin' ||
      pathname === '/auth/signup' ||
      pathname === '/auth/parental-consent'
    )) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // ルートパスの場合、認証済みユーザーはダッシュボードへ
    if (token && pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // 公開ページは常に許可
        const publicPaths = [
          '/',
          '/about',
          '/privacy',
          '/terms',
          '/contact',
          '/auth/signin',
          '/auth/signup',
          '/auth/error',
          '/auth/verify-request',
          '/offline',
        ];

        if (publicPaths.includes(pathname)) {
          return true;
        }

        // 静的ファイルは許可
        if (
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/images/') ||
          pathname.startsWith('/icons/') ||
          pathname.startsWith('/favicon') ||
          pathname === '/manifest.json' ||
          pathname === '/sw.js'
        ) {
          return true;
        }

        // その他のルートは認証が必要
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|icons/|images/|manifest.json|sw.js).*)',
  ],
};