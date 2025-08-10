'use client';

import React from 'react';
import Link from 'next/link';

export default function SimpleDashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">ダッシュボード</h1>
        
        <div className="grid gap-6">
          <Link href="/interview">
            <div className="p-6 bg-blue-500 hover:bg-blue-600 rounded-xl cursor-pointer transition-colors">
              <h2 className="text-2xl font-bold mb-2">🎤 音声練習</h2>
              <p className="text-white/90">面接練習を今すぐ開始</p>
            </div>
          </Link>
          
          <Link href="/">
            <div className="p-6 bg-gray-800 hover:bg-gray-700 rounded-xl cursor-pointer transition-colors">
              <h2 className="text-2xl font-bold mb-2">🏠 ホームへ戻る</h2>
              <p className="text-white/90">トップページへ</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}