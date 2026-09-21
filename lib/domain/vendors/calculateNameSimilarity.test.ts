import { describe, it, expect } from "vitest";
import { calculateNameSimilarity } from "./calculateNameSimilarity";

describe("calculateNameSimilarity", () => {
  it("scores reordered words as highly similar", () => {
    const score = calculateNameSimilarity("Acme Trading", "Trading Acme");

    expect(score).toBeGreaterThanOrEqual(85);
  });

  it("treats 'Sdn Bhd as a a negligible suffix when comparing names", () => {
    const score = calculateNameSimilarity("ABC", "ABC Sdn Bhd");

    expect(score).toBeGreaterThanOrEqual(85);
  });

  it("DIAGNOSTIC: prints the score for Gamuda vs Gamuda Land", () => {
    console.log("Gamuda vs Gamuda Land:", calculateNameSimilarity("Gamuda", "Gamuda Land"));
    console.log("Gamuda vs Gamuda Berhad:", calculateNameSimilarity("Gamuda", "Gamuda Berhad"));
  });
});