-- Migration 004: Audit log (Phase 1 — report mutations only)
-- Append-only record of who did what, to which record, and when.
-- Every row is immutable from the moment it's written (unlike
-- VENDOR_PERFORMANCE_REPORTS, which is only locked once Finalized) —
-- so this trigger, unlike TR_VPR_finalized_immutable, has no status
-- condition: it unconditionally rejects every UPDATE and DELETE.

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[AUDIT_LOG](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[user_oid] [nvarchar](36) NOT NULL,
	[user_tid] [nvarchar](36) NOT NULL,
	[user_email] [nvarchar](320) NOT NULL,
	[action] [nvarchar](50) NOT NULL,
	[target_type] [nvarchar](30) NOT NULL,
	[target_id] [int] NOT NULL,
	[ip_address] [nvarchar](45) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED
(
	[id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[AUDIT_LOG] ADD DEFAULT (sysutcdatetime()) FOR [created_at]
GO

-- Supports the future admin viewer: filter by user + date range, and by
-- which record was acted on. (timestamp) alone covers plain date-range
-- filtering without a user or target filter applied.
CREATE INDEX [IX_AUDIT_LOG_user_created] ON [dbo].[AUDIT_LOG] ([user_oid], [created_at])
GO
CREATE INDEX [IX_AUDIT_LOG_target] ON [dbo].[AUDIT_LOG] ([target_type], [target_id])
GO
CREATE INDEX [IX_AUDIT_LOG_created_at] ON [dbo].[AUDIT_LOG] ([created_at])
GO

CREATE OR ALTER TRIGGER dbo.TR_AuditLog_Immutable
ON dbo.AUDIT_LOG
AFTER UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;
  RAISERROR('Audit log entries cannot be modified or deleted', 16, 1);
  ROLLBACK TRANSACTION;
END
GO

-- No DENY UPDATE/DELETE added here: this codebase has no existing
-- GRANT/DENY/CREATE USER statements anywhere in db/migrations, and the
-- application's actual DB login is not referenced in the repo at all —
-- lib/db.ts authenticates via a connection string pulled from Azure Key
-- Vault at runtime (secret "sql-connection-string"), so the login/user
-- name isn't known to migration code. The finalized-report immutability
-- precedent (002_finalized_report_immutability.sql) is also trigger-only,
-- with no DENY — this migration follows that same established pattern
-- rather than introducing a new one. If DB-level permission locking is
-- wanted later, it needs the actual login name from Key Vault/Azure
-- Portal first.
