// 深掘り面接システムの動作確認テスト
// 合格者面接例（HさんのダンスとTさんのメダカ）レベルの会話を再現できるかテスト

const fs = require('fs');

// テスト用の志願理由書データ
const testEssayContent = {
  motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。",
  research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
  schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
  future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
  inquiryLearning: "小学4年生から環境委員会に所属し、メダカの水質管理や植物の育成を継続しています。特にpH値の測定や観察記録を通じて、生き物の生態について学び続けています。"
};

// Hさん（ダンス）パターンのテストケース
const testCaseHsan = {
  essayContent: {
    ...testEssayContent,
    inquiryLearning: "小学3年生からチームダンスに取り組んでいます。練習では振付を覚えるだけでなく、チーム全体の表現を合わせることに力を入れています。特に文化祭での発表に向けて、みんなで話し合いながら練習しています。"
  },
  conversationHistory: [
    { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
    { role: 'student', content: '受検番号123番、田中花子です。' },
    { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
    { role: 'student', content: '電車で来ました。' },
    { role: 'interviewer', content: '電車でお疲れさまでした。どれくらい時間がかかりましたか？' },
    { role: 'student', content: '30分かかりました。' },
    { role: 'interviewer', content: '30分ですか、ちょうど良い距離ですね。それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。' },
    { role: 'student', content: '小学3年生からチームダンスに取り組んでいます。最初は振付を覚えるのが精一杯でしたが、だんだんチーム全体の表現を合わせることの大切さを学びました。特に文化祭の発表では、みんなで何度も話し合って、それぞれの動きを調整しました。振付にばらつきがあってなかなかそろわなかったのですが、お互いの動きを見ながら練習を重ねて、最終的にはとても良い発表ができました。' }
  ],
  expectedQuestionTypes: [
    '振付のばらつき問題への具体的対処法',
    'チーム内での話し合いプロセス',
    '個人練習vs集団練習の工夫',
    '意見が合わない時の調整方法',
    '表現力向上のための努力',
    '文化祭発表での具体的な成果',
    '継続動機と今後の展望'
  ]
};

// Tさん（メダカ）パターンのテストケース
const testCaseTsan = {
  essayContent: testEssayContent,
  conversationHistory: [
    { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
    { role: 'student', content: '受検番号456番、佐藤太郎です。' },
    { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
    { role: 'student', content: '自転車で来ました。' },
    { role: 'interviewer', content: '自転車でいらしたんですね。どれくらい時間がかかりましたか？' },
    { role: 'student', content: '15分ぐらいです。' },
    { role: 'interviewer', content: 'お近くですね。それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。' },
    { role: 'student', content: '小学4年生から環境委員会に所属して、メダカの飼育と水質管理をしています。最初はただ餌をあげるだけでしたが、だんだん水の汚れやpH値に興味を持つようになりました。pH値を測定して記録をつけたり、水温や酸素量も調べています。時々メダカが死んでしまうこともあって悲しかったのですが、原因を調べて改善策を考えるようになりました。今では毎日観察記録をつけて、小さな変化にも気づけるようになりました。' }
  ],
  expectedQuestionTypes: [
    'pH値測定の具体的方法',
    'メダカの死因調査と改善策',
    '毎日の観察記録の内容',
    '水質管理の困難な点',
    '4年間継続の動機',
    '環境委員会での役割分担',
    '生き物への愛情と責任感'
  ]
};

// APIテスト関数
async function testInterviewAPI(testCase, testName) {
  console.log(`\n🧪 ${testName} のテスト開始`);
  console.log('=====================================');
  
  try {
    // Next.jsアプリが起動していることを前提とする
    const response = await fetch('http://localhost:3005/api/interview/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        essayContent: testCase.essayContent,
        conversationHistory: testCase.conversationHistory,
        questionType: 'follow_up',
        currentStage: 'exploration',
        interviewDepth: Math.floor(testCase.conversationHistory.length / 2)
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ API Response:');
    console.log(`🎯 Generated Question: "${result.question}"`);
    console.log(`📊 Stage: ${result.stageInfo?.currentStage}, Depth: ${result.stageInfo?.depth}`);
    console.log(`🔧 Pattern Type: ${result.stageInfo?.patternType}`);
    
    // 質問の品質分析
    analyzeQuestionQuality(result.question, testCase.expectedQuestionTypes, testName);
    
    return result;
    
  } catch (error) {
    console.error(`❌ ${testName} テストエラー:`, error.message);
    return null;
  }
}

// 質問品質分析関数
function analyzeQuestionQuality(question, expectedTypes, testName) {
  console.log('\n📋 質問品質分析:');
  
  // 具体性チェック
  const specificityMarkers = question.match(/具体的|どのよう|なぜ|どんな|どういう|どのくらい/g) || [];
  console.log(`🔍 具体性マーカー数: ${specificityMarkers.length}`);
  
  // キーワード活用チェック
  let keywordUsage = 0;
  if (testName.includes('Hさん')) {
    const danceKeywords = ['ダンス', '振付', 'チーム', 'ばらつき', '話し合い', '練習', '表現', '文化祭'];
    keywordUsage = danceKeywords.filter(keyword => question.includes(keyword)).length;
    console.log(`🎭 ダンス関連キーワード使用: ${keywordUsage}/8`);
  } else if (testName.includes('Tさん')) {
    const medakaKeywords = ['メダカ', 'pH', '水質', '観察', '記録', '環境委員会', '測定', '飼育'];
    keywordUsage = medakaKeywords.filter(keyword => question.includes(keyword)).length;
    console.log(`🐟 メダカ関連キーワード使用: ${keywordUsage}/8`);
  }
  
  // 深掘り質問パターンチェック
  const deepDivePatterns = [
    '困った', '大変', 'うまくいかな', '失敗', '課題', '問題',
    '誰かと一緒', '先生', '友達', 'チーム', '協力',
    'どのように', 'どんな方法', 'どうやって', 'どういう風に',
    '一番', '特に', '印象に残った', '覚えている'
  ];
  const deepDiveCount = deepDivePatterns.filter(pattern => question.includes(pattern)).length;
  console.log(`🎯 深掘りパターン数: ${deepDiveCount}`);
  
  // 総合評価
  const qualityScore = (specificityMarkers.length * 2) + (keywordUsage * 3) + (deepDiveCount * 2);
  console.log(`⭐ 総合品質スコア: ${qualityScore}/30`);
  
  if (qualityScore >= 20) {
    console.log('🏆 優秀な深掘り質問です！');
  } else if (qualityScore >= 15) {
    console.log('✅ 良い深掘り質問です');
  } else if (qualityScore >= 10) {
    console.log('⚠️ 改善が必要です');
  } else {
    console.log('❌ 品質が不十分です');
  }
}

// 連続質問テスト（7層深掘りテスト）
async function testContinuousDeepDive(initialTestCase, testName, targetLayers = 7) {
  console.log(`\n🔥 ${testName} 連続深掘りテスト（目標: ${targetLayers}層）`);
  console.log('================================================');
  
  let conversationHistory = [...initialTestCase.conversationHistory];
  let layerCount = Math.floor(conversationHistory.length / 2);
  
  for (let i = layerCount; i < targetLayers; i++) {
    console.log(`\n--- 第${i + 1}層目の質問生成 ---`);
    
    const response = await fetch('http://localhost:3005/api/interview/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        essayContent: initialTestCase.essayContent,
        conversationHistory: conversationHistory,
        questionType: 'follow_up',
        currentStage: 'exploration',
        interviewDepth: i + 1
      })
    });

    if (!response.ok) {
      console.error(`❌ 第${i + 1}層でエラー: ${response.status}`);
      break;
    }

    const result = await response.json();
    console.log(`🎯 第${i + 1}層質問: "${result.question}"`);
    
    // 面接官の質問を追加
    conversationHistory.push({
      role: 'interviewer',
      content: result.question
    });
    
    // ダミーの学生回答を生成（実際のテストでは実際の回答を使用）
    let studentResponse = generateDummyStudentResponse(result.question, testName);
    conversationHistory.push({
      role: 'student',
      content: studentResponse
    });
    
    console.log(`👨‍🎓 学生回答: "${studentResponse}"`);
    
    // 7層チェックロジックのテスト
    if (result.stageTransition) {
      console.log(`⚠️ 第${i + 1}層で段階移行が発生: ${result.stageTransition.from} → ${result.stageTransition.to}`);
      if (i + 1 < 7) {
        console.log(`❌ 7層未満での段階移行は問題です！`);
      }
      break;
    }
  }
  
  console.log(`\n🏁 連続深掘りテスト完了: ${Math.floor(conversationHistory.length / 2)}層達成`);
  return conversationHistory;
}

// ダミー学生回答生成
function generateDummyStudentResponse(question, testName) {
  if (testName.includes('Hさん')) {
    if (question.includes('困った') || question.includes('大変')) {
      return 'みんなの動きが合わなくて、特に手の振りが人によって全然違っていました。最初は注意し合うのも難しくて...';
    } else if (question.includes('どのように') || question.includes('どうやって')) {
      return '鏡を見ながら一人ずつ動きをチェックして、お互いの動きを真似する練習をしました。';
    } else if (question.includes('誰か') || question.includes('協力')) {
      return '先輩が時々見に来てくれて、アドバイスをもらったり、友達同士でも動画を撮って確認したりしました。';
    }
  } else if (testName.includes('Tさん')) {
    if (question.includes('pH') || question.includes('測定')) {
      return 'リトマス紙を使ったり、デジタルのpHメーターも借りて測定していました。数値が安定しない時が多くて...';
    } else if (question.includes('困った') || question.includes('大変')) {
      return '水が急に汚れたり、メダカが元気がなくなったりした時です。何が原因かわからなくて先生に相談しました。';
    } else if (question.includes('記録') || question.includes('観察')) {
      return '毎日ノートに水温、pH値、メダカの様子を書いて、写真も撮っています。小さな変化も記録するようにしています。';
    }
  }
  
  // デフォルト回答
  return 'はい、そうですね。もう少し詳しく説明すると...';
}

// メイン実行関数
async function runAllTests() {
  console.log('🚀 深掘り面接システム動作確認テスト開始');
  console.log('===========================================');
  
  // サーバー起動確認
  try {
    const healthCheck = await fetch('http://localhost:3005/api/interview/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ essayContent: testEssayContent })
    });
    console.log('✅ サーバー接続確認完了');
  } catch (error) {
    console.error('❌ サーバーが起動していません。npm run dev を実行してください。');
    return;
  }
  
  // 1. 単発質問品質テスト
  console.log('\n=== 1. 単発質問品質テスト ===');
  await testInterviewAPI(testCaseHsan, 'Hさん（ダンス）パターン');
  await testInterviewAPI(testCaseTsan, 'Tさん（メダカ）パターン');
  
  // 2. 連続深掘りテスト
  console.log('\n=== 2. 連続深掘りテスト ===');
  await testContinuousDeepDive(testCaseHsan, 'Hさん（ダンス）', 7);
  await testContinuousDeepDive(testCaseTsan, 'Tさん（メダカ）', 7);
  
  console.log('\n🎉 全テスト完了！');
  console.log('詳細な結果は上記のログを確認してください。');
}

// Node.js環境での実行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testInterviewAPI,
    testContinuousDeepDive,
    testCaseHsan,
    testCaseTsan
  };
}

// スクリプト直接実行の場合
if (require.main === module) {
  runAllTests().catch(console.error);
}