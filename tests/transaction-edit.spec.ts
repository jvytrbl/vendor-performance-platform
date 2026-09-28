import { test, expect, type Page } from '@playwright/test';

// Same past-date rationale as transaction-create.spec.ts: transaction_date
// can never be in the future (validateTransactionInput.ts), and a
// current-quarter date risks landing inside an already-finalized report's
// period (locks the row from ever being deleted). A year back avoids both.
const MONTHS_AGO = 12;

function pastIsoDate(monthsAgo: number, day: number): string {
  const now = new Date();
  const total = now.getMonth() - monthsAgo;
  const year = now.getFullYear() + Math.floor(total / 12);
  const month = (((total % 12) + 12) % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// A fixed-count click loop here assumes a fixed starting month and that
// every click reliably registers before the next fires — neither held up
// in a real run (calendar got stuck mid-navigation, clicks piling up on a
// popover that had already re-rendered). Poll the calendar's own displayed
// month/year instead (a role="status" caption, e.g. "February 2026") and
// only click "Previous Month" when it doesn't yet match, re-querying both
// the caption and the button fresh on every attempt so neither can go stale.
async function pickPastDate(page: Page, fieldId: string, day: number) {
  await page.locator(`#${fieldId}`).click();

  const target = pastIsoDate(MONTHS_AGO, day);
  const [targetYear, targetMonth] = target.split('-').map(Number);
  const targetLabel = new Date(targetYear, targetMonth - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  await expect(async () => {
    const currentLabel = (await page.locator('.rdp-caption_label').textContent())?.trim();
    if (currentLabel === targetLabel) return;
    await page.getByRole('button', { name: 'Go to the Previous Month' }).click();
    throw new Error(`calendar on "${currentLabel}", waiting for "${targetLabel}"`);
  }).toPass({ timeout: 45000 });

  await page.locator(`td[data-day="${target}"] button`).click();
}

test('editing a transaction redirects to the list and shows the updated value', async ({ page }) => {
  // Two poll-based date pickers (up to 45s each) plus form-filling,
  // navigation, and cleanup easily exceed Playwright's default 30s budget.
  test.setTimeout(120000);

  const unique = Date.now();
  const originalDescription = `Playwright Edit Test (original) ${unique}`;
  const updatedDescription = `Playwright Edit Test (updated) ${unique}`;
  const transactionDay = 5;
  const filterDate = pastIsoDate(MONTHS_AGO, transactionDay);

  // --- Setup: create a transaction to edit (reuses the create form, already
  // proven in transaction-create.spec.ts) ---
  await page.goto('/transactions/add');
  await page.getByRole('combobox', { name: 'Vendor' }).click();
  await page.getByPlaceholder('Search vendors…').fill('Gamuda Berhad');
  await page.getByRole('option', { name: 'Gamuda Berhad' }).click();
  await page.getByLabel('Item description').fill(originalDescription);
  await pickPastDate(page, 'transaction_date', transactionDay);
  await page.getByLabel('Agreed price (RM)').fill('1000');
  await pickPastDate(page, 'agreed_delivery_date', 10);
  await page.getByLabel('Quantity ordered').fill('10');
  await page.getByRole('button', { name: /add transaction/i }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  // Narrow the newest-first, seed-data-heavy list down to just this one date
  // (see transaction-create.spec.ts) so the new row is findable at all.
  await page.locator('#dateFrom').fill(filterDate);
  await page.locator('#dateTo').fill(filterDate);
  await expect(page.getByText(originalDescription)).toBeVisible();

  // --- The actual test: navigate to detail, then Edit ---
  await page.getByText(originalDescription).click();
  await expect(page).toHaveURL(/\/transactions\/\d+$/);

  await page.getByRole('link', { name: /^Edit$/ }).click();
  await expect(page).toHaveURL(/\/transactions\/\d+\/edit$/);

  // EditTransactionForm.tsx uses a plain <input>, unlike the Add form's
  // combobox/calendar-popup fields — a direct fill, no special handling.
  await page.locator('#item_description').fill(updatedDescription);
  await page.getByRole('button', { name: /^Save changes$/ }).click();

  await expect(page).toHaveURL(/\/transactions$/);

  // Re-apply the date filter (a fresh navigation to /transactions resets it)
  // and confirm the list reflects the edit, not the original value.
  await page.locator('#dateFrom').fill(filterDate);
  await page.locator('#dateTo').fill(filterDate);
  await expect(page.getByText(updatedDescription)).toBeVisible();
  await expect(page.getByText(originalDescription)).not.toBeVisible();

  // --- Cleanup ---
  await page.getByText(updatedDescription).click();
  await expect(page).toHaveURL(/\/transactions\/\d+$/);
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();

  // Same finalized-report-lock tolerance as transaction-create.spec.ts.
  const deleted = page.waitForURL(/\/transactions$/, { timeout: 5000 }).then(() => true as const);
  const locked = page
    .getByText(/cannot be deleted because it is part of finalized report/i)
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => false as const);

  const wasDeleted = await Promise.race([deleted, locked]).catch(() => null);

  if (wasDeleted) {
    await expect(page.getByText(updatedDescription)).not.toBeVisible();
  } else {
    test.info().annotations.push({
      type: 'known-limitation',
      description:
        `Cleanup could not delete "${updatedDescription}" — it landed inside an already-finalized report's period, which locks it permanently by design. Leftover test data remains in the DB; this does not indicate a test failure.`,
    });
  }
});
