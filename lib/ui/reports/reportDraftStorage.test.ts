import { describe, it, expect } from "vitest";
import { saveDraftFields, restoreDraftFields, clearDraftFields } from "./reportDraftStorage";

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

describe("saveDraftFields", () => {
  // NFR-011: "The retained content shall consist solely of the report's
  // editable text fields. Authentication tokens or credentials shall never
  // be included." This is the seam's core defensive guarantee — a token
  // leak here would be a real credential-leak risk, not a UX bug.
  it("stores only the four editable section fields, never any other property passed in", () => {
    const storage = createFakeStorage();
    const fieldsWithExtras = {
      vendor_summary: "Summary text",
      delivery_performance: "Delivery text",
      pricing_analysis: "Pricing text",
      order_accuracy: "Accuracy text",
      accessToken: "super-secret-bearer-token",
      Authorization: "Bearer abc.def.ghi",
    } as any;

    saveDraftFields(7, fieldsWithExtras, storage);

    const raw = storage.getItem("report-draft-7");
    expect(raw).not.toBeNull();
    expect(raw).not.toContain("secret");
    expect(raw).not.toContain("Bearer");
    expect(JSON.parse(raw as string)).toEqual({
      vendor_summary: "Summary text",
      delivery_performance: "Delivery text",
      pricing_analysis: "Pricing text",
      order_accuracy: "Accuracy text",
    });
  });
});

describe("restoreDraftFields", () => {
  // Category 2 (empty/missing): nothing was ever stashed for this report.
  it("returns null when nothing has been saved for this report", () => {
    const storage = createFakeStorage();
    expect(restoreDraftFields(7, storage)).toBeNull();
  });

  it("returns exactly the fields previously saved for that report", () => {
    const storage = createFakeStorage();
    const fields = {
      vendor_summary: "Summary text",
      delivery_performance: "Delivery text",
      pricing_analysis: "Pricing text",
      order_accuracy: "Accuracy text",
    };

    saveDraftFields(7, fields, storage);

    expect(restoreDraftFields(7, storage)).toEqual(fields);
  });

  // Category 4-adjacent (no cross-contamination): two different reports'
  // drafts must not collide under the same key.
  it("keeps drafts for different reports independent", () => {
    const storage = createFakeStorage();
    saveDraftFields(7, {
      vendor_summary: "Report 7 summary",
      delivery_performance: "",
      pricing_analysis: "",
      order_accuracy: "",
    }, storage);
    saveDraftFields(8, {
      vendor_summary: "Report 8 summary",
      delivery_performance: "",
      pricing_analysis: "",
      order_accuracy: "",
    }, storage);

    expect(restoreDraftFields(7, storage)?.vendor_summary).toBe("Report 7 summary");
    expect(restoreDraftFields(8, storage)?.vendor_summary).toBe("Report 8 summary");
  });
});

describe("clearDraftFields", () => {
  it("removes the saved draft so a later restore returns null", () => {
    const storage = createFakeStorage();
    saveDraftFields(7, {
      vendor_summary: "Summary text",
      delivery_performance: "",
      pricing_analysis: "",
      order_accuracy: "",
    }, storage);

    clearDraftFields(7, storage);

    expect(restoreDraftFields(7, storage)).toBeNull();
  });
});
