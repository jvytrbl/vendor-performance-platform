export type GenerateContent = (prompt: string) => Promise<string>;

export function buildPrompt(data: Record<string, number | string | null | undefined>): string {
    return [
        "You write narrative for a vendor performance report.",
        "Use only the numeric values in the following JSON.",
        "Do not invent any numeric value that is not present.",
        "If a field is null, do not state a number for that metric.",
        "When you state a number, either quote it exactly as given (same decimal places) or round it to the nearest whole number — never round to any other precision, and never estimate or approximate a value.",
        "Each vendor's data includes a vendor{id}_name field giving their real name (e.g. vendor7_name). Always refer to that vendor by this name in the narrative. Never write \"Vendor\" followed by a number, and never use the numeric vendor ID as a name.",
        "When you characterize performance, compare against both the prior period and the peer average.",
        "Write four separate sections. Use these headings exactly, in this order, each on its own line:",
        "Vendor Summary:",
        "Delivery Performance:",
        "Pricing Analysis:",
        "Order Accuracy:",
        "Vendor Summary covers who is in the period and the overall result.",
        "Delivery Performance covers on-time delivery and delay.",
        "Pricing Analysis covers overcharge and undercharge.",
        "Order Accuracy covers shortfall and over-delivery.",
        "Do not repeat the same paragraph in more than one section.",
        "Within each section, separate the discussion of each vendor with a blank line so vendors are clearly distinguished as separate paragraphs.",
        JSON.stringify(data),
    ].join("\n");
}

export async function generateReportNarrative(
    data: Record<string, number | string | null | undefined>,
    generateContent: GenerateContent
): Promise<string> {
    return generateContent(buildPrompt(data));
}