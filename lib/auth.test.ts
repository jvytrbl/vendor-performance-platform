import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateAuthHeader } from "./auth";
import { jwtVerify } from "jose";

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(),
  jwtVerify: vi.fn(),
}));

describe("validateAuthHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when no Authorization header is present", async () => {
    const result = await validateAuthHeader(null);

    expect(result.valid).toBe(false);
  });

  it("rejects a header that does not start with 'Bearer '", async () => {
    const result = await validateAuthHeader("Basic 1234567890");

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Invalid authorization header");
  });

  it("rejects a Bearer token that fails verification", async () => {
    vi.mocked(jwtVerify).mockRejectedValue(new Error("signature verification failed"));

    const result = await validateAuthHeader("Bearer some.invalid.token");

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Invalid or Expired token");
  });

  it("returns valid: true when the token passes verification", async () => {
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { sub: "user-123" },
      protectedHeader: { alg: "RS256" },
    } as any);

    const result = await validateAuthHeader("Bearer some.valid.token");

    expect(result.valid).toBe(true);
  });
});
