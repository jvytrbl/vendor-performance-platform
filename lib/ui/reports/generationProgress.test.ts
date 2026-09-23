import { describe, expect, it } from "vitest";
import { nextGenerationProgress } from "./generationProgress";

describe("nextGenerationProgress", () => {
  it("starts near empty and stays under the ceiling", () => {
    expect(nextGenerationProgress(0)).toBeLessThan(0.05);
    expect(nextGenerationProgress(120)).toBeLessThanOrEqual(0.94);
  });

  it("keeps moving forward across a long wait", () => {
    const early = nextGenerationProgress(8);
    const middle = nextGenerationProgress(20);
    const later = nextGenerationProgress(40);
    expect(middle).toBeGreaterThan(early);
    expect(later).toBeGreaterThan(middle);
    expect(nextGenerationProgress(41.8) - nextGenerationProgress(40)).toBeGreaterThanOrEqual(0.003);
  });
});
