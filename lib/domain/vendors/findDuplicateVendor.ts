import { calculateNameSimilarity } from "./calculateNameSimilarity";

export interface VendorRecord {
  id: number;
  name: string;
}

const DUPLICATE_THRESHOLD = 85;

export function findDuplicateVendor(
  candidateName: string,
  existingVendors: VendorRecord[]
): VendorRecord | null {

  let bestMatch: VendorRecord | null = null;
  let bestScore = 0;

  for (const vendor of existingVendors) {
    if(typeof vendor.name !== "string") {
        continue;
    }
    const score = calculateNameSimilarity(candidateName, vendor.name);
    if (score >= DUPLICATE_THRESHOLD && score > bestScore) {
        bestMatch = vendor;
        bestScore = score;
    }
  }

  return bestMatch;
}