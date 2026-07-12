import type { FinalReport, NodeError } from '@repo/shared';

/**
 * In-memory report cache with TTL-based expiration.
 *
 * Why in-memory and not Redis?
 * This is a take-home assignment. An in-memory Map is sufficient to
 * demonstrate the caching pattern without adding infra. In production
 * you'd swap this for Redis/DynamoDB with the same interface.
 *
 * Cache key: lowercased, trimmed company name (e.g. "apple")
 * TTL: configurable, defaults to 1 hour
 */

interface CachedReport {
  report: FinalReport;
  errors: NodeError[];
  cachedAt: number;         // Date.now() when cached
  companyName: string;      // original casing
}

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

class ReportCache {
  private cache = new Map<string, CachedReport>();
  private ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  /** Normalize the cache key */
  private key(companyName: string): string {
    return companyName.trim().toLowerCase();
  }

  /** Get a cached report if it exists and hasn't expired */
  get(companyName: string): CachedReport | null {
    const k = this.key(companyName);
    const entry = this.cache.get(k);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.cache.delete(k);
      console.log(`[Cache] Expired entry for "${companyName}"`);
      return null;
    }

    console.log(`[Cache] HIT for "${companyName}" (age: ${Math.round((Date.now() - entry.cachedAt) / 1000)}s)`);
    return entry;
  }

  /** Store a report in the cache */
  set(companyName: string, report: FinalReport, errors: NodeError[]): void {
    const k = this.key(companyName);
    this.cache.set(k, {
      report,
      errors,
      cachedAt: Date.now(),
      companyName,
    });
    console.log(`[Cache] Stored report for "${companyName}" (TTL: ${this.ttlMs / 1000}s)`);
  }

  /** Check how many entries are cached (for health check) */
  get size(): number {
    return this.cache.size;
  }

  /** Clear all cached entries */
  clear(): void {
    this.cache.clear();
    console.log('[Cache] Cleared all entries');
  }
}

// Singleton — shared across the server process
export const reportCache = new ReportCache(
  parseInt(process.env.CACHE_TTL_MS || '', 10) || DEFAULT_TTL_MS
);
