import type { ReportSectionInput } from "./validateReportSections";

const HEADINGS: { key: keyof ReportSectionInput; label: string }[] = [
  { key: "vendor_summary", label: "Vendor Summary" },
  { key: "delivery_performance", label: "Delivery Performance" },
  { key: "pricing_analysis", label: "Pricing Analysis" },
  { key: "order_accuracy", label: "Order Accuracy" },
];

export function parseNarrativeSections(narrative: string): ReportSectionInput | null {
  const text = narrative.replace(/\r\n/g, "\n");
  const marks: { key: keyof ReportSectionInput; headingStart: number; contentStart: number }[] =
    [];

  for (const heading of HEADINGS) {
    const pattern = new RegExp(
      `(?:^|\\n)\\s*(?:#{1,3}\\s*)?(?:\\*\\*)?${heading.label}(?:\\*\\*)?:\\s*`,
      "i"
    );
    const match = pattern.exec(text);
    if (!match) return null;
    marks.push({
      key: heading.key,
      headingStart: match.index,
      contentStart: match.index + match[0].length,
    });
  }

  for (let index = 1; index < marks.length; index += 1) {
    if (marks[index].headingStart <= marks[index - 1].contentStart) return null;
  }

  const sections: ReportSectionInput = {
    vendor_summary: "",
    delivery_performance: "",
    pricing_analysis: "",
    order_accuracy: "",
  };

  for (let index = 0; index < marks.length; index += 1) {
    const end = index + 1 < marks.length ? marks[index + 1].headingStart : text.length;
    sections[marks[index].key] = text.slice(marks[index].contentStart, end).trim();
  }

  if (HEADINGS.some((heading) => sections[heading.key] === "")) return null;

  const unique = new Set(HEADINGS.map((heading) => sections[heading.key]));
  if (unique.size === 1) return null;

  return sections;
}
