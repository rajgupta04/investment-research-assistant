import type { AgentStateType, AgentStateUpdate } from '../graph/state.ts';
import { searchCompanyInfo, tavilyResultsToSources, getTavilyConfig } from '../tools/tavily.ts';
import { resolveTickerSymbol } from '../tools/yahooFinance.ts';
import type { Source } from '@repo/shared';

/**
 * Node 1: researchCompany
 *
 * Responsibility: Use Tavily to research the company — establish identity,
 * ticker, sector, and key facts. This is the foundation for all downstream nodes.
 *
 * Failure behavior: FATAL — if we can't identify the company, abort the graph.
 */
export async function researchCompany(
  state: AgentStateType
): Promise<AgentStateUpdate> {
  console.log(`[researchCompany] Researching: ${state.companyName}`);

  try {
    const config = getTavilyConfig();
    
    // Run both searches in parallel for efficiency
    const [tavilyResponse, ticker] = await Promise.all([
      searchCompanyInfo(state.companyName, config),
      resolveTickerSymbol(state.companyName)
    ]);

    // Use the Tavily 'answer' as the primary description, or fallback to the top snippet
    const description = tavilyResponse.answer || tavilyResponse.results[0]?.content || `No description found for ${state.companyName}.`;
    
    const sources: Source[] = tavilyResultsToSources(tavilyResponse.results);

    // Some fields like sector, industry, ceo, etc., are difficult to parse
    // structurally without an LLM. For now, we will leave them null 
    // until the LLM synthesis wrapper is implemented, or populate what we can.
    return {
      companyOverview: {
        name: state.companyName,
        ticker: ticker,
        exchange: null,
        sector: null,
        industry: null,
        description: description,
        headquarters: null,
        founded: null,
        ceo: null,
        employees: null,
        sources: sources,
      },
      sources: sources,
      currentNode: 'researchCompany',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[researchCompany] ✗ FATAL error: ${errorMsg}`);
    
    throw new Error(`Failed to research company: ${errorMsg}`);
  }
}
