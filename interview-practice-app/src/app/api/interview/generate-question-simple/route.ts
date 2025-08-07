import { NextRequest, NextResponse } from 'next/server';

interface ConversationHistory {
  role: 'interviewer' | 'student';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      essayContent, 
      conversationHistory, 
      currentStage,
      interviewDepth 
    } = await request.json();
    
    const history: ConversationHistory[] = conversationHistory || [];
    const stage = currentStage || 'opening';
    const depth = interviewDepth || 1;
    
    console.log(`🚀 簡易質問生成: stage=${stage}, depth=${depth}, history=${history.length}件`);
    
    // 学生回答数をカウント
    const studentAnswerCount = history.filter(h => h.role === 'student').length;
    
    let question: string;
    
    // 🎯 明確な段階別質問生成
    if (studentAnswerCount === 0) {
      // 最初の質問
      question = 'それでは面接を始めます。受検番号と名前を教えてください。';
      console.log('✅ 開始質問を生成');
      
    } else if (studentAnswerCount === 1) {
      // 2番目：交通手段確認（来迎寺問題の解決）
      const lastAnswer = history[history.length - 1]?.content || '';
      if (lastAnswer.includes('来迎寺') || lastAnswer.includes('夏目')) {
        question = '来迎寺からお越しいただきありがとうございます。こちらまではどのような交通手段でいらっしゃいましたか？';
      } else {
        question = 'ありがとうございます。こちらまではどのような交通手段でいらっしゃいましたか？';
      }
      console.log('✅ 交通手段質問を生成');
      
    } else if (studentAnswerCount === 2) {
      // 3番目：所要時間確認
      question = 'なるほど。どのくらいの時間がかかりましたか？';
      console.log('✅ 時間確認質問を生成');
      
    } else if (studentAnswerCount === 3) {
      // 4番目：探究活動への移行
      question = 'それでは本題に入らせていただきます。あなたが取り組んでいる探究学習について、1分程度で教えてください。準備時間を30秒ほどお取りしますので、考えをまとめてください。';
      console.log('✅ 探究活動開始質問を生成');
      
    } else if (studentAnswerCount === 4) {
      // 5番目：きっかけ探究
      const lastAnswer = history[history.length - 1]?.content || '';
      if (lastAnswer.includes('メダカ')) {
        question = 'メダカの飼育を始めたきっかけは何でしたか？';
      } else if (lastAnswer.includes('ダンス')) {
        question = 'ダンスを始めたきっかけは何でしたか？';
      } else {
        question = 'その活動を始めたきっかけは何でしたか？';
      }
      console.log('✅ きっかけ質問を生成');
      
    } else if (studentAnswerCount >= 5) {
      // 継続質問（簡易深掘り）
      const deepQuestions = [
        'その活動の中で、困ったことや課題に感じたことはありましたか？',
        'その課題を解決するために、どのような工夫をしましたか？',
        'その経験を通して、新しく学んだことはありますか？',
        'その活動は、普段の生活や学校生活にどのような影響を与えましたか？',
        '明和中学校に入学したら、その経験をどのように活かしていきたいですか？'
      ];
      
      const questionIndex = Math.min(studentAnswerCount - 5, deepQuestions.length - 1);
      question = deepQuestions[questionIndex];
      console.log(`✅ 深掘り質問${questionIndex + 1}を生成`);
    } else {
      // フォールバック
      question = 'もう少し詳しく教えていただけますか？';
    }
    
    return NextResponse.json({
      question: question,
      stage: studentAnswerCount < 4 ? 'opening' : 'exploration',
      depth: depth,
      simple: true,
      debugInfo: {
        studentAnswerCount,
        stage,
        method: 'simple_generation'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('簡易質問生成エラー:', error);
    
    return NextResponse.json({
      question: 'それでは面接を始めます。受検番号と名前を教えてください。',
      stage: 'opening',
      depth: 1,
      emergency: true,
      error: (error as any).message,
      timestamp: new Date().toISOString()
    });
  }
}