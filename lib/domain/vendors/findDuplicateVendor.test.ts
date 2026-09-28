import { expect, it, describe } from "vitest";
import { findDuplicateVendor } from "./findDuplicateVendor";

describe("findDuplicateVendor()", () => {
    it("returns null when there are no existing vendors to compare against", () => {
        const result = findDuplicateVendor("Acme Trading", []);

        expect(result).toBeNull();
    });

    it("returns the matching vendor when an existing name is highly similar", () => {
        const existingVendors = [
            {id: 1, name: "Acme Trading Sdn Bhd"},
        ];

        const result = findDuplicateVendor("Acme Trading", existingVendors);
        expect(result).toEqual({ id: 1, name: "Acme Trading Sdn Bhd"});
    });

    it("returns null when no existing vendor is similar enough", () => {
        const existingVendors = [
            {id: 1, name: "Enviros Group Sdn Bhd"},
        ];

        const result = findDuplicateVendor("Acme Trading", existingVendors);
        expect(result).toBeNull();
    })

    it("returns the best (highest-scoring) match when multiple vendors cross the threshold", () => {
        const existingVendors = [
          { id: 1, name: "Acme Trding" },          // a close typo — likely still crosses 85%, listed FIRST
          { id: 2, name: "Acme Trading Sdn Bhd" }, // a perfect match after suffix-stripping — listed SECOND
        ];
      
        const result = findDuplicateVendor("Acme Trading", existingVendors);
      
        expect(result).toEqual({ id: 2, name: "Acme Trading Sdn Bhd" });
      });

      it("returns null when the candidate name is empty", () => {
        const result = findDuplicateVendor("", [{ id: 1, name: "Acme Trading" }]);
      
        expect(result).toBeNull();
      });
      
      it("safely skips an existing vendor with a malformed (non-string) name", () => {
        const result = findDuplicateVendor("Acme Trading", [
          { id: 1, name: null as any },
          { id: 2, name: "Acme Trading" },
        ]);

        expect(result).toEqual({ id: 2, name: "Acme Trading" });
      });

      // FR-SH-002 (URD-PERSONAL-004): "A similarity score of 85% or higher
      // shall be presented to the user for confirmation" — inclusive, so a
      // score of exactly 85 must count as a duplicate, not just scores above it.
      // "Acme z" is a real, verified 85-exact match against "Acme Trading"
      // (not a guess) — confirmed via calculateNameSimilarity before writing
      // this test, since Jaro-Winkler scores can't be hand-derived reliably.
      it("treats a candidate scoring exactly at the 85% threshold as a duplicate (boundary is inclusive per FR-SH-002)", () => {
        const existingVendors = [{ id: 1, name: "Acme z" }];

        const result = findDuplicateVendor("Acme Trading", existingVendors);

        expect(result).toEqual({ id: 1, name: "Acme z" });
      });

      // "Acme Tra" and "Acme Tradz" both score exactly 93 against "Acme
      // Trading" (verified, a genuine tie, not an approximation). The first
      // vendor found at the winning score must be kept — a later vendor
      // tying that same score must NOT silently overwrite it — so the
      // result is deterministic based on input order, not incidental.
      it("keeps the first vendor found when a later candidate ties its score, instead of the last one silently winning", () => {
        const existingVendors = [
          { id: 1, name: "Acme Tra" },
          { id: 2, name: "Acme Tradz" },
        ];

        const result = findDuplicateVendor("Acme Trading", existingVendors);

        expect(result).toEqual({ id: 1, name: "Acme Tra" });
      });
})