// 合格者面接例の再現テスト
const { DeepDiveEngine } = require('./dist/lib/interview/deep-dive-engine.js');

// Hさんの面接を再現
function simulateHInterview() {
  console.log('===== Hさん面接シミュレーション =====\n');
  const engine = new DeepDiveEngine();
  
  const essayContent = {
    inquiryLearning: "私は年中のころからダンスを習っています。その中で小学4年生から同じダンス教室に通う仲間とチームを組み、全国一を目指す選抜チームという活動を始めました。"
  };
  
  // パターン選択
  const pattern = engine.selectInterviewPattern(essayContent.inquiryLearning);
  console.log(`選択パターン: ${pattern}\n`);
  
  // 面接の流れ
  const interview = [
    { stage: 'opening', depth: 1, response: '1111番、Hです。' },
    { stage: 'opening', depth: 2, response: '母と公共交通機関である電車に乗ってきました。' },
    { stage: 'opening', depth: 3, response: 'JRに乗ってから、大曽根駅で降りて名鉄瀬戸線に乗って東大手駅まで来てここまで歩いてきました' },
    { stage: 'exploration', depth: 1, response: essayContent.inquiryLearning },
    { stage: 'exploration', depth: 2, response: '私は幼少期から音楽を聴いて音に乗って踊ることが好きで、私がダンスを年中になってから始めたいと言ったときに母がやってみたらどうと勧めてくれてやろうと思いました。' },
    { stage: 'exploration', depth: 3, response: '16人います。' },
    { stage: 'exploration', depth: 4, response: 'ジャンルごとに分かれているんですが、基本の人数は3人です。' },
    { stage: 'exploration', depth: 5, response: 'それぞれの曲の構成の中で伝えたい想いやダンスがあって、その伝えたい想いやダンスにあっている先生たちがダンス教室の中から代表して選ばれて振りを作っていく、という感じでした。' }
  ];
  
  let conversationHistory = [];
  
  interview.forEach((turn, index) => {
    console.log(`\n--- ターン ${index + 1} (${turn.stage} / 深度${turn.depth}) ---`);
    
    // 質問生成
    const questionChain = engine.generateQuestionChain(pattern, turn.stage, [], turn.depth);
    console.log(`利用可能な質問数: ${questionChain.questions.length}`);
    
    if (questionChain.questions.length > 0) {
      const question = questionChain.questions[0];
      console.log(`質問ID: ${question.id}`);
      console.log(`質問ガイダンス: ${question.guidanceForAI.topic}`);
      console.log(`期待深度: ${question.expectedDepth}`);
    }
    
    // 段階遷移チェック
    if (conversationHistory.length > 0) {
      const pairs = [];
      for (let i = 0; i < conversationHistory.length; i += 2) {
        if (conversationHistory[i] && conversationHistory[i + 1]) {
          pairs.push({
            question: conversationHistory[i],
            response: conversationHistory[i + 1]
          });
        }
      }
      
      const nextStage = engine.checkStageTransition(turn.stage, pairs, pattern);
      if (nextStage && nextStage !== turn.stage) {
        console.log(`⚡ 段階遷移検出: ${turn.stage} → ${nextStage}`);
      }
    }
    
    // 会話履歴に追加
    conversationHistory.push(`質問${index + 1}`);
    conversationHistory.push(turn.response);
  });
}

// Tさんの面接を再現
function simulateTInterview() {
  console.log('\n\n===== Tさん面接シミュレーション =====\n');
  const engine = new DeepDiveEngine();
  
  const essayContent = {
    inquiryLearning: "僕が探究活動について思ったことは、僕はよく生物の飼育をしているのですが、その生物が何を感じているのかとか、何をストレスと思っているのかがわからなくて、すごく難しいと思った"
  };
  
  // パターン選択
  const pattern = engine.selectInterviewPattern(essayContent.inquiryLearning);
  console.log(`選択パターン: ${pattern}\n`);
  
  // 特徴的な深掘り質問の確認
  const explorationQuestions = engine.generateQuestionChain(pattern, 'exploration', [], 1);
  console.log('探究段階の質問:');
  explorationQuestions.questions.forEach((q, idx) => {
    console.log(`${idx + 1}. ${q.guidanceForAI.topic}`);
    console.log(`   スタイル: ${q.guidanceForAI.style}`);
    console.log(`   要素: ${q.guidanceForAI.elements.join(', ')}`);
  });
}

// 環境委員会パターンのテスト
function testEnvironmentalCommittee() {
  console.log('\n\n===== 環境委員会パターンテスト =====\n');
  const engine = new DeepDiveEngine();
  
  const essayContent = {
    inquiryLearning: "私は小学4年生から学校の環境委員会で校内緑化活動に取り組み、植物の育成過程を観察記録しています。特にメダカの水槽管理では水質と生態の関係性について探究し、pH値の変化が及ぼす影響を継続的に調べています。"
  };
  
  // パターン選択（科学系になるはず）
  const pattern = engine.selectInterviewPattern(essayContent.inquiryLearning);
  console.log(`選択パターン: ${pattern}`);
  console.log('期待パターン: scientific_individual');
  console.log(`判定結果: ${pattern === 'scientific_individual' ? '✅ 正しい' : '❌ 誤り'}`);
}

// 実行
try {
  simulateHInterview();
  simulateTInterview();
  testEnvironmentalCommittee();
} catch (error) {
  console.error('シミュレーションエラー:', error.message);
  console.log('\n注意: TypeScriptファイルの直接実行はできません。実際の動作確認は開発サーバーで行ってください。');
}