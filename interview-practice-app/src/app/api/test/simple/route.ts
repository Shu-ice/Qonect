import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'テストAPI成功',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      message: '探究活動メイン15分構造テスト成功',
      receivedData: body,
      testResult: {
        motivationQuestionUsage: 'avoid',
        inquiryFocused: true,
        generatedQuestion: 'メダカの飼育でpH値測定をされているんですね。測定した結果、予想と違った数値が出たことはありませんでしたか？',
        stage: 'exploration',
        depth: 3,
        qualityScore: 42
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'リクエストの処理に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 400 }
    );
  }
}