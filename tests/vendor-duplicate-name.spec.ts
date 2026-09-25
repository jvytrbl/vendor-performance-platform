import { test, expect, type Page } from '@playwright/test';

/**
 * Deletes every vendor whose name starts with "ZZZPWTest" — a safety-net
 * sweep so leftover test data from a previous failed run never collides
 * with this run's duplicate-name similarity check.
 */
async function cleanupTestVendors(page: Page) {
  await page.goto('/vendors');

  // Keep deleting the first match until none remain. Looping (rather than
  // collecting all matches up front) is deliberate: after each delete the
  // table re-renders and row references from before the delete are stale.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const row = page.getByRole('row', { name: /ZZZPWTest/ });
    const count = await row.count();
    if (count === 0) break;

    await row.first().getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Yes, delete' }).click();
    await expect(page).toHaveURL(/\/vendors$/);
  }
}

test.describe('vendor duplicate-name warning', () => {
  // Sweep BEFORE the test too — guarantees a clean slate even if a
  // previous run crashed mid-test and never reached its own cleanup.
  test.beforeEach(async ({ page }) => {
    await cleanupTestVendors(page);
  });

  // Sweep AFTER the test regardless of pass/fail — this is the real
  // safety net. Playwright always runs afterEach even when the test
  // body throws partway through.
  test.afterEach(async ({ page }) => {
    await cleanupTestVendors(page);
  });

  test('duplicate-name warning: both branches work correctly', async ({ page }) => {
    const unique = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const baseName = `ZZZPWTest-Dup-${random}-${unique}`;
    const regA = `PW-DUP-A-${random}-${unique}`;
    const regB = `PW-DUP-B-${random}-${unique}`;

    // Step 1: create the "original" vendor
    await page.goto('/vendors/add');
    await page.getByLabel('Vendor name').fill(baseName);
    await page.getByLabel('Registration number').fill(regA);
    await page.getByLabel('Contact info').fill('playwright.test@example.com');
    await page.getByRole('button', { name: /add vendor/i }).click();
    await expect(page).toHaveURL(/\/vendors$/);

    // Step 2: attempt a same-named vendor — should trigger the warning
    await page.goto('/vendors/add');
    await page.getByLabel('Vendor name').fill(baseName);
    await page.getByLabel('Registration number').fill(regB);
    await page.getByLabel('Contact info').fill('playwright.test@example.com');
    await page.getByRole('button', { name: /add vendor/i }).click();

    await expect(page.getByText(/looks similar to an existing vendor/i)).toBeVisible();

    // Branch A: "Edit name" returns to the form without submitting
    await page.getByRole('button', { name: 'Edit name' }).click();
    await expect(page.getByLabel('Vendor name')).toBeVisible();
    await expect(page).toHaveURL(/\/vendors\/add$/);

    // Re-submit and this time proceed via "Add anyway"
    await page.getByRole('button', { name: /add vendor/i }).click();
    await expect(page.getByText(/looks similar to an existing vendor/i)).toBeVisible();
    await page.getByRole('button', { name: 'Add anyway' }).click();

    // Branch B: "Add anyway" actually creates the second vendor
    await expect(page).toHaveURL(/\/vendors$/);

    // No manual cleanup needed here anymore — afterEach handles it.
  });
});