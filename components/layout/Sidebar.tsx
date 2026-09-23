"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Building2,
  ChevronLeft,
  Clock,
  FileText,
  Home,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  enabled: boolean;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", enabled: true, icon: Home },
  { label: "Vendors", href: "/vendors", enabled: true, icon: Building2 },
  { label: "Transactions", href: "/transactions", enabled: true, icon: ArrowLeftRight },
  { label: "Reports", href: "/reports", enabled: true, icon: FileText },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onToggle, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const showLabels = mobileOpen || !collapsed;

  return (
    <aside
      id="app-nav"
      className={`fixed top-14 z-30 h-[calc(100dvh-3.5rem)] w-64 shrink-0 flex-col border-r border-border bg-surface-muted md:sticky md:z-0 ${
        mobileOpen ? "flex" : "hidden md:flex"
      } ${collapsed ? "md:w-14" : "md:w-64"}`}
    >
      <nav className={showLabels ? "flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 pt-4" : "flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 pt-4"}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.enabled && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
          const Icon = item.icon;

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                title={`${item.label} — coming soon`}
                className={
                  showLabels
                    ? "flex min-h-11 items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground-muted/50"
                    : "flex min-h-11 items-center justify-center rounded-lg px-2 py-2.5 text-sm text-foreground-muted/50"
                }
              >
                {!showLabels ? (
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    {item.label}
                  </span>
                )}
                {showLabels && (
                  <span className="flex items-center gap-1 rounded-full bg-border/50 px-2 py-0.5 text-[9px] font-normal uppercase tracking-wide text-foreground-muted/60">
                    <Clock className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
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
              onClick={onNavigate}
              className={
                isActive
                  ? showLabels
                    ? "flex min-h-11 items-center gap-2.5 rounded-lg bg-accent-soft/40 px-3 py-2.5 text-sm font-semibold text-accent transition-colors duration-150 ease-out"
                    : "flex min-h-11 items-center justify-center rounded-lg bg-accent-soft/40 px-2 py-2.5 text-sm font-semibold text-accent transition-colors duration-150 ease-out"
                  : showLabels
                    ? "flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground-muted transition-colors duration-150 ease-out hover:bg-canvas hover:text-foreground"
                    : "flex min-h-11 items-center justify-center rounded-lg px-2 py-2.5 text-sm text-foreground-muted transition-colors duration-150 ease-out hover:bg-canvas hover:text-foreground"
              }
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              {showLabels && item.label}
            </Link>
          );
        })}
      </nav>

      <div className={collapsed ? "hidden border-t border-border p-2 md:block" : "hidden border-t border-border p-3 md:block"}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground-muted transition-colors duration-150 ease-out hover:bg-canvas hover:text-foreground"
        >
          <ChevronLeft
            className={collapsed ? "h-4 w-4 rotate-180 transition-transform duration-150 ease-out" : "h-4 w-4 transition-transform duration-150 ease-out"}
            strokeWidth={1.75}
            aria-hidden="true"
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
