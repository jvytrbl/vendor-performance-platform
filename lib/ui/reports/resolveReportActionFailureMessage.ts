export function resolveReportActionFailureMessage(code: string): string {
  const messages: Record<string, string> = {
    REPORT_FINALIZED: "This report is already finalized and cannot be modified.",
    GENERATION_IN_PROGRESS:
      "Generation is already in progress. Please wait before trying again.",
    AI_UNAVAILABLE:
      "The AI narrative service is temporarily unavailable. Please try again in a moment.",
    NARRATIVE_VALIDATION_FAILED:
      "Generation was rejected because a number or a comparison did not match the computed data. Nothing was saved. Generate again.",
    REPORT_NOT_FINALIZED:
      "This report must be finalized before you can export it.",
    DUPLICATE_METRICS:
      "A report with this vendor and period already exists. Please choose a different vendor or period.",
    UNAUTHORIZED: "Your session has expired. Please log in again.",
    VENDOR_NOT_FOUND: "One or more selected vendors could not be found.",
  };

  return messages[code] || "An error occurred. Please try again.";
}
