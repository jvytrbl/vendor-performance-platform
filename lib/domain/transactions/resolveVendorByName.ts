import { VendorRecord } from "../vendors/findDuplicateVendor";
import { calculateNameSimilarity } from "../vendors/calculateNameSimilarity";

const MATCH_THRESHOLD = 85;

export type resolveVendorByNamerResult =
    | { matched: true; vendorId: number}
    | { matched: false; error: string; code: string};

function normalizeExact(name: string): string {
    return name.trim().toLowerCase();
}

export function resolveVendorByName(
    name: unknown,
    vendors: VendorRecord[]
): resolveVendorByNamerResult {
    if (typeof name !== "string" || name.trim().length === 0 ) {
        return {
            matched: false,
            error: "Vendor name is required",
            code: "INVALID_VENDOR_NAME",
        };
    }

    const normalizeCandidate = normalizeExact(name);

    const exactMatch = vendors.find(
        (vendor) => 
            typeof vendor.name === "string" &&
        normalizeExact(vendor.name) === normalizeCandidate       
    );

    if (exactMatch) {
        return { matched: true, vendorId: exactMatch.id };
      }
      const scoredMatches = vendors
        .filter((vendor) => typeof vendor.name === "string")
        .map((vendor) => ({
          vendor,
          score: calculateNameSimilarity(name, vendor.name),
        }))
        .filter(({ score }) => score >= MATCH_THRESHOLD);
      if (scoredMatches.length === 0) {
        return {
          matched: false,
          error: `No vendor found matching "${name}"`,
          code: "VENDOR_NOT_FOUND",
        };
      }
      if (scoredMatches.length > 1) {
        return {
          matched: false,
          error: `Vendor name "${name}" matches more than one existing vendor`,
          code: "AMBIGUOUS_VENDOR_NAME",
        };
      }
      return { matched: true, vendorId: scoredMatches[0].vendor.id };
    }
