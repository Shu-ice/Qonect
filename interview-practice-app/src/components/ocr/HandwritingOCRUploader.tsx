/**
 * 手書きPDF OCRアップローダー
 * ドラッグ&ドロップ、プレビュー、処理進捗表示
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { handwritingOCR, HandwritingOCRResult } from '@/lib/ocr/handwriting-gemini';

interface HandwritingOCRUploaderProps {
  onOCRComplete?: (result: HandwritingOCRResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  maxFileSize?: number; // MB
  className?: string;
}

interface ProcessingState {
  stage: 'idle' | 'uploading' | 'converting' | 'processing' | 'complete' | 'error';
  progress: number;
  currentPage?: number;
  totalPages?: number;
  message: string;
}

export const HandwritingOCRUploader: React.FC<HandwritingOCRUploaderProps> = ({
  onOCRComplete,
  onError,
  disabled = false,
  maxFileSize = 10, // 10MB
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    stage: 'idle',
    progress: 0,
    message: 'PDFファイルをアップロードしてください',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<HandwritingOCRResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ファイル検証
  const validateFile = useCallback((file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'PDFファイルのみアップロード可能です';
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `ファイルサイズは${maxFileSize}MB以下にしてください`;
    }
    
    return null;
  }, [maxFileSize]);

  // ファイル選択処理
  const handleFileSelect = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setProcessing({
        stage: 'error',
        progress: 0,
        message: error,
      });
      onError?.(error);
      return;
    }

    setSelectedFile(file);
    setProcessing({
      stage: 'uploading',
      progress: 10,
      message: 'ファイルを読み込んでいます...',
    });

    // プレビュー生成
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      setProcessing({
        stage: 'converting',
        progress: 30,
        message: 'PDFを画像に変換しています...',
      });

      // OCR処理開始
      await processOCR(file);
      
    } catch (error) {
      console.error('File processing failed:', error);
      const errorMessage = 'ファイル処理に失敗しました';
      setProcessing({
        stage: 'error',
        progress: 0,
        message: errorMessage,
      });
      onError?.(errorMessage);
    }
  }, [validateFile, onError]);

  // OCR処理実行
  const processOCR = async (file: File) => {
    try {
      setProcessing({
        stage: 'processing',
        progress: 50,
        message: 'Gemini Pro Vision で手書き文字を認識しています...',
      });

      // OCR実行（進捗コールバック付き）
      const result = await handwritingOCR.processMultiplePages(file);

      setProcessing({
        stage: 'complete',
        progress: 100,
        message: `認識完了！${result.totalPages}ページ、信頼度${(result.overallConfidence * 100).toFixed(1)}%`,
      });

      setOcrResult(result);
      onOCRComplete?.(result);

    } catch (error) {
      console.error('OCR processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'OCR処理に失敗しました';
      setProcessing({
        stage: 'error',
        progress: 0,
        message: errorMessage,
      });
      onError?.(errorMessage);
    }
  };

  // ドラッグ&ドロップハンドラ
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  // ファイル入力ハンドラ
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // ファイル選択ボタンクリック
  const handleSelectClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // リセット
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    setProcessing({
      stage: 'idle',
      progress: 0,
      message: 'PDFファイルをアップロードしてください',
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // プログレスバーの色
  const getProgressColor = () => {
    switch (processing.stage) {
      case 'error': return 'bg-red-500';
      case 'complete': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  // ステージアイコン
  const getStageIcon = () => {
    switch (processing.stage) {
      case 'idle':
        return (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      case 'uploading':
      case 'converting':
      case 'processing':
        return (
          <motion.svg
            className="w-12 h-12 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </motion.svg>
        );
      case 'complete':
        return (
          <motion.svg
            className="w-12 h-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </motion.svg>
        );
      case 'error':
        return (
          <motion.svg
            className="w-12 h-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </motion.svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`handwriting-ocr-uploader ${className}`}>
      {/* ドロップゾーン */}
      <motion.div
        ref={dropZoneRef}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'}
          ${processing.stage === 'error' ? 'border-red-300 bg-red-50' : ''}
          ${processing.stage === 'complete' ? 'border-green-300 bg-green-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleSelectClick}
        whileHover={disabled ? {} : { scale: 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
      >
        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {/* メインコンテンツ */}
        <div className="flex flex-col items-center space-y-4">
          {/* ステージアイコン */}
          <div className="mb-4">
            {getStageIcon()}
          </div>

          {/* ファイル情報 */}
          {selectedFile && (
            <div className="text-sm text-gray-600 mb-2">
              📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
            </div>
          )}

          {/* ステータスメッセージ */}
          <div className="text-lg font-medium text-gray-700 mb-2">
            {processing.message}
          </div>

          {/* プログレスバー */}
          {processing.stage !== 'idle' && (
            <div className="w-full max-w-md">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${getProgressColor()}`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${processing.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                {processing.progress}%
                {processing.currentPage && processing.totalPages && (
                  ` (${processing.currentPage}/${processing.totalPages}ページ)`
                )}
              </div>
            </div>
          )}

          {/* アクション */}
          {processing.stage === 'idle' && (
            <div className="text-center space-y-2">
              <button
                onClick={handleSelectClick}
                disabled={disabled}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                📎 PDFファイルを選択
              </button>
              <p className="text-sm text-gray-500">
                または、ここにドラッグ&ドロップ
              </p>
              <p className="text-xs text-gray-400">
                最大{maxFileSize}MB、PDF形式のみ
              </p>
            </div>
          )}

          {/* エラー時の再試行 */}
          {processing.stage === 'error' && (
            <div className="space-x-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                リセット
              </button>
              {selectedFile && (
                <button
                  onClick={() => processOCR(selectedFile)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  再試行
                </button>
              )}
            </div>
          )}

          {/* 完了時のアクション */}
          {processing.stage === 'complete' && (
            <div className="space-x-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                新しいファイル
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* OCR結果プレビュー */}
      <AnimatePresence>
        {ocrResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ✨ 認識結果
            </h3>
            
            {/* 統計情報 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{ocrResult.totalPages}</div>
                <div className="text-sm text-blue-600">ページ数</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(ocrResult.overallConfidence * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-green-600">信頼度</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {ocrResult.combinedText.length}
                </div>
                <div className="text-sm text-purple-600">文字数</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {(ocrResult.processingTime / 1000).toFixed(1)}s
                </div>
                <div className="text-sm text-orange-600">処理時間</div>
              </div>
            </div>

            {/* 認識テキスト */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">認識されたテキスト:</h4>
              <div className="max-h-40 overflow-y-auto p-4 bg-gray-50 border rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {ocrResult.combinedText}
                </pre>
              </div>
            </div>

            {/* 前処理情報 */}
            {ocrResult.preprocessingApplied.length > 0 && (
              <div className="text-sm text-gray-600">
                <strong>適用された前処理:</strong> {ocrResult.preprocessingApplied.join(', ')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 使い方ガイド */}
      {processing.stage === 'idle' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">📚 使い方のコツ</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 手書き文字ははっきりと、濃く書いてください</li>
            <li>• 消しゴムの跡がある場合は、できるだけきれいに消してください</li>
            <li>• スキャン時は影ができないよう注意してください</li>
            <li>• 1ページあたり400-600文字程度が最適です</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default HandwritingOCRUploader;