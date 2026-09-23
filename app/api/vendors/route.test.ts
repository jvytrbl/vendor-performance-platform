import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST  } from "./route";
import { validateAuthHeader } from "@/lib/auth";
import { getAllVendors, insertVendor, listVendors } from "@/lib/repositories/vendors";
import { error } from "console";

vi.mock("@/lib/auth", () => ({
  validateAuthHeader: vi.fn(),
}));

vi.mock("@/lib/repositories/vendors", () => ({
  getAllVendors: vi.fn(),
  insertVendor: vi.fn(),
  listVendors: vi.fn(),
}));

//GET the vendor lists
describe("GET /api/vendors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a 500 response with a generic error message when the database call fails", async() => {
    vi.mocked(validateAuthHeader).mockResolvedValue( { valid: true});
    vi.mocked(listVendors).mockRejectedValue( new Error("Database connection failed"));

    const request = new Request("http://localhost/api/vendors", {
      headers: { Authorization: "Bearer good.token"},
    })

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "Failed to fetch vendors",
      code: "INTERNAL_ERROR",
    });
  });

  it("returns 401 when the request is not authenticated", async ()=> {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid:false,
      reason: "Invalid or Expired token",
    });

    const request = new Request("http://localhost/api/vendors", {
      headers: {Authorization: "Bearer bad.token"},
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Invalid or Expired token",
      code: "UNAUTHORIZED",
    });
  });

  it("returns the first page of 15 vendors and the total when no page params are given", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(listVendors).mockResolvedValue({
      vendors: [{ id: 1, name: "Acme Trading" }],
      total: 1,
    } as any);

    const response = await GET(new Request("http://localhost/api/vendors", {
      headers: { Authorization: "Bearer good.token" },
    }));
    const body = await response.json();

    expect(listVendors).toHaveBeenCalledWith({ search: undefined, limit: 15, offset: 0 });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      vendors: [{ id: 1, name: "Acme Trading" }],
      total: 1,
    });
  });

  it("passes search and the page slice to the repository", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(listVendors).mockResolvedValue({ vendors: [], total: 31 } as any);

    await GET(new Request("http://localhost/api/vendors?page=3&pageSize=15&q=acme", {
      headers: { Authorization: "Bearer good.token" },
    }));

    expect(listVendors).toHaveBeenCalledWith({ search: "acme", limit: 15, offset: 30 });
  });

  it("returns an empty page with the total when the requested page is past the last page", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(listVendors).mockResolvedValue({ vendors: [], total: 31 } as any);

    const response = await GET(new Request("http://localhost/api/vendors?page=4&pageSize=15", {
      headers: { Authorization: "Bearer good.token" },
    }));
    const body = await response.json();

    expect(listVendors).toHaveBeenCalledWith({ search: undefined, limit: 15, offset: 45 });
    expect(response.status).toBe(200);
    expect(body).toEqual({ vendors: [], total: 31 });
  });

  it("returns 400 when page is not a positive integer", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const response = await GET(new Request("http://localhost/api/vendors?page=0", {
      headers: { Authorization: "Bearer good.token" },
    }));
    const body = await response.json();

    expect(listVendors).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "page must be a positive integer",
      code: "VALIDATION_FAILED",
      field: "page",
    });
  });
  
});

//POST new vendor record
describe("POST /api/vendors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request is not authenticated", async ()=>{
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const request = new Request("http://localhost/api/vendors", {
      method: "POST",
      headers: { Authorization: "Bearer bad.token"},
      body: JSON.stringify({ name: "", registration_number: "", contact_info:""}),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Invalid or Expired token", code: "UNAUTHORIZED"});
  });

  //testing the validation function from validateVendorInput
  it("returns 400 with the validation error when the vendor input is invalid", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue( { valid: true });

    const request = new Request("http://localhost/api/vendors", {
      method: "POST",
      headers: {Authorization: "Bearer good.token"},
      body: JSON.stringify({
        name: "",
        registration_number: "REG-001",
        contact_info: "contact@example.com",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Vendor name is required",
      code: "VALIDATION_FAILED",
      field: "name",
    });
  });

  //testing the duplicate function from findDuplicateVendor
  it("returns 409 with the possible duplicate when a similar vendor already exists", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getAllVendors).mockResolvedValue([
      { id: 1, name: "Acme Trading Sdn Bhd" },
    ]);
  
    const request = new Request("http://localhost/api/vendors", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify({
        name: "Acme Trading",
        registration_number: "REG-002",
        contact_info: "contact@example.com",
      }),
    });
  
    const response = await POST(request);
    const body = await response.json();
  
    expect(response.status).toBe(409);
    expect(body).toEqual({ possibleDuplicate: { id: 1, name: "Acme Trading Sdn Bhd" } });
  });

  //testing where the POST function create new vendor when validation and duplicate is passed
  it("creates the vendor and returns 201 when no duplicate exists", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getAllVendors).mockResolvedValue([]);
    vi.mocked(insertVendor).mockResolvedValue({ id: 5, name: "Acme Trading" });
  
    const request = new Request("http://localhost/api/vendors", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify({
        name: "Acme Trading",
        registration_number: "REG-001",
        contact_info: "contact@example.com",
      }),
    });
  
    const response = await POST(request);
    const body = await response.json();
  
    expect(response.status).toBe(201);
    expect(body).toEqual({ data: { id: 5, name: "Acme Trading" } });
  });

  it("returns 409 with a clean message when registration_number already exists", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getAllVendors).mockResolvedValue([]);
    vi.mocked(insertVendor).mockRejectedValue({
      number: 2627,
      message: "Violation of UNIQUE KEY constraint 'UQ_VENDORS_registration_number'",
    });
  
    const request = new Request("http://localhost/api/vendors", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify({
        name: "Acme Trading",
        registration_number: "REG-001",
        contact_info: "contact@example.com",
      }),
    });
  
    const response = await POST(request);
    const body = await response.json();
  
    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: "Registration number already in use",
      code: "DUPLICATE_REGISTRATION",
      field: "registration_number",
    });
  });

  it("creates the vendor even when a possible duplicate exists, if confirmDuplicate is true", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getAllVendors).mockResolvedValue([
      { id: 1, name: "Acme Trading Sdn Bhd" },
    ]);
    vi.mocked(insertVendor).mockResolvedValue({ id: 6, name: "Acme Trading" });
  
    const request = new Request("http://localhost/api/vendors", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify({
        name: "Acme Trading",
        registration_number: "REG-002",
        contact_info: "contact@example.com",
        confirmDuplicate: true,
      }),
    });
  
    const response = await POST(request);
    const body = await response.json();
  
    expect(response.status).toBe(201);
    expect(body).toEqual({ data: { id: 6, name: "Acme Trading" } });
  });
});