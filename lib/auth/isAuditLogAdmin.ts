// Same parsing pattern as ALLOWED_EMAILS/ALLOWED_TENANT_IDS in lib/auth.ts —
// read per-call (not cached at module load) so env changes take effect
// without a restart being the only way to notice they didn't.
export function isAuditLogAdmin(email: string): boolean {
  const adminEmails = (process.env.AUDIT_LOG_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase());
}
