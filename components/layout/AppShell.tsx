"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useMsal } from "@azure/msal-react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const STORAGE_KEY = "sidebar-collapsed";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { accounts } = useMsal();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The signed-out home page is a front door, not a work surface — no
  // sidebar/navbar chrome around it. Every other route keeps its existing
  // (ad hoc, per-route) signed-out handling; this is scoped to "/" only.
  const isSignedOutHome = accounts.length === 0 && pathname === "/";

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    const query = window.matchMedia("(min-width: 768px)");
    function closeOnDesktop() {
      if (query.matches) setMenuOpen(false);
    }
    query.addEventListener("change", closeOnDesktop);
    return () => query.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  if (isSignedOutHome) {
    return <div className="flex min-h-dvh flex-col bg-cream">{children}</div>;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <Navbar
        collapsed={collapsed}
        menuOpen={menuOpen}
        onMenu={() => setMenuOpen((open) => !open)}
      />
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-foreground/30 md:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="flex min-h-0 flex-1">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={menuOpen}
          onToggle={toggle}
          onNavigate={() => setMenuOpen(false)}
        />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
