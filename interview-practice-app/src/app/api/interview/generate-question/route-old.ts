import { NextRequest, NextResponse } from 'next/server';
import { multiAI } from '@/lib/ai/adapter';
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
  let conversationHistory: ConversationHistory[] = [];
  let depth = 1;
  
  try {
    const { 
      essayContent, 
      conversationHistory: requestConversationHistory, 
      questionType: requestQuestionType,
      currentStage,
      interviewDepth 
    } = await request.json();
    
    conversationHistory = requestConversationHistory || [];
    const questionType = requestQuestionType || 'follow_up';
    const stage: InterviewStage = currentStage || 'opening';
    depth = interviewDepth || 1;

    // 入力検証
    if (!essayContent) {
      return NextResponse.json(
        { error: '志願理由書の内容が必要です' },
        { status: 400 }
      );
    }

    // 段階的深掘りエンジンを初期化
    const deepDiveEngine = new DeepDiveEngine();
    const patternType = deepDiveEngine.selectInterviewPattern(essayContent.inquiryLearning);
    
    console.log(`🎯 APIで選択されたパターン: ${patternType}`);
    console.log(`📊 現在の段階: ${stage}, 深度: ${depth}`);
    console.log(`📝 会話履歴数: ${conversationHistory ? conversationHistory.length : 0}`);
    console.log(`🔍 探究活動内容: ${essayContent.inquiryLearning.substring(0, 100)}...`);
    
    const questionChain = deepDiveEngine.generateQuestionChain(
      patternType,
      stage,
      (conversationHistory || []).map((h: ConversationHistory) => h.content),
      depth
    );

    // 🚀 最優先1: 学生回答の完了性チェック
    if (conversationHistory && conversationHistory.length > 0) {
      const latestStudentResponse = conversationHistory[conversationHistory.length - 1]?.content || '';
      const isResponseIncomplete = /その度に$|という風に$|ということで$|なので$|そして$|また$|さらに$/.test(latestStudentResponse.trim());
      
      if (isResponseIncomplete) {
        console.log('🎯 最優先: 学生回答が途中で終了 - 継続質問を生成');
        
        const continuationPrompt = `学生が話の途中で止まっています：「${latestStudentResponse}」
        
この続きを自然に促す質問を生成してください。例：
- 「その度にどのようなことをされましたか？」
- 「それはどういうことでしょうか？」
- 「もう少し詳しく教えてください」`;
        
        try {
          const aiResponse = await multiAI.generateWithTripleAI(continuationPrompt, 
            'あなたは明和高校附属中学校の面接官です。学生の回答の続きを自然に促してください。', 
            { operation: 'continuation_prompt', priority: 'quality_first' }
          );
          
          return NextResponse.json({
            question: aiResponse.content.trim(),
            stageTransition: null,
            depth: depth,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('継続質問生成エラー:', (error as any).message);
        }
      }
    }

    // 🚀 最優先1.5: ふざけた回答への冷静な対処
    if (conversationHistory && conversationHistory.length >= 2) {
      const lastQuestion = conversationHistory[conversationHistory.length - 2]?.content || '';
      const lastAnswer = conversationHistory[conversationHistory.length - 1]?.content || '';
      
      // ふざけた回答の検出
      const isJokingAnswer = checkJokingAnswer(lastQuestion, lastAnswer);
      
      if (isJokingAnswer) {
        console.log('🎭 ふざけた回答を検出 - 冷静なツッコミ質問を生成');
        console.log(`質問: "${lastQuestion.substring(0, 50)}..."`);
        console.log(`回答: "${lastAnswer.substring(0, 50)}..."`);
        
        const seriousReminderPrompt = `面接官の質問: 「${lastQuestion}」
学生の回答: 「${lastAnswer}」

学生がふざけた回答をしています。面接官として冷静に真剣な回答を促す「質問」を1つ生成してください。

重要: 必ず「？」で終わる質問文を生成してください。お礼や挨拶ではなく、質問を生成してください。

例: 「それは本当でしょうか？面接の場ですので、実際のところを教えてください。」`;
        
        try {
          // 4秒タイムアウトを設定（超高速化）
          const aiResponse = await Promise.race([
            multiAI.generateWithTripleAI(seriousReminderPrompt, 
              'あなたは明和高校附属中学校の面接官です。学生がふざけた回答をした時、冷静で毅然とした態度で真剣な回答を求めてください。', 
              { operation: 'serious_reminder', priority: 'speed_first', maxTokens: 100 }
            ),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timeout')), 4000))
          ]);
          
          const generatedQuestion = (aiResponse as any).content.trim();
          console.log(`🎭 ふざけ検出AI生成質問: "${generatedQuestion}"`);
          
          // AI生成質問の品質チェック（質問形式を厳格にチェック）
          const isInappropriateResponse = (
            generatedQuestion.length < 5 ||
            generatedQuestion.trim() === '' ||
            !generatedQuestion.includes('？') || // 質問符が必須
            /^(はい|そうですね|なるほど|うん|ええ)[。、]*$/.test(generatedQuestion) ||
            // お礼や挨拶は質問ではない
            generatedQuestion.includes('ありがとうございます') ||
            generatedQuestion.includes('ありがとう') ||
            generatedQuestion.includes('お疲れさまでした') ||
            // 質問らしくない文章パターン
            /^ご質問/.test(generatedQuestion) ||
            /です。$/.test(generatedQuestion.replace(/[。、！？\s]*$/, '')) ||
            /ました。$/.test(generatedQuestion.replace(/[。、！？\s]*$/, ''))
          );
          
          if (isInappropriateResponse) {
            console.log('⚠️ ふざけ検出AI生成質問が不適切 - フォールバック使用');
            throw new Error('AI生成質問が不適切');
          }
          
          return NextResponse.json({
            question: generatedQuestion,
            stageTransition: null,
            depth: depth,
            seriousReminder: true,
            questionQuality: calculateQuestionQuality(generatedQuestion, 'serious'),
            debugInfo: {
              jokeDetected: true,
              aiGenerated: true,
              fallbackUsed: false,
              generationTimeMs: Date.now() % 10000 // 簡易的な生成時間
            },
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('冷静なツッコミ質問生成エラー:', error);
          // バリエーション豊富なフォールバック（最高品質版）
          const fallbackVariations = [
            'それは間違いありませんか？もう一度、真剣にお答えいただけますか？',
            'なるほど。でも面接の場ですので、実際のところを教えていただけますか？',
            'そうですか。でも今日は大切な面接ですから、本当のことをお聞かせください。',
            `${lastAnswer.split('。')[0]}ですか。面接では正直にお答えいただきたいのですが、改めていかがでしょうか？`,
            'それは本当でしょうか？実際の経験を教えてください。',
            `「${lastAnswer.length > 20 ? lastAnswer.substring(0, 18) + '...' : lastAnswer}」について、もう少し具体的に教えていただけますか？`,
            '面接ではできるだけ本当のことをお聞かせください。改めていかがでしょうか？'
          ];
          const selectedFallback = fallbackVariations[Math.floor(Math.random() * fallbackVariations.length)];
          
          return NextResponse.json({
            question: selectedFallback,
            stageTransition: null,
            depth: depth,
            seriousReminder: true,
            questionQuality: calculateQuestionQuality(selectedFallback, 'serious'),
            debugInfo: {
              jokeDetected: true,
              aiGenerated: false,
              fallbackUsed: true,
              fallbackIndex: fallbackVariations.indexOf(selectedFallback),
              originalError: (error as any).message
            },
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // 質問の意図と回答の整合性チェック（強化版）
      const isMisaligned = checkAnswerAlignment(lastQuestion, lastAnswer);
      
      console.log(`🔍 齟齬チェック結果: ${isMisaligned ? '検出' : 'なし'}`);
      console.log(`🔍 質問: "${lastQuestion.substring(0, 50)}..."`);
      console.log(`🔍 回答: "${lastAnswer.substring(0, 50)}..."`);
      
      if (isMisaligned) {
        console.log('🎯 かみ合わない回答を検出 - ツッコミ質問を生成');
        console.log(`質問: "${lastQuestion.substring(0, 50)}..."`);
        console.log(`回答: "${lastAnswer.substring(0, 50)}..."`);
        console.log('🔍 検出理由:', getMisalignmentReason(lastQuestion, lastAnswer));
        
        const clarificationPrompt = `面接官の質問: 「${lastQuestion}」
学生の回答: 「${lastAnswer}」

学生の回答が質問とずれています。面接官として優しく軌道修正する「質問」を1つ生成してください。

重要: 
1. 必ず「？」で終わる質問文を生成
2. 学生の回答を一旦受け止めてから、本来の質問に戻す
3. 自然な語りかけで、固くなりすぎない

例: 「${lastAnswer.length > 20 ? lastAnswer.substring(0, 20) + '...' : lastAnswer}ですね。ただ、今お聞きしたかったのは${lastQuestion.includes('困った') ? '困ったことについて' : lastQuestion.includes('工夫') ? '工夫について' : 'その点について'}なのですが、いかがでしょうか？」`;
        
        try {
          // 5秒タイムアウトを設定（超高速化）
          const aiResponse = await Promise.race([
            multiAI.generateWithTripleAI(clarificationPrompt, 
              'あなたは明和高校附属中学校の面接官です。学生の回答が質問とかみ合わない時、優しく軌道修正してください。', 
              { operation: 'clarification_question', priority: 'speed_first', maxTokens: 80 }
            ),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timeout')), 5000))
          ]);
          
          const generatedQuestion = (aiResponse as any).content.trim();
          console.log(`🔍 齟齬検出AI生成質問: "${generatedQuestion}"`);
          
          // AI生成質問の品質チェック（質問形式を厳格にチェック）
          const isInappropriateResponse = (
            generatedQuestion.length < 5 ||
            generatedQuestion.trim() === '' ||
            !generatedQuestion.includes('？') || // 質問符が必須
            /^(はい|そうですね|なるほど|うん|ええ)[。、]*$/.test(generatedQuestion) ||
            // お礼や挨拶は質問ではない
            generatedQuestion.includes('ありがとうございます') ||
            generatedQuestion.includes('ありがとう') ||
            generatedQuestion.includes('お疲れさまでした') ||
            // 質問らしくない文章パターン
            /^ご質問/.test(generatedQuestion) ||
            /です。$/.test(generatedQuestion.replace(/[。、！？\s]*$/, '')) ||
            /ました。$/.test(generatedQuestion.replace(/[。、！？\s]*$/, ''))
          );
          
          if (isInappropriateResponse) {
            console.log('⚠️ 齟齬検出AI生成質問が不適切 - フォールバック使用');
            throw new Error('AI生成質問が不適切');
          }
          
          return NextResponse.json({
            question: generatedQuestion,
            stageTransition: null,
            depth: depth,
            clarification: true,
            questionQuality: calculateQuestionQuality(generatedQuestion, 'clarification'),
            debugInfo: {
              misalignmentReason: getMisalignmentReason(lastQuestion, lastAnswer),
              aiGenerated: true,
              fallbackUsed: false
            },
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('🚨 ツッコミ質問生成エラー:', error);
          console.log('📝 フォールバック質問生成開始');
          // 高速＆高品質フォールバック（優先度順）
          let selectedFallback: string;
          
          // 最高優先度：具体的内容に応じた自然な対応
          if (lastAnswer.includes('映画') && lastQuestion.includes('測定')) {
            selectedFallback = '映画も楽しいですね。でも今はpH値の測定方法についてお聞きしたいのですが、いかがでしょうか？';
          } else if (lastAnswer.includes('映画') && lastQuestion.includes('工夫')) {
            selectedFallback = '映画も楽しいですね。でも今は工夫についてお聞きしたいのですが、いかがでしょうか？';
          } else if (lastAnswer.includes('友達') && !lastQuestion.includes('友達')) {
            selectedFallback = 'お友達との時間も大切ですね。でも先ほどの質問についてお答えいただけますか？';
          } else {
            // 汎用フォールバック
            const fallbackQuestions = [
              'すみません、それはどういうことでしょうか？もう少し詳しく説明していただけますか？',
              `なるほど。でも今は${lastQuestion.includes('困った') ? '困ったことについて' : lastQuestion.includes('工夫') ? '工夫について' : lastQuestion.includes('測定') ? '測定方法について' : lastQuestion.includes('pH値') ? 'pH値について' : 'その点について'}お聞きしたいのですが、いかがでしょうか？`,
              'それも興味深いお話ですが、先ほどの質問について教えていただけますか？'
            ];
            selectedFallback = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
          }
          
          return NextResponse.json({
            question: selectedFallback,
            stageTransition: null,
            depth: depth,
            clarification: true,
            questionQuality: calculateQuestionQuality(selectedFallback, 'clarification'),
            debugInfo: {
              misalignmentReason: getMisalignmentReason(lastQuestion, lastAnswer),
              aiGenerated: false,
              fallbackUsed: true,
              fallbackIndex: 0
            },
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // 志願理由書質問の使用判定（齟齬チェック用 + 時間余った場合のみ）
    const motivationQuestionUsage = shouldUseMotivationQuestions(
      stage, 
      depth, 
      conversationHistory?.length || 0,
      0 // TODO: 実際の残り時間を計算
    );
    
    console.log(`📋 志願理由書質問使用判定: ${motivationQuestionUsage}`);
    if (motivationQuestionUsage === 'avoid') {
      console.log('🎯 探究活動メイン15分構造 - 志願理由書質問は回避し探究活動に集中');
    } else if (motivationQuestionUsage === 'consistency_check') {
      console.log('🔍 探究活動深掘り完了 - 必要に応じて齟齬チェック用質問');
    } else {
      console.log('⏰ 時間が余った場合の志願理由書補完質問');
    }

    // 🚀 最優先3: exploration段階の7層強制チェック + 連続性強化
    console.log('🔥🔥🔥 CRITICAL DEBUG: exploration段階チェック開始');
    console.log(`🔥 stage: ${stage}, conversationHistory.length: ${conversationHistory?.length}`);
    if (stage === 'exploration' && conversationHistory && conversationHistory.length > 0) {
      console.log('🔥🔥🔥 CRITICAL: exploration段階条件に合致 - 処理開始');
      // 会話履歴を質問・回答ペアに変換
      const conversationPairs = [];
      for (let i = 0; i < conversationHistory.length - 1; i += 2) {
        if (conversationHistory[i] && conversationHistory[i + 1]) {
          conversationPairs.push({
            question: conversationHistory[i].content,
            response: conversationHistory[i + 1].content
          });
        }
      }

      console.log(`🔍 最優先EXPLORATION段階チェック: 現在${conversationPairs.length}層, 探究活動深掘り継続（9層まで）`);
      console.log(`📋 会話ペア詳細:`, conversationPairs.map((pair, index) => `${index + 1}. Q:${pair.question.substring(0, 50)}... A:${pair.response.substring(0, 50)}...`));
      
      console.log('🔥🔥🔥 CRITICAL: conversationPairs計算完了');
      console.log(`🔥 conversationPairs.length: ${conversationPairs.length}`);
      console.log(`🔥 条件チェック: conversationPairs.length < 9 = ${conversationPairs.length < 9}`);
      
      if (conversationPairs.length < 9) {
        console.log('🔥🔥🔥 CRITICAL: 深掘り継続条件に合致 - 強制質問生成実行');
        console.log(`❌ 最優先EXPLORATION段階継続: ${conversationPairs.length}層/${conversationPairs.length < 7 ? '7層必要' : '9層まで探究活動深掘り継続'}`);
        
        // 🚀 連続性を考慮した深掘り質問生成
        let forceGeneratedQuestion: string;
        
        try {
          // 連続性強化: 前の質問と回答の流れを分析
          const lastStudentResponse = conversationHistory[conversationHistory.length - 1]?.content || '';
          const continuityKeywords = extractContinuityKeywords(lastStudentResponse);
          
          forceGeneratedQuestion = await generateContinuousDeepDiveQuestion(
            conversationHistory || [],
            essayContent,
            continuityKeywords,
            conversationPairs.length + 1,
            motivationQuestionUsage === 'avoid'
          );
          console.log('✅ 連続性を考慮した深掘り質問生成成功');
          console.log(`🎯 生成された深掘り質問: "${forceGeneratedQuestion}"`);
          
        } catch (error) {
          console.error('❌ 連続性深掘り質問生成エラー:', error);
          
          // フォールバック: 従来の深掘り質問生成
          try {
            forceGeneratedQuestion = await generateInquiryDeepDiveQuestion(
              conversationHistory || [],
              essayContent,
              motivationQuestionUsage === 'avoid'
            );
            console.log('🔄 従来の深掘り質問生成使用');
          } catch (fallbackError) {
            console.error('❌ フォールバック質問生成エラー:', fallbackError);
            const lastResponse = conversationHistory[conversationHistory.length - 1]?.content || '';
            const keywords = lastResponse.match(/\b\w+/g)?.slice(-3) || ['活動'];
            forceGeneratedQuestion = `その「${keywords.join(' ')}」について、もう少し詳しく教えてください。`;
            console.log('🔄 最終フォールバック質問使用');
          }
        }
        
        return NextResponse.json({
          question: forceGeneratedQuestion,
          stageTransition: null,
          depth: conversationPairs.length + 1,
          stageInfo: {
            currentStage: 'exploration',
            depth: conversationPairs.length + 1,
            patternType: patternType
          },
          continuityEnhanced: true,
          forceDeepDive: true,
          preparationTime: 0,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('✅ 最優先: Exploration段階9層完了 - 次段階移行可能');
      }
    }

    // 会話履歴から最適な次質問を選択
    let selectedQuestion = null;
    if (questionChain.questions.length > 0) {
      const usedQuestions = conversationHistory ? 
        conversationHistory
          .filter((h: any) => h.role === 'interviewer')
          .map((h: any) => h.content) : [];
      
      const unusedQuestion = questionChain.questions.find((q: any) => 
        !usedQuestions.includes(q.id)
      );
      
      selectedQuestion = unusedQuestion || questionChain.questions[0];
      console.log(`📝 質問選択: ${selectedQuestion.id} (未使用: ${unusedQuestion ? 'はい' : 'いいえ'})`);
    }

    // フォールバック：質問がない場合は段階に応じた適切なフォールバック
    if (!selectedQuestion) {
      console.log(`⚠️ 選択された質問がありません - stage: ${stage}, depth: ${depth}`);
      
      // 段階に応じたフォールバック質問を生成
      let fallbackQuestion = '';
      
      // 探究活動が詳しく説明された場合は必ず深掘り（強制実行）
      const lastStudentResponse = conversationHistory
        ?.filter((h: any) => h.role === 'student')
        .slice(-1)[0]?.content || '';
      
      // 探究活動の詳細説明を検出した場合、強制的に深掘り質問を生成
      if (lastStudentResponse.length > 50 && 
          (lastStudentResponse.includes('環境委員会') || 
           lastStudentResponse.includes('メダカ') || 
           lastStudentResponse.includes('水質') || 
           lastStudentResponse.includes('pH') ||
           lastStudentResponse.includes('植物') ||
           lastStudentResponse.includes('観察') ||
           lastStudentResponse.includes('小学') ||
           lastStudentResponse.includes('記録'))) {
        
        console.log('🎯 探究活動詳細説明検出 - 強制深掘り質問生成');
        
        // 抽出されたキーワードに基づいて具体的な深掘り質問を生成
        if (lastStudentResponse.includes('メダカ') && lastStudentResponse.includes('pH')) {
          fallbackQuestion = '環境委員会で小学4年生からメダカの水質管理をされているんですね。pH値を調べる中で、一番困ったことや大変だったことはありませんでしたか？';
        } else if (lastStudentResponse.includes('植物') && lastStudentResponse.includes('観察')) {
          fallbackQuestion = '植物の育成過程を観察記録されているんですね。その観察の中で、予想と違った結果が出たことはありませんでしたか？';
        } else if (lastStudentResponse.includes('環境委員会')) {
          fallbackQuestion = '環境委員会での活動、素晴らしいですね。その活動を続ける中で、一番印象に残った発見や気づきはありましたか？';
        } else {
          fallbackQuestion = 'その探究活動の中で、一番困ったことや大変だったことはありませんでしたか？';
        }
        
        // 必ずexploration段階を継続
        return NextResponse.json({
          question: fallbackQuestion,
          forceDeepDive: true,
          stageInfo: { 
            currentStage: 'exploration', // 強制的にexploration段階を継続
            depth: Math.max(depth, 2), 
            patternType: patternType 
          },
          timestamp: new Date().toISOString()
        });
      }

      fallbackQuestion = 'もう少し詳しく教えていただけますか？';

      return NextResponse.json({
        question: fallbackQuestion,
        fallbackGenerated: true,
        stageInfo: { currentStage: stage, depth: depth, patternType: patternType },
        timestamp: new Date().toISOString()
      });
    }

    // AI質問生成
    let generatedQuestion: string;
    
    if (selectedQuestion?.guidanceForAI) {
      try {
        generatedQuestion = await generateQuestionFromGuidance(
          selectedQuestion.guidanceForAI,
          conversationHistory || [],
          essayContent
        );
      } catch (error) {
        console.error('AI質問生成エラー:', error);
        generatedQuestion = buildFallbackQuestion(selectedQuestion, conversationHistory || []);
      }
    } else {
      generatedQuestion = buildFallbackQuestion(selectedQuestion, conversationHistory || []);
    }

    // 段階的深掘りエンジンによる質問を返す
    return NextResponse.json({
      question: generatedQuestion,
      stageInfo: {
        currentStage: stage,
        depth: depth,
        patternType: patternType
      },
      preparationTime: selectedQuestion?.preparationTime || 0,
      questionMeta: {
        intent: selectedQuestion?.intent,
        evaluationFocus: selectedQuestion?.evaluationFocus,
        expectedDepth: selectedQuestion?.expectedDepth,
        guidance: selectedQuestion?.guidanceForAI
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('質問生成エラー:', error);
    
    // Gemini APIエラーでも面接を継続させる緊急フォールバック
    console.error('🚨 CRITICAL: Gemini API完全失敗 - 緊急フォールバック実行');
    
    // 最小限の高品質フォールバック質問を生成
    let emergencyQuestion = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const lastResponse = conversationHistory[conversationHistory.length - 1]?.content || '';
      if (lastResponse.includes('メダカ') || lastResponse.includes('環境委員会')) {
        emergencyQuestion = 'その活動を続ける中で、一番印象に残った体験は何でしたか？';
      } else if (lastResponse.includes('友達') || lastResponse.includes('一緒')) {
        emergencyQuestion = '友達と協力する中で、どのような発見がありましたか？';
      } else {
        emergencyQuestion = 'その体験から、どのようなことを学びましたか？';
      }
    } else {
      emergencyQuestion = 'それでは、あなたが取り組んでいる活動について教えてください。';
    }
    
    return NextResponse.json({
      question: emergencyQuestion,
      stageTransition: null,
      depth: depth,
      emergencyFallback: true,
      debugInfo: {
        apiError: true,
        errorMessage: (error as any).message,
        fallbackReason: 'Gemini API完全失敗による緊急フォールバック'
      },
      timestamp: new Date().toISOString()
    });
  }
}

// 質問と回答の整合性チェック関数
function checkAnswerAlignment(question: string, answer: string): boolean {
  // 質問のタイプを判定
  const questionTypes = {
    // 時間を聞いている質問
    time: /どれくらい|何分|何時間|時間|かかりましたか/.test(question),
    // 方法を聞いている質問
    method: /どのように|どうやって|どんな方法|どういう風に|どのような方法|方法で/.test(question),
    // 理由を聞いている質問
    reason: /なぜ|どうして|理由|きっかけ/.test(question),
    // 困難を聞いている質問
    difficulty: /困った|大変|難しかった|うまくいかな|失敗/.test(question),
    // 具体例を聞いている質問
    example: /例えば|具体的に|どんな|何か/.test(question),
    // 人物を聞いている質問
    person: /誰|先生|友達|仲間|一緒/.test(question),
    // 数量を聞いている質問
    quantity: /何人|何回|何個|いくつ/.test(question),
    // 感想・感情を聞いている質問
    feeling: /どう思|どう感じ|気持ち|印象/.test(question),
    // 工夫・取り組みを聞いている質問
    effort: /工夫|取り組み|努力|頑張って|心がけ|注意/.test(question),
    // 測定・実験について聞いている質問
    measurement: /測定|計測|調べ|記録|データ|実験/.test(question)
  };

  // 回答の内容チェック
  const answerChecks = {
    // 時間の回答があるか
    hasTime: /\d+分|\d+時間|分|時間|かかり/.test(answer),
    // 方法の説明があるか（具体的な行動や手順を含む）
    hasMethod: /使って|して|すると|ように|やり方|手順|試験紙|道具|器具|測定して|測定する|測定した/.test(answer),
    // 理由の説明があるか
    hasReason: /から|ため|ので|理由|きっかけ/.test(answer),
    // 困難の説明があるか（より包括的に）
    hasDifficulty: /困った|大変|難しかった|うまくいかな|失敗|問題|課題|苦労|死んで|だめ|悪く/.test(answer),
    // 具体例があるか
    hasExample: /例えば|具体的に|ような|など/.test(answer),
    // 人物の言及があるか
    hasPerson: /先生|友達|仲間|みんな|一緒|母|父/.test(answer),
    // 数量の言及があるか
    hasQuantity: /\d+人|\d+回|\d+個/.test(answer),
    // 感想・感情の表現があるか
    hasFeeling: /思った|感じた|嬉しかった|楽しかった|悲しかった|可愛い|癒される/.test(answer),
    // 工夫・取り組みの説明があるか
    hasEffort: /工夫|取り組み|努力|頑張って|心がけ|注意|気をつけ|改善|試み|対策/.test(answer),
    // 測定・実験の具体的な説明があるか
    hasMeasurement: /測定|計測|調べ|記録|データ|実験|pH|数値|値/.test(answer)
  };

  // 質問に対して不適切な回答パターン
  const misalignedPatterns = [
    // 時間を聞かれているのに時間の情報がない
    (questionTypes.time && !answerChecks.hasTime && answer.length > 15),
    // 方法を聞かれているのに方法の説明がない（感想・意見だけの場合）
    (questionTypes.method && !answerChecks.hasMethod && answer.length > 15 &&
     (answer.includes('重要') || answer.includes('大切') || answer.includes('思います') || answer.includes('と思う'))),
    // 理由を聞かれているのに理由の説明がない
    (questionTypes.reason && !answerChecks.hasReason && answer.length > 15),
    // 困難を聞かれているのに困難の説明がない（楽しい・嬉しい話だけの場合）
    (questionTypes.difficulty && !answerChecks.hasDifficulty &&
     (answer.includes('楽しかった') || answer.includes('嬉しかった') || answer.includes('面白かった'))),
    // 人物を聞かれているのに人物の言及がない
    (questionTypes.person && !answerChecks.hasPerson && answer.length > 10),
    // 数量を聞かれているのに数量の言及がない
    (questionTypes.quantity && !answerChecks.hasQuantity && answer.length > 10),
    // 質問と全く関係ない内容（志望理由などを突然話し始める）
    (answer.includes('明和') && !question.includes('明和') && !question.includes('志望')),
    // 技術的質問に対して全く関係ない日常の話
    (question.includes('測定') && answer.includes('映画')),
    (question.includes('pH値') && (answer.includes('映画') || answer.includes('テレビ') || answer.includes('ゲーム'))),
    (question.includes('方法') && (answer.includes('映画') || answer.includes('友達と遊') || answer.includes('買い物'))),
    // 「はい」「いいえ」だけの短すぎる回答（詳細を求められている場合）
    ((answer === 'はい' || answer === 'いいえ' || answer.length < 10) && 
     (question.includes('詳しく') || question.includes('説明') || question.includes('教えて'))),
    // 工夫を聞かれているのに感想だけで具体的な工夫の説明がない
    (questionTypes.effort && !answerChecks.hasEffort && answerChecks.hasFeeling && 
     !answerChecks.hasMethod && answer.length > 15),
    // 測定・実験について聞かれているのに感想だけで具体的な説明がない  
    (questionTypes.measurement && !answerChecks.hasMeasurement && answerChecks.hasFeeling && 
     !answerChecks.hasMethod && answer.length > 15)
  ];

  // いずれかのパターンに該当すればtrue（かみ合っていない）
  return misalignedPatterns.some(pattern => pattern);
}

// デバッグ用：齟齬の理由を特定
function getMisalignmentReason(question: string, answer: string): string {
  const questionTypes = {
    time: /どれくらい|何分|何時間|時間|かかりましたか/.test(question),
    method: /どのように|どうやって|どんな方法|どういう風に|どのような方法|方法で/.test(question),
    reason: /なぜ|どうして|理由|きっかけ/.test(question),
    difficulty: /困った|大変|難しかった|うまくいかな|失敗/.test(question),
    effort: /工夫|取り組み|努力|頑張って|心がけ|注意/.test(question),
    measurement: /測定|計測|調べ|記録|データ|実験/.test(question)
  };

  const answerChecks = {
    hasTime: /\d+分|\d+時間|分|時間|かかり/.test(answer),
    hasMethod: /使って|して|すると|ように|やり方|手順/.test(answer),
    hasReason: /から|ため|ので|理由|きっかけ/.test(answer),
    hasDifficulty: /困った|大変|難しかった|うまくいかな|失敗/.test(answer),
    hasEffort: /工夫|取り組み|努力|頑張って|心がけ/.test(answer),
    hasMeasurement: /測定|計測|調べ|記録|データ|実験|pH|数値/.test(answer),
    hasFeeling: /思った|感じた|嬉しかった|楽しかった|可愛い|癒される/.test(answer)
  };

  if (questionTypes.effort && !answerChecks.hasEffort && answerChecks.hasFeeling) {
    return '工夫を聞かれているのに感想のみ';
  }
  if (questionTypes.measurement && !answerChecks.hasMeasurement && answerChecks.hasFeeling) {
    return '測定について聞かれているのに感想のみ';
  }
  if (questionTypes.method && !answerChecks.hasMethod) {
    return '方法を聞かれているのに方法の説明なし';
  }
  if (questionTypes.difficulty && !answerChecks.hasDifficulty) {
    return '困難を聞かれているのに困難の説明なし';
  }
  if (answer.includes('映画') && !question.includes('映画')) {
    return '質問と全く関係ない映画の話';
  }
  if (question.includes('測定') && answer.includes('映画')) {
    return '測定について聞かれているのに映画の話';
  }
  if (question.includes('pH値') && (answer.includes('映画') || answer.includes('テレビ') || answer.includes('ゲーム'))) {
    return 'pH値について聞かれているのに娯楽の話';
  }
  if (question.includes('方法') && (answer.includes('映画') || answer.includes('友達と遊') || answer.includes('買い物'))) {
    return '方法について聞かれているのに日常生活の話';
  }
  
  return '質問と回答の内容が一致しない';
}

// 質問品質のリアルタイム計算（最高品質版）
function calculateQuestionQuality(question: string, type: 'normal' | 'clarification' | 'serious'): {
  score: number;
  factors: string[];
  breakdown: {
    basic: number;
    naturalness: number;
    specificity: number;
    typeSpecific: number;
    penalties: number;
  };
} {
  let score = 50; // ベース50点
  const factors: string[] = [];
  const breakdown = { basic: 0, naturalness: 0, specificity: 0, typeSpecific: 0, penalties: 0 };

  // 基本品質チェック
  if (question.includes('？')) {
    score += 10;
    breakdown.basic += 10;
    factors.push('質問符あり');
  } else {
    score -= 20;
    breakdown.penalties -= 20;
    factors.push('質問符なし');
  }

  if (question.length >= 20 && question.length <= 100) {
    score += 10;
    breakdown.basic += 10;
    factors.push('適切な長さ');
  } else if (question.length < 20) {
    score -= 10;
    breakdown.penalties -= 10;
    factors.push('短すぎる');
  } else {
    score -= 5;
    breakdown.penalties -= 5;
    factors.push('長すぎる');
  }

  // 自然さチェック（強化版）
  if (/ですね|でしたね|なるほど|そうですか|そうなんですね/.test(question)) {
    score += 15;
    breakdown.naturalness += 15;
    factors.push('相槌で自然');
  }

  if (/でも|ただ|しかし|それでは|では/.test(question)) {
    score += 10;
    breakdown.naturalness += 10;
    factors.push('転換表現で流暢');
  }

  // 具体性チェック（新機能）
  if (/どのように|どうやって|どんな方法|具体的に|詳しく/.test(question)) {
    score += 12;
    breakdown.specificity += 12;
    factors.push('具体的な疑問詞');
  }

  if (/メダカ|pH|環境委員会|友達|先生|記録|観察|測定/.test(question)) {
    score += 8;
    breakdown.specificity += 8;
    factors.push('キーワード活用');
  }

  // タイプ別チェック（強化版）
  if (type === 'clarification') {
    if (/お聞きしたかった|質問は|について|軌道修正/.test(question)) {
      score += 15;
      breakdown.typeSpecific += 15;
      factors.push('明確な軌道修正');
    }
    if (/申し訳|すみません|それでは/.test(question)) {
      score += 10;
      breakdown.typeSpecific += 10;
      factors.push('丁寧な表現');
    }
  }

  if (type === 'serious') {
    if (/面接|本当|実際|正直/.test(question)) {
      score += 15;
      breakdown.typeSpecific += 15;
      factors.push('毅然とした対応');
    }
    if (/間違いありませんか|本当でしょうか/.test(question)) {
      score += 8;
      breakdown.typeSpecific += 8;
      factors.push('適切な確認表現');
    }
  }

  // 固定表現ペナルティ（強化版）
  if (/それは間違いありませんか？/.test(question)) {
    score -= 5;
    breakdown.penalties -= 5;
    factors.push('固定表現使用');
  }

  if (/もう少し詳しく教えてください/.test(question)) {
    score -= 3;
    breakdown.penalties -= 3;
    factors.push('汎用表現');
  }

  // AI生成品質ボーナス
  const hasPersonalizedElements = /あなた|今お聞きした|先ほどの|その時/.test(question);
  if (hasPersonalizedElements) {
    score += 8;
    breakdown.naturalness += 8;
    factors.push('個人に向けた表現');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    factors,
    breakdown
  };
}

// 🚀 探究活動の深掘り専用質問生成
async function generateInquiryDeepDiveQuestion(
  conversationHistory: ConversationHistory[],
  essayContent: EssayContent,
  avoidMotivationQuestions: boolean = false
): Promise<string> {
  const lastStudentResponse = conversationHistory
    .filter(msg => msg.role === 'student')
    .slice(-1)[0]?.content || '';

  const prompt = `
【明和中学校面接：探究活動深掘り専門質問生成】

**受験生の探究活動説明**：
「${lastStudentResponse}」

**実際の合格者面接の質問技術**：
1. **具体的要素を必ず拾う**：「環境委員会」→「環境委員会では何人で活動していますか？」
2. **プロセス重視**：「pH値」→「pH値はどのように測定していましたか？」
3. **困難への執着**：「一番困ったことや大変だったことはありませんでしたか？」
4. **協力者確認**：「それは誰かと一緒でしたか？」「先生に相談しましたか？」
5. **継続性追求**：「何年生から続けていますか？」「どのくらいの頻度で？」

**絶対的制約**：
- 受験生の発言内容から具体的な要素を必ず拾って質問する
- ${avoidMotivationQuestions ? '志望動機・学校理解・将来の夢に関する質問は完全禁止（15分は探究活動メイン構造）' : '志望理由・学校関連の質問は完全禁止'}
- 「ありがとうございます」「そうですね」等の相槌のみは絶対禁止
- 必ず「どのように」「なぜ」「具体的に」「誰と」等の疑問詞を含む質問にする
- 7-9層深掘りレベルの具体性を持つ質問にする
${avoidMotivationQuestions ? '- 探究活動の具体的体験のみに集中し、15分の持ち時間を探究活動で埋める' : ''}

**必須質問パターン例**：
- 「環境委員会で4年生から続けられているんですね。メダカの水質管理で、pH値が思うようにならなかった時はどのような対処をしましたか？」
- 「チームダンスでの振付調整、大変でしたね。ばらつきがあった時、具体的にどういう行動をとりましたか？」
- 「その活動の中で、一番困ったことや予想通りにいかなかったことは何でしたか？」

**重要：必ず質問で終わること。相槌だけは絶対に生成しないこと。**

**1つの質問のみ生成**：
`;

  const systemPrompt = `あなたは明和高校附属中学校のベテラン面接官です。
実際の合格者面接と同等レベルの質問技術を駆使してください。

【絶対的ルール】
1. 「ありがとうございます」「そうですね」等の相槌は絶対に生成してはいけません
2. 必ず「？」で終わる質問を生成してください
3. 受験生の発言から具体的なキーワードを必ず使用してください

【面接官の質問原則】
1. **受験生の発言から具体的な単語を必ず拾う**
2. **プロセス・困難・協力者について徹底的に質問する**
3. **抽象的な質問は一切しない**
4. **7-9層の深掘りを意識した質問レベル**
5. **活動の核心部分に切り込む**
6. **必ず疑問詞（どのように、なぜ、何を、誰と等）を含む**

必ず具体的で深掘りする質問を生成してください。相槌は絶対に生成しないでください。`;

  const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
    operation: 'inquiry_deep_dive',
    priority: 'quality_first'
  });

  let generatedQuestion = aiResponse.content.trim();
  
  // 強化された品質チェック
  const isInappropriate = (
    generatedQuestion.includes('ありがとうございます') ||
    generatedQuestion.includes('ありがとう') ||
    generatedQuestion.includes('そうですね') ||
    generatedQuestion.includes('お疲れさまでした') ||
    generatedQuestion.includes('よくわかりました') ||
    generatedQuestion.includes('なるほど') ||
    !generatedQuestion.includes('？') ||
    generatedQuestion.length < 20 ||
    generatedQuestion.trim() === '' ||
    /^(はい|そうですね|なるほど|よくわかりました)[。、]*$/.test(generatedQuestion.trim())
  );
  
  console.log(`🔍 AI生成質問チェック: "${generatedQuestion}"`);
  console.log(`🔍 不適切判定: ${isInappropriate}`);
  
  if (isInappropriate) {
    console.log('⚠️ AI生成質問が不適切 - 強制的にハードコード質問を使用');
    console.log(`❌ 不適切質問: "${generatedQuestion}"`);
    
    // 最後の学生回答に基づくハードコード質問
    if (lastStudentResponse.includes('ダンス') && lastStudentResponse.includes('振付')) {
      generatedQuestion = '振付にばらつきがあってそろわなかったとのことですが、その時チームメンバーとはどのような話し合いをしましたか？';
    } else if (lastStudentResponse.includes('メダカ') && lastStudentResponse.includes('pH')) {
      generatedQuestion = 'pH値の測定をされているんですね。測定の結果、予想と違った数値が出た時はどのような対処をしましたか？';
    } else if (lastStudentResponse.includes('環境委員会')) {
      generatedQuestion = '環境委員会での活動、継続されているのは素晴らしいですね。その中で一番困ったことや大変だったことは何でしたか？';
    } else if (lastStudentResponse.includes('観察') || lastStudentResponse.includes('記録')) {
      generatedQuestion = '観察記録を続けられているんですね。記録をつける中で、予想と違った結果が出たことはありませんでしたか？';
    } else {
      generatedQuestion = 'その探究活動を続ける中で、一番印象に残った困難や発見はどのようなものでしたか？';
    }
    
    console.log(`✅ ハードコード質問使用: "${generatedQuestion}"`);
  } else {
    console.log(`✅ AI生成質問は適切: "${generatedQuestion}"`);
  }

  return generatedQuestion;
}

// guidanceForAIを使って実際の質問をAI生成する
async function generateQuestionFromGuidance(
  guidance: {
    topic: string;
    style: 'formal' | 'friendly' | 'encouraging';
    elements: string[];
    context?: string;
  },
  conversationHistory: ConversationHistory[],
  essayContent: EssayContent
): Promise<string> {
  const lastStudentResponse = conversationHistory
    .filter(msg => msg.role === 'student')
    .slice(-1)[0]?.content || '';

  const styleMapping = {
    formal: '丁寧で正式な面接らしい言葉遣い',
    friendly: '親しみやすく、緊張をほぐすような優しい言葉遣い',
    encouraging: '受験生を励まし、自信を持たせるような温かい言葉遣い'
  };

  const prompt = `
【実際の合格者面接を再現する面接官として質問を生成してください】

**受験生の情報**：
- 志望動機：${essayContent.motivation}
- 探究活動：${essayContent.inquiryLearning}

**会話の流れ**：
${conversationHistory.length > 0 ? 
  conversationHistory.map(msg => 
    `${msg.role === 'interviewer' ? '面接官' : '受験生'}: ${msg.content}`
  ).join('\n') : 
  '（まだ会話なし）'
}

**質問生成の指示**：
- **トピック**：${guidance.topic}
- **スタイル**：${styleMapping[guidance.style]}
- **含めるべき要素**：${guidance.elements.join('、')}
- **文脈**：${guidance.context || '特になし'}

**重要な要件**：
1. 前の受験生の回答「${lastStudentResponse}」から具体的な要素を拾って反応する
2. その要素について更なる詳細や具体性を求める質問を続ける
3. 体験の具体性、プロセス、感情を重視した質問をする
4. 5-9層の段階的深掘りを意識した質問レベルにする

**1つの質問のみ**を生成してください：
`;

  const systemPrompt = `あなたは明和高校附属中学校のベテラン面接官です。
実際の合格者面接と同じレベルの質問技術を駆使してください。

【面接官の質問技術】
1. **体験の具体化**: 「具体的にどういう行動をしましたか？」「そのときはどうしましたか？」
2. **プロセスの詳細化**: 「どのようにして調べましたか？」「どんな方法で解決しましたか？」
3. **感情・動機の探究**: 「そのときどう思いましたか？」「なぜそう思ったのですか？」
4. **社会性の確認**: 「誰かと一緒でしたか？」「周りの反応はどうでしたか？」
5. **困難への対処**: 「うまくいかなかったときはどうしましたか？」「困ったことはありませんでしたか？」

5-9層の段階的深掘りレベルの質問を生成してください。`;

  const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
    operation: 'dynamic_question_generation',
    priority: 'quality_first'
  });

  let generatedQuestion = aiResponse.content.trim();
  
  // 強化された品質チェック（Guidance用）
  const isInappropriate = (
    generatedQuestion.includes('ありがとうございます') ||
    generatedQuestion.includes('ありがとう') ||
    generatedQuestion.includes('そうですね') ||
    generatedQuestion.includes('お疲れさまでした') ||
    generatedQuestion.includes('よくわかりました') ||
    generatedQuestion.includes('なるほど') ||
    !generatedQuestion.includes('？') ||
    generatedQuestion.length < 20 ||
    generatedQuestion.trim() === '' ||
    /^(はい|そうですね|なるほど|よくわかりました)[。、]*$/.test(generatedQuestion.trim())
  );
  
  console.log(`🔍 Guidance AI生成質問チェック: "${generatedQuestion}"`);
  console.log(`🔍 Guidance不適切判定: ${isInappropriate}`);
  
  if (isInappropriate) {
    console.log('⚠️ Guidance AI生成質問が不適切 - フォールバック使用');
    console.log(`❌ Guidance不適切質問: "${generatedQuestion}"`);
    
    // 探究活動に特化したフォールバック質問
    if (lastStudentResponse.includes('ダンス') || lastStudentResponse.includes('振付')) {
      generatedQuestion = 'ダンスの練習で、チームメンバーと意見が合わない時はどのように解決しましたか？';
    } else if (lastStudentResponse.includes('メダカ') || lastStudentResponse.includes('水質')) {
      generatedQuestion = 'メダカの飼育で、うまくいかなかった時はどのような工夫をしましたか？';
    } else if (lastStudentResponse.includes('環境委員会') || lastStudentResponse.includes('委員会')) {
      generatedQuestion = '委員会活動で、一番やりがいを感じたのはどのような時でしたか？';
    } else {
      generatedQuestion = 'その活動の中で、予想と違った結果が出た時はどう対処しましたか？';
    }
    
    console.log(`✅ Guidanceフォールバック質問使用: "${generatedQuestion}"`);
  } else {
    console.log(`✅ Guidance AI生成質問は適切: "${generatedQuestion}"`);
  }

  return generatedQuestion;
}

// AI生成が失敗した場合のフォールバック質問生成
function buildFallbackQuestion(
  selectedQuestion: any,
  conversationHistory: ConversationHistory[]
): string {
  const guidance = selectedQuestion?.guidanceForAI;
  const lastStudentResponse = conversationHistory
    .filter(msg => msg.role === 'student')
    .slice(-1)[0]?.content || '';

  // より具体的で自然な相槌を生成
  let prefix = '';
  if (lastStudentResponse) {
    if (lastStudentResponse.includes('時間') || lastStudentResponse.includes('分')) {
      if (lastStudentResponse.includes('1時間半') || lastStudentResponse.includes('90分')) {
        prefix = '1時間半ですか、遠くからお疲れさまでした。';
      } else if (lastStudentResponse.includes('30分')) {
        prefix = '30分ですか、ちょうど良い距離ですね。';
      } else if (lastStudentResponse.includes('10分') || lastStudentResponse.includes('15分')) {
        prefix = 'お近くですね。';
      } else {
        prefix = 'そうですか。';
      }
    } else if (lastStudentResponse.includes('電車')) {
      prefix = '電車でお疲れさまでした。';
    } else if (lastStudentResponse.includes('自転車')) {
      prefix = '自転車でいらしたんですね。';
    } else if (lastStudentResponse.includes('車')) {
      prefix = 'お車でお疲れさまでした。';
    } else if (lastStudentResponse.includes('歩い')) {
      prefix = '歩いていらしたんですね。';
    } else {
      prefix = '';
    }
  }

  // トピックベースの基本質問
  if (guidance?.topic) {
    if (guidance.topic.includes('面接開始')) {
      return 'それでは面接を始めます。受検番号と名前を教えてください。';
    } else if (guidance.topic.includes('交通手段')) {
      return `${prefix} こちらまでは何で来られましたか？`;
    } else if (guidance.topic.includes('所要時間')) {
      return `${prefix} どれくらい時間がかかりましたか？`;
    } else if (guidance.topic.includes('探究活動')) {
      return `${prefix} それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。`;
    }
  }

  // 探究活動の深掘り質問をデフォルトで生成（具体的なキーワードベース）
  if (lastStudentResponse.includes('ダンス') || lastStudentResponse.includes('振付')) {
    return 'ダンスでの取り組み、素晴らしいですね。練習で一番困ったことはどのようなことでしたか？';
  } else if (lastStudentResponse.includes('メダカ') || lastStudentResponse.includes('水質')) {
    return 'メダカの飼育、継続されているのは立派ですね。水質管理で苦労したことはありませんでしたか？';
  } else if (lastStudentResponse.includes('環境委員会') || lastStudentResponse.includes('委員会')) {
    return '委員会活動を続けられているんですね。その中で特に印象に残った出来事はありますか？';
  }
  
  // 最終デフォルト
  return 'その活動について、もう少し詳しく教えていただけますか？';
}

// ふざけた回答の検出関数
function checkJokingAnswer(question: string, answer: string): boolean {
  // 明らかにふざけた回答のパターン
  const jokingPatterns = [
    // アニメ・漫画・ゲーム関連
    /どこでもドア|タイムマシン|ワープ|テレポート|瞬間移動|魔法|忍術|超能力/,
    /ドラえもん|ポケモン|マリオ|ピカチュウ|悟空|ナルト|ルフィ|コナン/,
    /ゲーム|プレステ|スイッチ|DS|ファミコン|スマホゲーム/,
    
    // 娯楽・エンタメ関連（探究活動質問への不適切回答）
    /映画|テレビ|YouTube|TikTok|Netflix|アニメ|漫画|小説|音楽鑑賞|ドラマ/,
    
    // 非現実的な交通手段・方法
    /空を飛んで|飛行機で家から|ロケット|UFO|宇宙船|竜|ドラゴン|ペガサス|ユニコーン/,
    /走って1分|光の速度|音速|時速1000|瞬間移動|ワープして/,
    
    // 食べ物・動物での移動
    /パンに乗って|お寿司で|ラーメンで|カレーライスで|犬に乗って|猫と一緒に|象に乗って/,
    
    // 動物が人間的行動をする
    /メダカがしゃべ|魚がしゃべ|犬がしゃべ|猫がしゃべ|鳥がしゃべ|動物がしゃべ/,
    /メダカが.*言っ|魚が.*言っ|犬が.*言っ|猫が.*言っ|鳥が.*言っ|動物が.*言っ/,
    /メダカが.*教え|魚が.*教え|犬が.*教え|猫が.*教え|鳥が.*教え|動物が.*教え/,
    /メダカが.*手伝|魚が.*手伝|犬が.*手伝|猫が.*手伝|鳥が.*手伝|動物が.*手伝/,
    /メダカが.*宿題|魚が.*宿題|犬が.*宿題|猫が.*宿題|鳥が.*宿題|動物が.*宿題/,
    
    // 明らかな嘘・誇張
    /宇宙から|月から|火星から|異世界から|未来から|過去から|別次元/,
    /1000歳|100歳|500年前|昨日生まれた|宇宙人|ロボット|AI/,
    
    // 日常生活・娯楽活動（探究活動と無関係）
    /寝ること|食べること|買い物|遊ぶこと|友達と遊|散歩|お風呂に入ること|歯磨き/,
    /スマホをいじること|SNS|LINE|Instagram|Twitter|Facebook/,
    
    // おふざけ表現
    /えへへ|あはは|ふふふ|にゃーん|わんわん|もぐもぐ|ぴょんぴょん/,
    /超絶|めっちゃ神|やばたん|草|w+|笑|ｗ+/,
    
    // 交通手段への不適切な回答
    /お母さんのお腹の中|卵から生まれて|拾われて|神様が|天使が|悪魔が/
  ];

  // 質問に対して明らかに不適切で非現実的な回答
  const isObviouslyJoking = jokingPatterns.some(pattern => pattern.test(answer));
  
  // 短すぎる回答で意味をなさない
  const isMeaningless = (
    answer.length < 5 && 
    !/はい|いいえ|分|時間|電車|バス|車|歩|自転車/.test(answer)
  );
  
  // 質問の種類に応じた不適切さチェック
  let contextuallyInappropriate = false;
  
  // 交通手段を聞かれた場合
  if (/何で来|どうやって来|交通手段/.test(question)) {
    contextuallyInappropriate = /どこでもドア|空飛んで|瞬間移動|魔法|宇宙|異世界/.test(answer);
  }
  
  // 時間を聞かれた場合
  if (/時間|どれくらい/.test(question)) {
    contextuallyInappropriate = /0秒|瞬間|光速|音速|1000年|永遠/.test(answer);
  }
  
  // 探究活動を聞かれた場合
  if (/探究|活動|取り組|研究/.test(question)) {
    contextuallyInappropriate = /ゲーム|アニメ|漫画|YouTube|TikTok|スマホ|寝ること|食べること|映画|テレビ|ドラマ/.test(answer);
  }
  
  // 困難・大変なことを聞かれた場合に娯楽系の回答
  if (/困った|大変|難しかった|うまくいかな|失敗/.test(question)) {
    contextuallyInappropriate = /映画|テレビ|ゲーム|YouTube|TikTok|アニメ|漫画|ドラマ|音楽|寝ること|食べること/.test(answer);
  }

  // 絵文字だけの回答（簡略化版）
  const isEmojiOnly = answer.trim().length <= 5 && /^[^\w\s]*$/.test(answer.trim()) && answer.trim().length > 0;

  return isObviouslyJoking || isMeaningless || contextuallyInappropriate || isEmojiOnly;
}

// 連続性のためのキーワード抽出関数
function extractContinuityKeywords(studentResponse: string): string[] {
  const keywords: string[] = [];
  
  // 活動関連キーワード
  const activityKeywords = studentResponse.match(/メダカ|ダンス|環境委員会|pH|水質|振付|チーム|観察|記録|測定|練習|発表|文化祭|委員会|植物|育成/g) || [];
  keywords.push(...activityKeywords);
  
  // 困難・課題キーワード
  const challengeKeywords = studentResponse.match(/困った|大変|難しかった|うまくいかな|失敗|問題|課題|苦労|死んで|だめ|悪く/g) || [];
  keywords.push(...challengeKeywords);
  
  // 協力・人物キーワード
  const peopleKeywords = studentResponse.match(/先生|友達|仲間|みんな|一緒|母|父|チームメンバー|クラスメート/g) || [];
  keywords.push(...peopleKeywords);
  
  // 感情・体験キーワード
  const emotionKeywords = studentResponse.match(/嬉しかった|楽しかった|悲しかった|驚いた|発見|気づいた|学んだ|感じた/g) || [];
  keywords.push(...emotionKeywords);
  
  // 方法・プロセスキーワード
  const methodKeywords = studentResponse.match(/使って|試験紙|道具|器具|測定|手順|方法|やり方|工夫|改善|対処/g) || [];
  keywords.push(...methodKeywords);
  
  // 重複削除
  return Array.from(new Set(keywords));
}

// 連続性を考慮した深掘り質問生成
async function generateContinuousDeepDiveQuestion(
  conversationHistory: ConversationHistory[],
  essayContent: EssayContent,
  continuityKeywords: string[],
  currentDepth: number,
  avoidMotivationQuestions: boolean = false
): Promise<string> {
  const lastStudentResponse = conversationHistory
    .filter(msg => msg.role === 'student')
    .slice(-1)[0]?.content || '';
    
  const previousQA = conversationHistory
    .filter((_, index) => index >= Math.max(0, conversationHistory.length - 6)) // 最近3ペア
    .map(msg => `${msg.role === 'interviewer' ? '面接官' : '学生'}: ${msg.content}`)
    .join('\n');

  // 深度に応じた質問戦略
  const depthStrategy = getDepthStrategy(currentDepth);
  
  const prompt = `
【明和中学校面接：連続性を重視した深掘り質問生成】

**会話の流れ**：
${previousQA}

**最新の学生回答**：
「${lastStudentResponse}」

**抽出されたキーワード**：${continuityKeywords.join(', ')}

**現在の深度**：${currentDepth}層目
**質問戦略**：${depthStrategy.strategy}

**連続性強化の指針**：
1. **前の回答から自然につながる**: 学生が言及した具体的な要素を必ず拾う
2. **キーワードを活用**: ${continuityKeywords.slice(0, 3).join('、')}などの要素を質問に組み込む
3. **深度に応じた掘り下げ**: ${depthStrategy.focus}
4. **自然な相槌**: 前の回答に対する適切な反応を含める

**必須要件**：
- 学生の前の回答から具体的なキーワードを必ず使用
- ${depthStrategy.questionTypes}の質問パターンを使用
- 「そうですね」等の抽象的相槌ではなく、具体的な相槌を使用
- 必ず「？」で終わる質問にする
${avoidMotivationQuestions ? '- 志望動機・学校理解・将来の夢は一切質問せず、探究活動体験のみに集中（15分探究活動メイン構造）' : ''}

**質問例**：
${depthStrategy.examples.join('\n')}

**1つの自然で具体的な質問を生成**：
`;

  const systemPrompt = `あなたは明和高校附属中学校のベテラン面接官です。
学生の回答の流れを大切にし、自然で連続性のある深掘り質問を生成してください。

【連続性の原則】
1. 前の回答で学生が話した具体的な内容を必ず拾う
2. その内容からさらに深い体験や思考を引き出す
3. 面接官らしい品格を保ちながら、自然な会話の流れを作る
4. ${currentDepth}層目として適切な深度の質問をする

【深度${currentDepth}の重要な指針】
${currentDepth >= 7 ? 
`⚠️ 深度7以上では必ず深層質問を生成してください：
- 「体験を通してどう変わったか」「何を学んだか」「今後どうしたいか」の視点
- 表面的な困難・課題質問（「困ったことは？」「うまくいかなかったことは？」）は絶対に避ける
- 学生の内面的成長や気づきを引き出す質問に集中する` :
`深度${currentDepth}では${depthStrategy.focus}に集中してください。`}

絶対に「ありがとうございます」や抽象的な相槌だけは生成しないでください。`;

  const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
    operation: 'continuous_deep_dive',
    priority: 'quality_first'
  });

  let generatedQuestion = aiResponse.content.trim();
  
  // 深度対応の品質チェック（連続性用）
  const isInappropriate = (
    generatedQuestion.includes('ありがとうございます') ||
    generatedQuestion.includes('ありがとう') ||
    generatedQuestion.includes('そうですね') ||
    generatedQuestion.includes('お疲れさまでした') ||
    generatedQuestion.includes('よくわかりました') ||
    generatedQuestion.includes('なるほど') ||
    !generatedQuestion.includes('？') ||
    generatedQuestion.length < (currentDepth >= 7 ? 20 : 25) ||
    generatedQuestion.trim() === '' ||
    /^(はい|そうですね|なるほど|よくわかりました)[。、]*$/.test(generatedQuestion.trim()) ||
    // 深度7以上では表面的な質問パターンを禁止
    (currentDepth >= 7 && (
      generatedQuestion.includes('予想と違った') ||
      generatedQuestion.includes('困ったことは') ||
      generatedQuestion.includes('うまくいかなかった') ||
      generatedQuestion.includes('大変だった')
    ))
  );
  
  console.log(`🔍 連続性AI生成質問チェック: "${generatedQuestion}"`);
  console.log(`🔍 連続性不適切判定: ${isInappropriate}`);
  console.log(`🔍 現在の深度: ${currentDepth}`);
  console.log(`🔍 抽出キーワード: ${JSON.stringify(continuityKeywords)}`);
  
  if (isInappropriate) {
    console.log('⚠️ 連続性AI生成質問が不適切 - フォールバック使用');
    console.log(`❌ 連続性不適切質問: "${generatedQuestion}"`);
    
    // ⚠️ 深度7以上では絶対に深層質問のみを使用（強制実行）
    if (currentDepth >= 7) {
      console.log(`🚀 深度${currentDepth}: 深層質問強制生成開始`);
      console.log(`🔍 利用可能キーワード: ${JSON.stringify(continuityKeywords)}`);
      
      // より包括的なキーワードマッチング
      if (continuityKeywords.some(kw => ['友達', '一緒', '仲間', 'みんな'].includes(kw))) {
        generatedQuestion = 'その友達との協力を通して、あなた自身が成長したと感じる部分はありますか？';
        console.log('✅ 深層質問選択: 友達協力パターン');
      } else if (continuityKeywords.some(kw => ['メダカ', '記録', '観察'].includes(kw))) {
        generatedQuestion = 'メダカの観察記録を続けてきた体験を通して、自分自身はどのように変わったと思いますか？';
        console.log('✅ 深層質問選択: メダカ観察パターン');
      } else if (continuityKeywords.some(kw => ['環境委員会', '活動', '委員会'].includes(kw))) {
        generatedQuestion = 'この環境委員会での活動を続けてきて、以前の自分と比べて何が一番変わったと思いますか？';
        console.log('✅ 深層質問選択: 環境委員会パターン');
      } else if (continuityKeywords.length > 0) {
        const keyword = continuityKeywords[0];
        generatedQuestion = `その${keyword}の経験から得た学びを、今後どのように活かしていきたいですか？`;
        console.log(`✅ 深層質問選択: ${keyword}キーワードパターン`);
      } else {
        generatedQuestion = 'この体験全体を振り返って、一番大きな学びや成長は何でしたか？';
        console.log('✅ 深層質問選択: 汎用パターン');
      }
      
      console.log(`🎯 深度${currentDepth}深層質問確定: "${generatedQuestion}"`);
      // 深度7以上では絶対にここで処理終了
    } else {
      // 深度6以下では従来のフォールバック質問
      if (continuityKeywords.includes('メダカ') && continuityKeywords.includes('pH')) {
        generatedQuestion = 'pH値の管理をされているんですね。実際に数値が思うようにならなかった時、どのような工夫をされましたか？';
      } else if (continuityKeywords.includes('ダンス') && continuityKeywords.includes('振付')) {
        generatedQuestion = 'チームダンスの振付合わせ、大変でしたね。メンバー同士で意見が分かれた時はどう解決しましたか？';
      } else if (continuityKeywords.includes('困った') || continuityKeywords.includes('大変')) {
        generatedQuestion = `その困難を乗り越える時、一番支えになったのは何でしたか？`;
      } else if (continuityKeywords.length > 0) {
        const keyword = continuityKeywords[0];
        // より自然なフォールバック質問生成
        if (['友達', '仲間', 'みんな'].includes(keyword)) {
          generatedQuestion = 'その活動で、周りの方との協力はどのような感じでしたか？';
        } else if (['記録', '観察', '測定'].includes(keyword)) {
          generatedQuestion = `${keyword}を続ける中で、一番困ったことや工夫したことはありませんでしたか？`;
        } else {
          generatedQuestion = `その${keyword}の経験で、一番印象に残ったのはどのような点でしたか？`;
        }
      } else {
        generatedQuestion = 'その体験の中で、一番印象に残った発見や気づきは何でしたか？';
      }
    }
    
    console.log(`✅ 連続性フォールバック質問使用: "${generatedQuestion}"`);
  } else {
    console.log(`✅ 連続性AI生成質問は適切: "${generatedQuestion}"`);
  }

  return generatedQuestion;
}

// 深度に応じた質問戦略を取得
function getDepthStrategy(depth: number): {
  strategy: string;
  focus: string;
  questionTypes: string;
  examples: string[];
} {
  if (depth <= 2) {
    return {
      strategy: '基本情報の確認と活動詳細の把握',
      focus: '活動の概要、始めたきっかけ、基本的な取り組み内容',
      questionTypes: '「いつから」「どのような」「なぜ始めた」',
      examples: [
        '「その活動はいつ頃から始められたのですか？」',
        '「最初に始めようと思ったきっかけは何でしたか？」'
      ]
    };
  } else if (depth <= 4) {
    return {
      strategy: '困難・課題の詳細探求',
      focus: 'うまくいかなかった体験、直面した問題、課題への対処',
      questionTypes: '「困ったこと」「大変だったこと」「うまくいかなかった」',
      examples: [
        '「その活動で一番困ったことは何でしたか？」',
        '「思うようにいかなかった時はどう対処しましたか？」'
      ]
    };
  } else if (depth <= 6) {
    return {
      strategy: '協力・支援関係の探求',
      focus: '周りの人との協力、先生や友達からの支援、チームワーク',
      questionTypes: '「誰と一緒に」「先生に相談」「友達の協力」',
      examples: [
        '「それは一人で解決しましたか、それとも誰かと一緒でしたか？」',
        '「その時、先生や友達からのアドバイスはありましたか？」'
      ]
    };
  } else {
    return {
      strategy: '深層体験・メタ認知の探求',
      focus: '自己変化の実感、学びの本質、継続への意欲',
      questionTypes: '「どう変わった」「何を学んだ」「今後どうしたい」',
      examples: [
        '「その体験を通して、自分自身はどのように変わりましたか？」',
        '「今振り返ってみて、一番大きな学びは何でしたか？」',
        '「友達と協力する中で、あなた自身が成長したと感じる部分はありますか？」',
        '「この活動を続けてきて、以前の自分と比べて何が一番変わったと思いますか？」',
        '「その経験から得た学びを、今後どのように活かしていきたいですか？」'
      ]
    };
  }
}

// 志願理由書質問の使用判定関数（齟齬チェック用 + 時間余った場合のみ）
function shouldUseMotivationQuestions(
  stage: string, 
  depth: number, 
  conversationLength: number,
  timeRemaining: number = 0 // 残り時間（秒）
): 'avoid' | 'consistency_check' | 'time_filler' {
  // 基本的には探究活動に15分集中
  if (stage === 'opening' || (stage === 'exploration' && depth < 7)) {
    return 'avoid'; // 完全に回避
  }
  
  // 探究活動の深掘りが十分完了した場合の使用判定
  if (stage === 'exploration' && depth >= 7) {
    // 面接内容との齟齬チェックが必要な場合のみ
    return 'consistency_check';
  }
  
  // Metacognition段階以降で時間が余った場合のみ
  if ((stage === 'metacognition' || stage === 'future') && timeRemaining > 120) {
    return 'time_filler'; // 時間埋め用
  }
  
  return 'avoid';
}

// 志願理由書齟齬チェック用質問生成
async function generateConsistencyCheckQuestion(
  conversationHistory: ConversationHistory[],
  essayContent: EssayContent
): Promise<string> {
  const inquiryContent = essayContent.inquiryLearning || '';
  const motivationContent = essayContent.motivation || '';
  
  // 探究活動と志願理由書の内容を比較
  const lastStudentResponse = conversationHistory
    .filter(msg => msg.role === 'student')
    .slice(-1)[0]?.content || '';

  const prompt = `
【志願理由書との齟齬チェック質問生成】

**探究活動での発言内容**：
「${lastStudentResponse}」

**志願理由書の志望動機**：
「${motivationContent}」

**志願理由書の探究活動記述**：
「${inquiryContent}」

**齟齬チェックの目的**：
探究活動での具体的な発言内容と志願理由書の記述に矛盾がないかを確認する

**質問生成指針**：
1. 探究活動の体験と志望動機の整合性をチェック
2. 志願理由書で書いた内容と実際の体験の一致度を確認
3. 面接官として自然な確認質問を生成

**質問例**：
- 「志願理由書では○○と書かれていましたが、今お聞きした体験とどのようにつながっているのでしょうか？」
- 「その体験が、明和中学校を志望するきっかけになったのですか？」
- 「志願理由書に書かれた△△への興味は、この探究活動から生まれたものでしょうか？」

**1つの自然な確認質問を生成**：
`;

  const systemPrompt = `あなたは明和高校附属中学校の面接官です。
探究活動の深掘りが完了した後、志願理由書との整合性を確認する質問を生成してください。

【重要な原則】
1. 探究活動の内容と志願理由書の記述の整合性を確認
2. 受験生を追い詰めるのではなく、自然な確認として質問
3. 体験と志望動機のつながりを理解するための質問
4. 面接官として品格のある言葉遣いを保つ`;

  const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
    operation: 'consistency_check',
    priority: 'quality_first'
  });

  return aiResponse.content.trim();
}

// 時間余り用の志願理由書補完質問生成
async function generateTimeFillerQuestion(
  conversationHistory: ConversationHistory[],
  essayContent: EssayContent
): Promise<string> {
  const topics = [
    { key: 'research', label: '学校研究', content: essayContent.research },
    { key: 'schoolLife', label: '学校生活への期待', content: essayContent.schoolLife },
    { key: 'future', label: '将来の夢', content: essayContent.future }
  ].filter(topic => topic.content && topic.content.length > 10);

  if (topics.length === 0) {
    return '最後に、明和中学校でどのような学校生活を送りたいか教えてください。';
  }

  const selectedTopic = topics[Math.floor(Math.random() * topics.length)];

  const prompt = `
【時間余り用の志願理由書補完質問生成】

**選択されたトピック**：${selectedTopic.label}
**志願理由書の記述**：
「${selectedTopic.content}」

**質問生成指針**：
1. 探究活動の深掘りが完了し、時間が余った場合の質問
2. 志願理由書の記述を踏まえた自然な質問
3. 受験生の考えを深める質問
4. 面接の締めくくりにふさわしい質問

**質問例**：
- 「志願理由書で○○について書いていただきましたが、もう少し詳しく聞かせてください」
- 「△△への期待について、具体的にはどのようなことを考えていますか？」

**1つの自然な質問を生成**：
`;

  const systemPrompt = `あなたは明和高校附属中学校の面接官です。
探究活動の深掘りが完了し、時間が余った場合に使用する補完質問を生成してください。

【重要な原則】
1. 志願理由書の記述を基にした自然な質問
2. 面接の締めくくりにふさわしい内容
3. 受験生の考えや期待を引き出す質問
4. 面接官として品格のある言葉遣いを保つ`;

  const aiResponse = await multiAI.generateWithTripleAI(prompt, systemPrompt, {
    operation: 'time_filler',
    priority: 'quality_first'
  });

  return aiResponse.content.trim();
}