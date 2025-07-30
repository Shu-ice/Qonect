import { NextRequest, NextResponse } from 'next/server';
import { contextualSpeechCorrector } from '@/lib/speech/contextual-correction';

export async function POST(request: NextRequest) {
  try {
    const { essaySamples } = await request.json();

    if (!essaySamples || !Array.isArray(essaySamples)) {
      return NextResponse.json(
        { error: '志願理由書サンプルが必要です' },
        { status: 400 }
      );
    }

    // 志願理由書サンプルから学習
    await contextualSpeechCorrector.trainFromEssaySamples(essaySamples);

    return NextResponse.json({
      success: true,
      message: `${essaySamples.length}件の志願理由書から学習完了`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('志願理由書学習エラー:', error);
    return NextResponse.json(
      { error: '学習処理に失敗しました' },
      { status: 500 }
    );
  }
}

// 学習データの統計情報を取得
export async function GET() {
  try {
    // 実際の実装では、学習データの統計情報を返す
    const stats = {
      totalSamples: 0,
      schoolTypes: {},
      commonPhrases: [],
      lastTrainingDate: null
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('統計情報取得エラー:', error);
    return NextResponse.json(
      { error: '統計情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}