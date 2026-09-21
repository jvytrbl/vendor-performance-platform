import SignInButton from "@/components/auth/SignInButton";

interface NavbarProps {
  collapsed: boolean;
}

export default function Navbar({ collapsed }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-border bg-surface-muted">
      <div
        className={
          collapsed
            ? "flex h-full w-14 shrink-0 items-center justify-center border-r border-border"
            : "flex h-full w-56 shrink-0 items-center border-r border-border px-6"
        }
      >
        {collapsed ? (
          <span className="text-sm font-semibold text-foreground" title="Vendor Performance Platform">
            VP
          </span>
        ) : (
          <span className="text-sm font-semibold leading-tight text-foreground">
            Vendor Performance Platform
          </span>
        )}
      </div>
      <nav aria-label="Account" className="flex h-full flex-1 items-center justify-end px-12">
        <SignInButton />
      </nav>
    </header>
  );
}
