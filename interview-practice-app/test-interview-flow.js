// 面接フローのテストスクリプト
const { DeepDiveEngine } = require('./src/lib/interview/deep-dive-engine.ts');

// テストケース1: Hさんパターン（ダンス）
function testHPattern() {
  console.log('===== Hさんパターンテスト =====');
  const engine = new DeepDiveEngine();
  
  // パターン選択
  const pattern = engine.selectInterviewPattern('私は年中のころからダンスを習っています。小学4年生から同じダンス教室に通う仲間とチームを組み、全国一を目指す選抜チームという活動を始めました。');
  console.log('選択されたパターン:', pattern);
  
  // Opening段階
  const openingQuestions = engine.generateQuestionChain(pattern, 'opening', [], 1);
  console.log('\n[Opening段階の質問]');
  openingQuestions.questions.forEach(q => {
    console.log(`- ${q.id}: ${q.guidanceForAI.topic}`);
  });
  
  // Exploration段階への遷移チェック
  const conversationHistory = [
    { question: '受検番号と名前を教えてください', response: '1111番、Hです' },
    { question: 'ここまでどうやって来られましたか？', response: '母と公共交通機関である電車に乗ってきました' },
    { question: 'どれくらい時間がかかりましたか？', response: '30分くらいです' }
  ];
  
  const nextStage = engine.checkStageTransition('opening', conversationHistory, pattern);
  console.log('\n段階遷移:', nextStage);
  
  // Exploration段階
  if (nextStage === 'exploration') {
    const explorationQuestions = engine.generateQuestionChain(pattern, 'exploration', [], 1);
    console.log('\n[Exploration段階の質問]');
    explorationQuestions.questions.forEach(q => {
      console.log(`- ${q.id}: ${q.guidanceForAI.topic}`);
    });
  }
}

// テストケース2: Tさんパターン（生物飼育）
function testTPattern() {
  console.log('\n\n===== Tさんパターンテスト =====');
  const engine = new DeepDiveEngine();
  
  // パターン選択
  const pattern = engine.selectInterviewPattern('僕はよく生物の飼育をしているのですが、その生物が何を感じているのかとか、何をストレスと思っているのかがわからなくて、すごく難しいと思った');
  console.log('選択されたパターン:', pattern);
  
  // Exploration段階の質問
  const explorationQuestions = engine.generateQuestionChain(pattern, 'exploration', [], 1);
  console.log('\n[Exploration段階の質問]');
  explorationQuestions.questions.forEach(q => {
    console.log(`- ${q.id}: ${q.guidanceForAI.topic}`);
  });
}

// テストケース3: 新パターン（プログラミング）
function testTechPattern() {
  console.log('\n\n===== 技術系パターンテスト =====');
  const engine = new DeepDiveEngine();
  
  // パターン選択
  const pattern = engine.selectInterviewPattern('私は小学3年生からプログラミングを始めて、自分でゲームやアプリを作っています。特にUnityを使った3Dゲーム開発に熱中しています。');
  console.log('選択されたパターン:', pattern);
  
  // Exploration段階の質問
  const explorationQuestions = engine.generateQuestionChain(pattern, 'exploration', [], 1);
  console.log('\n[Exploration段階の質問]');
  explorationQuestions.questions.forEach(q => {
    console.log(`- ${q.id}: ${q.guidanceForAI.topic}`);
  });
}

// テストケース4: 生徒会長パターン
function testLeadershipPattern() {
  console.log('\n\n===== リーダーシップ系パターンテスト =====');
  const engine = new DeepDiveEngine();
  
  // パターン選択
  const pattern = engine.selectInterviewPattern('私は生徒会長として、学校行事の企画運営や生徒の意見をまとめる活動をしています。みんなの意見を聞いて、より良い学校を作るために頑張っています。');
  console.log('選択されたパターン:', pattern);
  
  // Exploration段階の質問
  const explorationQuestions = engine.generateQuestionChain(pattern, 'exploration', [], 1);
  console.log('\n[Exploration段階の質問]');
  explorationQuestions.questions.forEach(q => {
    console.log(`- ${q.id}: ${q.guidanceForAI.topic}`);
  });
}

// テスト実行
try {
  testHPattern();
  testTPattern();
  testTechPattern();
  testLeadershipPattern();
} catch (error) {
  console.error('テストエラー:', error);
}