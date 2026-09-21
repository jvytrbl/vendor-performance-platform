import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";
import { validateAuthHeader } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  validateAuthHeader: vi.fn(),
}));

describe("GET /api/protected-route", () => {
  it("returns 401 with the standard error shape when the token is invalid", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const request = new Request("http://localhost/api/protected-route", {
      headers: { Authorization: "Bearer bad.token" },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Invalid or Expired token", code: "UNAUTHORIZED" });
  });

  it("returns 200 when the token is valid", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const request = new Request("http://localhost/api/protected-route", {
      headers: { Authorization: "Bearer good.token" },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });
});
