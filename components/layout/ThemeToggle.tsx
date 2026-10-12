"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
  applyTheme,
  resolveInitialTheme,
  setStoredTheme,
  type ThemePreference,
} from "@/lib/ui/theme/themeStorage";

export default function ThemeToggle() {
  // null until mounted — the blocking script in layout.tsx already set the
  // real attribute before paint, so this only needs to read it back for the
  // button's own icon/label, never to apply it (avoids a hydration mismatch
  // between server-rendered markup and whatever the script already did).
  const [theme, setTheme] = useState<ThemePreference | null>(null);

  useEffect(() => {
    setTheme(resolveInitialTheme(window.localStorage));
  }, []);

  function toggle() {
    const next: ThemePreference = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    setStoredTheme(next, window.localStorage);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={theme === null}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex min-h-11 min-w-11 items-center justify-center text-foreground-muted transition-colors duration-150 ease-out hover:text-foreground disabled:opacity-0"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}
