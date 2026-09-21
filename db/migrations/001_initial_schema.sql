/****** Object:  Table [dbo].[VENDOR_PERFORMANCE_METRICS]    Script Date: 9/9/2026 10:23:41 AM ******/
-- Migration 001: Initial schema
-- Generated from live Azure SQL database via SSMS "Generate Scripts" (schema only)
-- Captures: VENDORS, VENDOR_TRANSACTIONS, VENDOR_PERFORMANCE_REPORTS,
-- VENDOR_PERFORMANCE_REPORT_VENDORS, VENDOR_PERFORMANCE_METRICS
-- Does NOT yet include the Finalized-report immutability trigger (SDD §3.4) — that's Phase 3 work.
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VENDOR_PERFORMANCE_METRICS](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[report_id] [int] NULL,
	[vendor_id] [int] NOT NULL,
	[period_start] [date] NOT NULL,
	[period_end] [date] NOT NULL,
	[on_time_delivery_rate] [decimal](5, 2) NULL,
	[avg_delay_days] [decimal](6, 2) NULL,
	[overcharge_rate] [decimal](5, 2) NULL,
	[avg_overcharge_pct] [decimal](6, 2) NULL,
	[undercharge_rate] [decimal](5, 2) NULL,
	[shortfall_rate] [decimal](5, 2) NULL,
	[avg_shortfall_units] [decimal](10, 2) NULL,
	[overdelivery_rate] [decimal](5, 2) NULL,
	[avg_overdelivery_units] [decimal](10, 2) NULL,
	[transaction_count] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_VPM_report_vendor_period] UNIQUE NONCLUSTERED 
(
	[report_id] ASC,
	[vendor_id] ASC,
	[period_start] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VENDOR_PERFORMANCE_REPORT_VENDORS]    Script Date: 9/9/2026 10:23:41 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VENDOR_PERFORMANCE_REPORT_VENDORS](
	[report_id] [int] NOT NULL,
	[vendor_id] [int] NOT NULL,
 CONSTRAINT [PK_VPRV] PRIMARY KEY CLUSTERED 
(
	[report_id] ASC,
	[vendor_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VENDOR_PERFORMANCE_REPORTS]    Script Date: 9/9/2026 10:23:41 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[reference_number] [nvarchar](30) NOT NULL,
	[period_type] [nvarchar](20) NOT NULL,
	[period_start] [date] NOT NULL,
	[period_end] [date] NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[vendor_summary] [nvarchar](max) NULL,
	[delivery_performance] [nvarchar](max) NULL,
	[pricing_analysis] [nvarchar](max) NULL,
	[order_accuracy] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[finalized_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VENDOR_TRANSACTIONS]    Script Date: 9/9/2026 10:23:41 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VENDOR_TRANSACTIONS](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[vendor_id] [int] NOT NULL,
	[transaction_date] [date] NOT NULL,
	[item_description] [nvarchar](500) NOT NULL,
	[agreed_price] [decimal](12, 2) NOT NULL,
	[actual_price] [decimal](12, 2) NULL,
	[agreed_delivery_date] [date] NOT NULL,
	[actual_delivery_date] [date] NULL,
	[quantity_ordered] [decimal](10, 2) NOT NULL,
	[quantity_received] [decimal](10, 2) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VENDORS]    Script Date: 9/9/2026 10:23:41 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VENDORS](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](200) NOT NULL,
	[registration_number] [nvarchar](50) NOT NULL,
	[contact_info] [nvarchar](500) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_VENDORS_registration_number] UNIQUE NONCLUSTERED 
(
	[registration_number] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS] ADD  DEFAULT ('Draft') FOR [status]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[VENDORS] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS]  WITH CHECK ADD  CONSTRAINT [FK_VPM_report] FOREIGN KEY([report_id])
