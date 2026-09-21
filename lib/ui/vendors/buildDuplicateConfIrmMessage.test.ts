import { describe, it, expect } from "vitest";
import { buildDuplicateConfirmMessage } from "./buildDuplicateConfirmMessage";

describe("buildDuplicateConfirmMessage", () => {
  it("names both the attempted vendor and the existing match, with a clear next step", () => {
    const message = buildDuplicateConfirmMessage("Acme Trading", {
      id: 1,
      name: "Acme Trading Sdn Bhd",
    });

    expect(message).toBe(
      '"Acme Trading" looks similar to an existing vendor, "Acme Trading Sdn Bhd". Add it anyway, or is this the same vendor?'
    );
  });

  
});