export const DEFAULT_PAGE_SIZE = 15;
export const MAX_PAGE_SIZE = 200;

export type PageParams =
  | { ok: true; page: number; pageSize: number; limit: number; offset: number }
  | { ok: false; field: "page" | "pageSize"; error: string };

function parsePositiveInt(raw: string | null, field: "page" | "pageSize", max?: number): 
  | { ok: true; value: number }
  | { ok: false; field: "page" | "pageSize"; error: string } {
  if (raw === null) {
    const fallback = field === "page" ? 1 : DEFAULT_PAGE_SIZE;
    return { ok: true, value: fallback };
  }
  const parsed = Number(raw);
  const withinMax = max === undefined || parsed <= max;
  if (!Number.isInteger(parsed) || parsed < 1 || !withinMax) {
    const limitNote = max === undefined ? "" : ` up to ${max}`;
    return {
      ok: false,
      field,
      error: `${field} must be a positive integer${limitNote}`,
    };
  }
  return { ok: true, value: parsed };
}

export function parsePageParams(searchParams: URLSearchParams): PageParams {
  const page = parsePositiveInt(searchParams.get("page"), "page");
  if (!page.ok) return page;
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), "pageSize", MAX_PAGE_SIZE);
  if (!pageSize.ok) return pageSize;
  return {
    ok: true,
    page: page.value,
    pageSize: pageSize.value,
    limit: pageSize.value,
    offset: (page.value - 1) * pageSize.value,
  };
}
