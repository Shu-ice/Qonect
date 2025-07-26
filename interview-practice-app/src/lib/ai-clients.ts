/**
 * AI API クライアント統合
 * OpenAI GPT-4 + Anthropic Claude 3.5 Sonnet + Google Gemini Pro
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { aiMonitor, AIUsageMetrics } from './ai-monitor';
import { rateLimiter } from './rate-limiter';
import { GEMINI_JAPANESE_CONFIG } from './gemini-prompts';

// OpenAI クライアント設定
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000, // 30秒
});

// Anthropic Claude用HTTP クライアント（SDK使用）
export class AnthropicClient {
  private apiKey: string;
  private baseURL = 'https://api.anthropic.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
  }

  async createMessage(params: {
    model: string;
    max_tokens: number;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
  }) {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    return response.json();
  }
}

export const anthropic = new AnthropicClient();

// Google Gemini クライアント設定
export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
    if (!key) {
      throw new Error('Google Generative AI API key not configured');
    }
    
    this.client = new GoogleGenerativeAI(key);
    this.model = this.client.getGenerativeModel({ 
      model: process.env.AI_GEMINI_MODEL || 'gemini-pro' 
    });
  }

  async generateContent(prompt: string, options?: {
    temperature?: number;
    maxOutputTokens?: number;
  }) {
    // 日本語最適化設定を使用
    const generationConfig = {
      ...GEMINI_JAPANESE_CONFIG.generationConfig,
      temperature: options?.temperature || GEMINI_JAPANESE_CONFIG.generationConfig.temperature,
      maxOutputTokens: options?.maxOutputTokens || GEMINI_JAPANESE_CONFIG.generationConfig.maxOutputTokens,
    };

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings: GEMINI_JAPANESE_CONFIG.safetySettings,
    });

    const response = await result.response;
    return {
      text: response.text(),
      candidates: response.candidates,
      usageMetadata: response.usageMetadata,
    };
  }
}

export const gemini = new GeminiClient();

// AI 設定
export const AI_CONFIG = {
  openai: {
    model: process.env.AI_DEFAULT_MODEL || 'gpt-4-turbo',
    fallbackModel: process.env.AI_FALLBACK_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  },
  anthropic: {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  },
  gemini: {
    model: process.env.AI_GEMINI_MODEL || 'gemini-pro',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  },
  tripleAI: {
    primaryProvider: process.env.AI_PRIMARY_PROVIDER || 'openai',
    enableTripleBackup: process.env.AI_ENABLE_TRIPLE_BACKUP === 'true',
    costOptimization: process.env.AI_COST_OPTIMIZATION || 'balanced',
  },
  enableRealAPI: process.env.ENABLE_REAL_AI_API === 'true',
  debugMode: process.env.ENABLE_DEBUG_MODE === 'true',
};

// エラーハンドリング & フォールバック
export class AIClientError extends Error {
  constructor(
    message: string,
    public provider: 'openai' | 'anthropic' | 'gemini',
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AIClientError';
  }
}

export interface AIResponse {
  content: string;
  provider: 'openai' | 'anthropic' | 'gemini';
  model: string;
  tokensUsed?: number;
}

/**
 * マルチAI統合クライアント
 */
export class MultiAIClient {
  
  /**
   * OpenAI GPT-4を使用してテキスト生成
   */
  async generateWithOpenAI(
    prompt: string,
    systemPrompt?: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      userId?: string;
      operation?: 'question_generation' | 'evaluation' | 'final_evaluation';
    }
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const userId = options?.userId || 'anonymous';
    const operation = options?.operation || 'question_generation';

