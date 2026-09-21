import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { validateAuthHeader } from "../../../../../lib/auth";
import { getReportById, saveGeneratedReport } from "@/lib/repositories/reports";
import { getTransactionsForPeriod } from "@/lib/repositories/transactions";
import {
  geminiGenerateContent,
  RateLimitError,
} from "../../../../../lib/ai/geminiGenerateContent";

vi.mock("../../../../../lib/auth", () => ({
  validateAuthHeader: vi.fn(),
}));

vi.mock("@/lib/repositories/reports", () => ({
  getReportById: vi.fn(),
  saveGeneratedReport: vi.fn(),
}));

vi.mock("@/lib/repositories/transactions", () => ({
  getTransactionsForPeriod: vi.fn(),
}));

vi.mock("../../../../../lib/ai/geminiGenerateContent", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../../lib/ai/geminiGenerateContent")>();
  return {
    ...actual,
    geminiGenerateContent: vi.fn(),
  };
});

const draft = {
  id: 7,
  reference_number: "VPR-20260101-123456",
  period_type: "Quarterly",
  period_start: "2026-01-01",
  period_end: "2026-03-31",
  status: "Draft",
  vendor_summary: null,
  delivery_performance: null,
  pricing_analysis: null,
  order_accuracy: null,
  created_at: "2026-04-01T00:00:00.000Z",
  finalized_at: null,
  vendor_ids: [1],
  metrics: [],
};

const currentTx = {
  id: 1,
  vendor_id: 1,
  transaction_date: "2026-02-01",
  agreed_delivery_date: "2026-02-10",
  actual_delivery_date: "2026-02-10",
  agreed_price: 100,
  actual_price: 100,
  quantity_ordered: 10,
  quantity_received: 10,
};

describe("POST /api/reports/:id/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("returns 401 when the request is not authenticated", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });
    const response = await POST(
      new Request("http://localhost/api/reports/7/generate", { method: "POST" }),
      { params: Promise.resolve({ id: "7" }) }
    );
    expect(response.status).toBe(401);
    expect(saveGeneratedReport).not.toHaveBeenCalled();
  });

  it("returns 404 when the report does not exist", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getReportById).mockResolvedValue(null);
    const response = await POST(
      new Request("http://localhost/api/reports/99/generate", {
        method: "POST",
        headers: { Authorization: "Bearer good.token" },
      }),
      { params: Promise.resolve({ id: "99" }) }
    );
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.code).toBe("REPORT_NOT_FOUND");
    expect(saveGeneratedReport).not.toHaveBeenCalled();
  });

  it("returns 409 when the report is Finalized", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getReportById).mockResolvedValue({ ...draft, status: "Finalized" } as any);
    const response = await POST(
      new Request("http://localhost/api/reports/7/generate", {
        method: "POST",
        headers: { Authorization: "Bearer good.token" },
      }),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.code).toBe("REPORT_FINALIZED");
    expect(saveGeneratedReport).not.toHaveBeenCalled();
  });

  it("does not save when the narrative fails validation", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getReportById).mockResolvedValue(draft as any);
    vi.mocked(getTransactionsForPeriod).mockResolvedValue([currentTx] as any);
    vi.mocked(geminiGenerateContent).mockResolvedValue("Delay was 9 days.");

    const response = await POST(
      new Request("http://localhost/api/reports/7/generate", {
        method: "POST",
        headers: { Authorization: "Bearer good.token" },
      }),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(saveGeneratedReport).not.toHaveBeenCalled();
    expect(response.status).toBe(422);
    expect(body).toEqual({
      error: "Generated narrative failed validation; nothing was saved",
      code: "NARRATIVE_VALIDATION_FAILED",
    });
  });

  it("saves sections and metrics when generation validates", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getTransactionsForPeriod).mockImplementation(async (_ids, dateFrom) => {
      if (dateFrom === "2026-01-01") return [currentTx] as any;
      return [];
    });
    vi.mocked(geminiGenerateContent).mockResolvedValue("On-time delivery was 100.");
    vi.mocked(saveGeneratedReport).mockResolvedValue();
    vi.mocked(getReportById)
      .mockResolvedValueOnce(draft as any)
      .mockResolvedValueOnce({
        ...draft,
        vendor_summary: "On-time delivery was 100.",
      } as any);

    const response = await POST(
      new Request("http://localhost/api/reports/7/generate", {
        method: "POST",
        headers: { Authorization: "Bearer good.token" },
      }),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(saveGeneratedReport).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(body.data.vendor_summary).toBe("On-time delivery was 100.");
  });

  it("retries on 429 and still saves once Gemini succeeds within the retry budget", async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
      vi.mocked(getTransactionsForPeriod).mockImplementation(async (_ids, dateFrom) => {
        if (dateFrom === "2026-01-01") return [currentTx] as any;
        return [];
      });
      vi.mocked(geminiGenerateContent)
        .mockRejectedValueOnce(new RateLimitError())
        .mockResolvedValue("On-time delivery was 100.");
      vi.mocked(saveGeneratedReport).mockResolvedValue();
      vi.mocked(getReportById)
        .mockResolvedValueOnce(draft as any)
        .mockResolvedValueOnce({
          ...draft,
          vendor_summary: "On-time delivery was 100.",
        } as any);

      const responsePromise = POST(
        new Request("http://localhost/api/reports/7/generate", {
          method: "POST",
          headers: { Authorization: "Bearer good.token" },
        }),
        { params: Promise.resolve({ id: "7" }) }
      );

      await vi.advanceTimersByTimeAsync(1000);
      const response = await responsePromise;
      const body = await response.json();

      expect(geminiGenerateContent).toHaveBeenCalledTimes(2);
      expect(saveGeneratedReport).toHaveBeenCalledOnce();
      expect(response.status).toBe(200);
      expect(body.data.vendor_summary).toBe("On-time delivery was 100.");
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns 503 AI_UNAVAILABLE after exhausting all 3 retry attempts on repeated 429s", async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
      vi.mocked(getReportById).mockResolvedValue(draft as any);
      vi.mocked(getTransactionsForPeriod).mockResolvedValue([currentTx] as any);
      vi.mocked(geminiGenerateContent).mockRejectedValue(new RateLimitError());

      const responsePromise = POST(
        new Request("http://localhost/api/reports/7/generate", {
          method: "POST",
          headers: { Authorization: "Bearer good.token" },
        }),
        { params: Promise.resolve({ id: "7" }) }
      );

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      const response = await responsePromise;
      const body = await response.json();

      expect(geminiGenerateContent).toHaveBeenCalledTimes(3);
      expect(saveGeneratedReport).not.toHaveBeenCalled();
      expect(response.status).toBe(503);
      expect(body.code).toBe("AI_UNAVAILABLE");
    } finally {
      vi.useRealTimers();
    }
  });
});
