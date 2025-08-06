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

// ふざけた回答の検出関数
function checkJokingAnswer(question: string, answer: string): boolean {
  // 明らかにふざけた回答のパターン
  const jokingPatterns = [
    /どこでもドア|タイムマシン|ワープ|テレポート|瞬間移動|魔法|忍術|超能力/,
    /ドラえもん|ポケモン|マリオ|ピカチュウ|悟空|ナルト|ルフィ|コナン/,
    /映画|テレビ|YouTube|TikTok|Netflix|アニメ|漫画|小説|音楽鑑賞|ドラマ/,
    /飛んできた|宇宙船|UFO|転送装置|念力|空を飛んで|光の速さで/,
    /知らない|わからない|忘れた|めんどくさい|うざい|だるい|適当に/,
    /寝ること|食べること|買い物|遊ぶこと|友達と遊|散歩|お風呂に入ること/,
    /スマホをいじること|SNS|LINE|Instagram|Twitter|Facebook/,
    /えへへ|あはは|ふふふ|にゃーん|わんわん|もぐもぐ|ぴょんぴょん/,
  ];

  // 探究活動の質問に対してテレビ視聴などの不適切な回答
  if (question.includes('探究学習') || question.includes('取り組んで')) {
    if (/テレビを見る|ゲームをする|寝る|遊ぶ/.test(answer)) {
      return true;
    }
  }

  return jokingPatterns.some(pattern => pattern.test(answer));
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

    console.log(`🚀 最適化API: stage=${stage}, depth=${depth}, history=${conversationHistory.length}件`);

    // ふざけた回答の検出
    if (conversationHistory.length >= 1 && userMessage) {
      const lastQuestion = conversationHistory[conversationHistory.length - 1]?.content || '';
      
      if (checkJokingAnswer(lastQuestion, userMessage)) {
        console.log('🎭 ふざけた回答を検出！');
        console.log(`質問: "${lastQuestion}"`);
        console.log(`回答: "${userMessage}"`);
        
        return NextResponse.json({
          question: 'すみません、今は面接の場ですので、真剣にお答えいただけますか？質問をもう一度しますね。' + lastQuestion,
          stageTransition: null,
          depth: depth,
          seriousReminder: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // 🚀 完全AI生成システム - 固定セリフ廃止
    // フロントエンドから送られたstudentAnswerCountを使用
    const studentAnswerCount = requestStudentAnswerCount !== undefined ? requestStudentAnswerCount : 
                              conversationHistory.filter(h => h.role === 'student').length;
    let question: string;
    const lastStudentResponse = userMessage || '';
    
    try {
      console.log(`🤖 AI自然質問生成: 回答数=${studentAnswerCount}, 回答=\"${lastStudentResponse.substring(0, 30)}...\"`);
      console.log(`🔍 デバッグ: requestStudentAnswerCount=${requestStudentAnswerCount}, conversationHistory.length=${conversationHistory.length}`);
      
      // 段階別AI生成プロンプト
      let aiPrompt: string;
      let systemPrompt: string;
      
      if (studentAnswerCount === 1) {
        // 交通手段質問のAI生成
        aiPrompt = `【明和中学校面接：交通手段質問生成】

受験生の自己紹介：「${lastStudentResponse}」

面接官として、受験生の名前を確認した後、来校時の交通手段について1つの簡潔な質問を生成してください。

【重要な要件】:
1. 面接官らしい品格を保つ丁寧な口調
2. 簡潔で直接的な質問（余計な前置きは不要）
3. 必ず「？」で終わる質問
4. 1文で完結

【例】:
- 「こちらまではどのような交通手段でいらっしゃいましたか？」
- 「今日はどうやってお越しになりましたか？」

簡潔で丁寧な1つの質問を生成してください：`;

        systemPrompt = `あなたは明和高校附属中学校の面接官です。品格を保ち、簡潔で丁寧な質問を心がけてください。`;
        
      } else if (studentAnswerCount === 2) {
        // 所要時間質問のAI生成
        aiPrompt = `【明和中学校面接：所要時間質問生成】

受験生の交通手段回答：「${lastStudentResponse}」

面接官として、受験生の交通手段を受けて、所要時間について簡潔に質問してください。

【重要な要件】:
1. 面接官らしい品格を保つ丁寧な口調
2. 簡潔で直接的な質問（余計な相槌や前置きは不要）
3. 必ず「？」で終わる質問
4. 1文で完結

【例】:
- 「どのくらいお時間がかかりましたか？」
- 「何分ほどかかりましたか？」

簡潔で丁寧な1つの質問を生成してください：`;

        systemPrompt = `あなたは明和高校附属中学校の面接官です。品格を保ち、簡潔で丁寧な質問を心がけてください。`;
        
      } else if (studentAnswerCount === 3) {
        // 探究活動開始質問のAI生成  
        aiPrompt = `【明和中学校面接：探究学習質問生成】

受験生の所要時間回答：「${lastStudentResponse}」

面接官として、本題の探究学習について質問してください。

【重要な要件】:
1. 面接官らしい品格を保つ丁寧な口調
2. 簡潔で要点を絞った質問
3. 本題に入ることを明確に示す
4. 必ず「？」で終わる質問
5. 2-3文で完結

【例】:
- 「それでは本題に入らせていただきます。あなたが取り組んでいる探究学習について教えてください。」
- 「では、探究学習についてお聞かせください。どのような活動をされていますか？」

簡潔で丁寧な質問を生成してください：`;

        systemPrompt = `あなたは明和高校附属中学校の面接官です。品格を保ち、簡潔で要点を絞った質問を心がけてください。`;
        
      } else if (studentAnswerCount >= 4) {
        // 深掘り質問のAI生成
        aiPrompt = `【明和中学校面接：深掘り質問生成】

受験生の回答：「${lastStudentResponse}」

面接官として、受験生の回答から具体的な要素を拾い、1つの深掘り質問を生成してください。

【重要な要件】:
1. 面接官らしい品格を保つ丁寧な口調
2. 受験生の回答の具体的な内容に基づく質問
3. 「困難・課題」「解決方法」「学び・気づき」「協働」のいずれかを探る
4. 簡潔で要点を絞った質問
5. 必ず「？」で終わる質問

【質問の観点】:
- 困難や課題にどう対処したか
- 工夫や解決方法について
- 活動から得た学びや気づき
- 他者との協働について

簡潔で的確な1つの質問を生成してください：`;

        systemPrompt = `あなたは明和高校附属中学校の面接官です。品格を保ち、受験生の体験に基づいた簡潔で的確な質問を心がけてください。`;
        
      } else {
        // 初期状態または予期しない状態のAI生成
        aiPrompt = `【明和中学校面接：状況対応質問生成】

面接官として、適切な質問を1つ生成してください。

【重要な要件】:
1. 面接官らしい品格を保つ丁寧な口調
2. 簡潔で適切な質問
3. 必ず「？」で終わる質問
4. 1文で完結

簡潔で適切な1つの質問を生成してください：`;

        systemPrompt = `あなたは明和高校附属中学校の面接官です。品格を保ち、簡潔で適切な質問を心がけてください。`;
      }
      
      // AI生成の実行 - 改善されたGemini API呼び出し
      console.log(`🚀 Gemini API呼び出し (段階: ${studentAnswerCount})`);
      
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error('❌ Gemini APIキーが設定されていません');
        throw new Error('API Key not configured');
      }
      
      console.log(`🔑 APIキー確認: ${apiKey.substring(0, 10)}...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Gemini 2.5 Flash使用（1日250リクエスト、1分10リクエスト制限）
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.3
        }
      });
      
      // プロンプト簡素化 - 過度に長いプロンプトを避ける
      const simplePrompt = `${systemPrompt}

${aiPrompt}`;
      
      console.log(`📝 送信プロンプト長: ${simplePrompt.length}文字`);
      
      // レート制限対策: 初回待機（無料版は15req/min制限）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // リトライ機能付きAPI呼び出し
      let retries = 3;
      while (retries > 0) {
        try {
          const result = await model.generateContent(simplePrompt);
          const response = await result.response;
          const generatedText = response.text();

          console.log(`📨 Gemini応答: "${generatedText}"`);
          question = generatedText.trim();
          break; // 成功したらループを抜ける
          
        } catch (apiError: any) {
          retries--;
          console.log(`⚠️ API呼び出し失敗 (残り${retries}回): ${apiError.message}`);
          console.log(`エラー詳細: ${JSON.stringify(apiError, null, 2)}`);
          
          if (retries === 0) {
            throw apiError; // 最終的に失敗
          }
          
          // 503エラーの場合は長めに待機
          const waitTime = apiError.status === 503 ? 5000 : (4 - retries) * 2000;
          console.log(`${waitTime/1000}秒待機...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // AI生成質問の最低限品質チェック（緩和版）
      if (!question || question.length < 10 || question === aiPrompt) {
        console.log(`⚠️ AI生成質問が最低限品質不適合: "${question}"`);
        throw new Error('AI生成質問が不適切');
      }
      
      // 「？」がない場合は自動で追加
      if (!question.includes('？') && !question.includes('?')) {
        question = question.trim() + '？';
        console.log('❓ 質問マーク自動追加');
      }
      
      console.log(`✅ AI生成質問 (段階${studentAnswerCount}): "${question}"`);
      
    } catch (error: any) {
      console.error('❌ AI質問生成システムエラー:', error);
      console.error('エラー詳細:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        stack: error.stack
      });
      
      // Gemini API特有のエラー処理
      if (error.status === 503) {
        console.error('⚠️ Gemini API過負荷 (503) - サービス一時的に利用不可');
        // 503エラーの詳細をログ
        console.error('503エラー詳細:', error);
      }
      
      // Gemini制限対応：クォータ制限の場合はシンプルなフォールバックを使用
      if (error.status === 429 || error.message.includes('quota') || error.message.includes('limit')) {
        console.log('🎯 Geminiクォータ制限 - フォールバックシステム使用');
        
        // 段階別の基本質問（AI生成の代替）
        if (studentAnswerCount === 1) {
          question = 'こちらまではどのような交通手段でいらっしゃいましたか？';
        } else if (studentAnswerCount === 2) {
          question = 'どのくらいお時間がかかりましたか？';
        } else if (studentAnswerCount === 3) {
          question = 'それでは本題に入らせていただきます。あなたが取り組んでいる探究学習について教えてください。';
        } else if (studentAnswerCount >= 4) {
          const fallbackQuestions = [
            'その活動で困難に感じたことがあれば教えてください。',
            'その取り組みからどのような学びがありましたか？',
            '他の人との協力で印象深いことがあれば聞かせてください。',
            'その経験を今後どのように活かしたいと考えていますか？',
            '活動を通じて発見したことがあれば教えてください。'
          ];
          question = fallbackQuestions[Math.min(studentAnswerCount - 4, fallbackQuestions.length - 1)];
        } else {
          question = '続けてお話しいただけますか？';
        }
        
        console.log(`✅ フォールバック質問 (段階${studentAnswerCount}): "${question}"`);
      } else {
        // その他のエラーは再スロー
        throw new Error(`AI生成失敗: ${error.message || 'Unknown error'}`);
      }
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
    console.error('❌ 最適化API 致命的エラー:', error);
    console.error('エラースタック:', (error as any).stack);
    
    // エラー内容をより詳細に記録
    const errorMessage = (error as any).message || 'Unknown error';
    const errorCode = (error as any).code || 'UNKNOWN';
    
    console.error(`エラーコード: ${errorCode}, メッセージ: ${errorMessage}`);
    
    // 緊急時でも自然な応答を生成（簡易版）
    const emergencyQuestions = [
      'もう少し詳しく教えていただけますか？',
      'その点について詳しく聞かせてください。',
      '続けてお話しいただけますでしょうか？'
    ];
    const randomQuestion = emergencyQuestions[Math.floor(Math.random() * emergencyQuestions.length)];
    
    return NextResponse.json({
      question: randomQuestion,
      stageTransition: null,
      depth: depth || 1,
      emergency: true,
      error: errorMessage,
      errorCode: errorCode,
      timestamp: new Date().toISOString()
    });
  }
}