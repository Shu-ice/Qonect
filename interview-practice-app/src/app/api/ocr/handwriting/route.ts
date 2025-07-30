import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload JPG, PNG, or PDF files.' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック (10MB制限)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { status: 400 }
      );
    }

    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // OCR処理実行（簡易実装）
    const ocrResult = {
      extractedText: 'OCR機能は開発中です。テキスト入力をご利用ください。',
      confidence: 0.8,
      processingTime: 1.0,
      method: 'mock' as const,
    };

    return NextResponse.json({
      success: true,
      result: ocrResult,
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    
    // エラーの種類に応じて適切なレスポンスを返す
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OCR service quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.message.includes('invalid')) {
        return NextResponse.json(
          { error: 'Invalid file format or corrupted file.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'OCR processing failed. Please try again.' },
      { status: 500 }
    );
  }
}

// OCR結果の確認・修正エンドポイント
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { ocrResultId, correctedText, userFeedback } = data;

    // ユーザーによる修正内容を記録
    // 将来的にOCRの精度向上に活用
    const correctionLog = {
      userId: session.user.id,
      ocrResultId,
      correctedText,
      userFeedback,
      timestamp: new Date(),
    };

    // ログを保存（将来の機械学習に使用）
    console.log('OCR Correction Log:', correctionLog);

    return NextResponse.json({
      success: true,
      message: 'Correction recorded successfully',
    });

  } catch (error) {
    console.error('OCR correction error:', error);
    return NextResponse.json(
      { error: 'Failed to record correction' },
      { status: 500 }
    );
  }
}