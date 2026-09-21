"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  enabled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", enabled: false },
  { label: "Vendors", href: "/vendors", enabled: true },
  { label: "Transactions", href: "/transactions", enabled: true },
  { label: "Reports", href: "/reports", enabled: false },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={
        collapsed
          ? "sticky top-14 flex h-[calc(100vh-3.5rem)] w-14 shrink-0 flex-col border-r border-border bg-surface-muted"
          : "sticky top-14 flex h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col border-r border-border bg-surface-muted"
      }
    >
      <nav className={collapsed ? "flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 pt-4" : "flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 pt-4"}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.enabled && pathname.startsWith(item.href);
          const initial = item.label.charAt(0);

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                title={`${item.label} — coming soon`}
                className={
                  collapsed
                    ? "flex items-center justify-center rounded-lg px-2 py-2.5 text-sm text-foreground-muted/50"
                    : "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground-muted/50"
                }
              >
                {collapsed ? initial : item.label}
                {!collapsed && (
                  <span className="rounded-full bg-border/50 px-2 py-0.5 text-[9px] font-normal uppercase tracking-wide text-foreground-muted/60">
                    Soon
                  </span>
                )}
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={
                isActive
                  ? collapsed
                    ? "flex items-center justify-center rounded-lg bg-accent-soft/40 px-2 py-2.5 text-sm font-semibold text-accent"
                    : "rounded-lg bg-accent-soft/40 px-3 py-2.5 text-sm font-semibold text-accent"
                  : collapsed
                    ? "flex items-center justify-center rounded-lg px-2 py-2.5 text-sm text-foreground-muted hover:bg-canvas hover:text-foreground"
                    : "rounded-lg px-3 py-2.5 text-sm text-foreground-muted hover:bg-canvas hover:text-foreground"
              }
            >
              {collapsed ? initial : item.label}
            </Link>
          );
        })}
      </nav>

      <div className={collapsed ? "border-t border-border p-2" : "border-t border-border p-3"}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground-muted hover:bg-canvas hover:text-foreground"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className={collapsed ? "h-4 w-4" : "h-4 w-4 rotate-180"}
          >
            <path
              d="M6 3.5 10.5 8 6 12.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
