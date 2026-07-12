import type { AgentStateType, AgentStateUpdate } from '../graph/state.ts';
import { getFinancialData } from '../tools/yahooFinance.ts';

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
  const ticker = state.companyOverview?.ticker;
  
  if (!ticker) {
    console.log(`[collectFinancialData] No ticker found for ${state.companyName}. Skipping financial data.`);
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
      currentNode: 'collectFinancialData',
    };
  }

  console.log(`[collectFinancialData] Fetching data for ticker: ${ticker}`);

  const { data, sources } = await getFinancialData(ticker);

  // Attach sources to the financial data
  data.sources = sources;

  return {
    financialData: data,
    sources, // Also append to global sources via the reducer
    currentNode: 'collectFinancialData',
  };
}
