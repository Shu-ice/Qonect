'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, X } from 'lucide-react';

interface InterviewHeaderProps {
  sessionStartTime: Date;
  onEndSession: () => void;
}

export function InterviewHeader({ sessionStartTime, onEndSession }: InterviewHeaderProps) {
  const [elapsedTime, setElapsedTime] = React.useState('00:00');

  React.useEffect(() => {
    const updateElapsedTime = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateElapsedTime();
    const timer = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="text-xl font-semibold text-white hover:text-white/90 transition-colors">
            Qonect
          </Link>

          {/* セッション情報 */}
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20"
            >
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">{elapsedTime}</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </motion.div>

            <div className="text-sm font-medium text-white/70 px-3 py-2 bg-white/5 rounded-full border border-white/10">
              面接練習中
            </div>
          </div>

          {/* 終了ボタン */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEndSession}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-400 rounded-full transition-all duration-300"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">終了</span>
          </motion.button>
        </div>
      </div>
    </nav>
  );
}