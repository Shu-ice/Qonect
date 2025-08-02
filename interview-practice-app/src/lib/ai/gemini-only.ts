// lib/ai/gemini-only.ts
// Gemini専用ラッパ：生成(FLASH) / 評価・総括(PRO)
// フォールバック：短縮再投 → テンプレ質問/軽量評価
// 実装ポリシー: 止めない/速い/子どもに優しい

import { GoogleGenerativeAI } from "@google/generative-ai";

// ========= 設定 =========
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const MODEL_FAST = process.env.GEMINI_FAST_MODEL || "gemini-1.5-flash";
const MODEL_ACCURATE = process.env.GEMINI_ACCURATE_MODEL || "gemini-1.5-pro";

const HARD_TIMEOUT_MS = Number(process.env.AI_HARD_TIMEOUT_MS || 3500);
const MAX_RETRY = 2;

// ========= 型 =========
export type QuestionItem = {
  id: string;
  text: string;
  intent: string;
  evaluationCriteria: string;
  type: "basic" | "experience" | "deep" | "synthesis";
};

export type EvalResult = {
  score: number; // 1-5
  strengths: string[];
  suggestions: string[];
};

export type SessionSummary = {
  overall: number; // 1-5
  byDimension: { key: string; score: number; comment: string }[];
  strengthsTop3: string[];
  weaknessesTop3: string[];
  nextFocus: string[];
};

// ========= ユーティリティ =========
const hasKey = () => API_KEY.trim().length > 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function withHardTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("AI_TIMEOUT")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); })
     .catch((e) => { clearTimeout(t); reject(e); });
  });
}


// ========= Gemini呼び出し =========
function createGemini(model: string) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  return genAI.getGenerativeModel({ model });
}

async function callGemini(
  model: "FAST" | "PRO",
  prompt: string,
  maxOutputTokens = 512
): Promise<string> {
  const mdl = model === "FAST" ? MODEL_FAST : MODEL_ACCURATE;
  const client = createGemini(mdl);
  const task = client.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens, temperature: model === "FAST" ? 0.6 : 0.4 },
    safetySettings: [],
  });
  // @ts-ignore
  const res = await withHardTimeout(task, HARD_TIMEOUT_MS);
  // @ts-ignore
  const out = res?.response?.text?.() || res?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) throw new Error("AI_EMPTY_OUTPUT");
  return String(out);
}

async function resilientCall(
  model: "FAST" | "PRO",
  prompt: string,
  maxOutputTokens = 512,
  shortPrompt?: string
): Promise<string> {
  let lastErr: any = null;
  for (let i = 0; i <= MAX_RETRY; i++) {
    try {
      const p = i === 0 ? prompt : (shortPrompt || prompt.slice(0, 800));
      return await callGemini(model, p, maxOutputTokens);
    } catch (e: any) {
      lastErr = e;
      await sleep(150 + 150 * i);
    }
  }
  throw lastErr || new Error("AI_FAILED");
}

// ========= 生成：志願理由書→質問 =========
export async function generateQuestionsFromEssay(params: {
  schoolKey: "meiwa";
  essaySummary400ja: string;
  lastAnswerKeyPoints?: string;
  desiredCount?: number;
}): Promise<QuestionItem[]> {
  const count = Math.min(Math.max(params.desiredCount ?? 8, 5), 10);
  if (!hasKey()) {
    throw new Error('Gemini APIキーが設定されていません。AI機能にはAPIキーが必要です。');
  }

  const sys = [
    "あなたは日本の中学入試面接官です。語彙は小6でも読める水準にしてください。",
    "出力はJSON配列。各要素に {text, intent, evaluationCriteria, type} を含めてください。",
    'typeは "basic" | "experience" | "deep" | "synthesis" のいずれか。',
    `質問は${count}件。段階的に基礎→経験→深掘り→統合の流れで構成。`,
  ].join("\n");

  const user = [
    "【志願理由書（要約400字）】",
    params.essaySummary400ja,
    params.lastAnswerKeyPoints ? `【直前回答の要点】${params.lastAnswerKeyPoints}` : "",
    "【出力条件】日本語。JSONのみ。説明や前置きは不要。",
  ].join("\n");

  const prompt = `${sys}\n\n${user}`;
  const shortPrompt = `${sys}\n\n【志望要約】${params.essaySummary400ja.slice(0, 300)}\n【条件】JSONのみ`;

  try {
    const raw = await resilientCall("FAST", prompt, 700, shortPrompt);
    const json = raw.match(/\[[\s\S]*\]/)?.[0] ?? raw;
    const arr = JSON.parse(json) as any[];
    const mapped: QuestionItem[] = arr.slice(0, count).map((o, idx) => ({
      id: `gq-${Date.now()}-${idx}`,
      text: String(o.text || o.question || "質問を簡潔に述べてください。"),
      intent: String(o.intent || "意図の明確化"),
      evaluationCriteria: String(o.evaluationCriteria || "具体性/理由/結論"),
      type: (["basic", "experience", "deep", "synthesis"] as const).includes(o.type)
        ? o.type
        : (idx < 2 ? "basic" : idx < 4 ? "experience" : idx < 7 ? "deep" : "synthesis"),
    }));
    return mapped.length ? mapped : [];
  } catch (error) {
    throw new Error(`質問生成に失敗しました: ${error}`);
  }
}

