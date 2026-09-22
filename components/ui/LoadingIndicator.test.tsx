// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import LoadingIndicator from "./LoadingIndicator";

afterEach(() => {
  cleanup();
});

describe("LoadingIndicator", () => {
  it("announces the operation that is in progress", () => {
    render(<LoadingIndicator label="Generating the report…" />);

    const status = screen.getByRole("status");
    expect(status.textContent).toBe("Generating the report…");
  });
});
