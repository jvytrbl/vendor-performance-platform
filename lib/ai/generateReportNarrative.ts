export type GenerateContent = (prompt: string) => Promise<string>;

function buildPrompt(data: Record<string, number | null | undefined>): string {
    return [
        "You write narrative for a vendor performance report.",
        "Use only the numeric values in the folowing JSON",
        "Do not invent any numeric value that is not present",
        "if a field is null, do not state a number for that metric.",
        "When you characterize performance, compare against both the prior priod and the peer average.",
        JSON.stringify(data),
    ].join("\n");
}

export async function generateReportNarrative(
    data: Record<string, number | null | undefined>,
    generateContent: GenerateContent
): Promise<string> {
    return generateContent(buildPrompt(data));
}