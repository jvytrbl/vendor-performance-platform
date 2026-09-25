import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

if (!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD) {
  throw new Error('E2E_TEST_EMAIL or E2E_TEST_PASSWORD is missing — check .env.local');
}

setup('authenticate', async ({ page }) => {
  setup.setTimeout(180000);

  await page.goto('/');
  await page.getByRole('button', { name: /log in/i }).click();

  await page.fill('input[name="loginfmt"]', process.env.E2E_TEST_EMAIL!);
  await page.click('#idSIButton9');

  await page.fill('input[name="passwd"]', process.env.E2E_TEST_PASSWORD!);
  // Only the password-submit click itself matters here. What follows is a
  // Windows Hello/FIDO passkey ceremony that resolves via the browser's own
  // WebAuthn API once triggered by the page's JS — it is not waiting on
  // further clicks against this same selector. Chasing '#idSIButton9'
  // (reused/disabled across several intermediate login.microsoft.com and
  // login.live.com hops) with a long timeout actively interferes with the
  // ceremony instead of waiting for it, so this click is deliberately short
  // and best-effort: swallow a timeout here and let the ceremony run.
  await page.click('#idSIButton9', { timeout: 5000 }).catch(() => {});

  console.log('>>> Touch the fingerprint reader now if prompted <<<');

  // Two valid outcomes after the passkey ceremony: this tenant may show a
  // "Stay signed in?" interstitial, or it may skip straight through to the
  // authenticated app. Race both signals instead of assuming one.
  await Promise.race([
    page.getByRole('heading', { name: 'Stay signed in?' }).waitFor({ state: 'visible', timeout: 150000 }),
    page.getByRole('button', { name: /log out/i }).waitFor({ state: 'visible', timeout: 150000 }),
  ]);

  const stayPrompt = page.getByRole('heading', { name: 'Stay signed in?' });
  if (await stayPrompt.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Yes' }).click();
  }

  await expect(page.getByRole('button', { name: /log out/i })).toBeVisible({
    timeout: 30000,
  });

  await page.context().storageState({ path: authFile });
});
