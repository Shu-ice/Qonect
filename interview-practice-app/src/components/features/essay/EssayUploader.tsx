'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Type,
  FileImage,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from '@/components/ui/PremiumCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { EssayProcessor, AIEssayAnalyzer, EssayAnalysis } from '@/lib/essay-processor';
import HandwritingUploader from './HandwritingUploader';
import { HandwritingOCRResult } from '@/lib/handwriting-ocr';

// 志願理由書の4項目構造
export interface EssaySection {
  motivation: string;      // 志望動機
  research: string;        // 探究活動の実績・経験
  schoolLife: string;      // 中学・高校生活の抱負
  future: string;          // 将来の目標
}

interface EssayUploaderProps {
  onEssayAnalyzed: (essay: EssaySection, analysis?: EssayAnalysis, ocrResult?: HandwritingOCRResult) => void;
  className?: string;
  maxFileSize?: number; // MB
  acceptedFormats?: string[];
}

export function EssayUploader({
  onEssayAnalyzed,
  className,
  maxFileSize = 10,
  acceptedFormats = ['pdf', 'jpg', 'jpeg', 'png', 'txt']
}: EssayUploaderProps) {
  const [uploadMethod, setUploadMethod] = useState<'drag' | 'text' | 'handwriting' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<EssaySection | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ファイルドロップ処理
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (!file) return;
    
    // ファイル形式チェック
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension || '')) {
      setError(`サポートされていないファイル形式です。対応形式: ${acceptedFormats.join(', ')}`);
      return;
    }
    
    // ファイルサイズチェック
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`ファイルサイズが大きすぎます。最大${maxFileSize}MBまでです。`);
      return;
    }
    
    setUploadedFile(file);
    setError(null);
    processFile(file);
  }, [acceptedFormats, maxFileSize]);

  // ファイル処理
  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        extractedText = await extractTextFromImage(file);
      } else {
        extractedText = await file.text();
      }
      
      await analyzeEssayContent(extractedText);
    } catch (error) {
      console.error('File processing error:', error);
      setError('ファイルの処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  // PDF文字抽出（ブラウザ版PDF.js使用想定）
  const extractTextFromPDF = async (file: File): Promise<string> => {
    // 実装予定: PDF.js integration
    return 'PDF処理機能は実装中です。テキスト入力をご利用ください。';
  };

  // 画像OCR処理（新しいAPIエンドポイント使用）
  const extractTextFromImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ocr/handwriting', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const result = await response.json();
      
      if (result.success && result.result?.extractedText) {
        return result.result.extractedText;
      } else {
        throw new Error('No text extracted from image');
      }
    } catch (error) {
      console.error('Image OCR error:', error);
      throw new Error('画像からのテキスト抽出に失敗しました。テキスト入力をご利用ください。');
    }
  };

  // AI解析処理（新しいAPIエンドポイント使用）
  const analyzeEssayContent = async (text: string): Promise<EssaySection> => {
    try {
      // まず構造分析でEssaySectionを作成
      const sections = EssayProcessor.analyzeEssayStructure(text);
      
      const essaySection: EssaySection = {
        motivation: sections.motivation || text.substring(0, Math.min(200, text.length)),
        research: sections.research || '探究活動の詳細を記載してください。',
        schoolLife: sections.schoolLife || '学校生活への抱負を記載してください。',
        future: sections.future || '将来の目標を記載してください。'
      };

      // サーバーサイドでAI分析を実行
      const response = await fetch('/api/essay/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          essayContent: essaySection,
          ocrResult: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Server-side analysis failed');
      }

      const result = await response.json();
      
      if (result.success && result.analysis) {
        // 分析結果をログ出力
        console.log('志願理由書分析結果:', {
          essayId: result.essayId,
          analysis: result.analysis,
          characterCount: result.characterCount,
        });
        
        setAnalysisResult(essaySection);
        onEssayAnalyzed(essaySection, result.analysis);
        
        return essaySection;
      } else {
        throw new Error('Analysis failed');
      }
      
    } catch (error) {
      console.error('AI分析エラー:', error);
      
      // フォールバック：基本的な構造分析のみ実行
      const sections = EssayProcessor.analyzeEssayStructure(text);
      
      const fallbackSection = {
        motivation: sections.motivation || 'テキスト入力から志望動機を手動で入力してください。',
        research: sections.research || 'テキスト入力から探究活動の内容を手動で入力してください。',
        schoolLife: sections.schoolLife || 'テキスト入力から学校生活の抱負を手動で入力してください。',
        future: sections.future || 'テキスト入力から将来の目標を手動で入力してください。'
      };
      
      setAnalysisResult(fallbackSection);
      onEssayAnalyzed(fallbackSection);
      
      return fallbackSection;
    }
  };

  // テキスト入力処理
  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      setError('志願理由書の内容を入力してください。');
      return;
    }
    
    setIsProcessing(true);
    try {
      await analyzeEssayContent(textInput);
    } catch (error) {
      setError('解析中にエラーが発生しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  // 手書きOCR結果ハンドラー
  const handleHandwritingRecognized = (essay: EssaySection, ocrResult: HandwritingOCRResult) => {
    setAnalysisResult(essay);
    onEssayAnalyzed(essay, undefined, ocrResult);
  };

  const resetUploader = () => {
    setUploadMethod(null);
    setUploadedFile(null);
    setTextInput('');
    setAnalysisResult(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* メソッド選択 */}
      {!uploadMethod && !analysisResult && (
        <PremiumCard variant="elevated" className="p-6">
          <PremiumCardHeader>
            <PremiumCardTitle className="text-center">
              志願理由書をアップロード
            </PremiumCardTitle>
          </PremiumCardHeader>
          <PremiumCardContent className="space-y-4">
            <p className="text-center text-premium-600">
              あなたの志願理由書を読み込んで、面接練習に最適化された質問を生成します
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PremiumButton
                  variant="outline"
                  size="lg"
                  onClick={() => setUploadMethod('handwriting')}
                  className="w-full h-24 flex-col bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200"
                >
                  <FileImage className="w-8 h-8 mb-2 text-primary-600" />
                  <div className="flex items-center space-x-1">
                    <span>手書きPDF</span>
                    <div className="text-xs bg-primary-100 text-primary-700 px-1 rounded">NEW</div>
                  </div>
                  <span className="text-xs text-primary-600">高精度AI認識</span>
                </PremiumButton>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PremiumButton
                  variant="outline"
                  size="lg"
                  onClick={() => setUploadMethod('drag')}
                  className="w-full h-24 flex-col"
                >
                  <Upload className="w-8 h-8 mb-2" />
                  <span>ファイル</span>
                  <span className="text-xs text-premium-500">PDF・画像</span>
                </PremiumButton>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PremiumButton
                  variant="outline"
                  size="lg"
                  onClick={() => setUploadMethod('text')}
                  className="w-full h-24 flex-col"
                >
                  <Type className="w-8 h-8 mb-2" />
                  <span>テキスト入力</span>
                  <span className="text-xs text-premium-500">直接入力</span>
                </PremiumButton>
              </motion.div>
            </div>
            
            <div className="text-center mt-6">
              <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-3 py-2 rounded-full text-sm">
                <Sparkles className="w-4 h-4" />
                <span>手書きPDFは小学6年生の文字に特化したAI認識を使用</span>
              </div>
            </div>
          </PremiumCardContent>
        </PremiumCard>
      )}

      {/* 手書きOCRアップローダー */}
      {uploadMethod === 'handwriting' && !analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <HandwritingUploader onTextRecognized={handleHandwritingRecognized} />
          <div className="mt-4 text-center">
            <PremiumButton
              variant="ghost"
              onClick={resetUploader}
              className="text-sm"
            >
              別の方法で入力する
            </PremiumButton>
          </div>
        </motion.div>
      )}

      {/* ファイルドラッグ&ドロップエリア */}
      {uploadMethod === 'drag' && !analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
              'border-premium-300 hover:border-primary-400 bg-premium-50',
              isProcessing && 'pointer-events-none opacity-50'
            )}
          >
            {uploadedFile ? (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-success-500 mx-auto" />
                <div>
                  <p className="font-medium text-premium-800">{uploadedFile.name}</p>
                  <p className="text-sm text-premium-600">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="w-12 h-12 text-premium-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-premium-800">
                    ファイルをドラッグ&ドロップ
                  </p>
                  <p className="text-sm text-premium-600">
                    PDF、画像ファイル（最大{maxFileSize}MB）
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <PremiumButton variant="ghost" onClick={resetUploader}>
              <X className="w-4 h-4 mr-2" />
              キャンセル
            </PremiumButton>
          </div>
        </motion.div>
      )}

      {/* テキスト入力エリア */}
      {uploadMethod === 'text' && !analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <PremiumCard variant="default" className="p-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-premium-700">
                志願理由書の内容
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="志願理由書の内容をここに貼り付けてください。&#10;&#10;【志望動機】&#10;明和高校附属中学校を志望する理由...&#10;&#10;【探究活動の実績・経験】&#10;小学校で取り組んだ研究や調べ学習について..."
                className="w-full h-64 p-4 border border-premium-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-premium-500">
                  {textInput.length} 文字
                </span>
                <div className="space-x-2">
                  <PremiumButton variant="ghost" onClick={resetUploader}>
                    キャンセル
                  </PremiumButton>
                  <PremiumButton
                    onClick={handleTextSubmit}
                    disabled={!textInput.trim() || isProcessing}
                    loading={isProcessing}
                  >
                    解析開始
                  </PremiumButton>
                </div>
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      )}

      {/* 処理中表示 */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-premium-600">
            志願理由書を解析しています...
          </p>
          <p className="text-sm text-premium-500 mt-2">
            AIが4つの項目に分けて内容を分析中です
          </p>
        </motion.div>
      )}

      {/* エラー表示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PremiumCard variant="warning" className="p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0" />
                <div>
                  <p className="text-warning-800 font-medium">エラーが発生しました</p>
                  <p className="text-warning-700 text-sm">{error}</p>
                </div>
                <PremiumButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setError(null)}
                >
                  <X className="w-4 h-4" />
                </PremiumButton>
              </div>
            </PremiumCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 解析結果表示 */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <PremiumCard variant="success" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-success-500" />
                <h3 className="text-lg font-bold text-success-800">
                  解析完了！
                </h3>
              </div>
              
              <p className="text-success-700">
                志願理由書の内容を4つの項目に分けて解析しました。面接練習を開始できます。
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-premium-800">志望動機</h4>
                  <p className="text-sm text-premium-600 line-clamp-3">
                    {analysisResult.motivation}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-premium-800">探究活動</h4>
                  <p className="text-sm text-premium-600 line-clamp-3">
                    {analysisResult.research}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-premium-800">学校生活の抱負</h4>
                  <p className="text-sm text-premium-600 line-clamp-3">
                    {analysisResult.schoolLife}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-premium-800">将来の目標</h4>
                  <p className="text-sm text-premium-600 line-clamp-3">
                    {analysisResult.future}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4 pt-4">
                <PremiumButton variant="ghost" onClick={resetUploader}>
                  新しい志願理由書
                </PremiumButton>
                <PremiumButton variant="premium">
                  面接練習を開始
                </PremiumButton>
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      )}
    </div>
  );
}

export default EssayUploader;