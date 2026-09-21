import { expect, it, describe } from "vitest";
import { formatVendorForTable } from "./formatVendorForTable";

describe("formatVendorForTable", () => {
    it("formats a complete vendor record for display", () => {
        const result = formatVendorForTable({
            id: 5, 
            name: "Acme Trading",
            registration_number: "REG-001",
            contact_info: "contact@example.com",
            created_at: "2026-09-14T10:23:21.000Z",
        });

    expect(result).toEqual({
        id: 5,
      name: "Acme Trading",
      registrationNumber: "REG-001",
      contactInfo: "contact@example.com",
      createdAt: "14 Sept 2026",
    });
    });

    it("shows a placeholder when registation_number and contact_info are missing", () => {
        const result = formatVendorForTable({
            id: 6,
            name: "Beta Supplies",
        });

        expect(result.registrationNumber).toBe("—");
        expect(result.contactInfo).toBe("—");
    });

    it("shows a placeholder when created_at is missing or not a valid date", () => {
        const missing =  formatVendorForTable({ id: 7, name: "Gamuda Berhad"});
        const malformed = formatVendorForTable({
            id: 8,
            name: "Delta Co",
            created_at: "not-a-date",
        });

        expect(missing.createdAt).toBe("—");
        expect(malformed.createdAt).toBe("—");
    });
});