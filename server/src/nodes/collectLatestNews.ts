import type { AgentStateType, AgentStateUpdate } from '../graph/state.ts';
import { searchCompanyNews, tavilyResultsToSources, getTavilyConfig } from '../tools/tavily.ts';
import type { NewsArticle, Source } from '@repo/shared';

/**
 * Node 3: collectLatestNews
 *
 * Responsibility: Use Tavily to fetch recent news articles about the company.
 * Runs in PARALLEL with collectFinancialData after researchCompany completes.
 *
 * Failure behavior: GRACEFUL DEGRADATION — set articles=[], log error,
 * report says "No recent news found."
 */
export async function collectLatestNews(
  state: AgentStateType
): Promise<AgentStateUpdate> {
  console.log(`[collectLatestNews] Fetching news for: ${state.companyName}`);

  try {
    const config = getTavilyConfig();
    const queryName = state.companyOverview?.name || state.companyName;
    const response = await searchCompanyNews(queryName, config);

    const articles: NewsArticle[] = response.results.map((r) => {
      // Extract a domain/source name from the URL roughly
      let sourceName = 'Unknown Source';
      try {
        const urlObj = new URL(r.url);
        sourceName = urlObj.hostname.replace('www.', '');
      } catch {
        // ignore invalid urls
      }

      return {
        title: r.title,
        url: r.url,
        source: sourceName,
        publishedAt: r.publishedDate ?? new Date().toISOString(),
        summary: r.content,
      };
    });

    const sources: Source[] = tavilyResultsToSources(response.results);

    return {
      latestNews: {
        articles,
        sources,
      },
      sources,
      currentNode: 'collectLatestNews',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[collectLatestNews] ✗ Failed for ${state.companyName}: ${errorMsg}`);

    return {
      latestNews: {
        articles: [],
        sources: [],
      },
      currentNode: 'collectLatestNews',
      errors: [{
        node: 'collectLatestNews',
        message: errorMsg,
        timestamp: new Date().toISOString(),
        recoverable: true,
      }],
    };
  }
}
