import { describe, it, expect } from "vitest";
import { markAutoGenerate, consumeAutoGenerateFlag } from "./autoGenerateFlag";

function createFakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe("consumeAutoGenerateFlag", () => {
  // Category 2 (empty/missing): nothing was ever marked for this report.
  it("returns false when nothing has been marked for this report", () => {
    const storage = createFakeStorage();
    expect(consumeAutoGenerateFlag(7, storage)).toBe(false);
  });

  it("returns true when a report has been marked for auto-generation", () => {
    const storage = createFakeStorage();
    markAutoGenerate(7, storage);
    expect(consumeAutoGenerateFlag(7, storage)).toBe(true);
  });

  // The whole point of this flag: a page refresh (or the effect re-running)
  // must not re-trigger automatic generation a second time.
  it("is one-shot — a second consume for the same report returns false", () => {
    const storage = createFakeStorage();
    markAutoGenerate(7, storage);

    expect(consumeAutoGenerateFlag(7, storage)).toBe(true);
    expect(consumeAutoGenerateFlag(7, storage)).toBe(false);
  });

  // Category 4-adjacent (no cross-contamination): two different reports'
  // flags must not collide under the same key.
  it("keeps flags for different reports independent", () => {
    const storage = createFakeStorage();
    markAutoGenerate(7, storage);

    expect(consumeAutoGenerateFlag(8, storage)).toBe(false);
    expect(consumeAutoGenerateFlag(7, storage)).toBe(true);
  });
});
