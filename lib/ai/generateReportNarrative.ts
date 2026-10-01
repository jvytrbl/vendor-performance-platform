export type GenerateContent = (prompt: string) => Promise<string>;

export interface BuildPromptOptions {
    // Presence (not just truthiness of a separate flag) is what decides
    // whether the four comparison instructions/headings are added — when
    // omitted, this function's output is byte-identical to before this
    // feature existed (pinned by a test).
    comparisonData?: unknown;
}

export function buildPrompt(
    data: Record<string, number | string | null | undefined>,
    options?: BuildPromptOptions
): string {
    const lines = [
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
    ];

    if (options?.comparisonData !== undefined) {
        lines.push(
            "You will also write four short comparison notes about how the vendors in this report compare to each other.",
            "A ranking has already been computed by the system for each of these four notes — do not state who leads, ranks first, or is tied in your own words; that will be shown to the reader separately, before your text, exactly as computed.",
            "In these four notes you may only point out trade-offs visible in the numbers (for example, cheapest but slowest to deliver), and you must not call any vendor \"good\" or \"bad\" in absolute terms unless the numbers given support it.",
            "Do not introduce any fact that is not present in the data.",
            "Write these four additional sections, each on its own line, using these exact headings in this order:",
            "Overall Comparison:",
            "Delivery Comparison:",
            "Pricing Comparison:",
            "Order Accuracy Comparison:",
            "Overall Comparison explains the comparisonData.overall result below.",
            "Delivery Comparison explains the comparisonData.categories.delivery result below.",
            "Pricing Comparison explains the comparisonData.categories.pricing result below.",
            "Order Accuracy Comparison explains the comparisonData.categories.orderAccuracy result below."
        );
    }

    lines.push(JSON.stringify(data));

    if (options?.comparisonData !== undefined) {
        lines.push(JSON.stringify(options.comparisonData));
    }

    return lines.join("\n");
}

export async function generateReportNarrative(
    data: Record<string, number | string | null | undefined>,
    generateContent: GenerateContent,
    options?: BuildPromptOptions
): Promise<string> {
    return generateContent(buildPrompt(data, options));
}
