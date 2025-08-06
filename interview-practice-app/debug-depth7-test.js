/**
 * 深度7でのテスト - 基本質問が生成される問題の調査
 */

async function testDepth7() {
  console.log('🧪 深度7テスト開始');
  
  // 深度7相当の会話履歴を作成（14回のやり取り）
  const conversationHistory = [
    { role: 'interviewer', content: '面接を始めます。' },
    { role: 'student', content: 'よろしくお願いします。' },
    { role: 'interviewer', content: 'それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。' },
    { role: 'student', content: '私は小学4年生から環境委員会でメダカの飼育をしています。毎日観察記録をつけて、pH値も測定しています。' },
    { role: 'interviewer', content: 'メダカの飼育で、pH値測定も行っているんですね。どのような目的でpH値を調べているのですか？' },
    { role: 'student', content: 'メダカが健康に育つ環境を作るためです。pH値が6.5から7.5の間が良いと本で読んだので、毎日チェックしています。' },
    { role: 'interviewer', content: 'pH値の管理、とても大切ですね。測定した結果、思うようにならなかった時はありませんでしたか？' },
    { role: 'student', content: 'はい、梅雨の時期にpH値が下がってしまい、メダカが元気がなくなったことがありました。' },
    { role: 'interviewer', content: 'pH値が下がった時の対処法は、どのように調べて実行しましたか？' },
    { role: 'student', content: '先生に相談したり、図書館で本を調べました。結果的に水替えの頻度を増やして解決できました。' },
    { role: 'interviewer', content: 'しっかりと原因を調べて解決されたんですね。その過程で一番困ったことはありましたか？' },
    { role: 'student', content: '最初は何が原因かわからなくて、メダカが病気になってしまうのではないかと心配でした。' },
    { role: 'interviewer', content: 'その心配を解決するために、どのような行動を取りましたか？' },
    { role: 'student', content: '環境委員会の友達と一緒に毎日様子を観察して、記録を詳しくつけるようにしました。' }
  ];

  const testData = {
    essayContent: {
      motivation: "明和中学校を志望します。",
      research: "学校見学に行きました。", 
      schoolLife: "友達と一緒に頑張りたいです。",
      future: "将来は科学者になりたいです。",
      inquiryLearning: "メダカの飼育をしています。毎日観察記録をつけています。"
    },
    conversationHistory: conversationHistory,
    questionType: 'follow_up',
    currentStage: 'exploration',
    interviewDepth: 7 // 深度7を明示的に指定
  };

  try {
    console.log('📤 送信データ:');
    console.log(`- 会話履歴長: ${conversationHistory.length}`);
    console.log(`- 深度: ${testData.interviewDepth}`);
    console.log(`- 段階: ${testData.currentStage}`);
    console.log(`- 最後の学生回答: "${conversationHistory[conversationHistory.length - 1].content}"`);
    
    const response = await fetch('http://localhost:3035/api/interview/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 レスポンス状態:', response.status);

    const responseText = await response.text();
    console.log('📥 レスポンス長:', responseText.length);

    if (!response.ok) {
      console.error('❌ HTTPエラー:', response.status, responseText);
      return;
    }

    try {
      const result = JSON.parse(responseText);
      console.log('✅ テスト成功!');
      console.log('📝 生成された質問:', result.question);
      console.log('📊 段階:', result.stageInfo?.currentStage || 'unknown');
      console.log('📊 深度:', result.stageInfo?.depth || 0);
      console.log('🔍 継続性強化:', result.continuityEnhanced ? 'はい' : 'いいえ');
      
      // 質問の内容を分析
      const question = result.question || '';
      console.log('\n🔍 質問分析:');
      console.log('- 長さ:', question.length);
      console.log('- 探究キーワード含有:', /メダカ|pH|観察|記録|測定|環境委員会/.test(question) ? 'はい' : 'いいえ');
      console.log('- 深層質問要素:', /変わった|学んだ|今後|振り返って|体験を通して/.test(question) ? 'はい' : 'いいえ');
      console.log('- 基本質問要素:', /説明してください|教えてください/.test(question) ? 'はい' : 'いいえ');
      
    } catch (parseError) {
      console.error('❌ JSON解析エラー:', parseError);
      console.error('❌ レスポンステキスト:', responseText);
    }
    
  } catch (error) {
    console.error('❌ ネットワークエラー:', error);
  }
}

// テスト実行
testDepth7().catch(console.error);