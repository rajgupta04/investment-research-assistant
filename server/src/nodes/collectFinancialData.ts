import type { AgentStateType, AgentStateUpdate } from '../graph/state.ts';

/**
 * Node 2: collectFinancialData
 *
 * Responsibility: Fetch structured financial metrics via yahoo-finance2.
 * Runs in PARALLEL with collectLatestNews after researchCompany completes.
 *
 * Failure behavior: GRACEFUL DEGRADATION — set available=false, log error,
 * report says "Financial data unavailable."
 */
export async function collectFinancialData(
  state: AgentStateType
): Promise<AgentStateUpdate> {
  const ticker = state.companyOverview?.ticker ?? 'UNKNOWN';
  console.log(`[collectFinancialData] Fetching data for ticker: ${ticker}`);

  // STUB: Will be replaced with yahoo-finance2 calls
  return {
    financialData: {
      available: false,
      currentPrice: null,
      marketCap: null,
      peRatio: null,
      pegRatio: null,
      priceToBook: null,
      debtToEquity: null,
      returnOnEquity: null,
      revenueGrowthYoY: null,
      earningsGrowthYoY: null,
      dividendYield: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      analystTargetPrice: null,
      revenueHistory: [],
      earningsHistory: [],
      sources: [],
    },
    sources: [],
    currentNode: 'collectFinancialData',
  };
}
