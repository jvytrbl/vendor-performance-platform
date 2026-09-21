import { describe, it, expect, vi } from "vitest";
import { runReportGeneration } from "./runReportGeneration";

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

const input = {
  vendorIds: [1],
  currentPeriod: { periodStart: "2026-01-01", periodEnd: "2026-03-31" },
  priorPeriod: { periodStart: "2025-10-01", periodEnd: "2025-12-31" },
  currentTxs: [currentTx],
  priorTxs: [],
};

describe("runReportGeneration", () => {
  it("returns sections and metrics when the narrative only uses computed numbers", async () => {
    const generateContent = vi.fn().mockResolvedValue("On-time delivery was 100.");

    const result = await runReportGeneration({ ...input, generateContent });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sections.vendor_summary).toBe("On-time delivery was 100.");
    expect(result.sections.delivery_performance).toBe("On-time delivery was 100.");
    expect(result.sections.pricing_analysis).toBe("On-time delivery was 100.");
    expect(result.sections.order_accuracy).toBe("On-time delivery was 100.");
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vendor_id: 1,
          period_start: "2026-01-01",
          on_time_delivery_rate: 100,
          transaction_count: 1,
        }),
      ])
    );
  });

  it("retries then fails without returning sections when the narrative invents a number", async () => {
    const generateContent = vi.fn().mockResolvedValue("Delay was 9 days.");

    const result = await runReportGeneration({ ...input, generateContent });

    expect(generateContent).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      ok: false,
      error: "Generated narrative failed validation; nothing was saved",
      code: "NARRATIVE_VALIDATION_FAILED",
    });
  });

  it("fails without returning sections when Gemini throws", async () => {
    const generateContent = vi.fn().mockRejectedValue(
      new Error("Gemini request failed with status 500")
    );

    const result = await runReportGeneration({ ...input, generateContent });

    expect(result).toEqual({
      ok: false,
      error: "AI generation failed; nothing was saved",
      code: "AI_UNAVAILABLE",
    });
  });
});
