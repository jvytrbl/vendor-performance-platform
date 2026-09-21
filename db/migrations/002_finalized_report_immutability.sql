-- Migration 002: Finalized report immutability (SDD §3.4, NFR-009)
-- Blocks UPDATE and DELETE when the existing row is Finalized.
-- Draft → Finalized (POST /api/reports/:id/finalize) is allowed because
-- the trigger looks at the old row in `deleted`, which is still Draft.

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER TRIGGER dbo.TR_VPR_finalized_immutable
ON dbo.VENDOR_PERFORMANCE_REPORTS
AFTER UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;

  IF EXISTS (
    SELECT 1
    FROM deleted
    WHERE status = 'Finalized'
  )
  BEGIN
    RAISERROR('Finalized reports cannot be modified or deleted', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
  END
END
GO