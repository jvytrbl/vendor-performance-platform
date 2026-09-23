import { getDbPool } from "@/lib/db";
import type { ReportInput } from "@/lib/domain/reports/validateReportInput";
import { buildReportListQuery, type ReportSortBy, type ReportSortOrder, type ReportStatusFilter } from "../domain/reports/reportListQuery";
import type { ReportSectionInput } from "../domain/reports/validateReportSections";
import type { GeneratedMetricRow } from "@/lib/domain/reports/runReportGeneration";

export interface ReportRecord {
  id: number;
  reference_number: string;
  period_type: string;
  period_start: string;
  period_end: string;
  status: string;
  vendor_ids: number[];
}

export interface ReportListItem {
  id: number;
  reference_number: string;
  period_type: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
}

export interface ReportMetricRecord {
  vvendor_id: number;
  period_start: string;
  period_end: string;
  on_time_delivery_rate: number | null;
  avg_delay_days: number | null;
  overcharge_rate: number | null;
  avg_overcharge_pct: number | null;
  undercharge_rate: number | null;
  shortfall_rate: number | null;
  avg_shortfall_units: number | null;
  overdelivery_rate: number | null;
  avg_overdelivery_units: number | null;
  transaction_count: number;
}

export interface ReportDetailRecord {
  id: number;
  reference_number: string;
  period_type: string;
  period_start: string;
  period_end: string;
  status: string;
  vendor_summary: string | null;
  delivery_performance: string | null;
  pricing_analysis: string | null;
  order_accuracy: string | null;
  created_at: string;
  finalized_at: string | null;
  vendor_ids: number[];
  metrics: ReportMetricRecord[];
}

export async function insertReport(input: ReportInput): Promise<ReportRecord> {
  const pool = await getDbPool();
  const referenceNumber = `VPR-${input.period_start.replaceAll("-", "")}-${Date.now().toString().slice(-6)}`;

  const inserted = await pool
    .request()
    .input("reference_number", referenceNumber)
    .input("period_type", input.period_type)
    .input("period_start", input.period_start)
    .input("period_end", input.period_end)
    .input("status", "Draft")
    .query(
      `INSERT INTO VENDOR_PERFORMANCE_REPORTS
        (reference_number, period_type, period_start, period_end, status)
       OUTPUT INSERTED.id, INSERTED.reference_number, INSERTED.period_type,
              INSERTED.period_start, INSERTED.period_end, INSERTED.status
       VALUES (@reference_number, @period_type, @period_start, @period_end, @status)`
    );

  const created = inserted.recordset[0];

  for (const vendorId of input.vendor_ids) {
    await pool
      .request()
      .input("report_id", created.id)
      .input("vendor_id", vendorId)
      .query(
        `INSERT INTO VENDOR_PERFORMANCE_REPORT_VENDORS (report_id, vendor_id)
         VALUES (@report_id, @vendor_id)`
      );
  }

  return { ...created, vendor_ids: input.vendor_ids };
}

