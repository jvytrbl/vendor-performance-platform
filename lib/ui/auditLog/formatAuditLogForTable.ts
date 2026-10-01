import type { AuditLogEntry } from "@/lib/api/auditLog";

export interface FormattedAuditLogRow {
  id: number;
  timestamp: string;
  userEmail: string;
  actionLabel: string;
  targetType: string;
  targetId: number;
  ipAddress: string;
}

const PLACEHOLDER = "—";

function formatTimestamp(value: string | undefined): string {
  if (!value) {
    return PLACEHOLDER;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return PLACEHOLDER;
  }

  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);

  return `${formatted} UTC`;
}

// "report.created" -> "Report created"; "transaction.bulk_uploaded" -> "Transaction bulk uploaded"
function formatActionLabel(action: string): string {
  const [entity, ...rest] = action.split(".");
  const verb = rest.join(".").replace(/_/g, " ");
  const capitalizedEntity = entity ? entity.charAt(0).toUpperCase() + entity.slice(1) : "";
  return [capitalizedEntity, verb].filter(Boolean).join(" ");
}

export function formatAuditLogForTable(entry: AuditLogEntry): FormattedAuditLogRow {
  return {
    id: entry.id,
    timestamp: formatTimestamp(entry.created_at),
    userEmail: entry.user_email,
    actionLabel: formatActionLabel(entry.action),
    targetType: entry.target_type,
    targetId: entry.target_id,
    ipAddress: entry.ip_address ?? PLACEHOLDER,
  };
}
