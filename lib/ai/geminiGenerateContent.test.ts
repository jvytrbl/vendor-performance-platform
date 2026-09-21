import { describe, it, expect, vi, afterEach } from "vitest";
import { geminiGenerateContent, RateLimitError } from "./geminiGenerateContent";

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

  it("throws a plain Error (not RateLimitError) for other non-ok statuses", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(geminiGenerateContent("prompt", "key")).rejects.not.toBeInstanceOf(
      RateLimitError
    );
  });
});
