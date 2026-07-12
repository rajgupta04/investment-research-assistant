import fs from 'fs';
import path from 'path';
import type { FinalReport, NodeError } from '@repo/shared';

/**
 * File-backed report cache with TTL-based expiration.
 *
 * Persists to disk so that it survives server restarts during development.
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
  private cacheFilePath = path.resolve(process.cwd(), '.report-cache.json');

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const raw = fs.readFileSync(this.cacheFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          this.cache.set(k, v as CachedReport);
        }
        console.log(`[Cache] Loaded ${this.cache.size} entries from disk`);
      }
    } catch (err) {
      console.warn('[Cache] Could not load cache from disk:', err);
    }
  }

  private saveToDisk() {
    try {
      const obj = Object.fromEntries(this.cache.entries());
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Cache] Could not save cache to disk:', err);
    }
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
      this.saveToDisk();
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
    this.saveToDisk();
    console.log(`[Cache] Stored report for "${companyName}" (TTL: ${this.ttlMs / 1000}s) and saved to disk`);
  }

  /** Check how many entries are cached (for health check) */
  get size(): number {
    return this.cache.size;
  }

  /** Clear all cached entries */
  clear(): void {
    this.cache.clear();
    this.saveToDisk();
    console.log('[Cache] Cleared all entries');
  }
}

// Singleton — shared across the server process
export const reportCache = new ReportCache(
  parseInt(process.env.CACHE_TTL_MS || '', 10) || DEFAULT_TTL_MS
);
