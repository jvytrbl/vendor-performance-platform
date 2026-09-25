import { test, expect } from '@playwright/test';

test('unauthenticated user hitting a protected route sees a sign-in prompt, not a hung page', async ({ page }) => {
  await page.goto('/vendors');

  await expect(page.getByText('Sign in to view this page.')).toBeVisible();
  // The Navbar already shows its own "Log in" button on every route, so
  // scope to the inline prompt in <main> to avoid matching both.
  await expect(page.getByRole('main').getByRole('button', { name: /log in/i })).toBeVisible();

  // The bug this proves is fixed: useAsyncData used to leave the page stuck
  // on its loading spinner forever (unhandled rejection from getAccessToken
  // outside the try/catch). Confirm that spinner never even appears now,
  // since the page content is never mounted while signed out.
  await expect(page.getByRole('status')).toHaveCount(0);

  // Still on /vendors — this is an inline prompt, not an automatic redirect,
  // consistent with how the rest of the app only ever signs in on a manual click.
  await expect(page).toHaveURL(/\/vendors$/);
});
