import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
// import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
// import { TestDashboard } from "@/components/debug/TestDashboard";
// import { AccessibilityToolbar, SkipLinks } from "@/components/ui/AccessibilityEnhancements";
import { Providers } from "@/components/Providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "明和面接練習アプリ - 愛知県公立中高一貫校対策",
  description: "愛知県公立中高一貫校（明和高校附属中学校）の面接練習に特化したアプリ。AI技術を活用し、小学6年生向けに最適化された練習環境を提供します。",
  keywords: ["明和高校附属中学校", "面接練習", "中高一貫校", "愛知県", "受験対策"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "明和面接練習"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#1e40af"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="明和面接練習" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased touch-manipulation`}
      >
        {/* <SkipLinks /> */}
        <Providers>
          {/* <ErrorBoundary> */}
            <main id="main-content">
              {children}
            </main>
            {/* TestDashboard は無効のまま（問題の原因のため） */}
            {/* <TestDashboard /> */}
            {/* <AccessibilityToolbar /> */}
          {/* </ErrorBoundary> */}
        </Providers>
      </body>
    </html>
  );
}
