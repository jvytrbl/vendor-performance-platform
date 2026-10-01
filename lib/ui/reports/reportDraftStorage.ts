import type { ReportSectionInput } from "@/lib/domain/reports/validateReportSections";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function storageKey(reportId: number): string {
  return `report-draft-${reportId}`;
}

export function saveDraftFields(
  reportId: number,
  fields: ReportSectionInput,
  storage: StorageLike
): void {
  // Explicit whitelist, not a spread/JSON.stringify(fields) shortcut — an
  // extra property on the caller's object (e.g. an auth token accidentally
  // present on the form state) must never reach storage. Per NFR-011 this
  // is a credential-leak risk, not just a UX bug.
  const onlyEditableFields: ReportSectionInput = {
    vendor_summary: fields.vendor_summary,
    delivery_performance: fields.delivery_performance,
    pricing_analysis: fields.pricing_analysis,
    order_accuracy: fields.order_accuracy,
  };

  // The four AI Comparative Analysis fields are only ever present on the
  // caller's object for a >= 2 vendor report (the editor strips them
  // otherwise — see sectionsPayloadFor in ReportEditor.tsx), so mirror that
  // same presence here rather than always writing them (as "" or undefined)
  // into storage.
  for (const key of [
    "ai_overall_comparison",
    "ai_delivery_comparison",
    "ai_pricing_comparison",
    "ai_order_accuracy_comparison",
  ] as const) {
    if (key in fields) {
      onlyEditableFields[key] = fields[key];
    }
  }

  storage.setItem(storageKey(reportId), JSON.stringify(onlyEditableFields));
}

export function restoreDraftFields(
  reportId: number,
  storage: StorageLike
): ReportSectionInput | null {
  const raw = storage.getItem(storageKey(reportId));
  if (raw === null) {
    return null;
  }
  return JSON.parse(raw) as ReportSectionInput;
}

export function clearDraftFields(reportId: number, storage: StorageLike): void {
  storage.removeItem(storageKey(reportId));
}
