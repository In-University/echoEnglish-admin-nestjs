import { Injectable } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ConfigService } from '@nestjs/config';

export type GenerateOptions = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

@Injectable()
export class GoogleGenAIService {
  private model: ChatGoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('GENAI_API_KEY') ||
      this.configService.get<string>('GOOGLE_API_KEY') ||
      this.configService.get<string>('GOOGLE_GENAI_API_KEY');

    if (!apiKey) {
      console.warn('[AI] No Gemini API key found in environment variables');
    }

    const modelName = 'gemini-2.0-flash-exp';
    this.model = new ChatGoogleGenerativeAI({
      model: modelName,
      temperature: 0.2,
      apiKey,
    });
  }

  public getModel(): ChatGoogleGenerativeAI {
    return this.model;
  }

  async generate(text: string): Promise<string> {
    const res = await this.model.invoke([{ role: 'user', content: text }]);

    try {
      // Handle LangChain AIMessage response
      if (res && typeof res.content === 'string') {
        return res.content;
      }

      // Fallback for other response structures
      if (res && Array.isArray(res.content)) {
        // Handle array of content parts
        const contentParts = res.content
          .map((part) => {
            if (typeof part === 'string') return part;
            if (part && typeof part === 'object' && 'text' in part)
              return part.text;
            return String(part);
          })
          .filter(Boolean);
        return contentParts.join(' ') || String(res);
      }

      // @ts-expect-error - LangChain response structure varies
      if (res?.output && Array.isArray(res.output) && res.output.length) {
        // @ts-expect-error - Dynamic property access
        return res.output[0].content ?? String(res);
      }

      return res?.text ?? String(res);
    } catch {
      return String(res);
    }
  }
}
