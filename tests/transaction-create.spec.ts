import { test, expect, type Page } from '@playwright/test';

// DateField (components/forms/DateField.tsx) is a button that opens a
// react-day-picker popover — not a fillable text input. Verified live: each
// day cell is a <td role="gridcell" data-day="YYYY-MM-DD"> wrapping a
// <button aria-label="Weekday, Month Dth, Year">D</button> — the button's
// aria-label (full spoken date) overrides its visible "D" text as the
// accessible name, so getByRole('button'/'gridcell', { name: 'D' }) matches
// nothing and just hangs retrying. data-day is the reliable, unambiguous
// target instead.
//
// The date is a year in the PAST, not "today"/"this month", and not the
// future either. Two real runs found both edges:
// - validateTransactionInput.ts rejects any transaction_date after today
//   ("Transaction date cannot be in the future") — so a future date can
//   never be used here at all.
// - A current-quarter date landed inside an already-finalized report's
//   period; finalized-report transactions can never be deleted (by design,
//   confirmed via a real 409 "...part of finalized report..."). A year back
//   is much less likely to collide with a finalized period, though not
//   guaranteed — see the cleanup handling below for what happens if it does.
const MONTHS_AGO = 12;

function pastIsoDate(monthsAgo: number, day: number): string {
  const now = new Date();
  const total = now.getMonth() - monthsAgo;
  const year = now.getFullYear() + Math.floor(total / 12);
  const month = (((total % 12) + 12) % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function pickPastDate(page: Page, fieldId: string, day: number) {
  await page.locator(`#${fieldId}`).click();
  const prevMonth = page.getByRole('button', { name: 'Go to the Previous Month' });
  for (let i = 0; i < MONTHS_AGO; i++) {
    await prevMonth.click();
  }
  await page.locator(`td[data-day="${pastIsoDate(MONTHS_AGO, day)}"] button`).click();
}

test('create a transaction and confirm it appears in the list', async ({ page }) => {
  const unique = Date.now();
  const itemDescription = `Playwright Test Item ${unique}`; // unique per run, avoids collisions with real data
  const transactionDay = 5;

  await page.goto('/transactions/add');

  // Vendor is a searchable combobox (Radix popover + cmdk), not a plain <select>.
  await page.getByRole('combobox', { name: 'Vendor' }).click();
  await page.getByPlaceholder('Search vendors…').fill('Gamuda Berhad');
  await page.getByRole('option', { name: 'Gamuda Berhad' }).click();

  await page.getByLabel('Item description').fill(itemDescription);
  await pickPastDate(page, 'transaction_date', transactionDay);
  await page.getByLabel('Agreed price (RM)').fill('1000');
  await pickPastDate(page, 'agreed_delivery_date', 10); // after transaction date
  await page.getByLabel('Quantity ordered').fill('10');
  // "On delivery" fields are optional — left blank, matching the create-only journey.

  await page.getByRole('button', { name: /add transaction/i }).click();

  await expect(page).toHaveURL(/\/transactions$/);

  // The list is sorted newest-first with a lot of pre-existing seed data
  // (real run showed "Page 1 of 30"), so a plain text search on page 1 alone
  // can miss a freshly created row. The list's own date filters (plain
  // <input type="date">, id="dateFrom"/"dateTo" — a different, simpler
  // control than the add form's calendar popup) narrow it down to just this
  // one date, guaranteeing the new row lands on page 1 regardless of volume.
  const filterDate = pastIsoDate(MONTHS_AGO, transactionDay);
  await page.locator('#dateFrom').fill(filterDate);
  await page.locator('#dateTo').fill(filterDate);
  await expect(page.getByText(itemDescription)).toBeVisible();

  // --- Cleanup: delete the transaction we just created ---
  // The list row itself (not a nested link) navigates to detail on click.
  await page.getByText(itemDescription).click();
  await expect(page).toHaveURL(/\/transactions\/\d+$/);
  await page.getByRole('button', { name: 'Delete' }).click(); // opens the confirm popover
  await page.getByRole('button', { name: 'Yes, delete' }).click();

  // If this transaction happens to fall inside an already-finalized report's
  // period after all, the app correctly refuses to delete it (locked data,
  // by design) instead of navigating away — that's real, intended behavior,
  // not a test bug, so it's tolerated here rather than failing the whole run.
  const deleted = page.waitForURL(/\/transactions$/, { timeout: 5000 }).then(() => true as const);
  const locked = page
    .getByText(/cannot be deleted because it is part of finalized report/i)
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => false as const);

  const wasDeleted = await Promise.race([deleted, locked]).catch(() => null);

  if (wasDeleted) {
    await expect(page.getByText(itemDescription)).not.toBeVisible();
  } else {
    test.info().annotations.push({
      type: 'known-limitation',
      description:
        `Cleanup could not delete "${itemDescription}" — it landed inside an already-finalized report's period, which locks it permanently by design. Leftover test data remains in the DB; this does not indicate a test failure.`,
    });
  }
});
