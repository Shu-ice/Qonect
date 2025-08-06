import {
  generateQuestionsFromEssay,
  evaluateResponse as _evaluateResponse,
  summarizeSession as _summarizeSession
} from "@/lib/ai/gemini-only";

export const multiAI = {
  async generateQuestions(params: {
    schoolKey?: "meiwa";
    essaySummary?: string;
    essaySummary400ja?: string;
    desiredCount?: number;
    lastAnswerKeyPoints?: string;
  }) {
    const essaySummary400ja = (params.essaySummary400ja || params.essaySummary || "").slice(0, 800);
    return generateQuestionsFromEssay({
      schoolKey: params.schoolKey || "meiwa",
      essaySummary400ja,
      lastAnswerKeyPoints: params.lastAnswerKeyPoints || "",
      desiredCount: params.desiredCount ?? 8
    });
  },
  async evaluateResponse(params: {
    question?: string;
    intent?: string;
    answer: string;
    questionText?: string;
    questionIntent?: string;
  }) {
    return _evaluateResponse({
      questionText: params.questionText || params.question || "",
      questionIntent: params.questionIntent || params.intent || "",
      userAnswer: params.answer
    });
  },
  async summarize(params: {
    evaluations: { question: string; answer: string; eval: { score: number; strengths: string[]; suggestions: string[] } }[];
    schoolKey?: "meiwa";
  }) {
    return _summarizeSession({
      schoolKey: params.schoolKey || "meiwa",
      evaluations: params.evaluations
    });
  },
  // 既存のAPIとの互換性のため
  async generateWithTripleAI(prompt: string, systemPrompt?: string, options?: any) {
    // エッセイ要約を抽出
    const essayMatch = prompt.match(/志望動機:\s*([^\n]+)/);
    const essaySummary = essayMatch ? essayMatch[1] : prompt.slice(0, 400);
    
    // 操作タイプによって適切な関数を呼び出し
    if (options?.operation === 'question_generation' || options?.operation === 'dynamic_question_generation') {
      const questions = await generateQuestionsFromEssay({
        schoolKey: "meiwa",
        essaySummary400ja: essaySummary,
        desiredCount: 1
      });
      return {
        content: questions[0]?.text || "質問を生成できませんでした",
        provider: 'gemini' as const,
        model: 'gemini-1.5-flash'
      };
    } else if (options?.operation === 'evaluation') {
      // 評価の場合はプロンプトからパラメータを抽出
      const questionMatch = prompt.match(/面接質問:\s*"([^"]+)"/);
      const answerMatch = prompt.match(/受験生の回答:\s*"([^"]+)"/);
      const question = questionMatch ? questionMatch[1] : "";
      const answer = answerMatch ? answerMatch[1] : "";
      
      const result = await _evaluateResponse({
        questionText: question,
        userAnswer: answer
      });
      
      // 既存フォーマットに変換
      const jsonResponse = {
        score: result.score,
        points: result.strengths,
        suggestions: result.suggestions
      };
      
      return {
        content: JSON.stringify(jsonResponse),
        provider: 'gemini' as const,
        model: 'gemini-1.5-pro'
      };
    }
    
    // その他の場合はGemini APIに直接プロンプトを送信
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        provider: 'gemini' as const,
        model: 'gemini-1.5-flash'
      };
    } catch (error) {
      console.error('Gemini API エラー:', error);
      // フォールバック：エラー時もなるべく固定セリフを避ける
      const fallbackPrompts = [
        '申し訳ございません。もう一度お答えいただけますでしょうか？',
        'すみません、少しお時間をいただけますか？',
        '恐れ入りますが、もう一度お聞かせください。',
        'ありがとうございます。続けてお話しください。'
      ];
      const randomIndex = Math.floor(Math.random() * fallbackPrompts.length);
      
      return {
        content: fallbackPrompts[randomIndex],
        provider: 'fallback' as const,
        model: 'fallback'
      };
    }
  }
};