'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Type, 
  Contrast,
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumButton } from './PremiumButton';
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from './PremiumCard';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  fontSize: number; // 100-150%
  focusIndicator: boolean;
}

export function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReaderMode: false,
    fontSize: 100,
    focusIndicator: true
  });

  // 設定をローカルストレージから読み込み
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('アクセシビリティ設定の読み込みエラー:', error);
      }
    }
  }, []);

  // 設定をローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // ハイコントラスト
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // 大きなテキスト
    if (newSettings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // 動きを減らす
    if (newSettings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // フォントサイズ
    root.style.fontSize = `${newSettings.fontSize}%`;
    
    // フォーカスインジケーター
    if (newSettings.focusIndicator) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
  };

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    if (key === 'fontSize') return; // フォントサイズは別途処理
    
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const changeFontSize = (delta: number) => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.max(80, Math.min(150, prev.fontSize + delta))
    }));
  };

  return (
    <>
      {/* アクセシビリティボタン */}
      <motion.div
        className="fixed bottom-4 left-4 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <PremiumButton
          onClick={() => setIsOpen(true)}
          variant="default"
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          aria-label="アクセシビリティ設定を開く"
        >
          <Settings className="w-6 h-6" />
        </PremiumButton>
      </motion.div>

      {/* 設定パネル */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* オーバーレイ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />
            
            {/* 設定パネル */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-20 left-4 z-50 w-80 max-w-[calc(100vw-2rem)]"
            >
              <PremiumCard className="shadow-2xl">
                <PremiumCardHeader className="flex flex-row items-center justify-between">
                  <PremiumCardTitle className="text-lg">
                    アクセシビリティ設定
                  </PremiumCardTitle>
                  <PremiumButton
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    size="sm"
                    aria-label="設定を閉じる"
                  >
                    <X className="w-4 h-4" />
                  </PremiumButton>
                </PremiumCardHeader>
                
                <PremiumCardContent className="space-y-4">
                  {/* フォントサイズ */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      文字サイズ: {settings.fontSize}%
                    </label>
                    <div className="flex items-center gap-2">
                      <PremiumButton
                        onClick={() => changeFontSize(-10)}
                        variant="outline"
                        size="sm"
                        disabled={settings.fontSize <= 80}
                      >
                        A-
                      </PremiumButton>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${((settings.fontSize - 80) / 70) * 100}%`
                          }}
                        />
                      </div>
                      <PremiumButton
                        onClick={() => changeFontSize(10)}
                        variant="outline"
                        size="sm"
                        disabled={settings.fontSize >= 150}
                      >
                        A+
                      </PremiumButton>
                    </div>
                  </div>

                  {/* トグル設定 */}
                  <div className="space-y-3">
                    <ToggleSetting
                      icon={<Contrast className="w-4 h-4" />}
                      label="ハイコントラスト"
                      description="色のコントラストを高くします"
                      checked={settings.highContrast}
                      onChange={() => toggleSetting('highContrast')}
                    />
                    
                    <ToggleSetting
                      icon={<Type className="w-4 h-4" />}
                      label="大きなテキスト"
                      description="文字をより大きく表示します"
                      checked={settings.largeText}
                      onChange={() => toggleSetting('largeText')}
                    />
                    
                    <ToggleSetting
                      icon={<EyeOff className="w-4 h-4" />}
                      label="動きを減らす"
                      description="アニメーションを最小限にします"
                      checked={settings.reducedMotion}
                      onChange={() => toggleSetting('reducedMotion')}
                    />
                    
                    <ToggleSetting
                      icon={<Eye className="w-4 h-4" />}
                      label="フォーカス強調"
                      description="キーボード操作時の強調表示を改善"
                      checked={settings.focusIndicator}
                      onChange={() => toggleSetting('focusIndicator')}
                    />
                  </div>

                  {/* リセットボタン */}
                  <PremiumButton
                    onClick={() => {
                      setSettings({
                        highContrast: false,
                        largeText: false,
                        reducedMotion: false,
                        screenReaderMode: false,
                        fontSize: 100,
                        focusIndicator: true
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    設定をリセット
                  </PremiumButton>
                </PremiumCardContent>
              </PremiumCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

interface ToggleSettingProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleSetting({ icon, label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-1 text-gray-600">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{label}</span>
          <button
            onClick={onChange}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              checked ? 'bg-primary-500' : 'bg-gray-300'
            )}
            aria-checked={checked}
            role="switch"
          >
            <span
              className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200',
                checked ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

// スキップリンク
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-0 left-0 z-50 bg-primary-600 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white"
      >
        メインコンテンツにスキップ
      </a>
      <a
        href="#navigation"
        className="absolute top-0 left-32 z-50 bg-primary-600 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white"
      >
        ナビゲーションにスキップ
      </a>
    </div>
  );
}

// 画面読み上げソフト用の視覚的に隠されたテキスト
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}