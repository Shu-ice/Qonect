import { NextRequest, NextResponse } from 'next/server';
import { DeepDiveEngine, InterviewStage } from '@/lib/interview/deep-dive-engine';

interface ConversationHistory {
  role: 'interviewer' | 'student';
  content: string;
}

interface EssayContent {
  motivation: string;
  research: string;
  schoolLife: string;
  future: string;
  inquiryLearning: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      essayContent, 
      conversationHistory: requestConversationHistory, 
      questionType: requestQuestionType,
      currentStage,
      interviewDepth 
    } = await request.json();
    
    const conversationHistory: ConversationHistory[] = requestConversationHistory || [];
    const questionType = requestQuestionType || 'follow_up';
    const stage: InterviewStage = currentStage || 'opening';
    const depth: number = interviewDepth || 1;

    console.log(`🚀 最適化API: stage=${stage}, depth=${depth}, history=${conversationHistory.length}件`);

    // 簡素化された質問生成ロジック
    const studentAnswerCount = conversationHistory.filter(h => h.role === 'student').length;
    let question: string;
    
    // 🎯 明確な段階別質問生成（来迎寺問題の完全解決）
    if (studentAnswerCount === 0) {
      // 開始質問
      question = 'それでは面接を始めます。受検番号と名前を教えてください。';
      console.log('✅ 面接開始質問生成');
      
    } else if (studentAnswerCount === 1) {
      // 交通手段質問（来迎寺対応）
      const lastAnswer = conversationHistory[conversationHistory.length - 1]?.content || '';
      
      if (lastAnswer.includes('来迎寺') || lastAnswer.includes('夏目')) {
        question = '来迎寺からお越しいただき、ありがとうございます。こちらまではどのような交通手段でいらっしゃいましたか？';
        console.log('✅ 来迎寺特化交通機関質問生成');
      } else {
        question = 'ありがとうございます。こちらまではどのような交通手段でいらっしゃいましたか？';
        console.log('✅ 一般交通機関質問生成');
      }
      
    } else if (studentAnswerCount === 2) {
      // 所要時間質問
      question = 'なるほど。どのくらいの時間がかかりましたか？';
      console.log('✅ 所要時間質問生成');
      
    } else if (studentAnswerCount === 3) {
      // 探究活動開始
      question = 'それでは本題に入らせていただきます。あなたが取り組んでいる探究学習について、1分程度で教えてください。準備時間を30秒ほどお取りしますので、考えをまとめてください。';
      console.log('✅ 探究活動開始質問生成');
      
    } else {
      // 深掘り質問
      const deepQuestions = [
        'その活動を始めたきっかけは何でしたか？',
        'その活動の中で、困ったことや課題に感じたことはありましたか？',
        'その課題を解決するために、どのような工夫をしましたか？',
        'その経験を通して、新しく学んだことはありますか？',
        '明和中学校に入学したら、その経験をどのように活かしていきたいですか？'
      ];
      
      const questionIndex = Math.min(studentAnswerCount - 4, deepQuestions.length - 1);
      question = deepQuestions[questionIndex];
      console.log(`✅ 深掘り質問${questionIndex + 1}を生成`);
    }

    return NextResponse.json({
      question: question,
      stageTransition: null,
      depth: depth,
      optimized: true,
      debugInfo: {
        studentAnswerCount,
        stage,
        method: 'optimized_generation',
        engineVersion: '2.0'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('最適化API エラー:', error);
    
    return NextResponse.json({
      question: 'それでは面接を始めます。受検番号と名前を教えてください。',
      stageTransition: null,
      depth: 1,
      emergency: true,
      error: (error as any).message,
      timestamp: new Date().toISOString()
    });
  }
}