// テスト3のデバッグ
const question = "pH値の測定はどのような方法で行いましたか？";
const answer = "pH値の測定はとても重要だと思います。";

console.log('🔍 テスト3デバッグ開始');
console.log(`質問: "${question}"`);
console.log(`回答: "${answer}"`);

// 質問タイプチェック
const questionTypes = {
  method: /どのように|どうやって|どんな方法|どういう風に/.test(question)
};

console.log(`\n📋 質問タイプ分析:`);
console.log(`- method: ${questionTypes.method}`);

// 回答内容チェック
const answerChecks = {
  hasMethod: /使って|して|すると|ように|方法|やり方|手順|測定|試験紙|道具|器具/.test(answer)
};

console.log(`\n📋 回答内容分析:`);
console.log(`- hasMethod: ${answerChecks.hasMethod}`);
console.log(`- 回答に「測定」が含まれる: ${answer.includes('測定')}`);
console.log(`- 回答に「思います」が含まれる: ${answer.includes('思います')}`);
console.log(`- 回答の長さ: ${answer.length}`);

// パターンマッチング
const pattern = (questionTypes.method && !answerChecks.hasMethod && answer.length > 15 &&
  (answer.includes('重要') || answer.includes('大切') || answer.includes('思います') || answer.includes('と思う')));

console.log(`\n🎯 パターンマッチング:`);
console.log(`- questionTypes.method: ${questionTypes.method}`);
console.log(`- !answerChecks.hasMethod: ${!answerChecks.hasMethod}`);
console.log(`- answer.length > 15: ${answer.length > 15}`);
console.log(`- 感想キーワード含む: ${answer.includes('重要') || answer.includes('大切') || answer.includes('思います') || answer.includes('と思う')}`);
console.log(`- 最終結果: ${pattern}`);

console.log('\n✅ デバッグ完了');