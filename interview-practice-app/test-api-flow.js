// APIフローのテストスクリプト
const fetch = require('node-fetch');

// テスト用の志願理由書データ
const essayContent = {
  motivation: "母が明和高校の卒業生で、楽しかった思い出をよく聞かせてくれました。",
  research: "学校説明会に参加し、先輩方の生き生きとした姿を見て感動しました。",
  schoolLife: "探究活動を通じて、自分の興味を深めたいです。",
  future: "将来は研究者になりたいです。",
  inquiryLearning: "私は小学4年生から学校の環境委員会で校内緑化活動に取り組み、植物の育成過程を観察記録しています。特にメダカの水槽管理では水質と生態の関係性について探究し、pH値の変化が及ぼす影響を継続的に調べています。"
};

// APIテスト関数
async function testInterviewAPI() {
  const baseUrl = 'http://localhost:3003/api/interview';
  
  try {
    // 1. 初回質問（Opening）
    console.log('===== 1. 初回質問（Opening） =====');
    let response = await fetch(`${baseUrl}/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essayContent,
        conversationHistory: [],
        questionType: 'opening',
        currentStage: 'opening',
        interviewDepth: 1
      })
    });
    let data = await response.json();
    console.log('質問:', data.question);
    console.log('段階情報:', data.stageInfo);
    
    // 2. 交通手段の質問
    console.log('\n===== 2. 交通手段の質問 =====');
    const history1 = [
      { role: 'interviewer', content: data.question },
      { role: 'student', content: '1234番、夏目漱石です' }
    ];
    
    response = await fetch(`${baseUrl}/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essayContent,
        conversationHistory: history1,
        currentStage: 'opening',
        interviewDepth: 2
      })
    });
    data = await response.json();
    console.log('質問:', data.question);
    
    // 3. 所要時間の質問
    console.log('\n===== 3. 所要時間の質問 =====');
    const history2 = [
      ...history1,
      { role: 'interviewer', content: data.question },
      { role: 'student', content: '自転車できました' }
    ];
    
    response = await fetch(`${baseUrl}/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essayContent,
        conversationHistory: history2,
        currentStage: 'opening',
        interviewDepth: 3
      })
    });
    data = await response.json();
    console.log('質問:', data.question);
    console.log('段階遷移:', data.stageTransition);
    
    // 4. 探究活動の質問（Exploration段階）
    console.log('\n===== 4. 探究活動の質問（Exploration段階） =====');
    const history3 = [
      ...history2,
      { role: 'interviewer', content: data.question },
      { role: 'student', content: '10分です' }
    ];
    
    response = await fetch(`${baseUrl}/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essayContent,
        conversationHistory: history3,
        currentStage: data.stageTransition ? data.stageTransition.to : 'opening',
        interviewDepth: 1
      })
    });
    data = await response.json();
    console.log('質問:', data.question);
    console.log('準備時間:', data.preparationTime);
    console.log('質問メタ情報:', data.questionMeta);
    
    // 5. 深掘り質問
    console.log('\n===== 5. 深掘り質問 =====');
    const history4 = [
      ...history3,
      { role: 'interviewer', content: data.question },
      { role: 'student', content: essayContent.inquiryLearning }
    ];
    
    response = await fetch(`${baseUrl}/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essayContent,
        conversationHistory: history4,
        currentStage: 'exploration',
        interviewDepth: 2
      })
    });
    data = await response.json();
    console.log('質問:', data.question);
    console.log('質問の意図:', data.questionMeta?.intent);
    console.log('評価軸:', data.questionMeta?.evaluationFocus);
    
  } catch (error) {
    console.error('APIテストエラー:', error);
  }
}

// テスト実行
testInterviewAPI();