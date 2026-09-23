"use client";

import { useMsal } from "@azure/msal-react";

export default function SignInButton() {
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

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="inline-flex min-h-11 items-center rounded bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
    >
      Log in
    </button>
  );
}
