'use client';

import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // NextAuthを完全に無効化
  return <>{children}</>;
}