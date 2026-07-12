import YahooFinance from 'yahoo-finance2';
import type { FinancialData, Source, FinancialTimeSeriesPoint, HistoricalPricePoint } from '@repo/shared';
import { withTimeout } from '../utils/retry.ts';

// ============================================================
// Yahoo Finance Wrapper
// ============================================================
//
// Design principles:
// 1. GRACEFUL DEGRADATION — Yahoo Finance is fragile (undocumented API,
//    aggressive rate-limiting). If it fails, we return { available: false }
//    and the rest of the pipeline continues.
// 2. All fields nullable — mirrors the FinancialData schema.
// 3. Timeout protection — yahoo-finance2 doesn't support AbortSignal,
//    so we use Promise.race with a timeout.

const DEFAULT_TIMEOUT_MS = 12_000;
const YAHOO_FINANCE_SOURCE_URL = 'https://finance.yahoo.com';

// ---- Yahoo Finance v4 client instance ----

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// ---- Public API ----

/**
 * Fetch financial data for a given ticker symbol.
 * Returns a fully populated FinancialData object on success,
 * or { available: false, ...nulls } on failure.
 */
export async function getFinancialData(
  ticker: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ data: FinancialData; sources: Source[] }> {
  console.log(`[YahooFinance] Fetching data for: ${ticker}`);

  try {
    // Fetch quoteSummary with the modules we need
    const result = await withTimeout(
      yf.quoteSummary(ticker, {
        modules: [
          'price',
          'summaryDetail',
          'financialData',
          'defaultKeyStatistics',
          'earningsTrend',
        ],
      }),
      timeoutMs,
      'YahooFinance:quoteSummary'
    );

    const price = result.price;
    const summary = result.summaryDetail;
    const financial = result.financialData;
    const keyStats = result.defaultKeyStatistics;

    // Extract fields, defaulting to null for anything missing
    const data: FinancialData = {
      available: true,
      currentPrice: price?.regularMarketPrice ?? null,
      marketCap: price?.marketCap ?? summary?.marketCap ?? null,
      peRatio: summary?.trailingPE ?? null,
      pegRatio: keyStats?.pegRatio ?? null,
      priceToBook: keyStats?.priceToBook ?? null,
      debtToEquity: financial?.debtToEquity ?? null,
      returnOnEquity: financial?.returnOnEquity ?? null,
      revenueGrowthYoY: financial?.revenueGrowth ?? null,
      earningsGrowthYoY: financial?.earningsGrowth ?? null,
      dividendYield: summary?.dividendYield ?? null,
      fiftyTwoWeekHigh: summary?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: summary?.fiftyTwoWeekLow ?? null,
      analystTargetPrice: financial?.targetMeanPrice ?? null,
      revenueHistory: [], // Will try to fill from earningsTrend
      earningsHistory: [], // Will try to fill from earningsTrend
      historicalPrices: [], // Will fill from chart() call below
      sources: [],
    };

    // Try to extract time-series from earningsTrend if available
    if (result.earningsTrend?.trend) {
      data.earningsHistory = result.earningsTrend.trend
        .filter((t) => t.period && t.earningsEstimate?.avg != null)
        .map(
          (t): FinancialTimeSeriesPoint => ({
            period: t.period ?? 'unknown',
            value: t.earningsEstimate?.avg ?? 0,
          })
        );
    }

    // Source for attribution
    const sources: Source[] = [
      {
        url: `${YAHOO_FINANCE_SOURCE_URL}/quote/${ticker}`,
        title: `Yahoo Finance — ${ticker}`,
        snippet: `Financial data retrieved for ${ticker}`,
        retrievedAt: new Date().toISOString(),
      },
    ];

    // Fetch 1-year historical prices for charts
    try {
      data.historicalPrices = await getHistoricalPrices(ticker, timeoutMs);
      console.log(`[YahooFinance] ✓ Got ${data.historicalPrices.length} historical price points for ${ticker}`);
    } catch (histErr) {
      console.warn(`[YahooFinance] ✗ Historical prices failed for ${ticker}:`, histErr instanceof Error ? histErr.message : histErr);
    }

    console.log(
      `[YahooFinance] ✓ Got data for ${ticker}: ` +
        `price=${data.currentPrice}, marketCap=${data.marketCap}, P/E=${data.peRatio}`
    );

    return { data, sources };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : String(error);
    console.warn(`[YahooFinance] ✗ Failed for ${ticker}: ${errorMsg}`);

    // Graceful degradation — return unavailable with all nulls
    return {
      data: createUnavailableFinancialData(),
      sources: [],
    };
  }
}

/**
 * Try to resolve a company name to a ticker symbol using Yahoo Finance search.
 * Returns null if no match found.
 */
export async function resolveTickerSymbol(
  companyName: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string | null> {
  try {
    const result = await withTimeout(
      yf.search(companyName, { newsCount: 0 }),
      timeoutMs,
      'YahooFinance:search'
    );

    // Find the first equity result
    const equity = result.quotes?.find(
      (q) => 'typeDisp' in q && (q as { typeDisp?: string }).typeDisp === 'Equity'
    );

    if (equity && 'symbol' in equity) {
      console.log(
        `[YahooFinance] Resolved "${companyName}" → ${(equity as { symbol: string }).symbol}`
      );
      return (equity as { symbol: string }).symbol;
    }

    // Fallback: take the first result with a symbol
    const firstWithSymbol = result.quotes?.find((q) => 'symbol' in q);
    if (firstWithSymbol && 'symbol' in firstWithSymbol) {
      console.log(
        `[YahooFinance] Resolved "${companyName}" → ${(firstWithSymbol as { symbol: string }).symbol} (fallback)`
      );
      return (firstWithSymbol as { symbol: string }).symbol;
    }

    console.warn(`[YahooFinance] No ticker found for "${companyName}"`);
    return null;
  } catch (error) {
    console.warn(
      `[YahooFinance] Ticker resolution failed for "${companyName}":`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

// ---- Helpers ----

function createUnavailableFinancialData(): FinancialData {
  return {
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
    historicalPrices: [],
    sources: [],
  };
}

/**
 * Fetch 1-year historical daily prices using yahoo-finance2 chart().
 */
async function getHistoricalPrices(
  ticker: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<HistoricalPricePoint[]> {
  const result = await withTimeout(
    yf.chart(ticker, { period1: '1y', interval: '1d' }),
    timeoutMs,
    'YahooFinance:chart'
  );

  if (!result.quotes || result.quotes.length === 0) return [];

  return result.quotes
    .filter((q: any) => q.close != null && q.date != null)
    .map((q: any): HistoricalPricePoint => ({
      date: new Date(q.date).toISOString().split('T')[0],
      close: q.close,
      high: q.high ?? q.close,
      low: q.low ?? q.close,
      volume: q.volume ?? 0,
    }));
}
