import Spinner from "./Spinner";

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
      <span className="text-accent">
        <Spinner size="md" />
      </span>
      {label}
    </p>
  );
}
