// ============================================================
// Retry + Timeout utilities for tool wrappers
// ============================================================

export interface RetryOptions {
  /** Maximum number of retry attempts (0 = no retries, just one attempt) */
  maxRetries: number;
  /** Base delay in ms before first retry. Doubles on each subsequent retry. */
  baseDelayMs: number;
  /** Maximum time in ms for a single attempt before it's aborted. */
  timeoutMs: number;
  /** Label for logging (e.g. 'Tavily', 'YahooFinance') */
  label: string;
}

/**
 * Executes `fn` with timeout + exponential backoff retries.
 *
 * The `fn` receives an AbortSignal that is aborted when the timeout fires.
 * For functions that don't accept a signal (e.g. yahoo-finance2), use
 * `withTimeout` + `withRetry` separately.
 */
export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, baseDelayMs, timeoutMs, label } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timer);
      return result;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;

      const isTimeout =
        error instanceof DOMException && error.name === 'AbortError';
      const errorMsg = isTimeout
        ? `timed out after ${timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : String(error);

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(
          `[${label}] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${errorMsg}. ` +
            `Retrying in ${delay}ms…`
        );
        await sleep(delay);
      } else {
        console.error(
          `[${label}] All ${maxRetries + 1} attempts failed. Last error: ${errorMsg}`
        );
      }
    }
  }

  throw lastError;
}

/**
 * Races a promise against a timeout. Useful for libraries that don't accept
 * AbortSignal (e.g. yahoo-finance2).
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`[${label}] Timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (error) {
    clearTimeout(timer!);
    throw error;
  }
}

/** Simple sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
