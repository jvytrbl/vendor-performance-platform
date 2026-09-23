import { describe, it, expect, vi } from "vitest";
import { buildPrompt, generateReportNarrative } from "./generateReportNarrative";
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

describe("buildPrompt", () => {
  it("adds the vendor blank-line instruction without changing existing instructions or JSON shape", () => {
    const prompt = buildPrompt(data);
    const lines = prompt.split("\n");
    const jsonLine = lines[lines.length - 1];

    expect(prompt).toContain(
      "Within each section, separate the discussion of each vendor with a blank line so vendors are clearly distinguished as separate paragraphs."
    );
    expect(prompt).toContain("You write narrative for a vendor performance report.");
    expect(prompt).toContain("Use only the numeric values in the following JSON.");
    expect(prompt).toContain("Do not invent any numeric value that is not present.");
    expect(prompt).toContain("If a field is null, do not state a number for that metric.");
    expect(prompt).toContain(
      "When you state a number, either quote it exactly as given (same decimal places) or round it to the nearest whole number — never round to any other precision, and never estimate or approximate a value."
    );
    expect(prompt).toContain("vendor{id}_name");
    expect(prompt).toContain(
      "When you characterize performance, compare against both the prior period and the peer average."
    );
    expect(prompt).toContain("Vendor Summary:");
    expect(prompt).toContain("Delivery Performance:");
    expect(prompt).toContain("Pricing Analysis:");
    expect(prompt).toContain("Order Accuracy:");
    expect(prompt).toContain("Do not repeat the same paragraph");
    expect(jsonLine).toBe(JSON.stringify(data));
    expect(JSON.parse(jsonLine)).toEqual(data);
  });
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