import { describe, it, expect } from "vitest";
import { validateVendorInput } from "./validateVendorInput";

describe("validateVendorInput", () => {
  //handle : first-time vendor input
  it("rejects an empty name", () => {
    const result = validateVendorInput({
      name: "",
      registration_number: "REG-001",
      contact_info: "contact@example.com",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.field).toBe("name");
    }
  });

  it("reject a missing registration_number, even when the name is valid", () => {
    const result = validateVendorInput({
        name: "Acmme Supplies",
        registration_number: "",
        contact_info: "contact@example.com"
    })

    expect(result.valid).toBe(false);
    if (!result.valid) {
        expect(result.field).toBe("registration_number")
    }
  })

  it("rejects a missing contact_info, even when name and registration_number are valid", () => {
    const result = validateVendorInput({
      name: "Acme Supplies",
      registration_number: "REG-001",
      contact_info: "",
    });
  
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.field).toBe("contact_info");
    }
  });

  it("accepts a fully valid vendor input", () => {
    const validInput = {
      name: "Acme Supplies",
      registration_number: "REG-001",
      contact_info: "contact@example.com",
    };
  
    const result = validateVendorInput(validInput);
  
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toEqual(validInput);
    }
  });

  it("rejects a name that is not a string", () => {
    const result = validateVendorInput({
      name: 12345 as any,
      registration_number: "REG-001",
      contact_info: "contact@example.com",
    });
  
    expect(result.valid).toBe(false);
  });
  
  it("accepts a name at exactly 200 characters", () => {
    const result = validateVendorInput({
      name: "A".repeat(200),
      registration_number: "REG-001",
      contact_info: "contact@example.com",
    });
  
    expect(result.valid).toBe(true);
  });
  
  it("rejects a name at 201 characters", () => {
    const result = validateVendorInput({
      name: "A".repeat(201),
      registration_number: "REG-001",
      contact_info: "contact@example.com",
    });
  
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.field).toBe("name");
    }
  });
  
  it("rejects a contact_info at 501 characters", () => {
    const result = validateVendorInput({
      name: "Acme Supplies",
      registration_number: "REG-001",
      contact_info: "A".repeat(501),
    });
  
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.field).toBe("contact_info");
    }
  });

  it("rejects a registration_number that is not a string", () => {
    const result = validateVendorInput({
      name: "Acme Supplies",
      registration_number: 12345 as any,
      contact_info: "contact@example.com",
    });
  
    expect(result.valid).toBe(false);
  });
  
  it("accepts a registration_number at exactly 50 characters", () => {
    const result = validateVendorInput({
      name: "Acme Supplies",
      registration_number: "R".repeat(50),
      contact_info: "contact@example.com",
    });
  
    expect(result.valid).toBe(true);
  });
  
  it("rejects a registration_number at 51 characters", () => {
    const result = validateVendorInput({
      name: "Acme Supplies",
      registration_number: "R".repeat(51),
      contact_info: "contact@example.com",
    });
  
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.field).toBe("registration_number");
    }
  });
  
  it("rejects a contact_info that is not a string", () => {
    const result = validateVendorInput({
      name: "Acme Supplies",
      registration_number: "REG-001",
      contact_info: 12345 as any,
    });
  
    expect(result.valid).toBe(false);
  });
  
  it("accepts contact_info at exactly 500 characters", () => {
    const result = validateVendorInput({
      name: "Acme Supplies",
      registration_number: "REG-001",
      contact_info: "A".repeat(500),
    });
  
    expect(result.valid).toBe(true);
  });
  
  it("rejects a name that is only whitespace", () => {
    const result = validateVendorInput({
      name: "   ",
      registration_number: "REG-001",
      contact_info: "contact@example.com",
    });
  
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.field).toBe("name");
    }
  });

  it("rejects a name containing HTML-like tags", () => {
    const result = validateVendorInput({
      name: "<script>alert('xss')</script>",
      registration_number: "REG-001",
      contact_info: "contact@example.com",
    });
  
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.field).toBe("name");
    }
  });
  
  it("rejects contact_info containing HTML-like tags", () => {
    const result = validateVendorInput({
      name: "Acme Supplies",
      registration_number: "REG-001",
      contact_info: "<img src=x onerror=alert(1)>",
    });
  
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.field).toBe("contact_info");
    }
  });

  it("rejects a name containing a SQL-injection-shaped string (quotes, semicolon, double-dash)", () => {
    const result = validateVendorInput({
      name: "Robert'); DROP TABLE VENDORS;--",
      registration_number: "REG-001",
      contact_info: "contact@example.com",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.field).toBe("name");
    }
  });

  it("rejects contact_info containing a SQL-injection-shaped string (quotes, semicolon, double-dash)", () => {
    const result = validateVendorInput({
      name: "Acme Supplies",
      registration_number: "REG-001",
      contact_info: "Robert'); DROP TABLE VENDORS;--",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.field).toBe("contact_info");
    }
  });

  it("accepts a name and contact_info containing a comma but no quote/semicolon/double-dash characters", () => {
    const result = validateVendorInput({
      name: "Acme Supplies, Inc",
      registration_number: "REG-001",
      contact_info: "123 Main St, Suite 4",
    });

    expect(result.valid).toBe(true);
  });

});