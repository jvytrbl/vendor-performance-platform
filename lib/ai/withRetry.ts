export type RetryResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: "AI_UNAVAILABLE" };

const MAX_ATTEMPTS = 3;
const DELAYS_MS = [1000, 2000, 4000];

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    isRetryable: (error: unknown) => boolean;
    wait: (ms: number) => Promise<void>;
  }
): Promise<RetryResult<T>> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const value = await operation();
      return { ok: true, value };
    } catch (error) {
      if (!options.isRetryable(error)) {
        throw error;
      }
      if (attempt === MAX_ATTEMPTS - 1) {
        return { ok: false, code: "AI_UNAVAILABLE" };
      }
      await options.wait(DELAYS_MS[attempt]);
    }
  }

  return { ok: false, code: "AI_UNAVAILABLE" };
}
