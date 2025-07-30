import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { essayService } from '@/lib/db/essay-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーの志願理由書一覧を取得
    const essays = await essayService.getUserEssays(session.user.id);

    return NextResponse.json(essays);

  } catch (error) {
    console.error('志願理由書取得エラー:', error);
    
    return NextResponse.json(
      { error: '志願理由書の取得に失敗しました' },
      { status: 500 }
    );
  }
}