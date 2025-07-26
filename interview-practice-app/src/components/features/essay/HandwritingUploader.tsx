/**
 * 手書きPDF/画像アップローダー
 * Gemini Pro Vision統合OCR機能
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileImage,
  FileText,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Edit3,
  Sparkles,
  Brain
} from 'lucide-react';
import { PremiumCard, PremiumCardContent, PremiumCardHeader, PremiumCardTitle } from '@/components/ui/PremiumCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { handwritingOCR, HandwritingOCRResult } from '@/lib/handwriting-ocr';
import { EssaySection } from './EssayUploader';
import { AIEssayAnalyzer } from '@/lib/essay-processor';

interface HandwritingUploaderProps {
  onTextRecognized: (essaySection: EssaySection, ocrResult: HandwritingOCRResult) => void;
  className?: string;
}

interface OCRProgress {
  stage: 'upload' | 'processing' | 'review' | 'complete';
  progress: number;
  message: string;
}

export function HandwritingUploader({ 
  onTextRecognized, 
  className 
}: HandwritingUploaderProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrResult, setOCRResult] = useState<HandwritingOCRResult | null>(null);
  const [ocrProgress, setOCRProgress] = useState<OCRProgress>({
    stage: 'upload',
    progress: 0,
    message: 'ファイルをアップロードしてください'
  });
  const [recognizedText, setRecognizedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ファイルドロップハンドラー
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (!file) return;
    
    // ファイル形式チェック
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('サポートされていないファイル形式です。PDF、JPG、PNGファイルをアップロードしてください。');
      return;
    }
    
    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズが大きすぎます。10MB以下のファイルをアップロードしてください。');
      return;
    }
    
    setUploadedFile(file);
    setError(null);
    processHandwritingFile(file);
  }, []);

  // 画像ファイルをImageDataに変換
  const convertImageFileToImageData = async (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.src = URL.createObjectURL(file);
    });
  };

  // 手書きファイル処理
  const processHandwritingFile = async (file: File) => {
    try {
      setOCRProgress({
        stage: 'processing',
        progress: 10,
        message: 'ファイルを解析中...'
      });

      let result: HandwritingOCRResult;

      if (file.type === 'application/pdf') {
        // PDF処理
        setOCRProgress({
          stage: 'processing',
          progress: 30,
          message: 'PDFから画像を抽出中...'
        });

        const multiPageResult = await handwritingOCR.processMultiplePages(file);
        
        setOCRProgress({
          stage: 'processing',
          progress: 70,
          message: 'Gemini Pro Visionで手書き文字を認識中...'
        });

        result = {
          recognizedText: multiPageResult.combinedText,
          confidence: multiPageResult.overallConfidence,
          processingTime: multiPageResult.totalProcessingTime,
          method: 'gemini-vision',
          preprocessingApplied: ['pdf_to_image', 'multi_page_processing']
        };
      } else {
        // 画像処理
        setOCRProgress({
          stage: 'processing',
          progress: 50,
          message: '画像を前処理中...'
        });

        // 画像をImageDataに変換
        const imageData = await convertImageFileToImageData(file);
        
        setOCRProgress({
          stage: 'processing',
          progress: 80,
          message: 'Gemini Pro Visionで手書き文字を認識中...'
        });

        result = await handwritingOCR.recognizeWithGeminiVision(imageData);
      }

      setOCRProgress({
        stage: 'review',
        progress: 90,
        message: '認識結果を確認してください'
      });

      setOCRResult(result);
      setRecognizedText(result.recognizedText);

      // 信頼度が高い場合は自動で次のステップへ
      if (result.confidence >= 0.9) {
        setTimeout(() => {
          handleConfirmText();
        }, 2000);
      }

    } catch (error) {
      console.error('手書きファイル処理エラー:', error);
      setError('手書き文字の認識に失敗しました。画像の品質を確認して再度お試しください。');
      setOCRProgress({
        stage: 'upload',
        progress: 0,
        message: 'エラーが発生しました'
      });
    }
  };

  // 認識テキスト確定
  const handleConfirmText = async () => {
    if (!recognizedText.trim()) {
      setError('認識されたテキストが空です。');
      return;
    }

    try {
      setOCRProgress({
        stage: 'complete',
        progress: 95,
        message: 'AI分析中...'
      });

      // 志願理由書として分析
      const analysis = await AIEssayAnalyzer.analyzeWithAI(recognizedText);
      
      const essaySection: EssaySection = {
        motivation: analysis.motivation.content || '',
        research: analysis.research.content || '',
        schoolLife: analysis.schoolLife.content || '',
        future: analysis.future.content || ''
      };

      setOCRProgress({
        stage: 'complete',
        progress: 100,
        message: '完了！分析結果を確認してください'
      });

      onTextRecognized(essaySection, ocrResult!);

    } catch (error) {
      console.error('AI分析エラー:', error);
      setError('AI分析に失敗しました。認識されたテキストは保存されました。');
    }
  };

  // リセット
  const handleReset = () => {
    setUploadedFile(null);
    setOCRResult(null);
    setRecognizedText('');
    setIsEditing(false);
    setError(null);
    setOCRProgress({
      stage: 'upload',
      progress: 0,
      message: 'ファイルをアップロードしてください'
    });
  };

  // 信頼度に基づく色とアイコン
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle2;
    return AlertTriangle;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <PremiumCard>
        <PremiumCardHeader>
          <PremiumCardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <span>手書きPDF・画像アップロード</span>
            <div className="ml-auto flex items-center space-x-2 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
              <Brain className="w-3 h-3" />
              <span>Gemini Pro Vision</span>
            </div>
          </PremiumCardTitle>
        </PremiumCardHeader>
        <PremiumCardContent>
          {/* アップロードエリア */}
          {ocrProgress.stage === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              className="border-2 border-dashed border-primary-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <FileText className="w-12 h-12 text-primary-500" />
                  <FileImage className="w-12 h-12 text-secondary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    手書き志願理由書をアップロード
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    PDF、JPG、PNGファイルに対応<br/>
                    <strong>Gemini Pro Vision</strong>が小学6年生の手書き文字を高精度で認識します
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded">✓ 薄い鉛筆対応</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">✓ 消しゴム跡除去</span>
                    <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">✓ 文脈理解</span>
                  </div>
                </div>
                <label htmlFor="handwriting-file-input">
                  <input
                    id="handwriting-file-input"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/jpg"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFile(file);
                        setError(null);
                        processHandwritingFile(file);
                      }
                    }}
                  />
                  <PremiumButton className="mt-4" asChild>
                    <div className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      ファイルを選択
                    </div>
                  </PremiumButton>
                </label>
              </div>
            </div>
          )}

          {/* 処理中表示 */}
          {ocrProgress.stage === 'processing' && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    手書き文字を認識中
                  </h3>
                  <p className="text-sm text-gray-600">{ocrProgress.message}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-primary-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${ocrProgress.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-gray-500">
                高精度認識のため、少しお時間をいただいています...
              </p>
            </div>
          )}

          {/* 認識結果確認 */}
          {ocrProgress.stage === 'review' && ocrResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">認識結果</h3>
                <div className="flex items-center space-x-2">
                  {React.createElement(getConfidenceIcon(ocrResult.confidence), {
                    className: `w-5 h-5 ${getConfidenceColor(ocrResult.confidence)}`
                  })}
                  <span className={`text-sm font-medium ${getConfidenceColor(ocrResult.confidence)}`}>
                    精度: {Math.round(ocrResult.confidence * 100)}%
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                {isEditing ? (
                  <textarea
                    value={recognizedText}
                    onChange={(e) => setRecognizedText(e.target.value)}
                    className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none"
                    placeholder="認識されたテキストを確認・修正してください..."
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm text-gray-700 max-h-48 overflow-y-auto">
                    {recognizedText || '認識されたテキストがありません'}
                  </div>
                )}
              </div>

              {/* 修正提案 */}
              {ocrResult.suggestedCorrections && ocrResult.suggestedCorrections.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                    確認が必要な箇所
                  </h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {ocrResult.suggestedCorrections.map((suggestion, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isEditing ? '確認' : '修正'}
                  </PremiumButton>
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    やり直し
                  </PremiumButton>
                </div>
                <PremiumButton onClick={handleConfirmText}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  この内容で分析開始
                </PremiumButton>
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800">エラー</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </PremiumCardContent>
      </PremiumCard>

      {/* 完了表示 */}
      {ocrProgress.stage === 'complete' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <PremiumCard className="bg-gradient-to-r from-green-50 to-primary-50 border-green-200">
            <PremiumCardContent className="py-6">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                手書き文字認識完了！
              </h3>
              <p className="text-sm text-green-700">
                志願理由書が正常に分析されました。分析結果をご確認ください。
              </p>
            </PremiumCardContent>
          </PremiumCard>
        </motion.div>
      )}
    </div>
  );
}

export default HandwritingUploader;