// ========= 評価：回答→短評 =========
export async function evaluateResponse(params: {
  questionText: string;
  questionIntent?: string;
  userAnswer: string;
}): Promise<EvalResult> {
  if (!hasKey()) {
    throw new Error('Gemini APIキーが設定されていません。AI評価機能にはAPIキーが必要です。');
  }

  const sys = [
    "明和中学校が求める生徒像を基準に回答を評価します。",
    "評価の視点：知的好奇心、主体性、個性の発揮、協働性",
    "出力はJSONのみ: {score:1-5, strengths:[..<=2], suggestions:[..<=2]}",
    "強み/改善は各25文字程度で、小6向けの優しい表現で。",
  ].join("\n");

  const user = [
    `【質問】${params.questionText}`,
    params.questionIntent ? `【質問の意図】${params.questionIntent}` : "",
    `【回答】${params.userAnswer}`,
    "【出力】JSONのみ。余計な文章は出力しない。",
  ].join("\n");

  try {
    const raw = await resilientCall("PRO", `${sys}\n\n${user}`, 300, `${sys}\n\n${user.slice(0, 500)}`);
    const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
    const obj = JSON.parse(json);
    const score = Math.min(5, Math.max(1, Number(obj.score || 3)));
    const strengths = (obj.strengths || []).map(String).slice(0, 2);
    const suggestions = (obj.suggestions || []).map(String).slice(0, 2);
    return { score, strengths, suggestions };
  } catch (error) {
    throw new Error(`評価処理に失敗しました: ${error}`);
  }
}

// ========= 総括：セッション→サマリー =========
export async function summarizeSession(params: {
  schoolKey: "meiwa";
  evaluations: { question: string; answer: string; eval: EvalResult }[];
}): Promise<SessionSummary> {
  if (!hasKey()) {
    throw new Error('Gemini APIキーが設定されていません。AI総括機能にはAPIキーが必要です。');
  }

  const sys = [
    "面接全体の総括をJSONで返します。小6向けの短い表現にしてください。",
    'output: {overall:1-5, byDimension:[{key,score,comment} *7], strengthsTop3:[..], weaknessesTop3:[..], nextFocus:[..<=2]}',
    "7指標: 動機の明確さ, 具体性, 論理性, 協働性, 社会関連, 学校理解, 自己理解",
    "各commentは25〜40文字程度。",
  ].join("\n");

  const lines = params.evaluations.slice(0, 12).map((e, i) =>
    `Q${i+1}:${e.question}\nA${i+1}:${e.answer}\nscore:${e.eval.score}\n+${(e.eval.strengths||[]).join(" / ")}\n-${(e.eval.suggestions||[]).join(" / ")}`
  ).join("\n\n");

  const user = [
    "【面接ログ（要約）】",
    lines,
    "【出力条件】JSONのみ。説明や前置きは不要。",
  ].join("\n");

  try {
    const raw = await resilientCall("PRO", `${sys}\n\n${user}`, 600, `${sys}\n\n${user.slice(0, 800)}`);
    const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
    const obj = JSON.parse(json);
    const overall = Math.min(5, Math.max(1, Number(obj.overall || 3)));
    const dims = Array.isArray(obj.byDimension) ? obj.byDimension : [];
    const keys = ["動機の明確さ","具体性","論理性","協働性","社会関連","学校理解","自己理解"];
    const byDimension = keys.map((k, i) => {
      const src = dims[i] || {};
      const s = Math.min(5, Math.max(1, Number(src.score || overall)));
      const c = String(src.comment || "良い点を伸ばし、具体例と理由を意識しましょう。");
      return { key: k, score: s, comment: c };
    });
    const strengthsTop3 = (obj.strengthsTop3 || []).map(String).slice(0, 3);
    const weaknessesTop3 = (obj.weaknessesTop3 || []).map(String).slice(0, 3);
    const nextFocus = (obj.nextFocus || []).map(String).slice(0, 2);
    return { overall, byDimension, strengthsTop3, weaknessesTop3, nextFocus };
  } catch (error) {
    throw new Error(`総括処理に失敗しました: ${error}`);
  }
}