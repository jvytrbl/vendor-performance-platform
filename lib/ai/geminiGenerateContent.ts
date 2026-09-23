const GEMINI_MODEL = "gemini-3.6-flash";

export class RateLimitError extends Error {
  readonly status = 429;

  constructor() {
    super("Gemini request failed with status 429");
    this.name = "RateLimitError";
  }
}

// Gemini returns 5xx (most commonly 503 "high demand") when the model is
// transiently overloaded on Google's side — unrelated to our own request
// rate. This is just as retryable as a 429 and, in practice, far more
// common than actual rate-limiting.
const RETRYABLE_SERVER_STATUSES = new Set([500, 502, 503, 504]);

export class ServiceUnavailableError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Gemini request failed with status ${status}`);
    this.name = "ServiceUnavailableError";
    this.status = status;
  }
}

export async function geminiGenerateContent(
  prompt: string,
  apiKey: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new RateLimitError();
    }
    if (RETRYABLE_SERVER_STATUSES.has(response.status)) {
      throw new ServiceUnavailableError(response.status);
    }
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const body = await response.json();
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string") {
    return "";
  }

  return text;
}
