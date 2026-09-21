import { describe, it, expect, vi } from "vitest";
import { withRetry } from "./withRetry";

class RetryableError extends Error {}

describe("withRetry", () => {
  // Category 1 (boundary value): exactly 3 attempts, not 2, not 4.
  it("stops after exactly 3 failed attempts and returns a temporarily-unavailable result", async () => {
    const operation = vi.fn().mockRejectedValue(new RetryableError());
    const wait = vi.fn().mockResolvedValue(undefined);

    const result = await withRetry(operation, {
      isRetryable: (error) => error instanceof RetryableError,
      wait,
    });

    expect(operation).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenNthCalledWith(1, 1000);
    expect(wait).toHaveBeenNthCalledWith(2, 2000);
    expect(result).toEqual({ ok: false, code: "AI_UNAVAILABLE" });
  });

  it("returns the value once a retry succeeds, without making further attempts", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new RetryableError())
      .mockResolvedValueOnce("ok");
    const wait = vi.fn().mockResolvedValue(undefined);

    const result = await withRetry(operation, {
      isRetryable: (error) => error instanceof RetryableError,
      wait,
    });

    expect(operation).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledTimes(1);
    expect(wait).toHaveBeenNthCalledWith(1, 1000);
    expect(result).toEqual({ ok: true, value: "ok" });
  });

  it("propagates a non-retryable error immediately without retrying", async () => {
    const error = new Error("bad request");
    const operation = vi.fn().mockRejectedValue(error);
    const wait = vi.fn();

    await expect(
      withRetry(operation, { isRetryable: () => false, wait })
    ).rejects.toBe(error);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });
});
