export const DEFAULT_PAGE_SIZE = 15;
export const MAX_PAGE_SIZE = 200;

export type PageParams =
  | { ok: true; page: number; pageSize: number; limit: number; offset: number }
  | { ok: false; field: "page" | "pageSize"; error: string };

function parsePositiveInt(
  raw: string | null,
  field: "page" | "pageSize",
  fallback: number,
  max?: number
):
  | { ok: true; value: number }
  | { ok: false; field: "page" | "pageSize"; error: string } {
  if (raw === null) {
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

// Every list endpoint shares this parser; defaultPageSize/maxPageSize let a
// caller override the app-wide DEFAULT_PAGE_SIZE/MAX_PAGE_SIZE (e.g. the
// audit log's smaller default/max) without duplicating the validation logic.
export function parsePageParams(
  searchParams: URLSearchParams,
  options?: { defaultPageSize?: number; maxPageSize?: number }
): PageParams {
  const defaultPageSize = options?.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const maxPageSize = options?.maxPageSize ?? MAX_PAGE_SIZE;

  const page = parsePositiveInt(searchParams.get("page"), "page", 1);
  if (!page.ok) return page;
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), "pageSize", defaultPageSize, maxPageSize);
  if (!pageSize.ok) return pageSize;
  return {
    ok: true,
    page: page.value,
    pageSize: pageSize.value,
    limit: pageSize.value,
    offset: (page.value - 1) * pageSize.value,
  };
}
