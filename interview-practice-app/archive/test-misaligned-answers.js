/**
 * かみ合わない回答のテスト用スクリプト
 * 実装されたcheckAnswerAlignment関数の動作を確認
 */

// テスト用の関数（APIから抽出）
function checkAnswerAlignment(question, answer) {
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
    feeling: /どう思|どう感じ|気持ち|印象/.test(question)
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
    hasFeeling: /思った|感じた|嬉しかった|楽しかった|悲しかった/.test(answer)
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
    // 「はい」「いいえ」だけの短すぎる回答（詳細を求められている場合）
    ((answer === 'はい' || answer === 'いいえ' || answer.length < 10) && 
     (question.includes('詳しく') || question.includes('説明') || question.includes('教えて')))
  ];

  // いずれかのパターンに該当すればtrue（かみ合っていない）
  return misalignedPatterns.some(pattern => pattern);
}

// テストケース
const testCases = [
  {
    name: "時間を聞かれているのに理由を答える",
    question: "どれくらい時間がかかりましたか？",
    answer: "朝早く家を出たのは、遅刻したくなかったからです。",
    expected: true
  },
  {
    name: "困難を聞かれているのに楽しかったことを答える",
    question: "メダカの飼育で一番困ったことは何でしたか？",
    answer: "メダカの赤ちゃんが生まれた時はとても嬉しかったです。みんなで観察して楽しかったです。",
    expected: true
  },
  {
    name: "方法を聞かれているのに感想だけ答える",
    question: "pH値の測定はどのような方法で行いましたか？",
    answer: "pH値の測定はとても重要だと思います。",
    expected: true
  },
  {
    name: "時間の質問に適切に回答",
    question: "どれくらい時間がかかりましたか？",
    answer: "30分くらいかかりました。",
    expected: false
  },
  {
    name: "困難の質問に適切に回答",
    question: "メダカの飼育で一番困ったことは何でしたか？",
    answer: "水質管理が難しくて、最初はメダカが死んでしまうこともありました。",
    expected: false
  },
  {
    name: "方法の質問に適切に回答",
    question: "pH値の測定はどのような方法で行いましたか？",
    answer: "専用の試験紙を使って、毎日同じ時間に測定するようにしました。",
    expected: false
  }
];

console.log("🧪 かみ合わない回答検出テスト開始\n");

testCases.forEach((testCase, index) => {
  const result = checkAnswerAlignment(testCase.question, testCase.answer);
  const status = result === testCase.expected ? "✅ 成功" : "❌ 失敗";
  
  console.log(`テスト ${index + 1}: ${testCase.name}`);
  console.log(`質問: "${testCase.question}"`);
  console.log(`回答: "${testCase.answer}"`);
  console.log(`期待値: ${testCase.expected ? "かみ合わない" : "適切"}`);
  console.log(`実際: ${result ? "かみ合わない" : "適切"}`);
  console.log(`結果: ${status}\n`);
});

console.log("🎯 テスト完了");