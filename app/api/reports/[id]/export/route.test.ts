import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { validateAuthHeader } from "../../../../../lib/auth";
import { getReportById } from "@/lib/repositories/reports";
import { generatePdfReport } from "../../../../../lib/exports/generatePdfReport";
import { generateDocxReport } from "../../../../../lib/exports/generateDocxReport";

vi.mock("../../../../../lib/auth", () => ({
  validateAuthHeader: vi.fn(),
}));

vi.mock("@/lib/repositories/reports", () => ({
  getReportById: vi.fn(),
}));

vi.mock("../../../../../lib/exports/generatePdfReport", () => ({
  generatePdfReport: vi.fn(),
}));

vi.mock("../../../../../lib/exports/generateDocxReport", () => ({
  generateDocxReport: vi.fn(),
}));

const finalizedReport = {
  id: 7,
  reference_number: "VPR-20260101-123456",
  period_type: "Quarterly",
  period_start: "2026-01-01",
  period_end: "2026-03-31",
  status: "Finalized",
  vendor_summary: "Summary text.",
  delivery_performance: "Delivery text.",
  pricing_analysis: "Pricing text.",
  order_accuracy: "Accuracy text.",
  created_at: "2026-04-01T00:00:00.000Z",
  finalized_at: "2026-04-02T00:00:00.000Z",
  vendor_ids: [1],
  metrics: [],
};

function requestFor(id: string, format?: string): Request {
  const query = format !== undefined ? `?format=${format}` : "";
  return new Request(`http://localhost/api/reports/${id}/export${query}`, {
    headers: { Authorization: "Bearer good.token" },
  });
}

describe("GET /api/reports/:id/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
  });

  it("returns 401 when the request is not authenticated", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });
    const response = await GET(requestFor("7", "pdf"), {
      params: Promise.resolve({ id: "7" }),
    });
    expect(response.status).toBe(401);
  });

  // Category 3 (wrong type/malformed): format must be exactly pdf or docx.
  it("returns 400 VALIDATION_FAILED when format is missing or not pdf/docx", async () => {
    vi.mocked(getReportById).mockResolvedValue(finalizedReport as any);

    const missing = await GET(requestFor("7"), { params: Promise.resolve({ id: "7" }) });
    expect(missing.status).toBe(400);
    expect((await missing.json()).code).toBe("VALIDATION_FAILED");

    const invalid = await GET(requestFor("7", "xlsx"), {
      params: Promise.resolve({ id: "7" }),
    });
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).code).toBe("VALIDATION_FAILED");

    expect(generatePdfReport).not.toHaveBeenCalled();
    expect(generateDocxReport).not.toHaveBeenCalled();
  });

  it("returns 404 when the report does not exist", async () => {
    vi.mocked(getReportById).mockResolvedValue(null);
    const response = await GET(requestFor("99", "pdf"), {
      params: Promise.resolve({ id: "99" }),
    });
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.code).toBe("REPORT_NOT_FOUND");
  });

  // Category 4 (duplicate/conflicting state), FR-M1-011: only a Finalized
  // report is exportable — this is a lifecycle-state conflict, not a
  // permission/role check.
  it("returns 409 REPORT_NOT_FINALIZED when the report is still a Draft", async () => {
    vi.mocked(getReportById).mockResolvedValue({
      ...finalizedReport,
      status: "Draft",
    } as any);

    const response = await GET(requestFor("7", "pdf"), {
      params: Promise.resolve({ id: "7" }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe("REPORT_NOT_FINALIZED");
    expect(generatePdfReport).not.toHaveBeenCalled();
    expect(generateDocxReport).not.toHaveBeenCalled();
  });

  it("returns a PDF file with the correct content type when format=pdf", async () => {
    vi.mocked(getReportById).mockResolvedValue(finalizedReport as any);
    const pdfBuffer = Buffer.from("%PDF-fake");
    vi.mocked(generatePdfReport).mockResolvedValue(pdfBuffer);

    const response = await GET(requestFor("7", "pdf"), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain(
      "VPR-20260101-123456.pdf"
    );
    expect(generateDocxReport).not.toHaveBeenCalled();
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(bytes.equals(pdfBuffer)).toBe(true);
  });

  it("returns a docx file with the correct content type when format=docx", async () => {
    vi.mocked(getReportById).mockResolvedValue(finalizedReport as any);
    const docxBuffer = Buffer.from("PK-fake");
    vi.mocked(generateDocxReport).mockResolvedValue(docxBuffer);

    const response = await GET(requestFor("7", "docx"), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(response.headers.get("Content-Disposition")).toContain(
      "VPR-20260101-123456.docx"
    );
    expect(generatePdfReport).not.toHaveBeenCalled();
  });
});
