import type { AgentStateType, AgentStateUpdate } from '../graph/state.ts';

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

  // STUB: Will be replaced with Tavily news search
  return {
    latestNews: {
      articles: [],
      sources: [],
    },
    sources: [],
    currentNode: 'collectLatestNews',
  };
}
