import type { ButtonHTMLAttributes, ReactNode } from "react";
import Spinner from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  isLoading?: boolean;
  children: ReactNode;
}

export const BUTTON_BASE_CLASSES =
  "inline-flex min-h-11 items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors duration-150 ease-out disabled:cursor-not-allowed";

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover disabled:bg-foreground-muted/40",
  secondary:
    "border border-border text-foreground hover:bg-surface-muted disabled:text-foreground-subtle",
  danger:
    "border border-border bg-danger-soft/40 text-danger-muted hover:border-danger hover:bg-danger-soft hover:text-danger disabled:bg-transparent disabled:text-foreground-subtle",
};

export function buttonClasses(variant: ButtonVariant = "secondary"): string {
  return `${BUTTON_BASE_CLASSES} ${BUTTON_VARIANT_CLASSES[variant]}`;
}

export default function Button({
  variant = "secondary",
  icon,
  isLoading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || isLoading}
      className={`${buttonClasses(variant)}${className ? ` ${className}` : ""}`}
    >
      {isLoading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  );
}
