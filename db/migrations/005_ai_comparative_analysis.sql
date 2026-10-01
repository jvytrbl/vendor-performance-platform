-- Migration 005: AI Comparative Analysis (fifth report section)
-- Four nullable columns, matching the existing four narrative columns'
-- style exactly (nvarchar(max) NULL) — each independently editable, same
-- as vendor_summary/delivery_performance/pricing_analysis/order_accuracy.
-- Existing and finalized reports keep these NULL; no backfill (per design).
-- Finalized-report immutability (migration 002's trigger) already covers
-- any column on this table unconditionally — no trigger change needed.

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS]
ADD [ai_overall_comparison] [nvarchar](max) NULL,
    [ai_delivery_comparison] [nvarchar](max) NULL,
    [ai_pricing_comparison] [nvarchar](max) NULL,
    [ai_order_accuracy_comparison] [nvarchar](max) NULL
GO
