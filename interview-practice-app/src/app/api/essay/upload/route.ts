import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EssayProcessor, AIEssayAnalyzer } from '@/lib/essay-processor';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { essayContent, ocrResult } = data;

    // 志願理由書の4項目構造を検証
    const requiredFields = ['motivation', 'research', 'schoolLife', 'future'];
    for (const field of requiredFields) {
      if (!essayContent[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // 文字数計算
    const totalCharacters = Object.values(essayContent).join('').length;

    // AI分析実行
    const analyzer = new AIEssayAnalyzer();
    const analysis = await analyzer.analyzeEssay(essayContent, 'meiwa');

    // データベースに保存
    const essay = await prisma.essay.create({
      data: {
        userId: session.user.id,
        motivation: essayContent.motivation,
        research: essayContent.research,
        schoolLife: essayContent.schoolLife,
        future: essayContent.future,
        researchTopic: analysis.research.topic || '探究活動',
        characterCount: totalCharacters,
        ocrSourceType: ocrResult ? 'handwritten' : 'typed',
        ocrConfidence: ocrResult?.confidence || null,
        ocrProcessedAt: ocrResult ? new Date() : null,
        aiEvaluation: analysis as any,
        evaluatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      essayId: essay.id,
      analysis,
      characterCount: totalCharacters,
    });

  } catch (error) {
    console.error('Essay upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const essayId = searchParams.get('essayId');

    if (essayId) {
      // 特定の志願理由書を取得
      const essay = await prisma.essay.findFirst({
        where: {
          id: essayId,
          userId: session.user.id,
        },
      });

      if (!essay) {
        return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
      }

      return NextResponse.json(essay);
    } else {
      // ユーザーの全志願理由書を取得
      const essays = await prisma.essay.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(essays);
    }

  } catch (error) {
    console.error('Essay fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}