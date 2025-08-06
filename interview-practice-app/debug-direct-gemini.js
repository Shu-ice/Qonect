// Gemini API直接呼び出しデバッグ
const testGeminiDirectly = async () => {
  console.log('🔍 Gemini API直接デバッグテスト');
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = 'AIzaSyDhSwuxAwrIccB5L4GG0Y7jvz6Rabe21qk';
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log('📝 テスト1: 交通手段質問生成');
    const prompt1 = `あなたは明和高校附属中学校の面接官です。品格を保ち、簡潔で丁寧な質問を心がけてください。

【明和中学校面接：交通手段質問生成】

受験生の自己紹介：「1234番橋本健一です」

面接官として、受験生の名前を確認した後、来校時の交通手段について1つの簡潔な質問を生成してください。

【重要な要件】:
1. 面接官らしい品格を保つ丁寧な口調
2. 簡潔で直接的な質問（余計な前置きは不要）
3. 必ず「？」で終わる質問
4. 1文で完結

【例】:
- 「こちらまではどのような交通手段でいらっしゃいましたか？」
- 「今日はどうやってお越しになりましたか？」

簡潔で丁寧な1つの質問を生成してください：`;
    
    const result1 = await model.generateContent(prompt1);
    const response1 = await result1.response;
    console.log('✅ 結果1:', response1.text());
    
    console.log('\n📝 テスト2: 所要時間質問生成');
    const prompt2 = `あなたは明和高校附属中学校の面接官です。品格を保ち、簡潔で丁寧な質問を心がけてください。

【明和中学校面接：所要時間質問生成】

受験生の交通手段回答：「電車できました」

面接官として、受験生の交通手段を受けて、所要時間について簡潔に質問してください。

【重要な要件】:
1. 面接官らしい品格を保つ丁寧な口調
2. 簡潔で直接的な質問（余計な相槌や前置きは不要）
3. 必ず「？」で終わる質問
4. 1文で完結

【例】:
- 「どのくらいお時間がかかりましたか？」
- 「何分ほどかかりましたか？」

簡潔で丁寧な1つの質問を生成してください：`;
    
    const result2 = await model.generateContent(prompt2);
    const response2 = await result2.response;
    console.log('✅ 結果2:', response2.text());
    
    console.log('\n📝 テスト3: 探究活動開始質問生成');
    const prompt3 = `あなたは明和高校附属中学校の面接官です。品格を保ち、簡潔で要点を絞った質問を心がけてください。

【明和中学校面接：探究学習質問生成】

受験生の所要時間回答：「30分です」

面接官として、本題の探究学習について質問してください。

【重要な要件】:
1. 面接官らしい品格を保つ丁寧な口調
2. 簡潔で要点を絞った質問
3. 本題に入ることを明確に示す
4. 必ず「？」で終わる質問
5. 2-3文で完結

【例】:
- 「それでは本題に入らせていただきます。あなたが取り組んでいる探究学習について教えてください。」
- 「では、探究学習についてお聞かせください。どのような活動をされていますか？」

簡潔で丁寧な質問を生成してください：`;
    
    const result3 = await model.generateContent(prompt3);
    const response3 = await result3.response;
    console.log('✅ 結果3:', response3.text());
    
  } catch (error) {
    console.error('❌ Gemini APIエラー:', error);
  }
};

testGeminiDirectly();