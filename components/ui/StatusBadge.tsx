interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-surface-muted text-foreground-muted border-border",
  Finalized: "bg-accent-soft text-accent border-accent",
};

const DEFAULT_STYLE = "bg-surface-muted text-foreground-muted border-border";

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}
