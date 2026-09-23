import type { ReactNode } from "react";
import Link from "next/link";
import { buttonClasses, type ButtonVariant } from "./Button";

interface LinkButtonProps {
  href: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  children: ReactNode;
}

export default function LinkButton({ href, variant = "secondary", icon, children }: LinkButtonProps) {
  return (
    <Link href={href} className={buttonClasses(variant)}>
      {icon}
      {children}
    </Link>
  );
}
