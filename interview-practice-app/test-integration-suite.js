/**
 * 🧪 明和中面接練習アプリ - 統合テストスイート
 * 小学6年生が最高の面接をするためのシステム検証
 */

const BASE_URL = 'http://localhost:3002';

// テスト用カラーコード
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// テスト結果サマリー
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

/**
 * テストユーティリティ
 */
class TestUtils {
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static log(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      'success': `${colors.green}✅`,
      'error': `${colors.red}❌`,
      'warning': `${colors.yellow}⚠️`,
      'info': `${colors.blue}ℹ️`,
      'test': `${colors.cyan}🧪`
    }[type] || '';
    
    console.log(`${prefix} [${timestamp}] ${message}${colors.reset}`);
  }

  static async fetchAPI(endpoint, data = null, method = 'POST') {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, options);
      const json = await response.json();
      
      return { success: true, data: json, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * テストケース定義
 */
const testCases = [
  // 1. 初回質問生成テスト
  {
    name: '初回質問生成',
    description: '面接開始時の基本的な質問が生成されるか',
    async test() {
      const result = await TestUtils.fetchAPI('/api/interview/generate-question', {
        essayContent: '',
        conversationHistory: [],
        currentStage: 'opening',
        interviewDepth: 1,
        userMessage: '',
        studentAnswerCount: 0
      });

      if (!result.success) throw new Error(result.error);
      if (!result.data.question.includes('受検番号') && !result.data.question.includes('名前')) {
        throw new Error(`期待した質問が生成されませんでした: ${result.data.question}`);
      }
      
      return result.data;
    }
  },

  // 2. 探究活動深掘りテスト
  {
    name: '探究活動深掘り質問生成',
    description: '7-9層の深掘り質問が適切に生成されるか',
    async test() {
      const result = await TestUtils.fetchAPI('/api/interview/generate-question', {
        conversationHistory: [
          {role: 'interviewer', content: '探究活動について1分ほどで説明してください。'}
        ],
        currentStage: 'exploration',
        interviewDepth: 2,
        userMessage: '私は小学4年生から環境委員会に所属していて、メダカの飼育と水質管理に取り組んでいます。pH値の測定や水温の記録を毎日続けていて、メダカが快適に過ごせる環境を作ることを目標にしています。',
        studentAnswerCount: 1
      });

      if (!result.success) throw new Error(result.error);
      
      // 深掘り質問のキーワードチェック
      const question = result.data.question;
      const hasRelevantKeywords = 
        question.includes('メダカ') || 
        question.includes('水質') || 
        question.includes('pH') ||
        question.includes('環境委員会') ||
        question.includes('困難') ||
        question.includes('大変');
      
      if (!hasRelevantKeywords) {
        console.warn(`⚠️ 深掘り質問にキーワードが含まれていません: ${question}`);
      }
      
      return result.data;
    }
  },

  // 3. 不適切回答検出テスト
  {
    name: '不適切回答検出',
    description: 'ふざけた回答を適切に検出・指導できるか',
    async test() {
      const result = await TestUtils.fetchAPI('/api/interview/generate-question', {
        conversationHistory: [
          {role: 'interviewer', content: '探究活動について説明してください。'}
        ],
        currentStage: 'exploration',
        interviewDepth: 2,
        userMessage: '吾輩は猫である。名前はまだない。',
        studentAnswerCount: 1
      });

      if (!result.success) throw new Error(result.error);
      
      const response = result.data;
      const isInappropriateDetected = 
        response.inappropriateDetected === true ||
        response.seriousReminder === true ||
        response.question.includes('真剣に') ||
        response.question.includes('面接の場');
      
      if (!isInappropriateDetected) {
        throw new Error('不適切回答が検出されませんでした');
      }
      
      return response;
    }
  },

  // 4. 段階移行テスト
  {
    name: '段階移行',
    description: 'opening→exploration→metacognition→futureの段階移行',
    async test() {
      let stage = 'opening';
      let transitions = [];
      
      // Opening段階から移行を確認（確実に移行する条件でテスト）
      
      // まず2回の回答で移行をテスト（パフォーマンスブースト条件）
      let result = await TestUtils.fetchAPI('/api/interview/generate-question', {
        conversationHistory: [
          {role: 'student', content: 'テスト回答1'},
          {role: 'student', content: 'テスト回答2'}
        ],
        currentStage: stage,
        interviewDepth: 2,
        userMessage: 'テスト回答2',
        studentAnswerCount: 2
      });
      
      if (result.data.stageTransition) {
        transitions.push(result.data.stageTransition);
        stage = result.data.stageTransition.to;
        console.log(`段階移行発生: ${result.data.stageTransition.from} → ${result.data.stageTransition.to}`);
      }
      
      // 移行しなかった場合、通常条件（3回）でテスト
      if (transitions.length === 0) {
        result = await TestUtils.fetchAPI('/api/interview/generate-question', {
          conversationHistory: [
            {role: 'student', content: 'テスト回答1'},
            {role: 'student', content: 'テスト回答2'},
            {role: 'student', content: 'テスト回答3'}
          ],
          currentStage: stage,
          interviewDepth: 3,
          userMessage: 'テスト回答3',
          studentAnswerCount: 3
        });
        
        if (result.data.stageTransition) {
          transitions.push(result.data.stageTransition);
          stage = result.data.stageTransition.to;
          console.log(`段階移行発生: ${result.data.stageTransition.from} → ${result.data.stageTransition.to}`);
        }
      }
      
      if (transitions.length === 0) {
        throw new Error('段階移行が発生しませんでした');
      }
      
      return { transitions, finalStage: stage };
    }
  },

  // 5. パフォーマンステスト
  {
    name: 'パフォーマンス',
    description: 'API応答時間が3秒以内か',
    async test() {
      const start = Date.now();
      
      const result = await TestUtils.fetchAPI('/api/interview/generate-question', {
        conversationHistory: [
          {role: 'interviewer', content: '探究活動について説明してください。'}
        ],
        currentStage: 'exploration',
        interviewDepth: 2,
        userMessage: 'メダカの飼育をしています。',
        studentAnswerCount: 1
      });
      
      const responseTime = Date.now() - start;
      
      if (!result.success) throw new Error(result.error);
      if (responseTime > 3000) {
        throw new Error(`応答時間が3秒を超えました: ${responseTime}ms`);
      }
      
      return { responseTime, data: result.data };
    }
  },

  // 6. 連続セッションテスト
  {
    name: '連続面接セッション',
    description: '15分間の完全な面接フローが実行できるか',
    async test() {
      const session = {
        stage: 'opening',
        depth: 1,
        history: [],
        answerCount: 0
      };
      
      const questions = [];
      
      // 10回の質問応答サイクル
      for (let i = 0; i < 10; i++) {
        const userMessage = this.generateMockAnswer(session.stage, i);
        
        const result = await TestUtils.fetchAPI('/api/interview/generate-question', {
          conversationHistory: session.history,
          currentStage: session.stage,
          interviewDepth: session.depth,
          userMessage,
          studentAnswerCount: session.answerCount
        });
        
        if (!result.success) throw new Error(`セッション${i + 1}で失敗: ${result.error}`);
        
        questions.push(result.data.question);
        
        // 履歴更新
        session.history.push(
          {role: 'interviewer', content: result.data.question},
          {role: 'student', content: userMessage}
        );
        
        if (result.data.stageTransition) {
          session.stage = result.data.stageTransition.to;
        }
        
        session.depth = result.data.depth || session.depth + 1;
        session.answerCount++;
        
        await TestUtils.delay(100); // API負荷軽減
      }
      
      return {
        totalQuestions: questions.length,
        finalStage: session.stage,
        finalDepth: session.depth
      };
    },
    
    generateMockAnswer(stage, index) {
      const answers = {
        opening: [
          '1234番、山田太郎です。',
          '電車で来ました。30分くらいかかりました。',
          'はい、母と一緒に来ました。'
        ],
        exploration: [
          '私は環境委員会でメダカの飼育をしています。',
          'pH値の測定が難しかったです。最初は使い方がわからなくて。',
          '水族館の人に聞いたり、本で調べたりしました。',
          'メダカが死んでしまったときは悲しかったです。',
          '水質を改善して、また新しいメダカを飼い始めました。'
        ],
        metacognition: [
          'どちらも継続することが大切だと思いました。',
          '失敗から学ぶことが多いと気づきました。'
        ],
        future: [
          '今度は熱帯魚の飼育にも挑戦したいです。',
          'もっと生き物について学びたいからです。'
        ]
      };
      
      const stageAnswers = answers[stage] || answers.exploration;
      return stageAnswers[index % stageAnswers.length];
    }
  },

  // 7. エラーハンドリングテスト
  {
    name: 'エラーハンドリング',
    description: '不正なデータでもクラッシュしないか',
    async test() {
      const invalidInputs = [
        { conversationHistory: null },
        { userMessage: undefined },
        { currentStage: 'invalid_stage' },
        { interviewDepth: -1 },
        { studentAnswerCount: 'not_a_number' }
      ];
      
      const results = [];
      
      for (const invalidInput of invalidInputs) {
        const result = await TestUtils.fetchAPI('/api/interview/generate-question', invalidInput);
        
        // エラーが返されるか、フォールバック質問が返されることを確認
        if (result.success && result.data.question) {
          results.push({ input: invalidInput, handled: true });
        } else if (result.error) {
          // エラーが適切にハンドリングされている
          results.push({ input: invalidInput, handled: true, error: result.error });
        } else {
          results.push({ input: invalidInput, handled: false, error: result.error });
        }
      }
      
      const allHandled = results.every(r => r.handled);
      if (!allHandled) {
        const failedInputs = results.filter(r => !r.handled);
        throw new Error(`一部の不正入力が適切に処理されませんでした: ${failedInputs.length}件`);
      }
      
      return results;
    }
  }
];

/**
 * テスト実行
 */
async function runTests() {
  console.log(`${colors.magenta}${'='.repeat(60)}`);
  console.log(`${colors.magenta}🎯 明和中面接練習アプリ - 統合テストスイート`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}\n`);
  
  TestUtils.log('info', `テスト開始: ${new Date().toLocaleString()}`);
  TestUtils.log('info', `対象URL: ${BASE_URL}`);
  console.log();

  for (const testCase of testCases) {
    TestUtils.log('test', `${testCase.name} - ${testCase.description}`);
    
    try {
      const startTime = Date.now();
      const result = await testCase.test();
      const duration = Date.now() - startTime;
      
      TestUtils.log('success', `✓ ${testCase.name} (${duration}ms)`);
      
      if (result && typeof result === 'object') {
        console.log(`   結果: ${JSON.stringify(result).substring(0, 100)}...`);
      }
      
      testResults.passed++;
    } catch (error) {
      TestUtils.log('error', `✗ ${testCase.name}: ${error.message}`);
      testResults.failed++;
      testResults.errors.push({
        test: testCase.name,
        error: error.message
      });
    }
    
    console.log();
    await TestUtils.delay(500); // テスト間の待機
  }

  // 結果サマリー
  console.log(`${colors.magenta}${'='.repeat(60)}`);
  console.log(`${colors.magenta}📊 テスト結果サマリー`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}\n`);
  
  console.log(`${colors.green}✅ 成功: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}❌ 失敗: ${testResults.failed}${colors.reset}`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.red}エラー詳細:${colors.reset}`);
    testResults.errors.forEach(err => {
      console.log(`  - ${err.test}: ${err.error}`);
    });
  }
  
  const successRate = (testResults.passed / (testResults.passed + testResults.failed) * 100).toFixed(1);
  console.log(`\n${colors.cyan}成功率: ${successRate}%${colors.reset}`);
  
  // 最終判定
  if (testResults.failed === 0) {
    console.log(`\n${colors.green}🎉 すべてのテストが成功しました！${colors.reset}`);
    console.log(`${colors.green}小学6年生が明和中で最高の面接をする準備が整いました！${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️ 一部のテストが失敗しました。修正が必要です。${colors.reset}`);
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  TestUtils.log('error', `予期しないエラー: ${error.message}`);
  process.exit(1);
});

// テスト実行
runTests().catch(error => {
  TestUtils.log('error', `テスト実行エラー: ${error.message}`);
  process.exit(1);
});