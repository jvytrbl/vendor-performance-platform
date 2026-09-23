import { CheckCircle2, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-surface-muted text-foreground-muted border-border",
  Finalized: "bg-info-soft text-info border-info/40",
};

const STATUS_ICONS: Record<string, LucideIcon> = {
  Draft: Circle,
  Finalized: CheckCircle2,
};

const DEFAULT_STYLE = "bg-surface-muted text-foreground-muted border-border";

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;
  const Icon = STATUS_ICONS[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {Icon && <Icon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />}
      {status}
    </span>
  );
}
