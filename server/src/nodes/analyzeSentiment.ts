import type { AgentStateType, AgentStateUpdate } from '../graph/state.js';
import { generateStructured } from '../tools/llm.js';
import { SentimentAnalysisSchema } from '@repo/shared';

/**
 * Node 4: analyzeSentiment
 *
 * Responsibility: LLM analysis of news data to assess market/media sentiment.
 * Runs in PARALLEL with evaluateBusinessQuality.
 * Depends on: latestNews (from collectLatestNews)
 *
 * Failure behavior: Retry once, then set null + log error.
 */
export async function analyzeSentiment(
  state: AgentStateType
): Promise<AgentStateUpdate> {
  const articles = state.latestNews?.articles ?? [];
  const articleCount = articles.length;
  console.log(`[analyzeSentiment] Analyzing ${articleCount} articles`);

  if (articleCount === 0) {
    return {
      sentimentAnalysis: {
        overall: 'neutral',
        score: 0,
        summary: `No recent news articles found for ${state.companyName}.`,
        keyThemes: [],
        evidence: [],
      },
      currentNode: 'analyzeSentiment',
    };
  }

  try {
    const systemPrompt = `You are an expert financial analyst and sentiment assessor.
Analyze the provided news articles about the company and assess the overall market sentiment.
Return a structured output matching the requested schema.
Every claim in your evidence array MUST include a 'source' (the URL of the article) if it is a fact, or 'reasoning' if it is an inference.`;

    const prompt = `Company: ${state.companyName}
News Articles:
${articles.map((a, i) => `[${i + 1}] Title: ${a.title}\nSource: ${a.source}\nURL: ${a.url}\nDate: ${a.publishedAt}\nSummary: ${a.summary}\n`).join('\n---\n')}

Analyze the sentiment of these articles. Provide an overall sentiment, a score between -1 (very negative) and 1 (very positive), a concise summary, key themes, and an evidence catalog backing up your claims.`;

    const sentiment = await generateStructured(
      SentimentAnalysisSchema,
      prompt,
      systemPrompt
    );

    return {
      sentimentAnalysis: sentiment,
      currentNode: 'analyzeSentiment',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[analyzeSentiment] ✗ Failed: ${errorMsg}`);
    
    return {
      sentimentAnalysis: null,
      currentNode: 'analyzeSentiment',
      errors: [{
        node: 'analyzeSentiment',
        message: errorMsg,
        timestamp: new Date().toISOString(),
        recoverable: true,
      }],
    };
  }
}
