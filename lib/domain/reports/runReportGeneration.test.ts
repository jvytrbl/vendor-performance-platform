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
  vendorNames: new Map([[1, "Acme Supplies"]]),
  currentPeriod: { periodStart: "2026-01-01", periodEnd: "2026-03-31" },
  priorPeriod: { periodStart: "2025-10-01", periodEnd: "2025-12-31" },
  currentTxs: [currentTx],
  priorTxs: [],
};

const acceptedNarrative = [
  "Vendor Summary:",
  "This period covers the selected vendor.",
  "",
  "Delivery Performance:",
  "On-time delivery was 100.",
  "",
  "Pricing Analysis:",
  "Agreed and actual prices match.",
  "",
  "Order Accuracy:",
  "Ordered and received quantities match.",
].join("\n");

describe("runReportGeneration", () => {
  it("returns sections and metrics when the narrative only uses computed numbers", async () => {
    const generateContent = vi.fn().mockResolvedValue(acceptedNarrative);

    const result = await runReportGeneration({ ...input, generateContent });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sections.vendor_summary).toBe("This period covers the selected vendor.");
    expect(result.sections.delivery_performance).toBe("On-time delivery was 100.");
    expect(result.sections.pricing_analysis).toBe("Agreed and actual prices match.");
    expect(result.sections.order_accuracy).toBe("Ordered and received quantities match.");
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

  it("includes each vendor's real name in the data sent to the model, not just its numeric id", async () => {
    const generateContent = vi.fn().mockResolvedValue(acceptedNarrative);

    await runReportGeneration({ ...input, generateContent });

    const prompt = generateContent.mock.calls[0][0];
    expect(prompt).toContain("vendor1_name");
    expect(prompt).toContain("Acme Supplies");
  });

  it("falls back to a Vendor {id} placeholder if a vendor name is missing from the lookup", async () => {
    const generateContent = vi.fn().mockResolvedValue(acceptedNarrative);

    await runReportGeneration({
      ...input,
      vendorNames: new Map(),
      generateContent,
    });

    const prompt = generateContent.mock.calls[0][0];
    expect(prompt).toContain('"vendor1_name":"Vendor 1"');
  });

  it("retries then fails when the same paragraph is copied into every section", async () => {
    const repeated = [
      "Vendor Summary:",
      "On-time delivery was 100.",
      "Delivery Performance:",
      "On-time delivery was 100.",
      "Pricing Analysis:",
      "On-time delivery was 100.",
      "Order Accuracy:",
      "On-time delivery was 100.",
    ].join("\n");
    const generateContent = vi.fn().mockResolvedValue(repeated);

    const result = await runReportGeneration({ ...input, generateContent });

    expect(generateContent).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      ok: false,
      error: "Generated narrative failed validation; nothing was saved",
      code: "NARRATIVE_VALIDATION_FAILED",
    });
  });

  it("retries then fails when one section invents a number", async () => {
    const invented = acceptedNarrative.replace(
      "Agreed and actual prices match.",
      "The overcharge was 9."
    );
    const generateContent = vi.fn().mockResolvedValue(invented);

    const result = await runReportGeneration({ ...input, generateContent });

    expect(generateContent).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      ok: false,
      error: "Generated narrative failed validation; nothing was saved",
      code: "NARRATIVE_VALIDATION_FAILED",
    });
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
