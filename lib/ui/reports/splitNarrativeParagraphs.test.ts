import { describe, expect, it } from "vitest";
import {
  emphasizeFirstVendorMentions,
  splitNarrativeParagraphs,
} from "./splitNarrativeParagraphs";

describe("splitNarrativeParagraphs", () => {
  it("splits blank-line-separated vendor discussion into paragraphs", () => {
    expect(
      splitNarrativeParagraphs(
        "Acme delivered 80 of orders on time.\n\nBeta lagged the peer average at 40."
      )
    ).toEqual([
      "Acme delivered 80 of orders on time.",
      "Beta lagged the peer average at 40.",
    ]);
  });

  it("treats a newline with only whitespace as a paragraph break", () => {
    expect(splitNarrativeParagraphs("First vendor.\n \nSecond vendor.")).toEqual([
      "First vendor.",
      "Second vendor.",
    ]);
  });

  it("keeps text without blank lines as a single paragraph", () => {
    expect(
      splitNarrativeParagraphs("Acme delivered 80 of orders on time. Beta lagged the peer average at 40.")
    ).toEqual([
      "Acme delivered 80 of orders on time. Beta lagged the peer average at 40.",
    ]);
  });

  it("keeps single newlines as one paragraph when no blank line is present", () => {
    expect(splitNarrativeParagraphs("First sentence.\nSecond sentence.")).toEqual([
      "First sentence.\nSecond sentence.",
    ]);
  });

  it("returns an empty list for empty or null narrative", () => {
    expect(splitNarrativeParagraphs("")).toEqual([]);
    expect(splitNarrativeParagraphs("   ")).toEqual([]);
    expect(splitNarrativeParagraphs(null)).toEqual([]);
    expect(splitNarrativeParagraphs(undefined)).toEqual([]);
  });
});

describe("emphasizeFirstVendorMentions", () => {
  it("bolds only the first mention of each vendor name", () => {
    expect(
      emphasizeFirstVendorMentions("Acme improved, then Acme slipped.", ["Acme"])
    ).toEqual([
      { text: "Acme", emphasize: true },
      { text: " improved, then Acme slipped.", emphasize: false },
    ]);
  });

  it("prefers the longer vendor name when names overlap", () => {
    expect(
      emphasizeFirstVendorMentions("Acme Trading beat the peer average.", ["Acme", "Acme Trading"])
    ).toEqual([
      { text: "Acme Trading", emphasize: true },
      { text: " beat the peer average.", emphasize: false },
    ]);
  });
});
