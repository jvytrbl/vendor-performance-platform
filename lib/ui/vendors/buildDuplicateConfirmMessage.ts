export interface DuplicateVendorMatch {
    id: number;
    name: string;
}

export function buildDuplicateConfirmMessage(
    attemptedName: string,
    possibleDuplicate: DuplicateVendorMatch
):  string {
    return `"${attemptedName}" looks similar to an existing vendor, "${possibleDuplicate.name}". Add it anyway, or is this the same vendor?`;
}