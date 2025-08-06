/**
 * 志願理由書質問の早期出現防止システムテスト
 */

// テストケース1: Opening段階での志願理由書質問防止
async function testOpeningStagePreventionTest() {
  console.log('🧪 テスト1: Opening段階での志願理由書質問防止');
  
  const testData = {
    essayContent: {
      motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。",
      research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
      schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
      future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
      inquiryLearning: "小学3年生からチームダンスに取り組んでいます。練習では振付を覚えるだけでなく、チーム全体の表現を合わせることに力を入れています。"
    },
    conversationHistory: [
      { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
      { role: 'student', content: '受検番号123番、田中花子です。' },
      { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
      { role: 'student', content: '電車で来ました。' }
    ],
    questionType: 'follow_up',
    currentStage: 'opening',
    interviewDepth: 2
  };

  try {
    const response = await fetch('http://localhost:3025/api/interview/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log(`📝 生成された質問: "${result.question}"`);
    console.log(`📊 段階: ${result.stageInfo?.currentStage}, 深度: ${result.stageInfo?.depth}`);
    
    // 志願理由書関連のキーワードチェック
    const motivationKeywords = ['志望', '動機', '明和', '学校', '将来', '夢', '理由'];
    const containsMotivationKeywords = motivationKeywords.some(keyword => 
      result.question.includes(keyword)
    );
    
    if (containsMotivationKeywords) {
      console.log('❌ Opening段階で志願理由書質問が生成されました');
      console.log(`🚨 検出されたキーワード: ${motivationKeywords.filter(keyword => result.question.includes(keyword))}`);
    } else {
      console.log('✅ Opening段階で志願理由書質問は回避されました');
    }
    
    return !containsMotivationKeywords;
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
    return false;
  }
}

// テストケース2: Exploration段階前半（深度3未満）での防止
async function testExplorationEarlyStageTest() {
  console.log('\n🧪 テスト2: Exploration段階前半での志願理由書質問防止');
  
  const testData = {
    essayContent: {
      motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。",
      research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
      schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
      future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
      inquiryLearning: "小学4年生から環境委員会に所属し、メダカの水質管理や植物の育成を継続しています。"
    },
    conversationHistory: [
      { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
      { role: 'student', content: '受検番号456番、佐藤太郎です。' },
      { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
      { role: 'student', content: '自転車で来ました。' },
      { role: 'interviewer', content: 'それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。' },
      { role: 'student', content: '小学4年生から環境委員会に所属して、メダカの飼育と水質管理をしています。pH値を測定して記録をつけたり、水温や酸素量も調べています。' }
    ],
    questionType: 'follow_up',
    currentStage: 'exploration',
    interviewDepth: 2 // 深度3未満
  };

  try {
    const response = await fetch('http://localhost:3025/api/interview/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log(`📝 生成された質問: "${result.question}"`);
    console.log(`📊 段階: ${result.stageInfo?.currentStage}, 深度: ${result.stageInfo?.depth}`);
    
    // 志願理由書関連のキーワードチェック
    const motivationKeywords = ['志望', '動機', '明和', '学校', '将来', '夢', '理由'];
    const containsMotivationKeywords = motivationKeywords.some(keyword => 
      result.question.includes(keyword)
    );
    
    if (containsMotivationKeywords) {
      console.log('❌ Exploration段階前半で志願理由書質問が生成されました');
      console.log(`🚨 検出されたキーワード: ${motivationKeywords.filter(keyword => result.question.includes(keyword))}`);
    } else {
      console.log('✅ Exploration段階前半で志願理由書質問は回避されました');
    }
    
    return !containsMotivationKeywords;
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
    return false;
  }
}

// テストケース3: 会話数が少ない場合の防止（10回未満）
async function testShortConversationTest() {
  console.log('\n🧪 テスト3: 短い会話での志願理由書質問防止');
  
  const testData = {
    essayContent: {
      motivation: "明和中学校の国際教養科では、多様な価値観の中で自分の考えを深められると思い志望しました。",
      research: "学校説明会で生徒の皆さんが自分の意見をしっかり持って発表されている姿を見て、素晴らしいと感じました。",
      schoolLife: "様々な活動を通じて、自分の視野を広げ、友達とともに成長していきたいです。",
      future: "将来は環境問題に取り組み、持続可能な社会作りに貢献したいと考えています。",
      inquiryLearning: "小学3年生からチームダンスに取り組んでいます。練習では振付を覚えるだけでなく、チーム全体の表現を合わせることに力を入れています。"
    },
    conversationHistory: [
      { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
      { role: 'student', content: '受検番号789番、山田花子です。' },
      { role: 'interviewer', content: 'こちらまでは何で来られましたか？' },
      { role: 'student', content: '徒歩で来ました。' },
      { role: 'interviewer', content: 'それでは、あなたが取り組んでいる探究活動について説明してください。' },
      { role: 'student', content: 'チームダンスをしています。振付を覚えて、チーム全体で表現を合わせています。' },
      { role: 'interviewer', content: 'チームダンスですね。何人くらいでやっているのですか？' },
      { role: 'student', content: '8人でやっています。' }
    ], // 8回の会話（10回未満）
    questionType: 'follow_up',
    currentStage: 'exploration',
    interviewDepth: 4
  };

  try {
    const response = await fetch('http://localhost:3025/api/interview/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log(`📝 生成された質問: "${result.question}"`);
    console.log(`📊 段階: ${result.stageInfo?.currentStage}, 深度: ${result.stageInfo?.depth}`);
    console.log(`💬 会話回数: ${testData.conversationHistory.length}回`);
    
    // 志願理由書関連のキーワードチェック
    const motivationKeywords = ['志望', '動機', '明和', '学校', '将来', '夢', '理由'];
    const containsMotivationKeywords = motivationKeywords.some(keyword => 
      result.question.includes(keyword)
    );
    
    if (containsMotivationKeywords) {
      console.log('❌ 短い会話で志願理由書質問が生成されました');
      console.log(`🚨 検出されたキーワード: ${motivationKeywords.filter(keyword => result.question.includes(keyword))}`);
    } else {
      console.log('✅ 短い会話で志願理由書質問は回避されました');
    }
    
    return !containsMotivationKeywords;
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
    return false;
  }
}

// 全テスト実行
async function runAllTests() {
  console.log('🎯 志願理由書質問の早期出現防止システムテスト開始\n');
  
  const results = [];
  
  results.push(await testOpeningStagePreventionTest());
  results.push(await testExplorationEarlyStageTest());
  results.push(await testShortConversationTest());
  
  const successCount = results.filter(result => result).length;
  const totalCount = results.length;
  
  console.log('\n📊 テスト結果サマリー');
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  console.log(`❌ 失敗: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 全てのテストが成功しました！志願理由書質問の早期出現防止システムは正常に動作しています。');
  } else {
    console.log('⚠️ 一部のテストが失敗しました。システムの調整が必要です。');
  }
}

// テスト実行
runAllTests().catch(console.error);