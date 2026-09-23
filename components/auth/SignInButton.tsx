"use client";

import { useMsal } from "@azure/msal-react";
import { ArrowRight } from "lucide-react";
import { buttonClasses, type ButtonVariant } from "@/components/ui/Button";

export default function SignInButton({
  variant = "primary",
  tone = "default",
}: {
  variant?: ButtonVariant;
  tone?: "default" | "gate" | "hero";
}) {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const handleSignIn = () => {
    instance
      .loginRedirect({
        scopes: ["api://542c58fb-c9a9-4e98-a11e-da6fea5b1809/access_as_user"],
      })
      .catch((error) => {
        console.error("Login failed", error);
      });
  };

  const handleSignOut = () => {
    instance.logoutPopup();
  };

  if (account) {
    return (
      <div className="flex items-center gap-3">
        <span
          className="max-w-[7rem] truncate text-sm text-foreground-muted sm:max-w-[16rem]"
          title={account.username}
        >
          {account.username}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex min-h-11 items-center rounded border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-canvas"
        >
          Log out
        </button>
      </div>
    );
  }

  if (tone === "hero") {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-medium text-accent-foreground transition-colors duration-150 ease-out hover:bg-accent-hover"
      >
        Log in
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>
    );
  }

  if (tone === "gate") {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        className="group inline-flex items-center gap-3 text-sm font-medium text-foreground"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-canvas transition-colors duration-150 ease-out group-hover:bg-accent group-hover:text-accent-foreground">
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
        Log in
      </button>
    );
  }

  return (
    <button type="button" onClick={handleSignIn} className={buttonClasses(variant)}>
      Log in
    </button>
  );
}
