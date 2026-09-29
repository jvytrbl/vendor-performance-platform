-- Rollback for Migration 004: Audit log
-- No paired rollback file exists for 001/002/003 in this project (none were
-- written), so there's no established rollback convention to follow here —
-- this is a new, straightforward reverse-order script: drop the trigger,
-- then the table (dropping the table removes its indexes and default
-- constraint along with it; there is no DENY to undo, since none was applied).

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

DROP TRIGGER IF EXISTS dbo.TR_AuditLog_Immutable
GO

DROP TABLE IF EXISTS [dbo].[AUDIT_LOG]
GO
