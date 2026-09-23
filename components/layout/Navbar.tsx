import Image from "next/image";
import { Menu, X } from "lucide-react";
import SignInButton from "@/components/auth/SignInButton";

interface NavbarProps {
  collapsed: boolean;
  menuOpen: boolean;
  onMenu: () => void;
}

export default function Navbar({ collapsed, menuOpen, onMenu }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border bg-surface-muted">
      <button
        type="button"
        onClick={onMenu}
        aria-expanded={menuOpen}
        aria-controls="app-nav"
        className="inline-flex min-h-11 min-w-11 items-center justify-center text-foreground md:hidden"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        {menuOpen ? (
          <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
      <div
        className={
          collapsed
            ? "hidden h-full w-14 shrink-0 items-center justify-center border-r border-border md:flex"
            : "hidden h-full w-64 shrink-0 items-center border-r border-border px-6 md:flex"
        }
      >
        {collapsed ? (
          <Image
            src="/vpp_logo.svg"
            alt="Vendor Performance Platform"
            title="Vendor Performance Platform"
            width={48}
            height={48}
            className="h-12 w-12"
          />
        ) : (
          <span className="flex items-center gap-2">
            <Image src="/vpp_logo.svg" alt="" width={48} height={48} className="h-12 w-12 shrink-0" />
            <span className="font-display text-2xl font-medium leading-tight text-foreground" title="Vendor Performance Platform">
              Vantage
            </span>
          </span>
        )}
      </div>
      <span className="flex min-w-0 items-center gap-2 truncate px-3 md:hidden">
        <Image src="/vpp_logo.svg" alt="" width={48} height={48} className="h-12 w-12 shrink-0" />
        <span className="font-display text-2xl font-medium text-foreground" title="Vendor Performance Platform">
          Vendor Performance
        </span>
      </span>
      <nav aria-label="Account" className="ml-auto flex h-full items-center px-4 sm:px-6 lg:px-12">
        <SignInButton />
      </nav>
    </header>
  );
}
