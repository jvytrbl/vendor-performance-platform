interface LoadingIndicatorProps {
  label: string;
}

export default function LoadingIndicator({ label }: LoadingIndicatorProps) {
  return (
    <p
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-sm text-foreground-muted"
    >
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent motion-reduce:animate-none"
      />
      {label}
    </p>
  );
}
