const GEMINI_MODEL = "gemini-3.8-flash";

export class RateLimitError extends Error {
  readonly status = 429;

  constructor() {
    super("Gemini request failed with status 429");
    this.name = "RateLimitError";
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
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const body = await response.json();
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string") {
    return "";
  }

  return text;
}
