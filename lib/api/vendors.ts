export interface VendorRecord {
    id: number;
    name: string;
    registration_number?: string;
    contact_info?: string;
    created_at?: string;
  }
  
  export interface VendorInput {
    name: string;
    registration_number: string;
    contact_info: string;
  }
  
  export async function fetchVendors(accessToken: string): Promise<VendorRecord[]> {
    const response = await fetch("/api/vendors", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await response.json();
  
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to fetch vendors");
    }
  
    return body.vendors;
  }
  
  export type CreateVendorResult =
    | { outcome: "created"; vendor: VendorRecord }
    | { outcome: "possibleDuplicate"; vendor: VendorRecord }
    | { outcome: "error"; error: string; code: string; field?: string };
  
  export async function createVendor(
    input: VendorInput,
    accessToken: string
  ): Promise<CreateVendorResult> {
    const response = await fetch("/api/vendors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });
    const body = await response.json();
  
    if (response.status === 201) {
      return { outcome: "created", vendor: body.data };
    }
  
    if (response.status === 409 && body.possibleDuplicate) {
      return { outcome: "possibleDuplicate", vendor: body.possibleDuplicate };
    }
  
    return {
      outcome: "error",
      error: body.error,
      code: body.code,
      field: body.field,
    };
  }
  
  export type FetchVendorByIdResult =
    | { outcome: "found"; vendor: VendorRecord }
    | { outcome: "error"; error: string; code: string; field?: string };

  export async function fetchVendorById(
    id: number,
    accessToken: string
  ): Promise<FetchVendorByIdResult> {
    const response = await fetch(`/api/vendors/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await response.json();

    if (response.status === 200) {
      return { outcome: "found", vendor: body.data };
    }

    return {
      outcome: "error",
      error: body.error,
      code: body.code,
      field: body.field,
    };
  }

  export type DeleteVendorResult =
    | { outcome: "deleted" }
    | { outcome: "error"; error: string; code: string; field?: string };
  
  export async function deleteVendor(
    id: number,
    accessToken: string
  ): Promise<DeleteVendorResult> {
    const response = await fetch(`/api/vendors/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await response.json();
  
    if (response.status === 200) {
      return { outcome: "deleted" };
    }
  
    return {
      outcome: "error",
      error: body.error,
      code: body.code,
      field: body.field,
    };
  }