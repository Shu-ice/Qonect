// 真のAI面接システムテスト

async function testAIInterview() {
  console.log('🧪 真のAI面接システムテスト');
  
  const tests = [
    {
      name: "ふざけた名前",
      userMessage: "野比のぎたです",
      conversationHistory: [{role: 'interviewer', content: '受検番号と名前を教えてください。'}]
    },
    {
      name: "架空の交通手段",
      userMessage: "タケコプターできました",
      conversationHistory: [{role: 'interviewer', content: 'どうやって来ましたか？'}]
    },
    {
      name: "正常な回答",
      userMessage: "電車で来ました",
      conversationHistory: [{role: 'interviewer', content: 'どうやって来ましたか？'}]
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📝 テスト: ${test.name}`);
    console.log(`   入力: "${test.userMessage}"`);
    
    try {
      const response = await fetch('http://localhost:3004/api/interview/ai-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: test.userMessage,
          conversationHistory: test.conversationHistory
        })
      });
      
      const data = await response.json();
      console.log(`   応答: "${data.question}"`);
      console.log(`   判定: ${data.inappropriate ? '❌不適切' : '✅適切'}`);
      if (data.reason) console.log(`   理由: ${data.reason}`);
      
    } catch (error) {
      console.error(`   エラー: ${error.message}`);
    }
  }
}

testAIInterview();