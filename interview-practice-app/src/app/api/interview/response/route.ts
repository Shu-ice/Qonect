import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { meiwaAIService } from '@/lib/meiwa-ai-service';
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
      questionId, 
      responseText, 
      audioTranscript, 
      duration, 
      transcriptConfidence 
    } = data;

    if (!sessionId || !questionId || !responseText) {
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

    // 質問の存在確認
    const question = await prisma.interviewQuestion.findFirst({
      where: {
        id: questionId,
        sessionId: sessionId,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // AI評価実行
    const aiEvaluation = await meiwaAIService.evaluateResponse(
      {
        id: question.id,
        question: question.questionText,
        type: question.questionType as any,
        intent: question.intent || '',
        evaluationCriteria: question.evaluationCriteria as any,
        difficulty: Math.min(Math.max(question.difficulty, 1), 5) as 1 | 2 | 3 | 4 | 5,
        expectedResponse: '',
        followUpTriggers: []
      },
      responseText,
      {
        researchTopic: interviewSession.researchTopic,
        previousResponses: [],
      }
    );

    // リアルタイム分析実行
    const realtimeAnalysis = await realtimeEvaluator.analyzeResponse(
      responseText,
      '', // interim transcript
      question.intent || '基本的な質問',
      interviewSession.researchTopic
    );

    // 回答をデータベースに保存
    const response = await prisma.interviewResponse.create({
      data: {
        sessionId,
        questionId,
        responseText,
        responseType: audioTranscript ? 'voice' : 'text',
        duration: duration || null,
        audioTranscript: audioTranscript || null,
        transcriptConfidence: transcriptConfidence || null,
        aiEvaluation: aiEvaluation as any,
        realtimeAnalysis: realtimeAnalysis as any,
        evaluatedAt: new Date(),
      },
    });

    // 次の質問を生成
    const nextQuestion = await generateNextQuestion(sessionId, question.orderIndex + 1);

    return NextResponse.json({
      success: true,
      responseId: response.id,
      evaluation: aiEvaluation,
      realtimeAnalysis,
      nextQuestion,
    });

  } catch (error) {
    console.error('Response processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process response' },
      { status: 500 }
    );
  }
}

async function generateNextQuestion(sessionId: string, orderIndex: number) {
  try {
    // セッション情報と過去の質問・回答を取得
    const session = await prisma.interviewSession.findFirst({
      where: { id: sessionId },
      include: {
        questions: {
          include: { responses: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!session) return null;

    // 質問数の上限チェック（最大10問）
    if (orderIndex > 10) {
      return null; // セッション終了
    }

    // 過去の回答履歴を分析して次の質問を生成
    const previousResponses = session.questions
      .map(q => q.responses[0])
      .filter(Boolean)
      .map(r => ({
        questionType: session.questions.find(q => q.id === r.questionId)?.questionType,
        responseText: r.responseText,
        evaluation: r.aiEvaluation,
      }));

    // 次の質問を生成（簡易実装）
    const nextQuestionData = {
      text: `${session.researchTopic}についてもう少し詳しく教えてください。`,
      type: 'experience_detail',
      intent: '体験の詳細を確認する',
      difficulty: 3,
      evaluationCriteria: {},
    };

    if (!nextQuestionData) return null;

    // 新しい質問をデータベースに保存
    const question = await prisma.interviewQuestion.create({
      data: {
        sessionId,
        questionText: nextQuestionData.text,
        questionType: nextQuestionData.type,
        intent: nextQuestionData.intent,
        difficulty: nextQuestionData.difficulty,
        evaluationCriteria: nextQuestionData.evaluationCriteria,
        orderIndex,
        generateTime: new Date(),
        aiProvider: 'meiwa-ai',
      },
    });

    return {
      id: question.id,
      text: question.questionText,
      type: question.questionType,
      intent: question.intent,
      difficulty: question.difficulty,
    };

  } catch (error) {
    console.error('Next question generation error:', error);
    return null;
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

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // セッションの全質問・回答を取得
    const responses = await prisma.interviewResponse.findMany({
      where: {
        sessionId,
        session: {
          userId: session.user.id,
        },
      },
      include: {
        question: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(responses);

  } catch (error) {
    console.error('Response fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}