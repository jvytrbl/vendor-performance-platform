// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { useAsyncData } from "./useAsyncData";

const getAccessToken = vi.fn();

vi.mock("@/lib/auth/useAccessToken", () => ({
  useAccessToken: () => getAccessToken,
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("useAsyncData", () => {
  it("resolves to an error status when getAccessToken rejects, instead of hanging on loading", async () => {
    getAccessToken.mockRejectedValue(new Error("Not signed in"));
    const fetcher = vi.fn();

    const { result } = renderHook(() =>
      useAsyncData(fetcher, [], "Failed to load")
    );

    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.errorMessage).toBe("Not signed in");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("resolves to ready when getAccessToken and the fetcher both succeed", async () => {
    getAccessToken.mockResolvedValue("token-123");
    const fetcher = vi.fn().mockResolvedValue({ items: [] });

    const { result } = renderHook(() =>
      useAsyncData(fetcher, [], "Failed to load")
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(fetcher).toHaveBeenCalledWith("token-123");
    expect(result.current.data).toEqual({ items: [] });
  });
});
