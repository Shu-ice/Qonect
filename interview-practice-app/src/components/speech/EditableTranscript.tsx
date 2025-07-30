'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle,
  Lightbulb,
  Volume2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { 
  TranscriptCorrection, 
  CorrectionContext 
} from '@/lib/speech/contextual-correction';

interface EditableTranscriptProps {
  originalText: string;
  interimText: string;
  isListening: boolean;
  context: CorrectionContext;
  onTextChange: (correctedText: string) => void;
  onAcceptCorrection: (finalText: string) => void;
  className?: string;
}

export function EditableTranscript({
  originalText,
  interimText,
  isListening,
  context,
  onTextChange,
  onAcceptCorrection,
  className
}: EditableTranscriptProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState(originalText);
  const [correction, setCorrection] = useState<TranscriptCorrection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 音声認識結果の自動修正
  useEffect(() => {
    if (originalText && originalText !== editableText && !isEditing) {
      processContextualCorrection(originalText, false);
    }
  }, [originalText]);

  // 中間結果の処理
  useEffect(() => {
    if (interimText && isListening) {
      const combinedText = editableText + interimText;
      processContextualCorrection(combinedText, true);
    }
  }, [interimText, isListening]);

  const processContextualCorrection = async (text: string, isInterim: boolean) => {
    setIsProcessing(true);
    try {
      // 基本的な修正のみ実行（高速）
      const basicCorrected = applyBasicCorrections(text);
      
      const correctionResult: TranscriptCorrection = {
        original: text,
        corrected: basicCorrected,
        confidence: 0.8,
        corrections: text !== basicCorrected ? [{
          position: 0,
          original: text,
          corrected: basicCorrected,
          reason: '基本修正'
        }] : []
      };
      
      setCorrection(correctionResult);
      
      if (!isInterim && correctionResult.corrected !== text) {
        setEditableText(correctionResult.corrected);
        onTextChange(correctionResult.corrected);
        
        // 修正が行われた場合は提案を表示
        if (correctionResult.corrections.length > 0) {
          setShowSuggestions(true);
          setTimeout(() => setShowSuggestions(false), 3000);
        }
      }

      // AI修正は非同期で実行（重い処理）
      if (!isInterim && text.length > 10) {
        tryAICorrection(text, basicCorrected);
      }
    } catch (error) {
      console.error('文脈修正エラー:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 基本的な音声認識エラーの修正
  const applyBasicCorrections = (text: string): string => {
    const basicCorrections: Record<string, string> = {
      // 同音異義語の修正
      'きぼうどうき': '志望動機',
      'しょうらいのゆめ': '将来の夢',
      'べんきょう': '勉強',
      'がくしゅう': '学習',
      'ちょうしょ': '長所',
      'たんしょ': '短所',
      'どりょく': '努力',
      'せいちょう': '成長',
      'がんばる': '頑張る',
      'きょうりょく': '協力',
      'せきにんかん': '責任感',
      
      // よくある誤認識の修正
      'です。': 'です',
      'ます。': 'ます',
      'だと思います。': 'だと思います',
      'と思っています。': 'と思っています',
      
      // 助詞の修正
      ' わ ': ' は ', // 主題を表す「は」
      ' お ': ' を ', // 目的格の「を」
      ' え ': ' へ ', // 方向を表す「へ」
    };

    let corrected = text;
    Object.entries(basicCorrections).forEach(([wrong, right]) => {
      const regex = new RegExp(wrong, 'gi');
      corrected = corrected.replace(regex, right);
    });

    return corrected;
  };

  // AI修正を非同期で試行
  const tryAICorrection = async (originalText: string, basicCorrected: string) => {
    try {
      const response = await fetch('/api/speech/contextual-correction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: basicCorrected,
          context
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.corrected !== basicCorrected) {
          const aiCorrection: TranscriptCorrection = {
            original: originalText,
            corrected: result.corrected,
            confidence: 0.9,
            corrections: [{
              position: 0,
              original: basicCorrected,
              corrected: result.corrected,
              reason: result.reasoning || 'AI修正'
            }]
          };
          
          setCorrection(aiCorrection);
          setEditableText(result.corrected);
          onTextChange(result.corrected);
          
          setShowSuggestions(true);
          setTimeout(() => setShowSuggestions(false), 4000);
        }
      }
    } catch (error) {
      console.log('AI修正はスキップしました:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(editableText.length, editableText.length);
    }, 100);
  };

  const handleSave = () => {
    setIsEditing(false);
    onTextChange(editableText);
    onAcceptCorrection(editableText);
  };

  const handleCancel = () => {
    setEditableText(originalText);
    setIsEditing(false);
  };

  const handleReprocess = async () => {
    if (originalText) {
      await processContextualCorrection(originalText, false);
    }
  };

  const displayText = isListening && interimText 
    ? editableText + interimText 
    : editableText;

  return (
    <div className={cn("relative", className)}>
      <PremiumCard className={cn(
        "p-4 transition-all duration-300",
        isListening && "border-blue-400 bg-blue-50/30",
        isEditing && "border-primary-400 bg-primary-50/30",
        correction?.confidence && correction.confidence < 0.7 && "border-yellow-400 bg-yellow-50/30"
      )}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              音声文字起こし
            </span>
            {isProcessing && (
              <div className="flex items-center gap-1 text-blue-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-xs">修正中...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* 信頼度表示 */}
            {correction && (
              <div className="flex items-center gap-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  correction.confidence >= 0.9 ? "bg-green-500" :
                  correction.confidence >= 0.7 ? "bg-yellow-500" : "bg-red-500"
                )} />
                <span className="text-xs text-gray-500">
                  {Math.round(correction.confidence * 100)}%
                </span>
              </div>
            )}
            
            {/* 編集・再処理ボタン */}
            {!isEditing && !isListening && (
              <div className="flex gap-1">
                <PremiumButton
                  onClick={handleReprocess}
                  variant="ghost"
                  size="sm"
                  disabled={isProcessing}
                  className="h-7 px-2"
                >
                  <RefreshCw className="w-3 h-3" />
                </PremiumButton>
                <PremiumButton
                  onClick={handleEdit}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                >
                  <Edit3 className="w-3 h-3" />
                </PremiumButton>
              </div>
            )}
          </div>
        </div>

        {/* テキスト表示・編集エリア */}
        <div className="relative">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                ref={textareaRef}
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-lg leading-relaxed"
                placeholder="修正したいテキストを入力してください..."
                rows={4}
              />
              
              <div className="flex justify-end gap-2">
                <PremiumButton
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  キャンセル
                </PremiumButton>
                <PremiumButton
                  onClick={handleSave}
                  size="sm"
                >
                  <Check className="w-4 h-4 mr-1" />
                  保存
                </PremiumButton>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className={cn(
                "min-h-[100px] p-3 rounded-lg text-lg leading-relaxed whitespace-pre-wrap",
                "bg-gray-50 border border-gray-200",
                isListening && "bg-blue-50 border-blue-200"
              )}>
                {displayText || (
                  <span className="text-gray-400 italic">
                    音声入力を開始してください...
                  </span>
                )}
                
                {/* リアルタイム認識インジケーター */}
                {isListening && interimText && (
                  <span className="text-blue-600 bg-blue-100/50 px-1 rounded">
                    {interimText}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="ml-1"
                    >
                      |
                    </motion.span>
                  </span>
                )}
              </div>

              {/* 聞き取り中表示 */}
              {isListening && (
                <div className="absolute bottom-2 right-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="flex items-center gap-1 text-blue-600 bg-white px-2 py-1 rounded-full shadow-sm text-xs"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    認識中
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 修正提案表示 */}
        <AnimatePresence>
          {showSuggestions && correction && correction.corrections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-yellow-800">
                    修正提案
                  </p>
                  {correction.corrections.slice(0, 3).map((corr, index) => (
                    <div key={index} className="text-sm text-yellow-700">
                      <span className="line-through opacity-60">{corr.original}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{corr.corrected}</span>
                      <span className="ml-2 text-xs opacity-75">({corr.reason})</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 低信頼度警告 */}
        {correction && correction.confidence < 0.7 && !isEditing && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <p className="text-sm text-orange-800">
                音声認識の精度が低い可能性があります。内容を確認して必要に応じて編集してください。
              </p>
            </div>
          </div>
        )}
      </PremiumCard>

      {/* 使用方法のヒント */}
      {!originalText && !isListening && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-500">
            💡 音声で話すと自動で文字起こしされ、文脈に応じて修正されます
          </p>
          <p className="text-xs text-gray-400 mt-1">
            編集ボタンで手動修正も可能です
          </p>
        </div>
      )}
    </div>
  );
}

// 修正履歴を表示するコンポーネント
interface CorrectionHistoryProps {
  corrections: TranscriptCorrection[];
  className?: string;
}

export function CorrectionHistory({ corrections, className }: CorrectionHistoryProps) {
  if (corrections.length === 0) return null;

  return (
    <PremiumCard className={cn("p-4", className)}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        修正履歴
      </h3>
      
      <div className="space-y-3 max-h-40 overflow-y-auto">
        {corrections.slice(-5).reverse().map((correction, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-2 bg-gray-50 rounded border-l-4 border-primary-300"
          >
            <div className="text-sm space-y-1">
              <div>
                <span className="text-gray-500 line-through">
                  {correction.original.substring(0, 50)}
                  {correction.original.length > 50 ? '...' : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-800 font-medium">
                  {correction.corrected.substring(0, 50)}
                  {correction.corrected.length > 50 ? '...' : ''}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>信頼度: {Math.round(correction.confidence * 100)}%</span>
                <span>{correction.corrections.length}箇所修正</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </PremiumCard>
  );
}