// 改善された深掘り質問システムのテスト
const testInquiryResponse = `
環境委員会で小学4年生からメダカの飼育をしています。
水質のpH値を毎日記録して、メダカが元気に育つように観察を続けています。
最初は難しくて、メダカが死んでしまったこともありましたが、
先生に相談して水温や餌の量を調整するようになりました。
`;

async function testDeepDiveImprovement() {
  console.log('🧪 改善された深掘り質問システムのテスト開始');
  
  const testPayload = {
    essayContent: {
      motivation: "明和中学校で探究学習を深めたい",
      research: "自由で創造的な学習環境",
      schoolLife: "探究学習に取り組みたい",
      future: "科学者になりたい",
      inquiryLearning: testInquiryResponse
    },
    conversationHistory: [
      { role: 'interviewer', content: 'それでは、あなたが取り組んでいる探究活動について、1分ほどで説明してください。' },
      { role: 'student', content: testInquiryResponse }
    ],
    questionType: 'follow_up',
    currentStage: 'exploration',
    interviewDepth: 2
  };

  try {
    console.log('📤 APIリクエスト送信中...');
    const response = await fetch('http://localhost:3000/api/interview/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    console.log('📥 APIレスポンス:');
    console.log(`✅ 質問: "${result.question}"`);
    console.log(`📊 ステージ情報: ${JSON.stringify(result.stageInfo, null, 2)}`);
    console.log(`🎯 質問メタデータ: ${JSON.stringify(result.questionMeta, null, 2)}`);
    
    // 改善されたかどうかの判定
    const isImproved = (
      result.question.includes('環境委員会') ||
      result.question.includes('メダカ') ||
      result.question.includes('pH値') ||
      result.question.includes('水質') ||
      result.question.includes('4年生') ||
      result.question.includes('困った') ||
      result.question.includes('死んでしまった')
    );
    
    if (isImproved) {
      console.log('🎉 成功: 具体的なキーワードを使った深掘り質問が生成されました！');
    } else {
      console.log('⚠️ 注意: まだ一般的な質問が生成されている可能性があります');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
    throw error;
  }
}

// テスト実行
testDeepDiveImprovement()
  .then(() => console.log('✅ テスト完了'))
  .catch(error => console.error('❌ テスト失敗:', error));