export async function listReports(page: {
  limit: number;
  offset: number;
  status?: ReportStatusFilter;
  search?: string;
  sortBy?: ReportSortBy;
  sortOrder?: ReportSortOrder;
}): Promise<{ reports: ReportListItem[]; total: number }> {
  const pool = await getDbPool();
  const request = pool.request();
  const listQuery = buildReportListQuery(page);
  for (const binding of listQuery.bindings) {
    request.input(binding.name, binding.value);
  }
  request.input("offset", page.offset);
  request.input("limit", page.limit);

  const countResult = await request.query(
    `SELECT COUNT(*) AS total FROM VENDOR_PERFORMANCE_REPORTS ${listQuery.whereClause}`
  );
  const rowsResult = await request.query(
    `SELECT id, reference_number, period_type, period_start, period_end, status, created_at
     FROM VENDOR_PERFORMANCE_REPORTS
     ${listQuery.whereClause}
     ${listQuery.orderByClause}
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
  );

  return {
    reports: rowsResult.recordset,
    total: Number(countResult.recordset[0]?.total ?? 0),
  };
}

export async function getReportById(id: number): Promise<ReportDetailRecord | null> {
  const pool = await getDbPool();
  const reportResult = await pool
    .request()
    .input("id", id)
    .query(
      `SELECT id, reference_number, period_type, period_start, period_end, status,
              vendor_summary, delivery_performance, pricing_analysis, order_accuracy,
              created_at, finalized_at
       FROM VENDOR_PERFORMANCE_REPORTS
       WHERE id = @id`
    );
  const report = reportResult.recordset[0];
  if (!report) {
    return null;
  }
  const vendorsResult = await pool
    .request()
    .input("id", id)
    .query(
      `SELECT vendor_id FROM VENDOR_PERFORMANCE_REPORT_VENDORS WHERE report_id = @id`
    );
  // A report's generation run stores one row per vendor for the current
  // period AND one for the prior-period comparison (both share this
  // report_id — see UQ_VPM_report_vendor_period, keyed on report_id +
  // vendor_id + period_start, not just report_id + vendor_id). This view
  // shows one row per vendor, so it must also pin period_start to the
  // report's own period, or every vendor's prior-period row comes back too.
  const metricsResult = await pool
    .request()
    .input("id", id)
    .input("period_start", report.period_start)
    .query(
      `SELECT vendor_id, period_start, period_end,
              on_time_delivery_rate, avg_delay_days, overcharge_rate, avg_overcharge_pct,
              undercharge_rate, shortfall_rate, avg_shortfall_units, overdelivery_rate,
              avg_overdelivery_units, transaction_count
       FROM VENDOR_PERFORMANCE_METRICS
       WHERE report_id = @id AND period_start = @period_start`
    );
  return {
    ...report,
    vendor_ids: vendorsResult.recordset.map((row: { vendor_id: number }) => row.vendor_id),
    metrics: metricsResult.recordset,
  };
}

export async function updateReportSections(
  id: number,
  input: ReportSectionInput
): Promise<Omit<ReportDetailRecord, "vendor_ids" | "metrics"> | null> {
  const pool = await getDbPool();
  // No OUTPUT clause here: VENDOR_PERFORMANCE_REPORTS has the
  // TR_VPR_finalized_immutable AFTER UPDATE/DELETE trigger (migration 002),
  // and SQL Server forbids OUTPUT-without-INTO on a table with any enabled
  // trigger (error 334). Fetch the updated row with a follow-up SELECT instead.
  await pool
    .request()
    .input("id", id)
    .input("vendor_summary", input.vendor_summary)
    .input("delivery_performance", input.delivery_performance)
    .input("pricing_analysis", input.pricing_analysis)
    .input("order_accuracy", input.order_accuracy)
    .query(
      `UPDATE VENDOR_PERFORMANCE_REPORTS
       SET vendor_summary = @vendor_summary,
           delivery_performance = @delivery_performance,
           pricing_analysis = @pricing_analysis,
           order_accuracy = @order_accuracy
       WHERE id = @id`
    );

  const result = await pool
    .request()
    .input("id", id)
    .query(
      `SELECT id, reference_number, period_type, period_start, period_end, status,
              vendor_summary, delivery_performance, pricing_analysis, order_accuracy,
              created_at, finalized_at
       FROM VENDOR_PERFORMANCE_REPORTS
       WHERE id = @id`
    );
  return result.recordset[0] ?? null;
}

export async function deleteReport(id: number): Promise<number> {
  const pool = await getDbPool();
  const result = await pool 
    .request()
    .input("id", id)
    .query("DELETE FROM VENDOR_PERFORMANCE_REPORTS WHERE id = @id");

    return result.rowsAffected[0] ?? 0;
}

export async function finalizeReport(
  id: number
): Promise<Omit<ReportDetailRecord, "vendor_ids" | "metrics"> | null> {
  const pool = await getDbPool();
  // Same OUTPUT-without-INTO restriction as updateReportSections above
  // (SQL error 334, caused by TR_VPR_finalized_immutable) — plain UPDATE
  // followed by a SELECT instead.
  await pool
    .request()
    .input("id", id)
    .input("status", "Finalized")
    .query(
      `UPDATE VENDOR_PERFORMANCE_REPORTS
       SET status = @status, finalized_at = GETUTCDATE()
       WHERE id = @id`
    );

  const result = await pool
    .request()
    .input("id", id)
    .query(
      `SELECT id, reference_number, period_type, period_start, period_end, status,
              vendor_summary, delivery_performance, pricing_analysis, order_accuracy,
              created_at, finalized_at
       FROM VENDOR_PERFORMANCE_REPORTS
       WHERE id = @id`
    );

  return result.recordset[0] ?? null;
}

export async function tryStartGeneration(id: number): Promise<boolean> {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("id", id)
    .query(
      `UPDATE VENDOR_PERFORMANCE_REPORTS
       SET generation_status = 'InProgress'
       WHERE id = @id AND (generation_status IS NULL OR generation_status <> 'InProgress')`
    );

  return (result.rowsAffected[0] ?? 0) > 0;
}

export async function clearGenerationStatus(id: number): Promise<void> {
  const pool = await getDbPool();
  await pool
    .request()
    .input("id", id)
    .query(
      `UPDATE VENDOR_PERFORMANCE_REPORTS
       SET generation_status = NULL
       WHERE id = @id`
    );
}

export async function saveGeneratedReport(
  id: number,
  sections: ReportSectionInput,
  metrics: GeneratedMetricRow[]
): Promise<void> {
  await updateReportSections(id, sections);

  const pool = await getDbPool();
  for (const row of metrics) {
    await pool
      .request()
      .input("report_id", id)
      .input("vendor_id", row.vendor_id)
      .input("period_start", row.period_start)
      .input("period_end", row.period_end)
      .input("on_time_delivery_rate", row.on_time_delivery_rate)
      .input("avg_delay_days", row.avg_delay_days)
      .input("overcharge_rate", row.overcharge_rate)
      .input("avg_overcharge_pct", row.avg_overcharge_pct)
      .input("undercharge_rate", row.undercharge_rate)
      .input("shortfall_rate", row.shortfall_rate)
      .input("avg_shortfall_units", row.avg_shortfall_units)
      .input("overdelivery_rate", row.overdelivery_rate)
      .input("avg_overdelivery_units", row.avg_overdelivery_units)
      .input("transaction_count", row.transaction_count)
      .query(
        `INSERT INTO VENDOR_PERFORMANCE_METRICS
          (report_id, vendor_id, period_start, period_end,
           on_time_delivery_rate, avg_delay_days, overcharge_rate, avg_overcharge_pct,
           undercharge_rate, shortfall_rate, avg_shortfall_units, overdelivery_rate,
           avg_overdelivery_units, transaction_count)
         VALUES
          (@report_id, @vendor_id, @period_start, @period_end,
           @on_time_delivery_rate, @avg_delay_days, @overcharge_rate, @avg_overcharge_pct,
           @undercharge_rate, @shortfall_rate, @avg_shortfall_units, @overdelivery_rate,
           @avg_overdelivery_units, @transaction_count)`
      );
  }
}