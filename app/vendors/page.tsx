//Vendor list (route: /vendors)
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchVendors, deleteVendor, type VendorRecord } from "@/lib/api/vendors";
import VendorTable from "@/components/vendors/VendorTable";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { resolveDeleteFailureMessage } from "@/lib/ui/vendors/resolveDeleteFailureMessage";

type Status = "loading" | "ready" | "error";

function matchesSearch(vendor: VendorRecord, term: string): boolean {
  const haystack = [
    vendor.name,
    vendor.registration_number ?? "",
    vendor.contact_info ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(term.toLowerCase());
}

export default function VendorsPage() {
  const getAccessToken = useAccessToken();
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadVendors = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await fetchVendors(accessToken);
      setVendors(result);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load vendors"
      );
      setStatus("error");
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setErrorMessage(null);
    try {
      const accessToken = await getAccessToken();
      const result = await deleteVendor(id, accessToken);

      if (result.outcome === "deleted") {
        setVendors((current) => current.filter((vendor) => vendor.id !== id));
      } else {
        setErrorMessage(resolveDeleteFailureMessage(result.code, result.error));
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete vendor"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVendors = useMemo(() => {
    if (searchTerm.trim() === "") {
      return vendors;
    }
    return vendors.filter((vendor) => matchesSearch(vendor, searchTerm.trim()));
  }, [vendors, searchTerm]);

  const emptyMessage =
    vendors.length === 0
      ? "No vendors yet. Add one to get started."
      : `No vendors match "${searchTerm}".`;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Vendors
        </h1>
        <Link
          href="/vendors/add"
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          Add vendor
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name, registration number, or contact…"
          className="w-full max-w-sm rounded border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none"
        />

        {status === "loading" && (
          <p className="text-sm text-foreground-muted">Loading vendors…</p>
        )}

        {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}

        {status === "ready" && (
          <>
            {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
            <VendorTable
                vendors={filteredVendors}
                onDelete={handleDelete}
                deletingId={deletingId}
                emptyMessage={emptyMessage}
              />
          </>
        )}
      </div>
    </div>
  );
}
