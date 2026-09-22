import { describe, expect, it } from "vitest";
import { resolveReportActionFailureMessage } from "./resolveReportActionFailureMessage";

describe("resolveReportActionFailureMessage", () => {
  it("maps REPORT_FINALIZED to finalization message", () => {
    expect(resolveReportActionFailureMessage("REPORT_FINALIZED")).toContain(
      "already finalized"
    );
  });

  it("maps GENERATION_IN_PROGRESS to in-progress message", () => {
    expect(resolveReportActionFailureMessage("GENERATION_IN_PROGRESS")).toContain(
      "already in progress"
    );
  });

  it("maps AI_UNAVAILABLE to unavailable message", () => {
    expect(resolveReportActionFailureMessage("AI_UNAVAILABLE")).toContain(
      "temporarily unavailable"
    );
  });

  it("maps DUPLICATE_METRICS to duplicate message", () => {
    expect(resolveReportActionFailureMessage("DUPLICATE_METRICS")).toContain(
      "already exists"
    );
  });

  it("maps unknown code to generic message", () => {
    expect(resolveReportActionFailureMessage("UNKNOWN_ERROR")).toBe(
      "An error occurred. Please try again."
    );
  });
});
