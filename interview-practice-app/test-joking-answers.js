/**
 * ふざけた回答検出機能のテスト用スクリプト
 * 実装されたcheckJokingAnswer関数の動作を確認
 */

// テスト用の関数（APIから抽出）
function checkJokingAnswer(question, answer) {
  // 明らかにふざけた回答のパターン
  const jokingPatterns = [
    // アニメ・漫画・ゲーム関連
    /どこでもドア|タイムマシン|ワープ|テレポート|瞬間移動|魔法|忍術|超能力/,
    /ドラえもん|ポケモン|マリオ|ピカチュウ|悟空|ナルト|ルフィ|コナン/,
    /ゲーム|プレステ|スイッチ|DS|ファミコン|スマホゲーム/,
    
    // 非現実的な交通手段・方法
    /空を飛んで|飛行機で家から|ロケット|UFO|宇宙船|竜|ドラゴン|ペガサス|ユニコーン/,
    /走って1分|光の速度|音速|時速1000|瞬間移動|ワープして/,
    
    // 食べ物・動物での移動
    /パンに乗って|お寿司で|ラーメンで|カレーライスで|犬に乗って|猫と一緒に|象に乗って/,
    
    // 明らかな嘘・誇張
    /宇宙から|月から|火星から|異世界から|未来から|過去から|別次元/,
    /1000歳|100歳|500年前|昨日生まれた|宇宙人|ロボット|AI/,
    
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
    contextuallyInappropriate = /ゲーム|アニメ|漫画|YouTube|TikTok|スマホ|寝ること|食べること/.test(answer);
  }

  // 絵文字だけの回答
  const isEmojiOnly = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u.test(answer.trim());

  return isObviouslyJoking || isMeaningless || contextuallyInappropriate || isEmojiOnly;
}

// テストケース
const testCases = [
  {
    name: "どこでもドアでの来校",
    question: "こちらまでは何で来られましたか？",
    answer: "どこでもドアで来ました。",
    expected: true
  },
  {
    name: "瞬間移動の時間",
    question: "どれくらい時間がかかりましたか？",
    answer: "0秒です。瞬間移動なので。",
    expected: true
  },
  {
    name: "ポケモン研究",
    question: "あなたの探究活動について教えてください。",
    answer: "ポケモンの研究をしています。ピカチュウと一緒に電気の実験をしています。",
    expected: true
  },
  {
    name: "宇宙人の名前",
    question: "受検番号と名前を教えてください。",
    answer: "受検番号999番、宇宙人Xです。",
    expected: true
  },
  {
    name: "正常な交通手段",
    question: "こちらまでは何で来られましたか？",
    answer: "電車で来ました。",
    expected: false
  },
  {
    name: "正常な時間回答",
    question: "どれくらい時間がかかりましたか？",
    answer: "30分くらいです。",
    expected: false
  },
  {
    name: "正常な探究活動",
    question: "あなたの探究活動について教えてください。",
    answer: "環境委員会でメダカの飼育をしています。",
    expected: false
  },
  {
    name: "ゲーム関連の活動",
    question: "普段どんな活動をしていますか？",
    answer: "ゲームをしています。",
    expected: true
  },
  {
    name: "空を飛ぶ移動",
    question: "どうやってここまで来ましたか？",
    answer: "空を飛んで来ました。",
    expected: true
  },
  {
    name: "絵文字だけの回答",
    question: "どう思いますか？",
    answer: "😀😀😀",
    expected: true
  }
];

console.log("🎭 ふざけた回答検出テスト開始\n");

let successCount = 0;
testCases.forEach((testCase, index) => {
  const result = checkJokingAnswer(testCase.question, testCase.answer);
  const status = result === testCase.expected ? "✅ 成功" : "❌ 失敗";
  
  if (result === testCase.expected) {
    successCount++;
  }
  
  console.log(`テスト ${index + 1}: ${testCase.name}`);
  console.log(`質問: "${testCase.question}"`);
  console.log(`回答: "${testCase.answer}"`);
  console.log(`期待値: ${testCase.expected ? "ふざけた回答" : "適切"}`);
  console.log(`実際: ${result ? "ふざけた回答" : "適切"}`);
  console.log(`結果: ${status}\n`);
});

console.log(`🎯 テスト完了: ${successCount}/${testCases.length} 成功`);