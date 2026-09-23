import { describe, it, expect, vi, afterEach } from "vitest";
import {
  geminiGenerateContent,
  RateLimitError,
  ServiceUnavailableError,
} from "./geminiGenerateContent";

describe("geminiGenerateContent", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // Category 1 (boundary/condition): 429 must be distinguishable from other
  // failures so a caller can decide to retry only this one.
  it("throws RateLimitError when Gemini responds with 429", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 } as Response);

    await expect(geminiGenerateContent("prompt", "key")).rejects.toBeInstanceOf(
      RateLimitError
    );
  });

  // Gemini's most common transient failure in practice is a 503 "model
  // currently experiencing high demand" response, not a 429 — this must be
  // retryable too, or the retry budget never actually engages.
  it.each([500, 502, 503, 504])(
    "throws ServiceUnavailableError (not RateLimitError) when Gemini responds with %i",
    async (status) => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status } as Response);

      const rejection = geminiGenerateContent("prompt", "key");
      await expect(rejection).rejects.toBeInstanceOf(ServiceUnavailableError);
      await expect(rejection).rejects.not.toBeInstanceOf(RateLimitError);
    }
  );

  it("throws a plain, non-retryable Error for other non-ok statuses", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 } as Response);

    const rejection = geminiGenerateContent("prompt", "key");
    await expect(rejection).rejects.not.toBeInstanceOf(RateLimitError);
    await expect(rejection).rejects.not.toBeInstanceOf(ServiceUnavailableError);
  });
});
