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

  it("leaves the four AI Comparative Analysis fields null for a single-vendor report", async () => {
    const generateContent = vi.fn().mockResolvedValue(acceptedNarrative);

    const result = await runReportGeneration({ ...input, generateContent });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sections.ai_overall_comparison).toBeNull();
    expect(result.sections.ai_delivery_comparison).toBeNull();
    expect(result.sections.ai_pricing_comparison).toBeNull();
    expect(result.sections.ai_order_accuracy_comparison).toBeNull();
    // The <2-vendor path must never even mention the comparison instructions.
    const prompt = generateContent.mock.calls[0][0];
    expect(prompt).not.toContain("Overall Comparison:");
  });
});

describe("runReportGeneration — AI Comparative Analysis (>= 2 vendors)", () => {
  const twoVendorTx = {
    id: 2,
    vendor_id: 2,
    transaction_date: "2026-02-01",
    agreed_delivery_date: "2026-02-10",
    actual_delivery_date: "2026-02-10",
    agreed_price: 100,
    actual_price: 100,
    quantity_ordered: 10,
    quantity_received: 10,
  };

  const twoVendorInput = {
    vendorIds: [1, 2],
    vendorNames: new Map([
      [1, "Acme Supplies"],
      [2, "Globex Logistics"],
    ]),
    currentPeriod: { periodStart: "2026-01-01", periodEnd: "2026-03-31" },
    priorPeriod: { periodStart: "2025-10-01", periodEnd: "2025-12-31" },
    currentTxs: [currentTx, twoVendorTx],
    priorTxs: [],
  };

  const acceptedComparisonNarrative = [
    acceptedNarrative,
    "Overall Comparison:",
    "Both vendors delivered on time this period.",
    "",
    "Delivery Comparison:",
    "Both vendors delivered on time this period.",
    "",
    "Pricing Comparison:",
    "Both vendors matched their agreed prices.",
    "",
    "Order Accuracy Comparison:",
    "Both vendors matched ordered and received quantities.",
  ].join("\n");

  it("sends the computed ranking as a second JSON block and requests the four comparison headings", async () => {
    const generateContent = vi.fn().mockResolvedValue(acceptedComparisonNarrative);

    await runReportGeneration({ ...twoVendorInput, generateContent });

    const prompt = generateContent.mock.calls[0][0];
    expect(prompt).toContain("Overall Comparison:");
    expect(prompt).toContain("Delivery Comparison:");
    expect(prompt).toContain("Pricing Comparison:");
    expect(prompt).toContain("Order Accuracy Comparison:");
    expect(prompt).toContain("do not state who leads");
    // The ranking JSON (vendorId-keyed) must actually be present, not just the instructions.
    expect(prompt).toContain("categoryLeaders");
    expect(prompt).toContain("overallLeaders");
  });

  it("prepends the code-authored ranking sentence to the AI's explanatory text for each comparison field", async () => {
    const generateContent = vi.fn().mockResolvedValue(acceptedComparisonNarrative);

    const result = await runReportGeneration({ ...twoVendorInput, generateContent });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Both vendors tie on every metric here (identical transactions), so the
    // code-authored sentence states a tie — confirms it's really prepended,
    // not just the AI's own text.
    expect(result.sections.ai_overall_comparison).toContain("are tied for 1st");
    expect(result.sections.ai_overall_comparison).toContain(
      "Both vendors delivered on time this period."
    );
    expect(result.sections.ai_delivery_comparison).toContain("are tied for 1st");
    expect(result.sections.ai_pricing_comparison).toContain("are tied for 1st");
    expect(result.sections.ai_order_accuracy_comparison).toContain("are tied for 1st");
  });

  it("retries then fails when a comparison heading is missing for a >= 2 vendor report", async () => {
    const generateContent = vi.fn().mockResolvedValue(acceptedNarrative); // no comparison headings at all

    const result = await runReportGeneration({ ...twoVendorInput, generateContent });

    expect(generateContent).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      ok: false,
      error: "Generated narrative failed validation; nothing was saved",
      code: "NARRATIVE_VALIDATION_FAILED",
    });
  });

  it("retries then fails when a comparison section invents a number", async () => {
    const invented = acceptedComparisonNarrative.replace(
      "Both vendors matched their agreed prices.",
      "The overcharge was 9."
    );
    const generateContent = vi.fn().mockResolvedValue(invented);

    const result = await runReportGeneration({ ...twoVendorInput, generateContent });

    expect(generateContent).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      ok: false,
      error: "Generated narrative failed validation; nothing was saved",
      code: "NARRATIVE_VALIDATION_FAILED",
    });
  });

  describe("hallucinated leader — the clear-leader (non-tied) case", () => {
    // Vendor 1 delivers on time; vendor 2 is late on every order, so vendor 1
    // is the sole, non-tied leader in every category and overall.
    const lateVendorTx = {
      id: 3,
      vendor_id: 2,
      transaction_date: "2026-02-01",
      agreed_delivery_date: "2026-02-10",
      actual_delivery_date: "2026-02-20",
      agreed_price: 100,
      actual_price: 130,
      quantity_ordered: 10,
      quantity_received: 7,
    };
    const clearLeaderInput = {
      vendorIds: [1, 2],
      vendorNames: new Map([
        [1, "Acme Supplies"],
        [2, "Globex Logistics"],
      ]),
      currentPeriod: { periodStart: "2026-01-01", periodEnd: "2026-03-31" },
      priorPeriod: { periodStart: "2025-10-01", periodEnd: "2025-12-31" },
      currentTxs: [currentTx, lateVendorTx],
      priorTxs: [],
    };
    const hallucinatedLeaderNarrative = [
      acceptedNarrative,
      "Overall Comparison:",
      "Globex Logistics leads this period.",
      "",
      "Delivery Comparison:",
      "Globex Logistics leads on delivery.",
      "",
      "Pricing Comparison:",
      "Pricing was close between the two vendors.",
      "",
      "Order Accuracy Comparison:",
      "Order accuracy was close between the two vendors.",
    ].join("\n");

    it("retries then fails without saving when the AI names the wrong vendor as leader on every attempt", async () => {
      const generateContent = vi.fn().mockResolvedValue(hallucinatedLeaderNarrative);

      const result = await runReportGeneration({ ...clearLeaderInput, generateContent });

      // Proves the fail-closed guarantee concretely: all 3 attempts are
      // spent (not short-circuited), and the final result carries no
      // sections/metrics a caller could accidentally persist — the route
      // only calls saveGeneratedReport/withAudit when result.ok is true,
      // so this ok:false shape is what keeps the write from ever happening.
      expect(generateContent).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        ok: false,
        error: "Generated narrative failed validation; nothing was saved",
        code: "NARRATIVE_VALIDATION_FAILED",
      });
      expect(result).not.toHaveProperty("sections");
      expect(result).not.toHaveProperty("metrics");
    });

    it("passes when a later attempt correctly names the real leader", async () => {
      const correctedNarrative = hallucinatedLeaderNarrative
        .replace("Globex Logistics leads this period.", "Acme Supplies leads this period.")
        .replace("Globex Logistics leads on delivery.", "Acme Supplies leads on delivery.");
      const generateContent = vi
        .fn()
        .mockResolvedValueOnce(hallucinatedLeaderNarrative)
        .mockResolvedValueOnce(correctedNarrative);

      const result = await runReportGeneration({ ...clearLeaderInput, generateContent });

      expect(generateContent).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sections.ai_overall_comparison).toContain("Acme Supplies ranks 1st");
    });
  });
});
