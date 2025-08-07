// 最小限のAPIテスト
const fetch = require('node-fetch');

async function minimalTest() {
  console.log('🧪 最小限API接続テスト開始');
  
  try {
    // まずGETでヘルスチェック（認証不要のはず）
    console.log('1. GET /api/test-simple');
    const getResponse = await fetch('http://localhost:3003/api/test-simple');
    console.log(`Status: ${getResponse.status}`);
    if (getResponse.status !== 401) {
      const data = await getResponse.text();
      console.log(`Response: ${data.substring(0, 200)}`);
    } else {
      console.log('GET request requires auth, skipping');
    }
    
    // 面接APIの最小限テスト（問題の診断）
    console.log('\n2. POST /api/interview/generate-question (最小限)');
    const minimalPayload = {
      essayContent: { inquiryLearning: "test" },
      currentStage: "opening",
      interviewDepth: 1
    };
    
    const postResponse = await fetch('http://localhost:3003/api/interview/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minimalPayload)
    });
    
    console.log(`Status: ${postResponse.status}`);
    const responseText = await postResponse.text();
    
    if (postResponse.status === 500) {
      // HTMLレスポンスの場合、エラーメッセージのみ抽出
      const errorMatch = responseText.match(/"message":"([^"]+)"/);
      if (errorMatch) {
        console.log(`❌ サーバーエラー: ${errorMatch[1]}`);
      } else {
        console.log('❌ 500エラーが発生（詳細不明）');
      }
    } else {
      console.log(`✅ 正常レスポンス: ${responseText.substring(0, 200)}`);
    }
    
  } catch (error) {
    console.log(`❌ 接続エラー: ${error.message}`);
  }
}

minimalTest();