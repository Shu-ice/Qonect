import { NextRequest, NextResponse } from 'next/server';
import { DeepDiveEngine, InterviewStage } from '@/lib/interview/deep-dive-engine';
import { multiAI } from '@/lib/ai/adapter';

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

// 🚀 明和中面接AIリフレクションシステム - 完全動的質問生成
// 受検生の発言内容を受けて、AIが自然で適切な深掘り質問を動的に生成
async function generateReflectiveQuestion(
  question: string, 
  answer: string, 
  conversationHistory: ConversationHistory[],
  stage: string,
  depth: number
): Promise<{question: string, needsFollowUp: boolean, followUpType: string}> {
  
  console.log('🧠 AIリフレクション質問生成開始');
  console.log(`現在段階: ${stage}, 深度: ${depth}`);
  console.log(`前質問: "${question}"`);
  console.log(`受検生回答: "${answer}"`);
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return { question: generateFallbackQuestion(stage, depth), needsFollowUp: false, followUpType: 'none' };
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.4
      }
    });

    // 📋 明和中面接の4段階フローに基づく動的質問生成プロンプト
    const prompt = `【明和中面接：受検生発言リフレクション質問生成】

## 面接状況
- 段階: ${stage} (opening→exploration→metacognition→future)
- 深度: ${depth}層
- 前質問: "${question}"
- 受検生回答: "${answer}"

## 明和中面接の特徴
- 探究活動の深掘りに重点
- 受検生の実際の体験を基にした自然な会話
- 課題解決プロセスの詳細確認
- 具体的エピソードの引き出し

## 質問生成指針
1. **受検生の回答内容を受けて**: 回答の具体的内容を引用して深掘り
2. **自然な会話継続**: 面接官として自然なリアクションから始める
3. **段階適応**: 現在の面接段階に適した深掘り方向
4. **体験重視**: 実体験・具体例を引き出す質問

## 段階別質問方針
- opening: 基本情報確認、緊張緩和
- exploration: 探究活動の詳細深掘り（困難→解決→学び）
- metacognition: 異なる経験の関連性発見、学習プロセス理解
- future: 継続意欲、発展計画

以下の形式で回答してください：
{
  "question": "具体的な深掘り質問",
  "needsFollowUp": true/false,
  "followUpType": "inappropriate|vague|good|excellent",
  "reasoning": "この質問を選んだ理由"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      const parsed = JSON.parse(text);
      console.log(`✅ AI質問生成: "${parsed.question}"`);
      console.log(`理由: ${parsed.reasoning}`);
      
      return {
        question: parsed.question || generateFallbackQuestion(stage, depth),
        needsFollowUp: parsed.needsFollowUp || false,
        followUpType: parsed.followUpType || 'good'
      };
    } catch (parseError) {
      console.log('⚠️ JSON解析失敗、テキストから質問抽出');
      // JSONでない場合、テキストから質問を抽出
      const questionMatch = text.match(/"question":\s*"([^"]+)"/);
      if (questionMatch) {
        return { question: questionMatch[1], needsFollowUp: false, followUpType: 'good' };
      }
      return { question: generateFallbackQuestion(stage, depth), needsFollowUp: false, followUpType: 'none' };
    }
    
  } catch (error) {
    console.error('❌ AIリフレクション質問生成エラー:', error);
    return { question: generateFallbackQuestion(stage, depth), needsFollowUp: false, followUpType: 'none' };
  }
}

// 🎭 AI不適切回答検出システム
async function checkInappropriateAnswer(question: string, answer: string): Promise<{isInappropriate: boolean, reason: string}> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      // APIキーがない場合は簡単なパターンマッチング
      const jokePatterns = ['吾輩は猫である', 'ふざけ', '適当', '知らない', 'わからない', 'テスト'];
      const isJoking = jokePatterns.some(pattern => answer.includes(pattern));
      return { isInappropriate: isJoking, reason: 'パターンマッチング検出' };
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { maxOutputTokens: 100, temperature: 0.2 }
    });

    const prompt = `【明和中面接：回答適切性判定】

質問: "${question}"
受検生回答: "${answer}"

この回答は中学受験面接として適切ですか？以下の観点で判定してください：

【不適切な例】:
- ふざけた内容（「吾輩は猫である」「適当に」など）
- 文学的引用や無関係な内容
- 極端に具体性に欠ける回答（「いろいろ」「なんとなく」のみ）
- 明らかに質問と無関係な内容

【判定形式】:
{
  "inappropriate": true/false,
  "reason": "判定理由"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      const parsed = JSON.parse(text);
      return {
        isInappropriate: parsed.inappropriate || false,
        reason: parsed.reason || '判定完了'
      };
    } catch {
      // JSON解析失敗時は保守的に判定
      return { isInappropriate: false, reason: 'JSON解析失敗' };
    }
    
  } catch (error) {
    console.error('❌ 不適切回答検出エラー:', error);
    return { isInappropriate: false, reason: 'AI検出エラー' };
  }
}

