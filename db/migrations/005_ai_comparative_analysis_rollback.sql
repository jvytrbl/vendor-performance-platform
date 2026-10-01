-- Rollback for Migration 005: AI Comparative Analysis
-- Drops the four columns added in 005_ai_comparative_analysis.sql, in the
-- same reverse-order style as 004's rollback.

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS]
DROP COLUMN [ai_overall_comparison],
            [ai_delivery_comparison],
            [ai_pricing_comparison],
            [ai_order_accuracy_comparison]
GO
