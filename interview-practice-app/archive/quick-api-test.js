/**
 * 迅速なAPIテスト
 */

const testData = {
  essayContent: {
    motivation: "明和中学校を志望します。",
    research: "学校見学に行きました。", 
    schoolLife: "友達と一緒に頑張りたいです。",
    future: "将来は科学者になりたいです。",
    inquiryLearning: "メダカの飼育をしています。毎日観察記録をつけています。"
  },
  conversationHistory: [
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
    { role: 'student', content: '環境委員会の友達と一緒に毎日様子を観察して、記録を詳しくつけるようにしました。' }
  ],
  questionType: 'follow_up',
  currentStage: 'exploration',
  interviewDepth: 7
};

fetch('http://localhost:3035/api/interview/generate-question', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => {
  console.log('Status:', res.status);
  return res.text();
})
.then(text => {
  console.log('Response:', text.substring(0, 500) + '...');
  if (text.startsWith('{')) {
    const result = JSON.parse(text);
    console.log('\n✅ 生成された質問:', result.question);
    console.log('📊 段階:', result.stageInfo?.currentStage);
    console.log('📊 深度:', result.stageInfo?.depth);
    console.log('🔍 継続強化:', result.continuityEnhanced);
  }
})
.catch(console.error);