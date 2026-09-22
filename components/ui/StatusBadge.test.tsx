// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

afterEach(() => {
  cleanup();
});

describe("StatusBadge", () => {
  it("renders the status text", () => {
    render(<StatusBadge status="Draft" />);
    expect(screen.getByText("Draft")).toBeTruthy();
  });

  it("applies a distinct visual style for Finalized versus Draft", () => {
    const { unmount } = render(<StatusBadge status="Draft" />);
    const draftClassName = screen.getByText("Draft").className;
    unmount();

    render(<StatusBadge status="Finalized" />);
    const finalizedClassName = screen.getByText("Finalized").className;

    expect(finalizedClassName).not.toBe(draftClassName);
  });
});
