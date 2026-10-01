import { describe, it, expect } from "vitest";
import { formatAuditLogForTable } from "./formatAuditLogForTable";

const baseEntry = {
  id: 42,
  user_email: "someone@envirosgroup.com",
  user_oid: "11111111-1111-1111-1111-111111111111",
  user_tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
  action: "report.created" as const,
  target_type: "Report" as const,
  target_id: 7,
  ip_address: "203.0.113.5",
  created_at: "2026-04-01T14:30:00.000Z",
};

describe("formatAuditLogForTable", () => {
  it("formats an entry into display-ready fields", () => {
    const result = formatAuditLogForTable(baseEntry);

    expect(result).toEqual({
      id: 42,
      timestamp: "01 Apr 2026, 14:30 UTC",
      userEmail: "someone@envirosgroup.com",
      actionLabel: "Report created",
      targetType: "Report",
      targetId: 7,
      ipAddress: "203.0.113.5",
    });
  });

  it("formats a bulk_uploaded action's underscore into a space", () => {
    const result = formatAuditLogForTable({
      ...baseEntry,
      action: "transaction.bulk_uploaded",
      target_type: "Transaction",
    });

    expect(result.actionLabel).toBe("Transaction bulk uploaded");
  });

  it("falls back to a placeholder when ip_address is null", () => {
    const result = formatAuditLogForTable({ ...baseEntry, ip_address: null });

    expect(result.ipAddress).toBe("—");
  });

  it("falls back to a placeholder when created_at is missing or invalid", () => {
    const result = formatAuditLogForTable({ ...baseEntry, created_at: "" });

    expect(result.timestamp).toBe("—");
  });
});
