import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { meiwaAIService } from '@/lib/meiwa-ai-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { researchTopic, essayId, sessionType = 'practice' } = data;

    if (!researchTopic) {
      return NextResponse.json(
        { error: 'Research topic is required' },
        { status: 400 }
      );
    }

    // 新しい面接セッションを作成
    const interviewSession = await prisma.interviewSession.create({
      data: {
        userId: session.user.id,
        essayId: essayId || null,
        sessionType,
        researchTopic,
        startTime: new Date(),
        currentPhase: 'intro',
        aiProvider: 'multi',
        difficultyLevel: 3,
      },
    });

    // 最初の質問を生成（簡易実装）
    const firstQuestion = {
      text: `${researchTopic}について研究を始めたきっかけを教えてください。`,
      type: 'basic_interest',
      intent: '探究活動への基本的な興味・関心を確認する',
      difficulty: 3,
      evaluationCriteria: {},
    };

    if (firstQuestion) {
      const question = await prisma.interviewQuestion.create({
        data: {
          sessionId: interviewSession.id,
          questionText: firstQuestion.text,
          questionType: firstQuestion.type,
          intent: firstQuestion.intent,
          difficulty: firstQuestion.difficulty,
          evaluationCriteria: firstQuestion.evaluationCriteria,
          orderIndex: 1,
          generateTime: new Date(),
          aiProvider: 'meiwa-ai',
        },
      });

      return NextResponse.json({
        success: true,
        sessionId: interviewSession.id,
        firstQuestion: {
          id: question.id,
          text: question.questionText,
          type: question.questionType,
          intent: question.intent,
        },
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: interviewSession.id,
      firstQuestion: {
        text: `${researchTopic}に取り組んだきっかけを教えてください。`,
        type: 'basic_interest',
        intent: '探究活動への基本的な興味・関心を確認する',
      },
    });

  } catch (error) {
    console.error('Interview session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create interview session' },
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

    if (sessionId) {
      // 特定のセッション情報を取得
      const interviewSession = await prisma.interviewSession.findFirst({
        where: {
          id: sessionId,
          userId: session.user.id,
        },
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
          },
          responses: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!interviewSession) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(interviewSession);
    } else {
      // ユーザーの全セッション履歴を取得
      const sessions = await prisma.interviewSession.findMany({
        where: { userId: session.user.id },
        orderBy: { startTime: 'desc' },
        take: 20, // 最新20件
      });

      return NextResponse.json(sessions);
    }

  } catch (error) {
    console.error('Interview session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { sessionId, phase, finalEvaluation, endTime } = data;

    const updateData: any = {};

    if (phase) {
      updateData.currentPhase = phase;
    }

    if (finalEvaluation) {
      updateData.finalEvaluation = finalEvaluation;
      updateData.overallScore = finalEvaluation.overallScore;
    }

    if (endTime) {
      updateData.endTime = new Date(endTime);
      // 継続時間を計算
      const interviewSession = await prisma.interviewSession.findFirst({
        where: { id: sessionId, userId: session.user.id },
      });
      
      if (interviewSession) {
        const duration = Math.floor((new Date(endTime).getTime() - interviewSession.startTime.getTime()) / 1000);
        updateData.duration = duration;
      }
    }

    const updatedSession = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });

  } catch (error) {
    console.error('Interview session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}