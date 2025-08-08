import { NextRequest, NextResponse } from 'next/server';
import { DeepDiveEngine, InterviewStage } from '@/lib/interview/deep-dive-engine';
import { multiAI } from '@/lib/ai/adapter';
import { responseOptimizer } from '@/lib/performance/response-optimizer';
import { enhancedDeepDiveEngine } from '@/lib/interview/enhanced-deep-dive-engine';
import { cacheWarmer } from '@/lib/performance/cache-warmer';
import { concurrentProcessor } from '@/lib/performance/concurrent-processor';
import { errorRecoverySystem } from '@/lib/error/error-recovery-system';
import { performanceBooster } from '@/lib/performance/performance-booster';

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

// 🚀 明和中面接AIリフレクションシステム - 高速動的質問生成
// 受検生の発言内容を受けて、AIが自然で適切な深掘り質問を動的に生成
// 手動で環境変数を読み込む関数
function loadEnvVariables() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContents = fs.readFileSync(envPath, 'utf8');
      const lines = envContents.split('\n');
      
      lines.forEach((line: string) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
          if (key && value && !process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (error) {
    console.warn('⚠️ 手動環境変数読み込みエラー:', error);
  }
}

async function generateReflectiveQuestion(
  question: string, 
  answer: string, 
  conversationHistory: ConversationHistory[],
  stage: string,
  depth: number
): Promise<{question: string, needsFollowUp: boolean, followUpType: string}> {
  
  // 🚀 キャッシュ最適化による高速応答
  const cacheKey = `reflection_${stage}_${depth}_${answer.substring(0, 50)}`;
  
  // 一時的にキャッシュを無効化してAI生成を確認
  // return await responseOptimizer.getOrSet(cacheKey, async () => {
  {
    console.log('🧠 AIリフレクション質問生成開始');
    console.log(`現在段階: ${stage}, 深度: ${depth}`);
    console.log(`前質問: "${question}"`);
    console.log(`受検生回答: "${answer}"`);
    
    // 環境変数の手動読み込みを試行
    loadEnvVariables();
    
    try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    // 🔥 APIキー強制使用（「メインはAIチャット」原則）
    const apiKey = 'AIzaSyDhSwuxAwrIccB5L4GG0Y7jvz6Rabe21qk';  // 確実にAI動作させるため
    
    console.log('🔑 APIキー確認:', apiKey ? `設定済み(${apiKey.substring(0, 20)}...)` : '未設定');
    console.log('🔑 環境変数チェック:', {
      GOOGLE_GENERATIVE_AI_API_KEY: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      NODE_ENV: process.env.NODE_ENV
    });
    
    if (!apiKey) {
      console.log('❌ APIキー未設定、フォールバック実行');
      return { question: generateFallbackQuestion(stage, depth), needsFollowUp: false, followUpType: 'no_api_key' };
    }
    
    console.log('✅ APIキー確認済み、Gemini呼び出し開始');
    console.log('🔥 **「メインはAIチャット」原則実行中** - AI動的質問生成開始');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        // maxOutputTokensは設定しない - デフォルト値を使用
        temperature: 0.4
      }
    });

    // 📋 **「メインはAIチャット」原則** - 受検生回答を理解した動的質問生成
    const prompt = `You are a Meiwa Middle School interviewer. 6th grader interview in progress.

Previous question: "${question}"
Student response: "${answer}"

Generate ONE natural follow-up question in Japanese based on student's answer.

CRITICAL RULES:
1. MUST end with question mark (？)
2. MUST relate to student's actual answer content  
3. Maximum 30 Japanese characters
4. Use polite form for elementary students
5. NO generic questions - SPECIFIC to their answer

Examples:
Q: "Name and number?" → A: "1234 Tanaka Taro" → Next: "田中さん、ありがとうございます。どうやって来ましたか？"

Return ONLY JSON:
{"question": "Japanese question here", "reasoning": "why this question"}`;

    console.log('📤 **緊急診断** - Gemini APIへのプロンプト送信中...');
    console.log('📤 プロンプト長:', prompt.length, '文字');
    console.log('📤 前質問:', `"${question}"`);
    console.log('📤 受検生回答:', `"${answer}"`);
    
    console.log('🚀 **実際にGemini APIを呼び出します**');
    const result = await model.generateContent(prompt);
    console.log('📥 **Gemini呼び出し成功** - result object received');
    
    const response = await result.response;
    console.log('📥 **Gemini response取得成功**');
    
    const text = response.text().trim();
    console.log('📥 **Gemini APIレスポンス完全版**:', text);
    console.log('📥 レスポンス長:', text.length, '文字');
    
    if (!text || text.length === 0) {
      console.error('❌ **Gemini APIからの空レスポンス**');
      throw new Error('Empty response from Gemini API');
    }
    
    // 🎉 Gemini APIから```json```ブロック形式でレスポンスが返される場合の処理
    let cleanText = text;
    if (text.includes('```json')) {
      console.log('📝 ```json```ブロック検出 - クリーニング実行');
      cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('🧹 クリーニング後テキスト:', cleanText);
    }
    
    try {
      const parsed = JSON.parse(cleanText);
      console.log(`🎉 **AI質問生成成功**: "${parsed.question}"`);
      console.log(`📝 理由: ${parsed.reasoning}`);
      console.log('✅ **「メインはAIチャット」原則が正常に動作中**');
      
      return {
        question: parsed.question || generateFallbackQuestion(stage, depth),
        needsFollowUp: true,
        followUpType: 'ai_generated',
        aiReasoning: parsed.reasoning
      };
    } catch (parseError) {
      console.log('⚠️ JSON解析失敗、正規表現で質問抽出を試行');
      console.log('⚠️ 解析エラー:', parseError.message);
      console.log('⚠️ 対象テキスト:', cleanText);
      
      // より堅牢な正規表現パターンで質問を抽出
      const questionPatterns = [
        /"question":\s*"([^"]+)"/,
        /\"question\":\s*\"([^\"]+)\"/,
        /question["\s]*:["\s]*([^"]+)"/,
        /([^。]*\?[^。]*)/  // 日本語質問文を直接抽出
      ];
      
      for (const pattern of questionPatterns) {
        const match = cleanText.match(pattern);
        if (match) {
          console.log(`✅ 正規表現で質問抽出成功: "${match[1]}"`);
          return { 
            question: match[1], 
            needsFollowUp: true, 
            followUpType: 'ai_extracted',
            extractionMethod: 'regex'
          };
        }
      }
      
      console.log('❌ 質問抽出完全失敗');
      return { question: generateFallbackQuestion(stage, depth), needsFollowUp: false, followUpType: 'extraction_failed' };
    }
    
    } catch (error) {
      console.error('❌ **「メインはAIチャット」失敗** - 緊急デバッグ情報:');
      console.error('❌ エラー詳細:', error.message);
      console.error('❌ エラータイプ:', error.constructor.name);
      console.error('❌ スタック:', error.stack);
      console.error('❌ プロンプト長:', prompt?.length);
      console.error('❌ APIキー状況:', apiKey ? 'あり' : 'なし');
      
      // 🚨 AI失敗時の緊急対応（固定パターン禁止のため、エラー詳細を返す）
      return { 
        question: `AI生成エラー: ${error.message}. システムを確認中です。`,
        needsFollowUp: false, 
        followUpType: 'ai_critical_error',
        errorDetails: {
          message: error.message,
          type: error.constructor.name,
          promptLength: prompt?.length,
          hasApiKey: !!apiKey
        }
      };
    }
  // }, { priority: 'high', cache: true });
  }
}

