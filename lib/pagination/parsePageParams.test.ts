import { describe, expect, it } from "vitest";
import { parsePageParams, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./parsePageParams";

describe("parsePageParams", () => {
  it("defaults to page 1 and pageSize 15 when both are omitted", () => {
    const result = parsePageParams(new URLSearchParams());
    expect(result).toEqual({
      ok: true,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      limit: DEFAULT_PAGE_SIZE,
      offset: 0,
    });
  });

  it("maps a later page onto the matching offset", () => {
    const result = parsePageParams(new URLSearchParams("page=3&pageSize=15"));
    expect(result).toEqual({
      ok: true,
      page: 3,
      pageSize: 15,
      limit: 15,
      offset: 30,
    });
  });

  it("rejects a page that is not a positive integer", () => {
    const result = parsePageParams(new URLSearchParams("page=0"));
    expect(result).toEqual({
      ok: false,
      field: "page",
      error: "page must be a positive integer",
    });
  });

  it("rejects a pageSize above the maximum", () => {
    const result = parsePageParams(
      new URLSearchParams(`pageSize=${MAX_PAGE_SIZE + 1}`)
    );
    expect(result).toEqual({
      ok: false,
      field: "pageSize",
      error: `pageSize must be a positive integer up to ${MAX_PAGE_SIZE}`,
    });
  });
});
