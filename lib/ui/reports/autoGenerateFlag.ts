export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function storageKey(reportId: number): string {
  return `report-autogenerate-${reportId}`;
}

// Set by the Create Report flow right before navigating to the new report's
// editor, so the editor knows to trigger its first generation automatically
// instead of landing on four blank textareas. Deliberate deviation from SDD
// §5.3's original two-manual-click journey (Create → separately click
// Generate) — see the comment at the consumption site in ReportEditor.tsx
// for the full rationale.
export function markAutoGenerate(reportId: number, storage: StorageLike): void {
  storage.setItem(storageKey(reportId), "1");
}

// One-shot: consuming the flag clears it, so a page refresh (or an effect
// re-run) never re-triggers automatic generation a second time.
export function consumeAutoGenerateFlag(reportId: number, storage: StorageLike): boolean {
  const key = storageKey(reportId);
  const wasSet = storage.getItem(key) !== null;
  storage.removeItem(key);
  return wasSet;
}
