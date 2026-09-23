interface SpinnerProps {
  size?: "sm" | "md";
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-3.5 w-3.5 border-[1.5px]",
  md: "h-4 w-4 border-2",
};

export default function Spinner({ size = "md" }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-border border-t-current motion-reduce:animate-none ${SIZE_CLASSES[size]}`}
    />
  );
}
