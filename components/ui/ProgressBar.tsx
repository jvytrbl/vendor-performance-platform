interface ProgressBarProps {
  label?: string;
  /** "pendulum" travels back and forth. Used when there is no real percentage. */
  motion?: "loop" | "pendulum";
}

export default function ProgressBar({ label, motion = "loop" }: ProgressBarProps) {
  const motionClass =
    motion === "pendulum" ? "animate-progress-pendulum" : "animate-progress-indeterminate";

  return (
    <div
      className="flex w-full flex-col gap-2"
      {...(label
        ? { role: "status" as const, "aria-live": "polite" as const }
        : { "aria-hidden": true as const })}
    >
      {label ? <p className="text-sm text-foreground-muted">{label}</p> : null}
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-border">
        <div className={`${motionClass} h-full w-1/3 rounded-full bg-accent`} />
      </div>
    </div>
  );
}
