import { describe, it, expect, vi } from "vitest";
import { withAuth } from "./withAuth";
import { validateAuthHeader } from "./auth";

vi.mock("./auth", () => ({
  validateAuthHeader: vi.fn(),
}));

describe("withAuth", () => {
  it("returns 401 and never calls the handler when the token is invalid", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const handler = vi.fn();
    const wrapped = withAuth(handler);

    const request = new Request("http://localhost/api/transactions", {
      headers: { Authorization: "Bearer bad.token" },
    });

    const response = await wrapped(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Invalid or Expired token",
      code: "UNAUTHORIZED",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls the handler with the request, auth result, and context when the token is valid", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
  
    const handlerResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
    });
    const handler = vi.fn().mockResolvedValue(handlerResponse);
    const wrapped = withAuth<{ params: Promise<{ id: string }> }>(handler);
  
    const request = new Request("http://localhost/api/transactions/5", {
      headers: { Authorization: "Bearer good.token" },
    });
    const context = { params: Promise.resolve({ id: "5" }) };
  
    const response = await wrapped(request, context);
  
    expect(handler).toHaveBeenCalledWith(request, { valid: true }, context);
    expect(response).toBe(handlerResponse);
  });

  
});