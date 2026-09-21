export type FieldValidationOutcome =
  | { valid: true }
  | { valid: false; error: string; field: string };

export function getVisibleFieldError(
  fieldName: string,
  touchedFields: ReadonlySet<string>,
  validation: FieldValidationOutcome
): string | null {
  if (validation.valid) {
    return null;
  }

  if (!touchedFields.has(fieldName)) {
    return null;
  }

  if (validation.field !== fieldName) {
    return null;
  }

  return validation.error;
}
