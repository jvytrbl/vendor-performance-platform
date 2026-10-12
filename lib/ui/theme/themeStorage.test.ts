// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { getStoredTheme, setStoredTheme, resolveInitialTheme } from "./themeStorage";

function createFakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe("getStoredTheme", () => {
  it("returns null when nothing has been stored", () => {
    expect(getStoredTheme(createFakeStorage())).toBeNull();
  });

  it("returns the stored theme when it's a valid preference", () => {
    const storage = createFakeStorage();
    storage.setItem("theme-preference", "dark");
    expect(getStoredTheme(storage)).toBe("dark");
  });

  it("returns null for a corrupted/unrecognized stored value instead of throwing", () => {
    const storage = createFakeStorage();
    storage.setItem("theme-preference", "blue");
    expect(getStoredTheme(storage)).toBeNull();
  });
});

describe("setStoredTheme", () => {
  it("stores the theme under the expected key", () => {
    const storage = createFakeStorage();
    setStoredTheme("dark", storage);
    expect(storage.getItem("theme-preference")).toBe("dark");
  });
});

describe("resolveInitialTheme", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  function mockMatchMedia(matchesDark: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" && matchesDark,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  }

  it("prefers the stored choice over the OS preference", () => {
    mockMatchMedia(true);
    const storage = createFakeStorage();
    storage.setItem("theme-preference", "light");
    expect(resolveInitialTheme(storage)).toBe("light");
  });

  it("falls back to the OS preference when nothing is stored (dark)", () => {
    mockMatchMedia(true);
    expect(resolveInitialTheme(createFakeStorage())).toBe("dark");
  });

  it("falls back to the OS preference when nothing is stored (light)", () => {
    mockMatchMedia(false);
    expect(resolveInitialTheme(createFakeStorage())).toBe("light");
  });
});
