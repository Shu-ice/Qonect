/**
 * キーワード検出の問題を調査
 */

const question = "pH値の管理をされているんですね。実際に数値が思うようにならなかった時、どのような工夫をされましたか？";

console.log("🔍 キーワード検出テスト");
console.log(`質問: "${question}"`);

// Hさん用キーワード
const danceKeywords = ['ダンス', '振付', 'チーム', 'ばらつき', '話し合い', '練習', '表現', '文化祭', 'メンバー', '調整', '合わせ', '意見', '分かれ', '解決', '振付合わせ', 'チームメンバー', 'メンバー同士'];
const hKeywordCount = danceKeywords.filter(keyword => question.includes(keyword)).length;

// Tさん用キーワード
const medakaKeywords = ['メダカ', 'pH', '水質', '観察', '記録', '環境委員会', '測定', '飼育', '数値', '対処', '管理', '工夫', '思うようにならない', 'pH値', '数値', '測定', '水質管理'];
const tKeywordCount = medakaKeywords.filter(keyword => question.includes(keyword)).length;

console.log("\n📊 Hさん用キーワード検出:");
console.log(`- キーワードリスト: [${danceKeywords.join(', ')}]`);
console.log(`- 検出数: ${hKeywordCount}`);
danceKeywords.forEach(keyword => {
  if (question.includes(keyword)) {
    console.log(`  ✅ "${keyword}" 検出`);
  }
});

console.log("\n📊 Tさん用キーワード検出:");
console.log(`- キーワードリスト: [${medakaKeywords.join(', ')}]`);
console.log(`- 検出数: ${tKeywordCount}`);
medakaKeywords.forEach(keyword => {
  if (question.includes(keyword)) {
    console.log(`  ✅ "${keyword}" 検出`);
  }
});

console.log("\n🎯 結論:");
console.log(`- この質問はTさん（メダカ）パターン用として分析すべき`);
console.log(`- 正しいキーワード数: ${tKeywordCount}`);
console.log(`- 間違った場合のキーワード数: ${hKeywordCount}`);