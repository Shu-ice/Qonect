'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// マスコットキャラクターの種類
export type MascotType = 
  | 'friendly-bear'
  | 'wise-owl'
  | 'cheerful-cat'
  | 'brave-lion'
  | 'gentle-rabbit'
  | 'smart-fox';

// 感情の種類
export type EmotionType = 
  | 'happy'
  | 'encouraging'
  | 'thinking'
  | 'surprised'
  | 'proud'
  | 'concerned'
  | 'celebrating'
  | 'neutral';

// アニメーションの種類
export type AnimationType = 
  | 'idle'
  | 'talking'
  | 'nodding'
  | 'waving'
  | 'jumping'
  | 'floating'
  | 'blinking';

// マスコットキャラクターの設定
interface MascotConfig {
  name: string;
  nameJp: string;
  personality: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  catchphrase: string;
}

const MASCOT_CONFIGS: Record<MascotType, MascotConfig> = {
  'friendly-bear': {
    name: 'Teddy',
    nameJp: 'テディ',
    personality: '優しくて頼りになる',
    primaryColor: '#8B4513',
    secondaryColor: '#DEB887',
    description: '面接が不安なときも、いつも励ましてくれる優しいクマさん',
    catchphrase: 'きみならできるよ！一緒にがんばろう！'
  },
  'wise-owl': {
    name: 'Hoot',
    nameJp: 'フート',
    personality: '知的で物知り',
    primaryColor: '#4A5568',
    secondaryColor: '#E2E8F0',
    description: '勉強のことなら何でも知っている賢いフクロウさん',
    catchphrase: 'しっかり考えて、自分の言葉で話そうね'
  },
  'cheerful-cat': {
    name: 'Mimi',
    nameJp: 'ミミ',
    personality: '元気で明るい',
    primaryColor: '#FF6B6B',
    secondaryColor: '#FFE0E0',
    description: 'いつも元気いっぱいで、みんなを笑顔にする猫さん',
    catchphrase: 'にゃんでも大丈夫！楽しく練習しようね♪'
  },
  'brave-lion': {
    name: 'Leo',
    nameJp: 'レオ',
    personality: '勇敢で力強い',
    primaryColor: '#F6AD55',
    secondaryColor: '#FED7AA',
    description: '勇気と自信を与えてくれる頼もしいライオンさん',
    catchphrase: '自信を持って！きみの力を信じているよ'
  },
  'gentle-rabbit': {
    name: 'Bunny',
    nameJp: 'バニー',
    personality: '穏やかで思いやりがある',
    primaryColor: '#F472B6',
    secondaryColor: '#FCE7F3',
    description: '心配事があるときも、優しく寄り添ってくれるウサギさん',
    catchphrase: 'ゆっくりでいいから、自分のペースで進もうね'
  },
  'smart-fox': {
    name: 'Fox',
    nameJp: 'フォックス',
    personality: '賢くて戦略的',
    primaryColor: '#F97316',
    secondaryColor: '#FFEDD5',
    description: 'いつも的確なアドバイスをくれる賢いキツネさん',
    catchphrase: 'よく考えたね！そのまま頑張って続けよう'
  }
};

interface MascotCharacterProps {
  type: MascotType;
  emotion?: EmotionType;
  animation?: AnimationType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speaking?: boolean;
  message?: string;
  onClick?: () => void;
  className?: string;
}

