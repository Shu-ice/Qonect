/**
 * 連続性強化システムのテスト用スクリプト
 * extractContinuityKeywords関数とgetDepthStrategy関数の動作を確認
 */

// テスト用の関数（APIから抽出）
function extractContinuityKeywords(studentResponse) {
  const keywords = [];
  
  // 活動関連キーワード
  const activityKeywords = studentResponse.match(/メダカ|ダンス|環境委員会|pH|水質|振付|チーム|観察|記録|測定|練習|発表|文化祭|委員会|植物|育成/g) || [];
  keywords.push(...activityKeywords);
  
  // 困難・課題キーワード
  const challengeKeywords = studentResponse.match(/困った|大変|難しかった|うまくいかな|失敗|問題|課題|苦労|死んで|だめ|悪く/g) || [];
  keywords.push(...challengeKeywords);
  
  // 協力・人物キーワード
  const peopleKeywords = studentResponse.match(/先生|友達|仲間|みんな|一緒|母|父|チームメンバー|クラスメート/g) || [];
  keywords.push(...peopleKeywords);
  
  // 感情・体験キーワード
  const emotionKeywords = studentResponse.match(/嬉しかった|楽しかった|悲しかった|驚いた|発見|気づいた|学んだ|感じた/g) || [];
  keywords.push(...emotionKeywords);
  
  // 方法・プロセスキーワード
  const methodKeywords = studentResponse.match(/使って|試験紙|道具|器具|測定|手順|方法|やり方|工夫|改善|対処/g) || [];
  keywords.push(...methodKeywords);
  
  // 重複削除
  return [...new Set(keywords)];
}

function getDepthStrategy(depth) {
  if (depth <= 2) {
    return {
      strategy: '基本情報の確認と活動詳細の把握',
      focus: '活動の概要、始めたきっかけ、基本的な取り組み内容',
      questionTypes: '「いつから」「どのような」「なぜ始めた」',
      examples: [
        '「その活動はいつ頃から始められたのですか？」',
        '「最初に始めようと思ったきっかけは何でしたか？」'
      ]
    };
  } else if (depth <= 4) {
    return {
      strategy: '困難・課題の詳細探求',
      focus: 'うまくいかなかった体験、直面した問題、課題への対処',
      questionTypes: '「困ったこと」「大変だったこと」「うまくいかなかった」',
      examples: [
        '「その活動で一番困ったことは何でしたか？」',
        '「思うようにいかなかった時はどう対処しましたか？」'
      ]
    };
  } else if (depth <= 6) {
    return {
      strategy: '協力・支援関係の探求',
      focus: '周りの人との協力、先生や友達からの支援、チームワーク',
      questionTypes: '「誰と一緒に」「先生に相談」「友達の協力」',
      examples: [
        '「それは一人で解決しましたか、それとも誰かと一緒でしたか？」',
        '「その時、先生や友達からのアドバイスはありましたか？」'
      ]
    };
  } else {
    return {
      strategy: '深層体験・メタ認知の探求',
      focus: '自己変化の実感、学びの本質、継続への意欲',
      questionTypes: '「どう変わった」「何を学んだ」「今後どうしたい」',
      examples: [
        '「その体験を通して、自分自身はどのように変わりましたか？」',
        '「今振り返ってみて、一番大きな学びは何でしたか？」'
      ]
    };
  }
}

// テストケース
const keywordTestCases = [
  {
    name: "Hさんダンスパターン",
    response: "小学3年生からチームダンスに取り組んでいます。最初は振付を覚えるのが精一杯でしたが、だんだんチーム全体の表現を合わせることの大切さを学びました。特に文化祭の発表では、みんなで何度も話し合って、それぞれの動きを調整しました。振付にばらつきがあってなかなかそろわなかったのですが、お互いの動きを見ながら練習を重ねて、最終的にはとても良い発表ができました。",
    expectedKeywords: ["ダンス", "チーム", "振付", "文化祭", "発表", "練習", "みんな", "学んだ"]
  },
  {
    name: "Tさんメダカパターン",
    response: "小学4年生から環境委員会に所属して、メダカの飼育と水質管理をしています。最初はただ餌をあげるだけでしたが、だんだん水の汚れやpH値に興味を持つようになりました。pH値を測定して記録をつけたり、水温や酸素量も調べています。時々メダカが死んでしまうこともあって悲しかったのですが、原因を調べて改善策を考えるようになりました。",
    expectedKeywords: ["環境委員会", "委員会", "メダカ", "水質", "pH", "測定", "記録", "悲しかった", "改善"]
  },
  {
    name: "困難体験パターン",
    response: "その時は本当に困りました。先生に相談してみたのですが、なかなか解決策が見つからず大変でした。友達と一緒に工夫して、最終的には問題を解決することができて嬉しかったです。",
    expectedKeywords: ["困った", "大変", "先生", "友達", "一緒", "工夫", "問題", "嬉しかった"]
  }
];

const depthTestCases = [
  { depth: 1, expectedStrategy: "基本情報の確認と活動詳細の把握" },
  { depth: 2, expectedStrategy: "基本情報の確認と活動詳細の把握" },
  { depth: 3, expectedStrategy: "困難・課題の詳細探求" },
  { depth: 4, expectedStrategy: "困難・課題の詳細探求" },
  { depth: 5, expectedStrategy: "協力・支援関係の探求" },
  { depth: 6, expectedStrategy: "協力・支援関係の探求" },
  { depth: 7, expectedStrategy: "深層体験・メタ認知の探求" },
  { depth: 8, expectedStrategy: "深層体験・メタ認知の探求" }
];

console.log("🔗 連続性強化システムテスト開始\n");

// キーワード抽出テスト
console.log("=== キーワード抽出テスト ===");
keywordTestCases.forEach((testCase, index) => {
  const extractedKeywords = extractContinuityKeywords(testCase.response);
  const foundExpectedKeywords = testCase.expectedKeywords.filter(keyword => 
    extractedKeywords.includes(keyword)
  );
  
  console.log(`\nテスト ${index + 1}: ${testCase.name}`);
  console.log(`回答: "${testCase.response.substring(0, 100)}..."`);
  console.log(`期待キーワード: [${testCase.expectedKeywords.join(', ')}]`);
  console.log(`抽出キーワード: [${extractedKeywords.join(', ')}]`);
  console.log(`一致数: ${foundExpectedKeywords.length}/${testCase.expectedKeywords.length}`);
  console.log(`結果: ${foundExpectedKeywords.length >= testCase.expectedKeywords.length * 0.6 ? '✅ 成功' : '❌ 失敗'}`);
});

// 深度戦略テスト
console.log("\n\n=== 深度戦略テスト ===");
depthTestCases.forEach((testCase, index) => {
  const strategy = getDepthStrategy(testCase.depth);
  const isCorrect = strategy.strategy === testCase.expectedStrategy;
  
  console.log(`\nテスト ${index + 1}: 深度${testCase.depth}層`);
  console.log(`期待戦略: ${testCase.expectedStrategy}`);
  console.log(`実際戦略: ${strategy.strategy}`);
  console.log(`フォーカス: ${strategy.focus}`);
  console.log(`質問タイプ: ${strategy.questionTypes}`);
  console.log(`結果: ${isCorrect ? '✅ 成功' : '❌ 失敗'}`);
});

console.log("\n🎯 連続性強化システムテスト完了");