// 🎭 AI不適切回答検出システム（高速キャッシュ版）
async function checkInappropriateAnswer(question: string, answer: string): Promise<{isInappropriate: boolean, reason: string}> {
  const cacheKey = `inappropriate_check_${answer.substring(0, 30)}`;
  
  return await responseOptimizer.getOrSet(cacheKey, async () => {
    // まず高速パターンマッチングで明らかな不適切回答を検出
  const inappropriatePatterns = [
    { pattern: /吾輩は猫である/, reason: '文学作品の引用' },
    { pattern: /ふざけ|冗談|ジョーク/, reason: 'ふざけた内容' },
    { pattern: /テスト|test|てすと/, reason: 'テスト回答' },
    { pattern: /あああ|ううう|えええ/, reason: '無意味な文字列' },
    { pattern: /^[ぁ-ん]{1,2}$/, reason: '極端に短い回答' },
    { pattern: /死ね|殺す|バカ|アホ/, reason: '不適切な言葉' }
  ];

  for (const { pattern, reason } of inappropriatePatterns) {
    if (pattern.test(answer)) {
      console.log(`🎭 パターンマッチで不適切回答検出: ${reason}`);
      return { isInappropriate: true, reason };
    }
  }

    // 極端に短い回答もチェック
    if (answer.length < 5 && !answer.match(/はい|いいえ|です|ます/)) {
      return { isInappropriate: true, reason: '回答が短すぎます' };
    }

    try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
      if (!apiKey) {
        return { isInappropriate: false, reason: 'AI判定不可' };
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
  }, { priority: 'critical', cache: true });
}

// フォールバック質問生成（段階別・重複回避・原則準拠）
function generateFallbackQuestion(stage: string, depth: number, conversationHistory: ConversationHistory[] = []): string {
  // 既に使用された質問を抽出
  const usedQuestions = conversationHistory
    .filter(h => h.role === 'interviewer')
    .map(h => h.content.replace(/。$/, '').trim());
  
  console.log(`🚨 **フォールバック質問が実行された** - これは緊急事態です`);
  console.log(`🚨 stage=${stage}, depth=${depth}, 使用済み質問数=${usedQuestions.length}`);
  console.log('🚨 **「メインはAIチャット」原則に違反しています**');
  
  // 🚨 明和中面接の正しい流れに修正
  const questions = {
    opening: [
      'ありがとうございます。こちらまで、どうやって来られましたか？',
      '時間はどのくらいかかりましたか？',
      'お一人で来られましたか？',
      'どちらの駅から乗られましたか？',
      'それでは、あなたがこれまで打ち込んできた探究活動について、1分ほどで説明してください。'
    ],
    exploration: [
      'もう少し詳しく教えてくれますか？',
      'その時はどんな気持ちでしたか？',
      'どんな工夫をしましたか？',
      '大変だったことはありますか？',
      'どんなことを学びましたか？',
      '誰かに相談しましたか？',
      'うまくいかないときはどうしましたか？'
    ],
    metacognition: [
      '他の活動と似ているところはありますか？',
      'どんな学び方が好きですか？',
      'この経験で成長したと思うことはありますか？'
    ],
    future: [
      'これからどんなことを調べたいですか？',
      'それはどうしてですか？',
      '中学校でも続けたいことはありますか？'
    ]
  };
  
  const stageQuestions = questions[stage as keyof typeof questions] || questions.exploration;
  
  // 重複回避：使用されていない質問を優先的に選択
  const availableQuestions = stageQuestions.filter(q => {
    const questionBase = q.replace(/。$/, '').trim();
    return !usedQuestions.some(used => 
      used === questionBase || 
      used.includes(questionBase.substring(0, 15)) ||
      questionBase.includes(used.substring(0, 15))
    );
  });
  
  if (availableQuestions.length > 0) {
    const selectedQuestion = availableQuestions[depth % availableQuestions.length];
    console.log(`✅ 重複回避成功: "${selectedQuestion}"`);
    return selectedQuestion;
  } else {
    // すべて使用済みの場合は、最もシンプルな新しい質問
    const emergencyQuestions = [
      '他に好きなことはありますか？',
      '将来やってみたいことはありますか？',
      '家族とはどんな話をしますか？',
      '友達とはどんな遊びをしますか？'
    ];
    const emergencySelected = emergencyQuestions[depth % emergencyQuestions.length];
    console.log(`🚨 緊急質問選択: "${emergencySelected}"`);
    return emergencySelected;
  }
}

export async function POST(request: NextRequest) {
  const apiStartTime = Date.now();
  let userMessage: string | undefined;
  let stage: InterviewStage = 'opening';
  let depth: number = 1;
  
  try {
    // 🚀 バックグラウンドで次の段階のキャッシュ予熱を開始  
    const { 
      essayContent, 
      conversationHistory: requestConversationHistory, 
      questionType: requestQuestionType,
      currentStage,
      interviewDepth,
      userMessage: requestUserMessage,
      studentAnswerCount: requestStudentAnswerCount
    } = await request.json();
    
    // 変数を適切なスコープに設定
    userMessage = requestUserMessage;
    stage = currentStage || 'opening';
    depth = interviewDepth || 1;
    
    // インテリジェントキャッシュ予熱（バックグラウンド実行）
    if (currentStage) {
      cacheWarmer.startIntelligentWarmup(currentStage).catch(error => {
        console.warn('⚠️ キャッシュ予熱エラー（処理続行）:', error);
      });
    }

    // 🚀 パフォーマンスブースト有効化
    performanceBooster.enableBoostMode();
    
    const conversationHistory: ConversationHistory[] = requestConversationHistory || [];
    const questionType = requestQuestionType || 'follow_up';

    console.log(`🧠 AIリフレクション面接API: stage=${stage}, depth=${depth}, history=${conversationHistory.length}件`);

    // 🎭 不適切回答検出システム（AI判定ベース）
    if (conversationHistory.length >= 1 && userMessage) {
      const lastQuestion = conversationHistory[conversationHistory.length - 1]?.content || '';
      
      console.log('🎭 不適切回答チェック開始');
      console.log(`ユーザー回答: "${userMessage}"`);
      
      const inappropriateCheck = await checkInappropriateAnswer(lastQuestion, userMessage);
      console.log(`判定結果: inappropriate=${inappropriateCheck.isInappropriate}, reason=${inappropriateCheck.reason}`);
      
      if (inappropriateCheck.isInappropriate) {
        console.log('🎭 不適切回答を検出！建設的指導モード発動');
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

    // 🚨 緊急: 受検生混乱状態検出とセッションリセット（拡張パターン）
    const confusionPatterns = [
      'たすけて', 'たすけてー', '何度ですか', '何度', 'わからない', 'わかりません',
      '何言ってる', 'なに言って', '意味不明', '意味がわからない', 'よくわからない',
      '？？？', '???', 'なぜ', 'なんで', 'どういう意味', 'どういうこと',
      '500人', '1000人', '100人'  // 明らかに文脈に合わない数値回答
    ];
    
    const isConfused = userMessage && confusionPatterns.some(pattern => userMessage.includes(pattern));
    
    if (isConfused) {
      console.log(`🚨 受検生混乱状態検出: "${userMessage}" - フレンドリーリセット実行`);
      return NextResponse.json({
        question: 'すみません、質問が分かりにくかったですね。改めて、あなたの好きな勉強や活動があれば、何でも教えてください。',
        stageTransition: { from: stage, to: 'opening', depth: 1 },
        depth: 1,
        resetSession: true,
        supportiveMode: true,
        confusionDetected: true,
        originalMessage: userMessage,
        responseTime: Date.now() - apiStartTime,
        timestamp: new Date().toISOString()
      });
    }
    
    // 🧠 AIリフレクション面接システム - 受検生発言を受けた動的深掘り
    const studentAnswerCount = requestStudentAnswerCount !== undefined ? requestStudentAnswerCount : 
                              conversationHistory.filter(h => h.role === 'student').length;
    let question: string;
    const lastStudentResponse = userMessage || '';
    
    console.log(`🧠 AIリフレクション面接: stage=${stage}, depth=${depth}, 回答数=${studentAnswerCount}`);
    
    // 🚀 高速AI動的質問生成システム（Enhanced Deep Dive Engine統合）
    if (conversationHistory.length >= 1 && userMessage) {
      const lastQuestion = conversationHistory[conversationHistory.length - 1]?.content || '';
      
      console.log('🧠 高速受検生発言リフレクション開始...');
      console.log(`前質問: "${lastQuestion}"`);
      console.log(`受検生回答: "${userMessage}"`);
      
      // 🧠 AI主導の動的質問生成（メインはAIチャット）
      console.log('🎯 **「メインはAIチャット」** - AI動的質問生成を強制実行');
      console.log('⚠️ 固定パターン禁止 - AI生成必須');
      
      // 必ずAI生成を優先（パターン回避）
      let reflectionResult = await generateReflectiveQuestion(
        lastQuestion,
        userMessage,
        conversationHistory,
        stage,
        depth
      );
      
      console.log(`🎯 AI生成質問: "${reflectionResult.question}"`);
      
      // 🚨 厳格な質問重複チェックと再生成システム
      const isDuplicateQuestion = conversationHistory.some(h => {
        if (h.role === 'interviewer') {
          const existingQ = h.content.replace(/。$/, '').trim();
          const newQ = reflectionResult.question?.replace(/。$/, '').trim() || '';
          // より厳密な重複判定：20文字以上または80%以上一致
          return existingQ === newQ || 
                 (existingQ.length > 20 && newQ.includes(existingQ.substring(0, 20))) ||
                 (newQ.length > 20 && existingQ.includes(newQ.substring(0, 20)));
        }
        return false;
      });
      
      if (!reflectionResult.question || reflectionResult.question.length < 10 || isDuplicateQuestion) {
        console.log('🚨 **緊急事態** - AI生成失敗または重複質問検出');
        console.log('🚨 **これは「メインはAIチャット」原則の重大な違反です**');
        if (isDuplicateQuestion) {
          console.log(`🚨 重複質問検出: "${reflectionResult.question}"`);
        }
        if (!reflectionResult.question) {
          console.log('🚨 AI質問が空です - Gemini API呼び出し失敗');
        }
        if (reflectionResult.question && reflectionResult.question.length < 10) {
          console.log(`🚨 AI質問が短すぎます: "${reflectionResult.question}" (${reflectionResult.question.length}文字)`);
        }
        
        for (let retry = 0; retry < 3; retry++) {
          console.log(`🔄 AI生成再試行 ${retry + 1}/3`);
          
          const retryPromptSuffix = isDuplicateQuestion ? 
            `\n\n🚨重要: 以下の質問は既に使用済みなので絶対に使わないでください:\n${conversationHistory.filter(h => h.role === 'interviewer').map(h => `"${h.content}"`).join('\n')}` :
            '';
          
          const retryResult = await generateReflectiveQuestion(
            lastQuestion,
            userMessage + `（${retry + 1}回目の再生成、重複回避）` + retryPromptSuffix,
            conversationHistory,
            stage,
            depth + retry
          );
          
          const isRetryDuplicate = conversationHistory.some(h => 
            h.role === 'interviewer' && h.content.includes(retryResult.question?.substring(0, 20) || '')
          );
          
          if (retryResult.question && retryResult.question.length >= 10 && !isRetryDuplicate) {
            reflectionResult = retryResult;
            reflectionResult.followUpType = 'ai_retry_success';
            console.log(`✅ AI再生成成功 (${retry + 1}回目): "${retryResult.question}"`);
            break;
          }
        }
        
        // AI再試行が全て失敗した場合の緊急措置
        if (!reflectionResult.question || reflectionResult.question.length < 10) {
          console.log('🚨 AI全失敗、受検生回答ベースの緊急質問生成');
          
          // 🚨 最優先：混乱・困惑状態の検出と対応
          if (userMessage.includes('何言ってる') || userMessage.includes('なに言って') || 
              userMessage.includes('500人') || userMessage.includes('？？') ||
              userMessage.includes('わからない') || userMessage.includes('意味')) {
            console.log('🚨 フォールバック段階での混乱検出');
            return NextResponse.json({
              question: 'すみません、質問を変えますね。あなたの好きな教科や習い事があれば教えてください。',
              stageTransition: { from: stage, to: 'opening', depth: 1 },
              depth: 1,
              resetSession: true,
              fallbackConfusionHandling: true,
              responseTime: Date.now() - apiStartTime,
              timestamp: new Date().toISOString()
            });
          }
          
          // 🚨 受検生の困惑・混乱への緊急対応
          if (userMessage.includes('何度') || userMessage.includes('？？') || userMessage.includes('たすけて') || userMessage.includes('わからない')) {
            reflectionResult.question = 'すみません、質問を変えますね。あなたの好きな勉強や活動について教えてください。';
          } else if (userMessage.includes('来ました') || userMessage.includes('来た')) {
            reflectionResult.question = 'そうですね。どちらの方面から来られたんですか？';
          } else if (userMessage.includes('番') && (userMessage.includes('です') || userMessage.includes('だ'))) {
            reflectionResult.question = 'ありがとうございます。今日はどうやって来られましたか？';
          } else if (userMessage.includes('分') || userMessage.includes('時間')) {
            reflectionResult.question = 'それでは、あなたが一番好きな活動について、1分ほどで教えてください。';
          } else {
            // 受検生の回答内容を理解した質問生成
            const responseKeywords = userMessage.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g) || [];
            if (responseKeywords.length > 0) {
              reflectionResult.question = `${responseKeywords[0]}について、もう少し詳しく聞かせてください。`;
            } else {
              reflectionResult.question = 'どんなことでも構いません。あなたの好きなことを教えてください。';
            }
          }
          
          reflectionResult.followUpType = 'emergency_context_based';
          console.log(`🚨 緊急生成質問: "${reflectionResult.question}"`);
        }
      }
      
      // 段階移行の判定（パフォーマンスブースト対応）
      let nextStage = stage;
      const shouldTransition = performanceBooster.shouldForceStageTransition(stage, studentAnswerCount);
      
      console.log(`🔄 段階移行チェック: stage=${stage}, answerCount=${studentAnswerCount}, shouldTransition=${shouldTransition}`);
      
      if (shouldTransition) {
        if (stage === 'opening') {
          nextStage = 'exploration';
          console.log('🔄 段階移行: opening → exploration (高速化)');
        } else if (stage === 'exploration') {
          nextStage = 'metacognition';
          console.log('🔄 段階移行: exploration → metacognition (高速化)');
        } else if (stage === 'metacognition') {
          nextStage = 'future';
          console.log('🔄 段階移行: metacognition → future (高速化)');
        }
      } else if (stage === 'opening' && studentAnswerCount >= 2) {
        nextStage = 'exploration';
        console.log('🔄 段階移行: opening → exploration (通常)');
      } else if (stage === 'exploration' && studentAnswerCount >= 4) {
        nextStage = 'metacognition';
        console.log('🔄 段階移行: exploration → metacognition (通常)');
      } else if (stage === 'metacognition' && studentAnswerCount >= 6) {
        nextStage = 'future';
        console.log('🔄 段階移行: metacognition → future (通常)');
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
      
      // 学習データ更新（バックグラウンド）
      if (userMessage && reflectionResult.question) {
        cacheWarmer.updateLearningData(stage, userMessage, reflectionResult.question);
      }
      
      // 通常のリフレクション質問返答
      const response = NextResponse.json({
        question: reflectionResult.question,
        stageTransition,
        depth: stageTransition ? depth + 1 : depth + 1,
        reflectionType: reflectionResult.followUpType,
        reflectionBased: true,
        enhancedEngine: false,
        responseTime: Date.now() - apiStartTime,
        timestamp: new Date().toISOString()
      });
      
      console.log(`⚡ 総処理時間: ${Date.now() - apiStartTime}ms`);
      return response;
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
      responseTime: Date.now() - apiStartTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AIリフレクション面接API エラー:', error);
    console.error('エラースタック:', (error as any).stack);
    
    // 🛡️ エラーリカバリーシステムによる高度なエラー処理
    const recoveryResult = await errorRecoverySystem.handleError(
      error as Error,
      {
        component: 'interview_api',
        action: 'generate_question',
        userInput: userMessage,
        stage: stage,
        depth: depth,
        timestamp: apiStartTime,
        sessionId: 'current_session'
      },
      async () => {
        // フォールバック戦略として基本質問を生成
        const fallbackStage = stage || 'opening';
        const fallbackDepth = depth || 1;
        
        return NextResponse.json({
          question: generateFallbackQuestion(fallbackStage, fallbackDepth),
          stageTransition: null,
          depth: fallbackDepth,
          emergency: true,
          errorRecovered: true,
          responseTime: Date.now() - apiStartTime,
          timestamp: new Date().toISOString()
        });
      }
    );
    
    if (recoveryResult) {
      return recoveryResult;
    }
    
    // 最終フォールバック
    return NextResponse.json({
      question: '申し訳ありませんが、一時的に問題が発生しています。「受検番号と名前を教えてください」からもう一度始めましょう。',
      stageTransition: null,
      depth: 1,
      emergency: true,
      finalFallback: true,
      error: 'System temporarily unavailable',
      responseTime: Date.now() - apiStartTime,
      timestamp: new Date().toISOString()
    });
  }
}