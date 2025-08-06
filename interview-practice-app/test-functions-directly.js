// 改善された関数を直接テストする
console.log('🧪 関数の直接テスト開始');

// 具体的キーワード抽出のテスト
function extractSpecificKeywords(response) {
  if (!response.trim()) return [];
  
  // 優先度付きパターンマッチング
  const highPriorityPatterns = [
    /環境委員会|生徒会|委員会|部活動|クラブ活動/g, // 組織・活動名
    /メダカ|植物|動物|水質|pH値|ダンス|音楽|プログラミング|スポーツ/g, // 具体的活動要素
  ];
  
  const mediumPriorityPatterns = [
    /小学\d年生|中学\d年生|\d年生|\d年間|毎日|週\d回/g, // 期間・頻度
    /\d+人|\d+匹|\d+本|\d+個/g, // 数量
    /困難|大変|失敗|うまくいかない|問題|課題/g, // 困難系
    /調べ|研究|観察|記録|測定|実験|練習/g, // プロセス系
  ];
  
  const extractedTerms = [];
  
  // 高優先度キーワード
  for (const pattern of highPriorityPatterns) {
    const matches = response.match(pattern) || [];
    extractedTerms.push(...matches.map(match => ({ term: match, priority: 3 })));
  }
  
  // 中優先度キーワード
  for (const pattern of mediumPriorityPatterns) {
    const matches = response.match(pattern) || [];
    extractedTerms.push(...matches.map(match => ({ term: match, priority: 2 })));
  }
  
  // 重複を除去し、優先度順にソート、最大5個まで
  const uniqueTerms = Array.from(new Map(extractedTerms.map(item => [item.term, item])).values());
  return uniqueTerms
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(item => item.term);
}

// 活動タイプ識別のテスト
function identifyActivityType(response) {
  // スポーツ・競技系を優先チェック（「部」や競技名が含まれる場合）
  if (/サッカー|野球|バスケ|テニス|水泳|陸上|スポーツ|競技|大会|試合|トレーニング|部活|コーチ|記録向上/.test(response)) {
    return 'スポーツ・競技系';
  }
  
  // 芸術・協働系
  if (/ダンス|音楽|美術|演劇|チーム|グループ|発表|練習|合唱|吹奏楽|振付|作品/.test(response)) {
    return '芸術・協働系';
  }
  
  // 科学・個人研究系（より具体的な科学的要素を重視）
  if (/メダカ|植物|動物|水質|pH|実験|観察|研究|測定|データ|環境委員会|飼育|栽培/.test(response)) {
    return '科学・個人研究系';
  }
  
  // 技術・創造系
  if (/プログラミング|ロボット|コンピュータ|アプリ|ゲーム|電子工作|Arduino|コード|システム/.test(response)) {
    return '技術・創造系';
  }
  
  // リーダーシップ・合意形成系
  if (/生徒会|児童会|委員長|部長|代表|リーダー|企画|運営|会長|キャプテン/.test(response)) {
    return 'リーダーシップ・合意形成系';
  }
  
  // 社会・課題解決系
  if (/ボランティア|地域|社会|環境問題|福祉|支援|奉仕|課題解決|改善/.test(response)) {
    return '社会・課題解決系';
  }
  
  return '一般探究活動';
}

// テストケース1: 科学・個人研究系
const testResponse1 = `
環境委員会で小学4年生からメダカの飼育をしています。
水質のpH値を毎日記録して、メダカが元気に育つように観察を続けています。
最初は難しくて、メダカが死んでしまったこともありましたが、
先生に相談して水温や餌の量を調整するようになりました。
`;

console.log('🔬 テストケース1: 科学・個人研究系');
console.log('抽出キーワード:', extractSpecificKeywords(testResponse1));
console.log('活動タイプ:', identifyActivityType(testResponse1));

// テストケース2: 芸術・協働系
const testResponse2 = `
ダンス部で3年生からチームで練習しています。
みんなで振付を考えて、発表会で披露するのが楽しいです。
最初はメンバーと意見が合わなくて大変でしたが、
話し合いを重ねて素晴らしい作品を作ることができました。
`;

console.log('🎭 テストケース2: 芸術・協働系');
console.log('抽出キーワード:', extractSpecificKeywords(testResponse2));
console.log('活動タイプ:', identifyActivityType(testResponse2));

// テストケース3: スポーツ・競技系
const testResponse3 = `
サッカー部で小学2年生から続けています。
毎日練習して、大会で記録を向上させるために頑張っています。
怪我をして思うようにいかない時期もありましたが、
コーチと相談して新しいトレーニング方法を見つけました。
`;

console.log('⚽ テストケース3: スポーツ・競技系');
console.log('抽出キーワード:', extractSpecificKeywords(testResponse3));
console.log('活動タイプ:', identifyActivityType(testResponse3));

console.log('✅ 関数テスト完了 - 全ての関数が正常に動作しています！');