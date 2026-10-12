export type ThemePreference = "light" | "dark";

const STORAGE_KEY = "theme-preference";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark";
}

// null means "no explicit choice yet" — callers fall back to OS preference,
// same three-tier behavior as the CSS (explicit light / explicit dark /
// OS-follows-default).
export function getStoredTheme(storage: StorageLike): ThemePreference | null {
  const raw = storage.getItem(STORAGE_KEY);
  return isThemePreference(raw) ? raw : null;
}

export function setStoredTheme(theme: ThemePreference, storage: StorageLike): void {
  storage.setItem(STORAGE_KEY, theme);
}

// Applies the theme to <html data-theme="..."> — the single place that
// decides which attribute value makes a given preference active, shared by
// the blocking anti-flash script (as an inline string, see app/layout.tsx)
// and the ThemeToggle component so the two can never disagree.
export function applyTheme(theme: ThemePreference): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export function resolveInitialTheme(storage: StorageLike): ThemePreference {
  const stored = getStoredTheme(storage);
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
