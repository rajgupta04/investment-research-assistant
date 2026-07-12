import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { z } from 'zod';
import { withRetry } from '../utils/retry.js';

/**
 * Returns a configured Gemini LLM instance.
 * Defaults to gemini-2.5-pro with temperature 0 for analytical tasks.
 */
export function getLLM() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is required.');
  }
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-pro',
    temperature: 0,
    apiKey,
  });
}

/**
 * Generates a structured output matching the provided Zod schema.
 */
export async function generateStructured<T>(
  schema: z.ZodType<T>,
  prompt: string,
  systemPrompt?: string,
  timeoutMs: number = 60_000
): Promise<T> {
  const llm = getLLM();
  const structuredLlm = llm.withStructuredOutput(schema);

  const messages = [];
  if (systemPrompt) {
    messages.push(['system', systemPrompt]);
  }
  messages.push(['human', prompt]);

  return withRetry(
    (signal) => structuredLlm.invoke(messages, { signal }),
    {
      maxRetries: 2,
      baseDelayMs: 1000,
      timeoutMs,
      label: 'LLM:Structured',
    }
  );
}

/**
 * Generates plain text output.
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string,
  timeoutMs: number = 60_000
): Promise<string> {
  const llm = getLLM();
  
  const messages = [];
  if (systemPrompt) {
    messages.push(['system', systemPrompt]);
  }
  messages.push(['human', prompt]);

  return withRetry(
    async (signal) => {
      const response = await llm.invoke(messages, { signal });
      return response.content as string;
    },
    {
      maxRetries: 2,
      baseDelayMs: 1000,
      timeoutMs,
      label: 'LLM:Text',
    }
  );
}
