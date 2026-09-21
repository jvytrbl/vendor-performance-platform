// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import DeleteVendorButton from "./DeleteVendorButton";

afterEach(() => {
  cleanup();
});

describe("DeleteVendorButton", () => {
  it("shows a confirmation step before calling onConfirmDelete", () => {
    const onConfirmDelete = vi.fn();
    render(<DeleteVendorButton onConfirmDelete={onConfirmDelete} isDeleting={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText("Delete this vendor?")).toBeTruthy();
    expect(onConfirmDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

    expect(onConfirmDelete).toHaveBeenCalledTimes(1);
  });

  it("hides the confirmation when Cancel is clicked, without deleting", () => {
    const onConfirmDelete = vi.fn();
    render(<DeleteVendorButton onConfirmDelete={onConfirmDelete} isDeleting={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Delete this vendor?")).toBeNull();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
    expect(onConfirmDelete).not.toHaveBeenCalled();
  });

  it("disables the confirm and cancel buttons while a delete is in progress", () => {
    const onConfirmDelete = vi.fn();
    const { rerender } = render(
      <DeleteVendorButton onConfirmDelete={onConfirmDelete} isDeleting={false} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    rerender(<DeleteVendorButton onConfirmDelete={onConfirmDelete} isDeleting={true} />);

    const confirmButton = screen.getByRole("button", { name: "Deleting…" }) as HTMLButtonElement;
    const cancelButton = screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement;

    expect(confirmButton.disabled).toBe(true);
    expect(cancelButton.disabled).toBe(true);
  });
});
