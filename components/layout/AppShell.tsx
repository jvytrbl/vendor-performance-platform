"use client";

import { useEffect, useState, type ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const STORAGE_KEY = "sidebar-collapsed";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar collapsed={collapsed} />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
        <main className="min-w-0 flex-1 overflow-y-auto px-12 py-10">{children}</main>
      </div>
    </div>
  );
}