// フォールバック質問生成（段階別）
function generateFallbackQuestion(stage: string, depth: number): string {
  const questions = {
    opening: [
      'こちらまではどうやっていらっしゃいましたか？',
      'お時間はどのくらいかかりましたか？',
      'お母さんと一緒にいらしたのですね。'
    ],
    exploration: [
      'もう少し詳しく教えていただけますか？',
      'その時はどんな気持ちでしたか？',
      'どのような工夫をされましたか？',
      '一番大変だったのはどのようなことですか？',
      'その経験から何を学びましたか？'
    ],
    metacognition: [
      'その活動と他の経験で似ているところはありますか？',
      'どのような学び方が自分に合っていると思いますか？'
    ],
    future: [
      'これからどのようなことを調べてみたいですか？',
      'それはなぜですか？'
    ]
  };
  
  const stageQuestions = questions[stage as keyof typeof questions] || questions.exploration;
  return stageQuestions[Math.min(depth - 1, stageQuestions.length - 1)];
}

export async function POST(request: NextRequest) {
  try {
    const { 
      essayContent, 
      conversationHistory: requestConversationHistory, 
      questionType: requestQuestionType,
      currentStage,
      interviewDepth,
      userMessage,
      studentAnswerCount: requestStudentAnswerCount
    } = await request.json();
    
    const conversationHistory: ConversationHistory[] = requestConversationHistory || [];
    const questionType = requestQuestionType || 'follow_up';
    const stage: InterviewStage = currentStage || 'opening';
    const depth: number = interviewDepth || 1;

    console.log(`🧠 AIリフレクション面接API: stage=${stage}, depth=${depth}, history=${conversationHistory.length}件`);

    // 🎭 不適切回答検出システム（AI判定ベース）
    if (conversationHistory.length >= 1 && userMessage) {
      const lastQuestion = conversationHistory[conversationHistory.length - 1]?.content || '';
      
      const inappropriateCheck = await checkInappropriateAnswer(lastQuestion, userMessage);
      if (inappropriateCheck.isInappropriate) {
        console.log('🎭 不適切回答を検出！');
        console.log(`質問: "${lastQuestion}"`);
        console.log(`回答: "${userMessage}"`);
        console.log(`判定理由: ${inappropriateCheck.reason}`);
        
        return NextResponse.json({
          question: `すみません、今は面接の場ですので、真剣にお答えいただけますか？質問をもう一度しますね。${lastQuestion}`,
          stageTransition: null,
          depth: depth,
          seriousReminder: true,
          inappropriateDetected: true,
          inappropriateReason: inappropriateCheck.reason,
          timestamp: new Date().toISOString()
        });
      }
    }

    // 🧠 AIリフレクション面接システム - 受検生発言を受けた動的深掘り
    const studentAnswerCount = requestStudentAnswerCount !== undefined ? requestStudentAnswerCount : 
                              conversationHistory.filter(h => h.role === 'student').length;
    let question: string;
    const lastStudentResponse = userMessage || '';
    
    console.log(`🧠 AIリフレクション面接: stage=${stage}, depth=${depth}, 回答数=${studentAnswerCount}`);
    
    // 🚀 受検生発言を受けたAI動的質問生成システム
    if (conversationHistory.length >= 1 && userMessage) {
      const lastQuestion = conversationHistory[conversationHistory.length - 1]?.content || '';
      
      console.log('🧠 受検生発言リフレクション開始...');
      console.log(`前質問: "${lastQuestion}"`);
      console.log(`受検生回答: "${userMessage}"`);
      
      // AIによる動的深掘り質問生成
      const reflectionResult = await generateReflectiveQuestion(
        lastQuestion,
        userMessage,
        conversationHistory,
        stage,
        depth
      );
      
      // 段階移行の判定
      let nextStage = stage;
      if (stage === 'opening' && studentAnswerCount >= 3) {
        nextStage = 'exploration';
        console.log('🔄 段階移行: opening → exploration');
      } else if (stage === 'exploration' && studentAnswerCount >= 8) {
        nextStage = 'metacognition';
        console.log('🔄 段階移行: exploration → metacognition');
      } else if (stage === 'metacognition' && studentAnswerCount >= 10) {
        nextStage = 'future';
        console.log('🔄 段階移行: metacognition → future');
      }
      
      const stageTransition = nextStage !== stage ? {
        from: stage,
        to: nextStage,
        depth: depth + 1
      } : null;
      
      // 不適切回答への対応
      if (reflectionResult.followUpType === 'inappropriate') {
        console.log(`🎭 不適切回答検出への対応`);
        return NextResponse.json({
          question: reflectionResult.question,
          stageTransition: null,
          depth: depth,
          seriousReminder: true,
          reflectionType: 'inappropriate',
          timestamp: new Date().toISOString()
        });
      }
      
      // 通常のリフレクション質問返答
      return NextResponse.json({
        question: reflectionResult.question,
        stageTransition,
        depth: stageTransition ? depth + 1 : depth + 1,
        reflectionType: reflectionResult.followUpType,
        reflectionBased: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // 初回質問（面接開始時のみ）
    console.log('🎬 面接開始時の初回質問生成');
    
    if (studentAnswerCount === 0) {
      question = 'それでは面接を始めます。受検番号と名前を教えてください。';
    } else {
      // フォールバック質問
      question = generateFallbackQuestion(stage, studentAnswerCount);
    }

    return NextResponse.json({
      question,
      stageTransition: null,
      depth: 1,
      initialQuestion: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AIリフレクション面接API エラー:', error);
    console.error('エラースタック:', (error as any).stack);
    
    // エラー時のフォールバック値を設定
    const fallbackStage = 'opening';
    const fallbackDepth = 1;
    
    return NextResponse.json({
      question: generateFallbackQuestion(fallbackStage, fallbackDepth),
      stageTransition: null,
      depth: fallbackDepth,
      emergency: true,
      error: (error as any).message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}