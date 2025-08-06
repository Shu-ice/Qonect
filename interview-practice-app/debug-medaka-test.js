// メダカ探究活動のデバッグテスト
const testInquiryLearning = "私は小学4年生から学校の環境委員会で校内緑化活動に取り組み、特にメダカの水槽管理では水質と生態の関係性について探究し、pH値の変化が及ぼす影響を継続的に調べています。";

console.log('=== メダカ探究活動デバッグテスト ===');
console.log('探究活動内容:', testInquiryLearning);
console.log('期待パターン: scientific_individual');
console.log('期待段階: exploration');
console.log('期待質問タイプ: 困難・課題探り、プロセス詳細、失敗体験など');

// APIリクエストのシミュレーション
const testRequest = {
  essayContent: {
    motivation: "明和高校で学びたい",
    research: "進学校として有名",
    schoolLife: "勉強に集中できる環境",
    future: "医師になりたい",
    inquiryLearning: testInquiryLearning
  },
  conversationHistory: [
    { role: 'interviewer', content: 'それでは面接を始めます。受検番号と名前を教えてください。' },
    { role: 'student', content: '1234番 田中太郎です。' },
    { role: 'interviewer', content: 'ありがとうございます。こちらまでは何で来られましたか？' },
    { role: 'student', content: '自転車できました。' },
    { role: 'interviewer', content: '自転車でいらしたんですね。どれくらい時間がかかりましたか？' },
    { role: 'student', content: '30分ぐらいです。' },
    { role: 'interviewer', content: '30分ですか、ちょうど良い距離ですね。それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。' },
    { role: 'student', content: testInquiryLearning }
  ],
  questionType: 'follow_up',
  currentStage: 'exploration',
  interviewDepth: 2
};

console.log('\n=== APIリクエスト内容 ===');
console.log(JSON.stringify(testRequest, null, 2));

console.log('\n次に期待される行動:');
console.log('1. パターン判定: scientific_individual');
console.log('2. exploration段階の深掘り質問生成');
console.log('3. メダカ・水質について具体的な困難や発見を聞く質問');
console.log('4. 「志願理由書」への言及は絶対に避ける');

console.log('\n実際のテストはブラウザコンソールで確認してください:');
console.log('http://localhost:3004/interview');