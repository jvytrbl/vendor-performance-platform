import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { jwtVerifyMock } = vi.hoisted(() => ({
    jwtVerifyMock: vi.fn(),
}));

vi.mock("jose", () => ({
    createRemoteJWKSet: vi.fn(() => ({})),
    jwtVerify: jwtVerifyMock,
}));

const { validateAuthHeader } = await import("./auth");

describe("validateAuthHeader()", () => {
    const originalDomain = process.env.ALLOWED_EMAIL_DOMAIN;

    beforeEach(() => {
        process.env.ALLOWED_EMAIL_DOMAIN = "envirosgroup.com";
    });

    afterEach(() => {
        process.env.ALLOWED_EMAIL_DOMAIN = originalDomain;
        vi.clearAllMocks();
    });

    it("accepts a token whose email is on the allowed domain", async () => {
        jwtVerifyMock.mockResolvedValue({
            payload: { email: "someone@envirosgroup.com" },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result).toEqual({ valid: true });
    });

    it("rejects a token whose email is on a different domain, including lookalikes", async () => {
        jwtVerifyMock.mockResolvedValue({
            payload: { email: "attacker@envirosgroup.com.evil.com" },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result.valid).toBe(false);
        expect(result.reason).toBe("Account not authorized for this application");
    });

    it("rejects when ALLOWED_EMAIL_DOMAIN is unset, even for an otherwise-valid domain", async () => {
        delete process.env.ALLOWED_EMAIL_DOMAIN;
        jwtVerifyMock.mockResolvedValue({
            payload: { email: "someone@envirosgroup.com" },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result.valid).toBe(false);
        expect(result.reason).toBe("Access domain not configured");
    });
});
