import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // ユーザーの志願理由書完了状況
    const essays = await prisma.essay.findMany({
      where: { userId },
      select: { id: true, characterCount: true },
    });

    // ユーザーの面接セッション数と平均スコア
    const sessions = await prisma.interviewSession.findMany({
      where: { userId },
      select: { 
        id: true,
        finalEvaluation: true,
      },
    });

    const interviewSessions = sessions.length;

    // 平均スコア計算
    let overallScore = 0;
    if (sessions.length > 0) {
      const totalScore = sessions.reduce((sum, session) => {
        const evaluation = session.finalEvaluation as any;
        return sum + (evaluation?.overallScore || 0);
      }, 0);
      overallScore = Math.round((totalScore / sessions.length) * 20); // 100点満点に変換
    }

    // 次のステップ決定
    const essayCompleted = essays.length > 0;
    let nextStep: 'essay' | 'interview' | 'practice' | 'complete' = 'essay';

    if (!essayCompleted) {
      nextStep = 'essay';
    } else if (interviewSessions === 0) {
      nextStep = 'interview';
    } else if (interviewSessions < 5) {
      nextStep = 'practice';
    } else {
      nextStep = 'complete';
    }

    const progress = {
      essayCompleted,
      interviewSessions,
      overallScore,
      nextStep,
    };

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Failed to fetch user progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}