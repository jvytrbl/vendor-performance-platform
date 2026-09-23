import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  action?: ReactNode;
}

export default function ErrorBanner({ message, action }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded border border-danger/30 bg-danger-soft px-4 py-3"
    >
      <AlertCircle
        className="mt-0.5 h-4 w-4 shrink-0 text-danger"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
        <p className="text-sm leading-relaxed text-foreground">{message}</p>
        {action}
      </div>
    </div>
  );
}
