import { NextResponse } from "next/server";
import { withAuth } from "../../../../../lib/withAuth";
import { getReportById, saveGeneratedReport } from "@/lib/repositories/reports";
import { getTransactionsForPeriod } from "@/lib/repositories/transactions";
import { getPriorPeriod } from "../../../../../lib/domain/reports/getPriorPeriod";
import { runReportGeneration } from "../../../../../lib/domain/reports/runReportGeneration";
import { geminiGenerateContent, RateLimitError } from "../../../../../lib/ai/geminiGenerateContent";
import { withRetry } from "../../../../../lib/ai/withRetry";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateContentWithRetry(prompt: string, apiKey: string): Promise<string> {
  const result = await withRetry(() => geminiGenerateContent(prompt, apiKey), {
    isRetryable: (error) => error instanceof RateLimitError,
    wait,
  });
  if (!result.ok) {
    throw new Error("AI generation temporarily unavailable after retries");
  }
  return result.value;
}

function parseReportId(id: string): number | null {
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) {
    return null;
  }
  return reportId;
}

function toIsoDate(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

export const POST = withAuth<{ params: Promise<{ id: string }> }>(
  async (_request, _auth, context) => {
    const { id } = await context!.params;
    const reportId = parseReportId(id);

    if (reportId === null) {
      return NextResponse.json(
        {
          error: "Report id must be a positive integer",
          code: "VALIDATION_FAILED",
          field: "id",
        },
        { status: 400 }
      );
    }

    const existing = await getReportById(reportId);
    if (!existing) {
      return NextResponse.json(
        { error: "Report not found", code: "REPORT_NOT_FOUND", field: "id" },
        { status: 404 }
      );
    }

    if (existing.status === "Finalized") {
      return NextResponse.json(
        {
          error: "Finalized reports cannot be generated",
          code: "REPORT_FINALIZED",
          field: "id",
        },
        { status: 409 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI generation failed; nothing was saved", code: "AI_UNAVAILABLE" },
        { status: 503 }
      );
    }

    const currentPeriod = {
      periodStart: toIsoDate(existing.period_start),
      periodEnd: toIsoDate(existing.period_end),
    };
    const priorPeriod = getPriorPeriod(currentPeriod);

    const currentTxs = await getTransactionsForPeriod(
      existing.vendor_ids,
      currentPeriod.periodStart,
      currentPeriod.periodEnd
    );
    const priorTxs = await getTransactionsForPeriod(
      existing.vendor_ids,
      priorPeriod.periodStart,
      priorPeriod.periodEnd
    );

    const result = await runReportGeneration({
      vendorIds: existing.vendor_ids,
      currentPeriod,
      priorPeriod,
      currentTxs,
      priorTxs,
      generateContent: (prompt) => generateContentWithRetry(prompt, apiKey),
    });

    if (!result.ok) {
      const status = result.code === "AI_UNAVAILABLE" ? 503 : 422;
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status }
      );
    }

    try {
      await saveGeneratedReport(reportId, result.sections, result.metrics);
    } catch (error: unknown) {
      const sqlNumber =
        typeof error === "object" && error !== null && "number" in error
          ? (error as { number: number }).number
          : undefined;
      if (sqlNumber === 2627) {
        return NextResponse.json(
          {
            error: "Metrics already exist for this report",
            code: "DUPLICATE_METRICS",
          },
          { status: 409 }
        );
      }
      throw error;
    }

    const saved = await getReportById(reportId);
    return NextResponse.json({ data: saved });
  }
);
