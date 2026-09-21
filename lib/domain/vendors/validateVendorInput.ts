export interface VendorInput {
  name: string;
  registration_number: string;
  contact_info: string;
}

export type ValidationResult =
  | { valid: true; data: VendorInput }
  | { valid: false; error: string; code: string; field: string };

export function validateVendorInput(input: VendorInput): ValidationResult {
  if (!input.name || typeof input.name !== "string" || input.name.trim() === "") {
    return {
      valid: false,
      error: "Vendor name is required",
      code: "VALIDATION_FAILED",
      field: "name",
    };
  }

  if (input.name.length > 200) {
    return {
      valid: false,
      error: "Vendor name must be 200 characters or fewer",
      code: "VALIDATION_FAILED",
      field: "name",
    };
  }

  if (/[<>;'"]/.test(input.name) || input.name.includes("--")) {
    return {
      valid: false,
      error: "Vendor name contains disallowed characters",
      code: "VALIDATION_FAILED",
      field: "name",
    };
  }

  if (!input.registration_number || typeof input.registration_number !== "string") {
    return {
      valid: false,
      error: "Registration number is required",
      code: "VALIDATION_FAILED",
      field: "registration_number",
    };
  }

  if (input.registration_number.length > 50) {
    return {
      valid: false,
      error: "Registration number must be 50 characters or fewer",
      code: "VALIDATION_FAILED",
      field: "registration_number",
    };
  }

  if (!input.contact_info || typeof input.contact_info !== "string") {
    return {
      valid: false,
      error: "Contact info is required",
      code: "VALIDATION_FAILED",
      field: "contact_info",
    };
  }

  if (input.contact_info.length > 500) {
    return {
      valid: false,
      error: "Contact info must be 500 characters or fewer",
      code: "VALIDATION_FAILED",
      field: "contact_info",
    };
  }

  if (/[<>;'"]/.test(input.contact_info) || input.contact_info.includes("--")) {
    return {
      valid: false,
      error: "Contact info contains disallowed characters",
      code: "VALIDATION_FAILED",
      field: "contact_info",
    };
  }

  return { valid: true, data: input };
}
