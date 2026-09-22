-- Migration 003: In-progress generation guard (NFR-012, Phase 3 Group C / C5)
-- Adds a status flag used as an atomic claim: a single UPDATE ... WHERE
-- generation_status IS NULL OR <> 'InProgress' is how a request proves it
-- was the one to win the race against a concurrent /generate call for the
-- same report. NULL means idle/free to claim.

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS]
ADD [generation_status] [nvarchar](20) NULL
GO