export function MascotCharacter({
  type,
  emotion = 'neutral',
  animation = 'idle',
  size = 'md',
  speaking = false,
  message,
  onClick,
  className
}: MascotCharacterProps) {
  const [currentAnimation, setCurrentAnimation] = useState(animation);
  const [isBlinking, setIsBlinking] = useState(false);
  const config = MASCOT_CONFIGS[type];

  // サイズ設定
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  // 定期的なまばたき
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // アニメーション変更時の処理
  useEffect(() => {
    setCurrentAnimation(animation);
  }, [animation]);

  // SVGコンポーネントを動的に生成
  const renderMascotSVG = () => {
    switch (type) {
      case 'friendly-bear':
        return (
          <BearSVG 
            emotion={emotion} 
            isBlinking={isBlinking}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor}
          />
        );
      case 'wise-owl':
        return (
          <OwlSVG 
            emotion={emotion} 
            isBlinking={isBlinking}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor}
          />
        );
      case 'cheerful-cat':
        return (
          <CatSVG 
            emotion={emotion} 
            isBlinking={isBlinking}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor}
          />
        );
      case 'brave-lion':
        return (
          <LionSVG 
            emotion={emotion} 
            isBlinking={isBlinking}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor}
          />
        );
      case 'gentle-rabbit':
        return (
          <RabbitSVG 
            emotion={emotion} 
            isBlinking={isBlinking}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor}
          />
        );
      case 'smart-fox':
        return (
          <FoxSVG 
            emotion={emotion} 
            isBlinking={isBlinking}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor}
          />
        );
      default:
        return null;
    }
  };

  // アニメーション設定
  const getAnimationProps = () => {
    switch (currentAnimation) {
      case 'talking':
        return {
          animate: { 
            scale: [1, 1.05, 1],
            y: [0, -2, 0]
          },
          transition: { 
            duration: 0.5, 
            repeat: speaking ? Infinity : 0,
            ease: "easeInOut" as const
          }
        };
      case 'nodding':
        return {
          animate: { 
            rotateX: [0, 10, 0, -5, 0]
          },
          transition: { 
            duration: 1,
            ease: "easeInOut" as const
          }
        };
      case 'waving':
        return {
          animate: { 
            rotate: [0, 10, -10, 5, 0]
          },
          transition: { 
            duration: 0.8,
            ease: "easeInOut" as const
          }
        };
      case 'jumping':
        return {
          animate: { 
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          },
          transition: { 
            duration: 0.6,
            ease: "easeOut" as const
          }
        };
      case 'floating':
        return {
          animate: { 
            y: [0, -8, 0]
          },
          transition: { 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      default:
        return {
          animate: { 
            y: [0, -3, 0]
          },
          transition: { 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
    }
  };

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* メインキャラクター */}
      <motion.div
        className={cn(
          sizeClasses[size],
          'cursor-pointer select-none transform-gpu',
          onClick && 'hover:scale-105 active:scale-95'
        )}
        onClick={onClick}
        {...getAnimationProps()}
        whileHover={onClick ? { scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
      >
        {renderMascotSVG()}
      </motion.div>

      {/* 音声インジケーター */}
      {speaking && (
        <motion.div
          className="absolute -top-2 -right-2 w-4 h-4 bg-primary-500 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="absolute inset-0 bg-primary-400 rounded-full animate-ping" />
        </motion.div>
      )}

      {/* メッセージバルーン */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 max-w-xs"
          >
            <div className="bg-white border-2 border-primary-200 rounded-xl px-4 py-2 shadow-premium relative">
              <p className="text-sm text-premium-800 text-center font-medium">
                {message}
              </p>
              {/* 吹き出しの尻尾 */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-primary-200" />
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* キャラクター名（オプション） */}
      {size === 'xl' && (
        <div className="mt-4 text-center">
          <p className="text-lg font-bold text-premium-800">
            {config.nameJp}
          </p>
          <p className="text-sm text-premium-600">
            {config.personality}
          </p>
        </div>
      )}
    </div>
  );
}

// キャラクター選択コンポーネント
interface MascotSelectorProps {
  selected?: MascotType;
  onSelect: (mascot: MascotType) => void;
  className?: string;
}

export function MascotSelector({ selected, onSelect, className }: MascotSelectorProps) {
  const mascotTypes: MascotType[] = [
    'friendly-bear',
    'wise-owl', 
    'cheerful-cat',
    'brave-lion',
    'gentle-rabbit',
    'smart-fox'
  ];

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-4', className)}>
      {mascotTypes.map((type) => {
        const config = MASCOT_CONFIGS[type];
        const isSelected = selected === type;
        
        return (
          <motion.div
            key={type}
            className={cn(
              'p-4 rounded-xl border-2 cursor-pointer transition-all duration-300',
              isSelected
                ? 'border-primary-500 bg-primary-50 shadow-glow'
                : 'border-premium-200 bg-white hover:border-primary-300 hover:shadow-premium'
            )}
            onClick={() => onSelect(type)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-center">
              <MascotCharacter
                type={type}
                size="md"
                emotion="happy"
                animation="idle"
              />
              <h3 className="mt-3 font-bold text-premium-800">
                {config.nameJp}
              </h3>
              <p className="text-sm text-premium-600 mt-1">
                {config.personality}
              </p>
              <p className="text-xs text-premium-500 mt-2 leading-relaxed">
                {config.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// 各動物のSVGコンポーネント（シンプル版）
interface AnimalSVGProps {
  emotion: EmotionType;
  isBlinking: boolean;
  primaryColor: string;
  secondaryColor: string;
}

const BearSVG: React.FC<AnimalSVGProps> = ({ emotion, isBlinking, primaryColor, secondaryColor }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* 耳 */}
    <circle cx="25" cy="25" r="15" fill={primaryColor} />
    <circle cx="75" cy="25" r="15" fill={primaryColor} />
    <circle cx="25" cy="25" r="8" fill={secondaryColor} />
    <circle cx="75" cy="25" r="8" fill={secondaryColor} />
    
    {/* 顔 */}
    <circle cx="50" cy="50" r="25" fill={primaryColor} />
    
    {/* 鼻 */}
    <ellipse cx="50" cy="45" rx="3" ry="2" fill="#000" />
    
    {/* 目 */}
    {!isBlinking ? (
      <>
        <circle cx="42" cy="40" r="3" fill="#000" />
        <circle cx="58" cy="40" r="3" fill="#000" />
        <circle cx="43" cy="39" r="1" fill="#fff" />
        <circle cx="59" cy="39" r="1" fill="#fff" />
      </>
    ) : (
      <>
        <path d="M39 40 Q42 38 45 40" stroke="#000" strokeWidth="2" fill="none" />
        <path d="M55 40 Q58 38 61 40" stroke="#000" strokeWidth="2" fill="none" />
      </>
    )}
    
    {/* 口 */}
    {emotion === 'happy' ? (
      <path d="M45 55 Q50 60 55 55" stroke="#000" strokeWidth="2" fill="none" />
    ) : (
      <path d="M47 55 L53 55" stroke="#000" strokeWidth="2" />
    )}
  </svg>
);

const OwlSVG: React.FC<AnimalSVGProps> = ({ emotion, isBlinking, primaryColor, secondaryColor }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* 体 */}
    <ellipse cx="50" cy="55" rx="25" ry="30" fill={primaryColor} />
    
    {/* 目の周り */}
    <circle cx="40" cy="40" r="12" fill={secondaryColor} />
    <circle cx="60" cy="40" r="12" fill={secondaryColor} />
    <circle cx="40" cy="40" r="10" fill="#fff" />
    <circle cx="60" cy="40" r="10" fill="#fff" />
    
    {/* 目 */}
    {!isBlinking ? (
      <>
        <circle cx="40" cy="40" r="6" fill="#000" />
        <circle cx="60" cy="40" r="6" fill="#000" />
        <circle cx="42" cy="38" r="2" fill="#fff" />
        <circle cx="62" cy="38" r="2" fill="#fff" />
      </>
    ) : (
      <>
        <path d="M34 40 Q40 38 46 40" stroke="#000" strokeWidth="2" fill="none" />
        <path d="M54 40 Q60 38 66 40" stroke="#000" strokeWidth="2" fill="none" />
      </>
    )}
    
    {/* くちばし */}
    <polygon points="50,50 46,58 54,58" fill="#FFA500" />
    
    {/* 耳（角） */}
    <polygon points="30,20 35,35 25,35" fill={primaryColor} />
    <polygon points="70,20 75,35 65,35" fill={primaryColor} />
  </svg>
);

// 他の動物のSVGコンポーネントも同様に実装...
const CatSVG: React.FC<AnimalSVGProps> = ({ emotion, isBlinking, primaryColor, secondaryColor }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* 耳 */}
    <polygon points="35,20 45,35 25,35" fill={primaryColor} />
    <polygon points="65,20 75,35 55,35" fill={primaryColor} />
    <polygon points="35,22 40,30 30,30" fill="#FFB6C1" />
    <polygon points="65,22 70,30 60,30" fill="#FFB6C1" />
    
    {/* 顔 */}
    <circle cx="50" cy="50" r="25" fill={primaryColor} />
    
    {/* 模様 */}
    <path d="M30 35 Q35 30 40 35" stroke={secondaryColor} strokeWidth="3" fill="none" />
    <path d="M60 35 Q65 30 70 35" stroke={secondaryColor} strokeWidth="3" fill="none" />
    
    {/* 目 */}
    {!isBlinking ? (
      <>
        <ellipse cx="42" cy="42" rx="4" ry="6" fill="#4169E1" />
        <ellipse cx="58" cy="42" rx="4" ry="6" fill="#4169E1" />
        <ellipse cx="42" cy="42" rx="1" ry="3" fill="#000" />
        <ellipse cx="58" cy="42" rx="1" ry="3" fill="#000" />
        <circle cx="43" cy="40" r="1" fill="#fff" />
        <circle cx="59" cy="40" r="1" fill="#fff" />
      </>
    ) : (
      <>
        <path d="M38 42 Q42 40 46 42" stroke="#000" strokeWidth="2" fill="none" />
        <path d="M54 42 Q58 40 62 42" stroke="#000" strokeWidth="2" fill="none" />
      </>
    )}
    
    {/* 鼻 */}
    <polygon points="50,48 47,52 53,52" fill="#FFB6C1" />
    
    {/* 口 */}
    <path d="M50 52 Q45 58 40 55" stroke="#000" strokeWidth="2" fill="none" />
    <path d="M50 52 Q55 58 60 55" stroke="#000" strokeWidth="2" fill="none" />
    
    {/* ひげ */}
    <path d="M25 50 L35 48" stroke="#000" strokeWidth="1" />
    <path d="M25 55 L35 53" stroke="#000" strokeWidth="1" />
    <path d="M75 50 L65 48" stroke="#000" strokeWidth="1" />
    <path d="M75 55 L65 53" stroke="#000" strokeWidth="1" />
  </svg>
);

const LionSVG: React.FC<AnimalSVGProps> = ({ emotion, isBlinking, primaryColor, secondaryColor }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* たてがみ */}
    <circle cx="50" cy="50" r="35" fill={secondaryColor} />
    <circle cx="30" cy="30" r="8" fill={primaryColor} />
    <circle cx="70" cy="30" r="8" fill={primaryColor} />
    <circle cx="25" cy="50" r="8" fill={primaryColor} />
    <circle cx="75" cy="50" r="8" fill={primaryColor} />
    <circle cx="30" cy="70" r="8" fill={primaryColor} />
    <circle cx="70" cy="70" r="8" fill={primaryColor} />
    
    {/* 顔 */}
    <circle cx="50" cy="50" r="20" fill={primaryColor} />
    
    {/* 目 */}
    {!isBlinking ? (
      <>
        <circle cx="43" cy="43" r="3" fill="#000" />
        <circle cx="57" cy="43" r="3" fill="#000" />
        <circle cx="44" cy="42" r="1" fill="#fff" />
        <circle cx="58" cy="42" r="1" fill="#fff" />
      </>
    ) : (
      <>
        <path d="M40 43 Q43 41 46 43" stroke="#000" strokeWidth="2" fill="none" />
        <path d="M54 43 Q57 41 60 43" stroke="#000" strokeWidth="2" fill="none" />
      </>
    )}
    
    {/* 鼻 */}
    <ellipse cx="50" cy="50" rx="2" ry="1.5" fill="#000" />
    
    {/* 口 */}
    {emotion === 'happy' ? (
      <path d="M45 57 Q50 62 55 57" stroke="#000" strokeWidth="2" fill="none" />
    ) : (
      <path d="M47 57 L53 57" stroke="#000" strokeWidth="2" />
    )}
  </svg>
);

const RabbitSVG: React.FC<AnimalSVGProps> = ({ emotion, isBlinking, primaryColor, secondaryColor }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* 耳 */}
    <ellipse cx="40" cy="25" rx="6" ry="20" fill={primaryColor} />
    <ellipse cx="60" cy="25" rx="6" ry="20" fill={primaryColor} />
    <ellipse cx="40" cy="25" rx="3" ry="15" fill={secondaryColor} />
    <ellipse cx="60" cy="25" rx="3" ry="15" fill={secondaryColor} />
    
    {/* 顔 */}
    <circle cx="50" cy="55" r="22" fill={primaryColor} />
    
    {/* 目 */}
    {!isBlinking ? (
      <>
        <circle cx="43" cy="48" r="3" fill="#000" />
        <circle cx="57" cy="48" r="3" fill="#000" />
        <circle cx="44" cy="47" r="1" fill="#fff" />
        <circle cx="58" cy="47" r="1" fill="#fff" />
      </>
    ) : (
      <>
        <path d="M40 48 Q43 46 46 48" stroke="#000" strokeWidth="2" fill="none" />
        <path d="M54 48 Q57 46 60 48" stroke="#000" strokeWidth="2" fill="none" />
      </>
    )}
    
    {/* 鼻 */}
    <ellipse cx="50" cy="55" rx="2" ry="1.5" fill="#FFB6C1" />
    
    {/* 口 */}
    <path d="M50 57 Q47 60 44 58" stroke="#000" strokeWidth="2" fill="none" />
    <path d="M50 57 Q53 60 56 58" stroke="#000" strokeWidth="2" fill="none" />
    
    {/* 前歯 */}
    <rect x="48" y="57" width="2" height="4" fill="#fff" stroke="#000" strokeWidth="0.5" />
    <rect x="50" y="57" width="2" height="4" fill="#fff" stroke="#000" strokeWidth="0.5" />
  </svg>
);

const FoxSVG: React.FC<AnimalSVGProps> = ({ emotion, isBlinking, primaryColor, secondaryColor }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* 耳 */}
    <polygon points="35,25 45,40 25,40" fill={primaryColor} />
    <polygon points="65,25 75,40 55,40" fill={primaryColor} />
    <polygon points="35,27 40,35 30,35" fill="#fff" />
    <polygon points="65,27 70,35 60,35" fill="#fff" />
    
    {/* 顔 */}
    <ellipse cx="50" cy="50" rx="22" ry="18" fill={primaryColor} />
    
    {/* 鼻部分 */}
    <ellipse cx="50" cy="58" rx="8" ry="6" fill="#fff" />
    
    {/* 目 */}
    {!isBlinking ? (
      <>
        <ellipse cx="43" cy="45" rx="3" ry="4" fill="#4169E1" />
        <ellipse cx="57" cy="45" rx="3" ry="4" fill="#4169E1" />
        <ellipse cx="43" cy="45" rx="1" ry="2" fill="#000" />
        <ellipse cx="57" cy="45" rx="1" ry="2" fill="#000" />
        <circle cx="44" cy="43" r="1" fill="#fff" />
        <circle cx="58" cy="43" r="1" fill="#fff" />
      </>
    ) : (
      <>
        <path d="M40 45 Q43 43 46 45" stroke="#000" strokeWidth="2" fill="none" />
        <path d="M54 45 Q57 43 60 45" stroke="#000" strokeWidth="2" fill="none" />
      </>
    )}
    
    {/* 鼻 */}
    <ellipse cx="50" cy="52" rx="2" ry="1.5" fill="#000" />
    
    {/* 口 */}
    <path d="M50 54 Q47 58 44 56" stroke="#000" strokeWidth="2" fill="none" />
    <path d="M50 54 Q53 58 56 56" stroke="#000" strokeWidth="2" fill="none" />
  </svg>
);

export { MASCOT_CONFIGS };
export type { MascotConfig };