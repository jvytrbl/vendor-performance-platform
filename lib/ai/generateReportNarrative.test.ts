import { describe, it, expect, vi } from "vitest";
import { generateReportNarrative } from "./generateReportNarrative";
import { buildMetricPromptData } from "../domain/reports/buildMetricPromptData";
import { geminiGenerateContent } from "./geminiGenerateContent";

const zeros = {
    onTimeDeliveryRate: 0,
    avgDelayDays: 0,
    overchargeRate: 0,
    avgOverchargePct: 0,
    underchargeRate: 0,
    shortfallRate: 0,
    avgShortfallUnits: 0,
    overdeliveryRate: 0,
    avgOverdeliveryUnits: 0,
};

const data = buildMetricPromptData({
    vendorId: 1,
    current: {...zeros, onTimeDeliveryRate: 80},
    prior: { ...zeros, onTimeDeliveryRate: 70},
    peers : [
        { vendorId: 1, metrics: { ...zeros, onTimeDeliveryRate: 80 } },
        { vendorId: 2, metrics: { ...zeros, onTimeDeliveryRate: 40 } },
        { vendorId: 3, metrics: { ...zeros, onTimeDeliveryRate: 60 } },
    ],
});

describe("generateReportNarrative", () => {
    // Category 8 (security-hostile input): does not apply.
    // Prompt data is numbers and null only, produced by A1–A8 / C1.
    it("puts the named metric fields in the prompt and returns the raw model text", async () => {
      const generateContent = vi.fn().mockResolvedValue(
        "On-time delivery was 80 versus the prior period 70 and a peer average of 50."
      );
      const result = await generateReportNarrative(data, generateContent);
      expect(generateContent).toHaveBeenCalledOnce();
      const prompt = generateContent.mock.calls[0][0];
      expect(prompt).toContain("onTimeDeliveryRateCurrent");
      expect(prompt).toContain("onTimeDeliveryRatePrior");
      expect(prompt).toContain("onTimeDeliveryRatePeerAverage");
      expect(prompt).toContain("80");
      expect(prompt).toContain("70");
      expect(prompt).toContain("50");
      expect(prompt).toContain("Do not invent any numeric value");
      expect(prompt).toContain("Vendor Summary:");
      expect(prompt).toContain("Delivery Performance:");
      expect(prompt).toContain("Pricing Analysis:");
      expect(prompt).toContain("Order Accuracy:");
      expect(prompt).toContain("Do not repeat the same paragraph");
      expect(result).toBe(
        "On-time delivery was 80 versus the prior period 70 and a peer average of 50."
      );
    });
    it("returns an empty string unchanged when the model returns no text", async () => {
      const generateContent = vi.fn().mockResolvedValue("");
      const result = await generateReportNarrative(data, generateContent);
      expect(result).toBe("");
    });
  });

describe("generateReportNarrative — real Gemini", () => {
    it.skipIf(!process.env.GEMINI_API_KEY)(
      "returns non-empty text from the live API",
      async () => {
        const result = await generateReportNarrative(data, (prompt) =>
          geminiGenerateContent(prompt, process.env.GEMINI_API_KEY as string)
        );
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      }
    );
  });