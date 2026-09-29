import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { jwtVerifyMock } = vi.hoisted(() => ({
    jwtVerifyMock: vi.fn(),
}));

vi.mock("jose", () => ({
    createRemoteJWKSet: vi.fn(() => ({})),
    jwtVerify: jwtVerifyMock,
}));

const { validateAuthHeader } = await import("./auth");

const TENANT_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const VALID_ISSUER = `https://sts.windows.net/${TENANT_ID}/`;
const OID = "11111111-1111-1111-1111-111111111111";

describe("validateAuthHeader()", () => {
    const originalDomain = process.env.ALLOWED_EMAIL_DOMAIN;
    const originalEmails = process.env.ALLOWED_EMAILS;
    const originalTenants = process.env.ALLOWED_TENANT_IDS;

    beforeEach(() => {
        process.env.ALLOWED_EMAIL_DOMAIN = "envirosgroup.com";
        process.env.ALLOWED_EMAILS = "hakimiazizi060@gmail.com";
        process.env.ALLOWED_TENANT_IDS = TENANT_ID;
    });

    afterEach(() => {
        process.env.ALLOWED_EMAIL_DOMAIN = originalDomain;
        process.env.ALLOWED_EMAILS = originalEmails;
        process.env.ALLOWED_TENANT_IDS = originalTenants;
        vi.clearAllMocks();
    });

    it("accepts a token whose email is on the allowed domain, returning email/oid/tid", async () => {
        jwtVerifyMock.mockResolvedValue({
            payload: { iss: VALID_ISSUER, oid: OID, tid: TENANT_ID, email: "someone@envirosgroup.com" },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result).toEqual({
            valid: true,
            email: "someone@envirosgroup.com",
            oid: OID,
            tid: TENANT_ID,
        });
    });

    it("accepts an explicitly-listed email on a different domain", async () => {
        jwtVerifyMock.mockResolvedValue({
            payload: { iss: VALID_ISSUER, oid: OID, tid: TENANT_ID, email: "hakimiazizi060@gmail.com" },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result).toEqual({
            valid: true,
            email: "hakimiazizi060@gmail.com",
            oid: OID,
            tid: TENANT_ID,
        });
    });

    it("rejects a token whose email matches neither the domain nor the explicit list", async () => {
        jwtVerifyMock.mockResolvedValue({
            payload: { iss: VALID_ISSUER, oid: OID, tid: TENANT_ID, email: "attacker@envirosgroup.com.evil.com" },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result.valid).toBe(false);
        expect((result as { reason: string }).reason).toBe("Account not authorized for this application");
    });

    it("rejects when both ALLOWED_EMAIL_DOMAIN and ALLOWED_EMAILS are unset, even for a plausible email", async () => {
        delete process.env.ALLOWED_EMAIL_DOMAIN;
        delete process.env.ALLOWED_EMAILS;
        jwtVerifyMock.mockResolvedValue({
            payload: { iss: VALID_ISSUER, oid: OID, tid: TENANT_ID, email: "someone@envirosgroup.com" },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result.valid).toBe(false);
        expect((result as { reason: string }).reason).toBe("Access not configured");
    });

    it("rejects a malformed/fake issuer string regardless of email domain", async () => {
        jwtVerifyMock.mockResolvedValue({
            payload: {
                iss: "https://evil.example.com/not-a-real-tenant/",
                oid: OID,
                tid: TENANT_ID,
                email: "someone@envirosgroup.com",
            },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result.valid).toBe(false);
        expect((result as { reason: string }).reason).toBe("Invalid or Expired token");
    });

    it("rejects a well-formed token from a tenant that isn't on ALLOWED_TENANT_IDS", async () => {
        const otherTenant = "99999999-8888-7777-6666-555555555555";
        jwtVerifyMock.mockResolvedValue({
            payload: {
                iss: `https://sts.windows.net/${otherTenant}/`,
                oid: OID,
                tid: otherTenant,
                email: "someone@envirosgroup.com",
            },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result.valid).toBe(false);
        expect((result as { reason: string }).reason).toBe("Tenant not authorized for this application");
    });

    it("rejects when ALLOWED_TENANT_IDS is unset, even for an otherwise-valid tenant", async () => {
        delete process.env.ALLOWED_TENANT_IDS;
        jwtVerifyMock.mockResolvedValue({
            payload: { iss: VALID_ISSUER, oid: OID, tid: TENANT_ID, email: "someone@envirosgroup.com" },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result.valid).toBe(false);
        expect((result as { reason: string }).reason).toBe("Tenant not authorized for this application");
    });

    it("rejects a token missing the oid claim", async () => {
        jwtVerifyMock.mockResolvedValue({
            payload: { iss: VALID_ISSUER, tid: TENANT_ID, email: "someone@envirosgroup.com" },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result.valid).toBe(false);
        expect((result as { reason: string }).reason).toBe("Invalid or Expired token");
    });

    it("rejects a token missing the tid claim", async () => {
        jwtVerifyMock.mockResolvedValue({
            payload: { iss: VALID_ISSUER, oid: OID, email: "someone@envirosgroup.com" },
        });

        const result = await validateAuthHeader("Bearer valid-token");

        expect(result.valid).toBe(false);
        expect((result as { reason: string }).reason).toBe("Invalid or Expired token");
    });

    it("rejects a malformed authorization header (missing 'Bearer ' prefix)", async () => {
        const result = await validateAuthHeader("valid-token-no-bearer-prefix");

        expect(result.valid).toBe(false);
        expect((result as { reason: string }).reason).toBe("Invalid authorization header");
    });

    it("rejects a missing authorization header", async () => {
        const result = await validateAuthHeader(null);

        expect(result.valid).toBe(false);
        expect((result as { reason: string }).reason).toBe("Missing authorization header");
    });

    it("rejects an expired/invalid-signature token (jwtVerify throws)", async () => {
        jwtVerifyMock.mockRejectedValue(new Error("signature verification failed"));

        const result = await validateAuthHeader("Bearer expired-token");

        expect(result.valid).toBe(false);
        expect((result as { reason: string }).reason).toBe("Invalid or Expired token");
    });
});
