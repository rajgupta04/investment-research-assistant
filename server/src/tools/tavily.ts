import type { Source } from '@repo/shared';
import { withRetry } from '../utils/retry.ts';

// ============================================================
// Tavily Search API Wrapper
// ============================================================
//
// Uses Tavily REST API directly (not through LangChain) for:
// 1. Full timeout/retry control via AbortSignal
// 2. Transparent request/response — no abstraction overhead
// 3. Easy mocking for tests (just mock fetch)
//
// Two search modes:
// - searchCompanyInfo: deep "advanced" search for company fundamentals
// - searchCompanyNews: "news" topic search for recent articles

// ---- Types ----

export interface TavilyConfig {
  apiKey: string;
  baseUrl?: string;
  /** Timeout per attempt in ms (default: 15000) */
  timeoutMs?: number;
  /** Max retries with exponential backoff (default: 2) */
  maxRetries?: number;
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string;
}

// ---- Defaults ----

const TAVILY_BASE_URL = 'https://api.tavily.com';
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 1_000;

// ---- Internal fetch helper ----

async function tavilySearch(
  query: string,
  options: {
    config: TavilyConfig;
    topic?: 'general' | 'news';
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    days?: number;
    includeAnswer?: boolean;
  },
  signal: AbortSignal
): Promise<TavilySearchResponse> {
  const {
    config,
    topic = 'general',
    searchDepth = 'basic',
    maxResults = 5,
    days,
    includeAnswer = false,
  } = options;

  const baseUrl = config.baseUrl ?? TAVILY_BASE_URL;

  const body: Record<string, unknown> = {
    query,
    topic,
    search_depth: searchDepth,
    max_results: maxResults,
    include_answer: includeAnswer,
    include_raw_content: false,
  };

  // `days` only applies to news topic
  if (topic === 'news' && days) {
    body.days = days;
  }

  const response = await fetch(`${baseUrl}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `Tavily API error ${response.status}: ${errorText}`
    );
  }

  return (await response.json()) as TavilySearchResponse;
}

// ---- Public API ----

/**
 * Deep search for company fundamentals (overview, sector, key facts).
 * Uses "advanced" search depth for richer results.
 */
export async function searchCompanyInfo(
  companyName: string,
  config: TavilyConfig
): Promise<TavilySearchResponse> {
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;

  const query = `${companyName} company overview business description sector industry ticker symbol`;

  return withRetry(
    (signal) =>
      tavilySearch(
        query,
        {
          config,
          topic: 'general',
          searchDepth: 'advanced',
          maxResults: 5,
          includeAnswer: true,
        },
        signal
      ),
    {
      maxRetries,
      baseDelayMs: DEFAULT_BASE_DELAY_MS,
      timeoutMs,
      label: 'Tavily:CompanyInfo',
    }
  );
}

/**
 * Search for recent news about the company (last 30 days).
 */
export async function searchCompanyNews(
  companyName: string,
  config: TavilyConfig
): Promise<TavilySearchResponse> {
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;

  const query = `${companyName} latest news developments announcements`;

  return withRetry(
    (signal) =>
      tavilySearch(
        query,
        {
          config,
          topic: 'news',
          searchDepth: 'basic',
          maxResults: 8,
          days: 30,
          includeAnswer: false,
        },
        signal
      ),
    {
      maxRetries,
      baseDelayMs: DEFAULT_BASE_DELAY_MS,
      timeoutMs,
      label: 'Tavily:CompanyNews',
    }
  );
}

// ---- Helpers ----

/**
 * Convert Tavily search results to our Source schema for the evidence catalog.
 */
export function tavilyResultsToSources(
  results: TavilySearchResult[]
): Source[] {
  return results.map((r) => ({
    url: r.url,
    title: r.title,
    snippet: r.content.slice(0, 300),
    retrievedAt: new Date().toISOString(),
  }));
}

/**
 * Get a configured Tavily config from environment variables.
 * Throws if TAVILY_API_KEY is not set.
 */
export function getTavilyConfig(): TavilyConfig {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      'TAVILY_API_KEY environment variable is required. ' +
        'Get one at https://tavily.com'
    );
  }
  return { apiKey };
}
