export function resolveDeleteFailureMessage(code: string, apiMessage: string): string {
    if (code === "UNAUTHORIZED") {
      return "Your session has expired. Please sign in again.";
    }
    return apiMessage;
  }
  