import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { realtimeEvaluator } from '@/lib/realtime-evaluation';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      sessionId, 
      partialResponse, 
      analysisType = 'interim',
      audioMetrics 
    } = data;

    if (!sessionId || !partialResponse) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // セッションの存在確認
    const interviewSession = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    });

    if (!interviewSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // リアルタイム分析実行
    const analysis = await realtimeEvaluator.analyzeResponse(
      partialResponse,
      '', // interim transcript
      '基本的な興味関心について', // question context
      interviewSession.researchTopic
    );

    // リアルタイムフィードバック生成（簡易実装）
    const feedback = {
      suggestions: analysis.suggestions || [],
      strengths: analysis.strengths || [],
      warnings: analysis.warnings || [],
      type: 'neutral' as const,
      message: 'リアルタイム分析中...',
    };

    // 分析結果をデータベースに保存
    const analyticsRecord = await prisma.realtimeAnalytics.create({
      data: {
        sessionId,
        timestamp: new Date(),
        analysisType,
        metricsData: {
          partialResponse,
          analysis: analysis as any,
          feedback: feedback as any,
          audioMetrics,
        } as any,
        processingTime: Date.now() - new Date().getTime(),
        aiProvider: 'meiwa-realtime',
      },
    });

    return NextResponse.json({
      success: true,
      analysisId: analyticsRecord.id,
      analysis,
      feedback,
      suggestions: feedback.suggestions || [],
    });

  } catch (error) {
    console.error('Realtime analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to perform realtime analysis' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const analysisType = searchParams.get('type');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = {
      sessionId,
      session: {
        userId: session.user.id,
      },
    };

    if (analysisType) {
      whereClause.analysisType = analysisType;
    }

    // リアルタイム分析履歴を取得
    const analytics = await prisma.realtimeAnalytics.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 50, // 最新50件
    });

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Realtime analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// 音声品質分析エンドポイント
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { sessionId, audioQualityData } = data;

    // 音声品質データの分析（簡易実装）
    const audioAnalysis = {
      volume: audioQualityData.volume || 50,
      clarity: audioQualityData.clarity || 75,
      pace: audioQualityData.pace || 60,
    };

    // 音声改善提案の生成（簡易実装）
    const voiceCoachingTips = [
      '声の大きさを適切に保ちましょう',
      'はっきりと話すことを心がけましょう',
      '話すスピードに注意しましょう'
    ];

    return NextResponse.json({
      success: true,
      audioAnalysis,
      voiceCoachingTips,
    });

  } catch (error) {
    console.error('Audio quality analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze audio quality' },
      { status: 500 }
    );
  }
}