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
})