    // レート制限チェック
    const rateLimitCheck = rateLimiter.checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      throw new AIClientError(
        rateLimitCheck.message || 'Rate limit exceeded',
        'openai',
        429
      );
    }

    if (!AI_CONFIG.enableRealAPI) {
      // モック応答
      const mockResponse = {
        content: `[MOCK] OpenAI応答: ${prompt.substring(0, 100)}...`,
        provider: 'openai' as const,
        model: options?.model || AI_CONFIG.openai.model,
        tokensUsed: 150,
      };

      // モックでもメトリクスを記録
      aiMonitor.recordUsage({
        timestamp: Date.now(),
        provider: 'openai',
        model: mockResponse.model,
        tokensUsed: mockResponse.tokensUsed || 0,
        requestDuration: Date.now() - startTime,
        success: true,
        userId,
        operation
      });

      rateLimiter.recordUsage(userId);
      return mockResponse;
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const completion = await openai.chat.completions.create({
        model: options?.model || AI_CONFIG.openai.model,
        messages,
        max_tokens: options?.maxTokens || AI_CONFIG.openai.maxTokens,
        temperature: options?.temperature || AI_CONFIG.openai.temperature,
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;
      
      const response: AIResponse = {
        content,
        provider: 'openai',
        model: completion.model,
        tokensUsed,
      };

      // 成功メトリクス記録
      aiMonitor.recordUsage({
        timestamp: Date.now(),
        provider: 'openai',
        model: completion.model,
        tokensUsed,
        requestDuration: Date.now() - startTime,
        success: true,
        userId,
        operation
      });

      rateLimiter.recordUsage(userId);
      return response;

    } catch (error: any) {
      // エラーメトリクス記録
      aiMonitor.recordUsage({
        timestamp: Date.now(),
        provider: 'openai',
        model: options?.model || AI_CONFIG.openai.model,
        tokensUsed: 0,
        requestDuration: Date.now() - startTime,
        success: false,
        errorType: error.type || error.code || 'unknown',
        userId,
        operation
      });

      if (AI_CONFIG.debugMode) {
        console.error('OpenAI API Error:', error);
      }
      
      throw new AIClientError(
        `OpenAI API error: ${error.message}`,
        'openai',
        error.status
      );
    }
  }

  /**
   * Anthropic Claude 3.5を使用してテキスト生成
   */
  async generateWithClaude(
    prompt: string,
    systemPrompt?: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      userId?: string;
      operation?: 'question_generation' | 'evaluation' | 'final_evaluation';
    }
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const userId = options?.userId || 'anonymous';
    const operation = options?.operation || 'question_generation';

    // レート制限チェック
    const rateLimitCheck = rateLimiter.checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      throw new AIClientError(
        rateLimitCheck.message || 'Rate limit exceeded',
        'anthropic',
        429
      );
    }

    if (!AI_CONFIG.enableRealAPI) {
      // モック応答
      const mockResponse = {
        content: `[MOCK] Claude応答: ${prompt.substring(0, 100)}...`,
        provider: 'anthropic' as const,
        model: AI_CONFIG.anthropic.model,
        tokensUsed: 200,
      };

      // モックでもメトリクスを記録
      aiMonitor.recordUsage({
        timestamp: Date.now(),
        provider: 'anthropic',
        model: mockResponse.model,
        tokensUsed: mockResponse.tokensUsed || 0,
        requestDuration: Date.now() - startTime,
        success: true,
        userId,
        operation
      });

      rateLimiter.recordUsage(userId);
      return mockResponse;
    }

    try {
      const messages = [
        { role: 'user', content: prompt }
      ];

      const response = await anthropic.createMessage({
        model: AI_CONFIG.anthropic.model,
        max_tokens: options?.maxTokens || AI_CONFIG.anthropic.maxTokens,
        messages,
        temperature: options?.temperature || AI_CONFIG.anthropic.temperature,
      });

      const tokensUsed = response.usage?.output_tokens || 0;
      const claudeResponse: AIResponse = {
        content: response.content[0]?.text || '',
        provider: 'anthropic',
        model: AI_CONFIG.anthropic.model,
        tokensUsed,
      };

      // 成功メトリクス記録
      aiMonitor.recordUsage({
        timestamp: Date.now(),
        provider: 'anthropic',
        model: AI_CONFIG.anthropic.model,
        tokensUsed,
        requestDuration: Date.now() - startTime,
        success: true,
        userId,
        operation
      });

      rateLimiter.recordUsage(userId);
      return claudeResponse;

    } catch (error: any) {
      // エラーメトリクス記録
      aiMonitor.recordUsage({
        timestamp: Date.now(),
        provider: 'anthropic',
        model: AI_CONFIG.anthropic.model,
        tokensUsed: 0,
        requestDuration: Date.now() - startTime,
        success: false,
        errorType: error.type || error.code || 'unknown',
        userId,
        operation
      });

      if (AI_CONFIG.debugMode) {
        console.error('Anthropic API Error:', error);
      }
      
      throw new AIClientError(
        `Anthropic API error: ${error.message}`,
        'anthropic',
        error.status
      );
    }
  }

  /**
   * Google Geminiを使用してテキスト生成
   */
  async generateWithGemini(
    prompt: string,
    systemPrompt?: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      userId?: string;
      operation?: 'question_generation' | 'evaluation' | 'final_evaluation';
    }
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const userId = options?.userId || 'anonymous';
    const operation = options?.operation || 'question_generation';

    // レート制限チェック
    const rateLimitCheck = rateLimiter.checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      throw new AIClientError(
        rateLimitCheck.message || 'Rate limit exceeded',
        'gemini',
        429
      );
    }

    if (!AI_CONFIG.enableRealAPI) {
      // モック応答
      const mockResponse = {
        content: `[MOCK] Gemini応答: ${prompt.substring(0, 100)}...`,
        provider: 'gemini' as const,
        model: AI_CONFIG.gemini.model,
        tokensUsed: 180,
      };

      // モックでもメトリクスを記録
      aiMonitor.recordUsage({
        timestamp: Date.now(),
        provider: 'gemini',
        model: mockResponse.model,
        tokensUsed: mockResponse.tokensUsed || 0,
        requestDuration: Date.now() - startTime,
        success: true,
        userId,
        operation
      });

      rateLimiter.recordUsage(userId);
      return mockResponse;
    }

    try {
      // システムプロンプトがある場合は統合
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\n${prompt}`
        : prompt;

      const result = await gemini.generateContent(fullPrompt, {
        temperature: options?.temperature || AI_CONFIG.gemini.temperature,
        maxOutputTokens: options?.maxTokens || AI_CONFIG.gemini.maxTokens,
      });

      const tokensUsed = result.usageMetadata?.totalTokenCount || 0;
      const geminiResponse: AIResponse = {
        content: result.text,
        provider: 'gemini',
        model: AI_CONFIG.gemini.model,
        tokensUsed,
      };

      // 成功メトリクス記録
      aiMonitor.recordUsage({
        timestamp: Date.now(),
        provider: 'gemini',
        model: AI_CONFIG.gemini.model,
        tokensUsed,
        requestDuration: Date.now() - startTime,
        success: true,
        userId,
        operation
      });

      rateLimiter.recordUsage(userId);
      return geminiResponse;

    } catch (error: any) {
      // エラーメトリクス記録
      aiMonitor.recordUsage({
        timestamp: Date.now(),
        provider: 'gemini',
        model: AI_CONFIG.gemini.model,
        tokensUsed: 0,
        requestDuration: Date.now() - startTime,
        success: false,
        errorType: error.type || error.code || 'unknown',
        userId,
        operation
      });

      if (AI_CONFIG.debugMode) {
        console.error('Gemini API Error:', error);
      }
      
      throw new AIClientError(
        `Gemini API error: ${error.message}`,
        'gemini',
        error.status
      );
    }
  }

  /**
   * トリプルAI生成（OpenAI + Claude + Gemini）
   * 負荷分散とフォールバック戦略を実装
   */
  async generateWithTripleAI(
    prompt: string,
    systemPrompt?: string,
    options?: {
      userId?: string;
      operation?: 'question_generation' | 'evaluation' | 'final_evaluation';
      priority?: 'cost_efficient' | 'balanced' | 'quality_first';
    }
  ): Promise<AIResponse> {
    const priority = options?.priority || AI_CONFIG.tripleAI.costOptimization;
    
    // プロバイダー優先順位を決定
    let providers: ('openai' | 'anthropic' | 'gemini')[];
    
    switch (priority) {
      case 'cost_efficient':
        providers = ['gemini', 'openai', 'anthropic'];
        break;
      case 'quality_first':
        providers = ['openai', 'anthropic', 'gemini'];
        break;
      case 'balanced':
      default:
        // ラウンドロビン的に選択
        const timestamp = Date.now();
        const selection = timestamp % 3;
        providers = selection === 0 
          ? ['openai', 'anthropic', 'gemini']
          : selection === 1
          ? ['anthropic', 'gemini', 'openai']
          : ['gemini', 'openai', 'anthropic'];
        break;
    }

    let lastError: AIClientError | null = null;

    for (const provider of providers) {
      try {
        switch (provider) {
          case 'openai':
            return await this.generateWithOpenAI(prompt, systemPrompt, options);
          case 'anthropic':
            return await this.generateWithClaude(prompt, systemPrompt, options);
          case 'gemini':
            return await this.generateWithGemini(prompt, systemPrompt, options);
        }
      } catch (error) {
        lastError = error as AIClientError;
        if (AI_CONFIG.debugMode) {
          console.warn(`${provider} failed, trying next provider:`, (error as Error).message);
        }
        continue;
      }
    }

    throw lastError || new AIClientError('All AI providers failed', providers[0]);
  }

  /**
   * フォールバック付きAI生成（後方互換性維持）
   * 第1選択でエラーの場合、第2選択に自動切り替え
   */
  async generateWithFallback(
    prompt: string,
    systemPrompt?: string,
    preferredProvider: 'openai' | 'anthropic' | 'gemini' = 'openai',
    options?: {
      userId?: string;
      operation?: 'question_generation' | 'evaluation' | 'final_evaluation';
    }
  ): Promise<AIResponse> {
    // トリプルAIが有効な場合は、そちらを使用
    if (AI_CONFIG.tripleAI.enableTripleBackup) {
      return this.generateWithTripleAI(prompt, systemPrompt, options);
    }

    // 従来の2AI フォールバック
    const providers = preferredProvider === 'openai' 
      ? ['openai', 'anthropic'] as const
      : preferredProvider === 'anthropic'
      ? ['anthropic', 'openai'] as const
      : ['gemini', 'openai'] as const;

    let lastError: AIClientError | null = null;

    for (const provider of providers) {
      try {
        if (provider === 'openai') {
          return await this.generateWithOpenAI(prompt, systemPrompt, options);
        } else if (provider === 'anthropic') {
          return await this.generateWithClaude(prompt, systemPrompt, options);
        } else {
          return await this.generateWithGemini(prompt, systemPrompt, options);
        }
      } catch (error) {
        lastError = error as AIClientError;
        if (AI_CONFIG.debugMode) {
          console.warn(`${provider} failed, trying next provider:`, (error as Error).message);
        }
        continue;
      }
    }

    throw lastError || new AIClientError('All AI providers failed', preferredProvider);
  }
}

// シングルトンインスタンス
export const multiAI = new MultiAIClient();