REFERENCES [dbo].[VENDOR_PERFORMANCE_REPORTS] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS] CHECK CONSTRAINT [FK_VPM_report]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS]  WITH CHECK ADD  CONSTRAINT [FK_VPM_vendor] FOREIGN KEY([vendor_id])
REFERENCES [dbo].[VENDORS] ([id])
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS] CHECK CONSTRAINT [FK_VPM_vendor]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORT_VENDORS]  WITH CHECK ADD  CONSTRAINT [FK_VPRV_report] FOREIGN KEY([report_id])
REFERENCES [dbo].[VENDOR_PERFORMANCE_REPORTS] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORT_VENDORS] CHECK CONSTRAINT [FK_VPRV_report]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORT_VENDORS]  WITH CHECK ADD  CONSTRAINT [FK_VPRV_vendor] FOREIGN KEY([vendor_id])
REFERENCES [dbo].[VENDORS] ([id])
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORT_VENDORS] CHECK CONSTRAINT [FK_VPRV_vendor]
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS]  WITH CHECK ADD  CONSTRAINT [FK_VENDOR_TRANSACTIONS_vendor] FOREIGN KEY([vendor_id])
REFERENCES [dbo].[VENDORS] ([id])
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS] CHECK CONSTRAINT [FK_VENDOR_TRANSACTIONS_vendor]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS]  WITH CHECK ADD  CONSTRAINT [CK_VPM_on_time_delivery_rate] CHECK  (([on_time_delivery_rate] IS NULL OR [on_time_delivery_rate]>=(0) AND [on_time_delivery_rate]<=(100)))
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS] CHECK CONSTRAINT [CK_VPM_on_time_delivery_rate]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS]  WITH CHECK ADD  CONSTRAINT [CK_VPM_overcharge_rate] CHECK  (([overcharge_rate] IS NULL OR [overcharge_rate]>=(0) AND [overcharge_rate]<=(100)))
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS] CHECK CONSTRAINT [CK_VPM_overcharge_rate]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS]  WITH CHECK ADD  CONSTRAINT [CK_VPM_overdelivery_rate] CHECK  (([overdelivery_rate] IS NULL OR [overdelivery_rate]>=(0) AND [overdelivery_rate]<=(100)))
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS] CHECK CONSTRAINT [CK_VPM_overdelivery_rate]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS]  WITH CHECK ADD  CONSTRAINT [CK_VPM_period_range] CHECK  (([period_end]>=[period_start]))
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS] CHECK CONSTRAINT [CK_VPM_period_range]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS]  WITH CHECK ADD  CONSTRAINT [CK_VPM_shortfall_rate] CHECK  (([shortfall_rate] IS NULL OR [shortfall_rate]>=(0) AND [shortfall_rate]<=(100)))
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS] CHECK CONSTRAINT [CK_VPM_shortfall_rate]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS]  WITH CHECK ADD  CONSTRAINT [CK_VPM_undercharge_rate] CHECK  (([undercharge_rate] IS NULL OR [undercharge_rate]>=(0) AND [undercharge_rate]<=(100)))
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_METRICS] CHECK CONSTRAINT [CK_VPM_undercharge_rate]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS]  WITH CHECK ADD  CONSTRAINT [CK_VPR_period_range] CHECK  (([period_end]>=[period_start]))
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS] CHECK CONSTRAINT [CK_VPR_period_range]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS]  WITH CHECK ADD  CONSTRAINT [CK_VPR_period_type] CHECK  (([period_type]='Custom' OR [period_type]='Quarterly'))
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS] CHECK CONSTRAINT [CK_VPR_period_type]
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS]  WITH CHECK ADD  CONSTRAINT [CK_VPR_status] CHECK  (([status]='Finalized' OR [status]='Draft'))
GO
ALTER TABLE [dbo].[VENDOR_PERFORMANCE_REPORTS] CHECK CONSTRAINT [CK_VPR_status]
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS]  WITH CHECK ADD  CONSTRAINT [CK_VENDOR_TRANSACTIONS_actual_delivery_date] CHECK  (([actual_delivery_date] IS NULL OR [actual_delivery_date]>=[transaction_date]))
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS] CHECK CONSTRAINT [CK_VENDOR_TRANSACTIONS_actual_delivery_date]
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS]  WITH CHECK ADD  CONSTRAINT [CK_VENDOR_TRANSACTIONS_actual_price] CHECK  (([actual_price] IS NULL OR [actual_price]>(0)))
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS] CHECK CONSTRAINT [CK_VENDOR_TRANSACTIONS_actual_price]
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS]  WITH CHECK ADD  CONSTRAINT [CK_VENDOR_TRANSACTIONS_agreed_delivery_date] CHECK  (([agreed_delivery_date]>=[transaction_date]))
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS] CHECK CONSTRAINT [CK_VENDOR_TRANSACTIONS_agreed_delivery_date]
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS]  WITH CHECK ADD  CONSTRAINT [CK_VENDOR_TRANSACTIONS_agreed_price] CHECK  (([agreed_price]>(0)))
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS] CHECK CONSTRAINT [CK_VENDOR_TRANSACTIONS_agreed_price]
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS]  WITH CHECK ADD  CONSTRAINT [CK_VENDOR_TRANSACTIONS_item_description] CHECK  ((len([item_description])>(0)))
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS] CHECK CONSTRAINT [CK_VENDOR_TRANSACTIONS_item_description]
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS]  WITH CHECK ADD  CONSTRAINT [CK_VENDOR_TRANSACTIONS_quantity_ordered] CHECK  (([quantity_ordered]>(0)))
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS] CHECK CONSTRAINT [CK_VENDOR_TRANSACTIONS_quantity_ordered]
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS]  WITH CHECK ADD  CONSTRAINT [CK_VENDOR_TRANSACTIONS_quantity_received] CHECK  (([quantity_received] IS NULL OR [quantity_received]>(0)))
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS] CHECK CONSTRAINT [CK_VENDOR_TRANSACTIONS_quantity_received]
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS]  WITH CHECK ADD  CONSTRAINT [CK_VENDOR_TRANSACTIONS_transaction_date] CHECK  (([transaction_date]>='2000-01-01' AND [transaction_date]<=CONVERT([date],getdate())))
GO
ALTER TABLE [dbo].[VENDOR_TRANSACTIONS] CHECK CONSTRAINT [CK_VENDOR_TRANSACTIONS_transaction_date]
GO
