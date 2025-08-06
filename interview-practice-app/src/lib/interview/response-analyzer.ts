// interview/response-analyzer.ts
// 回答分析機能

import { ResponseDepth, ResponseAnalysis } from './types';

export class ResponseAnalyzer {
  static analyzeResponse(response: string): ResponseAnalysis {
    return {
      depth: this.calculateResponseDepth(response),
      elements: this.extractResponseElements(response),
      emotions: this.extractEmotions(response),
      difficulties: this.extractDifficulties(response),
      solutions: this.extractSolutions(response),
      learnings: this.extractLearnings(response)
    };
  }

  private static calculateResponseDepth(response: string): ResponseDepth {
    const length = response.length;
    const specificWords = (response.match(/具体的|例えば|実際|詳しく|なぜなら/g) || []).length;
    const emotionWords = (response.match(/嬉しい|楽しい|困った|大変|感動/g) || []).length;
    
    if (length > 100 && specificWords >= 2 && emotionWords >= 1) return 'profound';
    if (length > 60 && (specificWords >= 1 || emotionWords >= 1)) return 'deep';
    if (length > 30) return 'moderate';
    return 'surface';
  }

  private static extractResponseElements(response: string): string[] {
    const elements: string[] = [];
    
    if (/きっかけ|始め|最初/.test(response)) elements.push('きっかけ');
    if (/困っ|大変|難し|問題|課題/.test(response)) elements.push('困難');
    if (/解決|工夫|方法|やり方/.test(response)) elements.push('解決策');
    if (/学ん|気づ|分か|理解/.test(response)) elements.push('学び');
    if (/友達|先生|家族|みんな|一緒/.test(response)) elements.push('協働');
    if (/続け|もっと|また|次/.test(response)) elements.push('継続意欲');
    
    return elements;
  }

  private static extractEmotions(response: string): string[] {
    const emotions: string[] = [];
    const emotionPatterns = {
      joy: /嬉しい|楽しい|面白い|わくわく/,
      difficulty: /困っ|大変|つらい|悩ん/,
      surprise: /驚い|びっくり|意外/,
      satisfaction: /満足|達成|成功|うまく/
    };

    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
      if (pattern.test(response)) emotions.push(emotion);
    }
    
    return emotions;
  }

  private static extractDifficulties(response: string): string[] {
    const difficulties: string[] = [];
    if (/意見|違い|対立|もめ/.test(response)) difficulties.push('意見対立');
    if (/技術|技能|うまく|できな/.test(response)) difficulties.push('技術的困難');
    if (/時間|忙し|間に合わ/.test(response)) difficulties.push('時間管理');
    if (/お金|費用|高い/.test(response)) difficulties.push('資金面');
    return difficulties;
  }

  private static extractSolutions(response: string): string[] {
    const solutions: string[] = [];
    if (/練習|繰り返|何度も/.test(response)) solutions.push('反復練習');
    if (/調べ|研究|情報/.test(response)) solutions.push('情報収集');
    if (/相談|聞い|教え/.test(response)) solutions.push('他者サポート');
    if (/工夫|方法|やり方/.test(response)) solutions.push('方法論改善');
    return solutions;
  }

  private static extractLearnings(response: string): string[] {
    const learnings: string[] = [];
    if (/大切|重要|必要/.test(response)) learnings.push('価値観形成');
    if (/できる|成長|上達/.test(response)) learnings.push('能力向上');
    if (/楽し|面白|好き/.test(response)) learnings.push('興味拡大');
    if (/友達|仲間|協力/.test(response)) learnings.push('社会性向上');
    return learnings;
  }
}