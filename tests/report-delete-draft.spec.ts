import { test, expect } from '@playwright/test';

// Delete only needs the report to be a Draft — it doesn't require generated
// content, but Edit/Delete are hidden entirely while busy === 'generating'
// (the whole layout swaps to the generating-only view), and auto-generation
// always fires on arrival regardless of what this test cares about. So one
// real Gemini call is unavoidable here too, purely to get back to the normal
// Draft view where Delete is clickable — same cost as report-regenerate-
// confirm.spec.ts, for the same structural reason.
const VENDOR = 'Gamuda Berhad';

test('deleting a Draft report redirects to the reports list', async ({ page }) => {
  test.setTimeout(150000);

  await page.goto('/reports/add');
  await page.locator('#periodType').selectOption('Quarterly');
  await page.locator('#quarterYear').selectOption('2026');
  await page.locator('#quarterNumber').selectOption('1');
  await page.getByRole('checkbox', { name: VENDOR }).check();
  await page.getByRole('button', { name: /Create Report/i }).click();

  await expect(page).toHaveURL(/\/reports\/\d+$/);

  // Wait for the generating pass to finish (success or failure both clear
  // `busy`, which is all this test needs — see the note above).
  await expect(page.getByRole('button', { name: /^Delete$/ })).toBeVisible({ timeout: 120000 });

  await page.getByRole('button', { name: /^Delete$/ }).click();
  await expect(page.getByText("Delete this report? This can't be undone.")).toBeVisible();

  await page.getByRole('button', { name: /^Yes, delete$/ }).click();

  // Contrast with Finalize (report-lifecycle.spec.ts), which stays in place
  // after succeeding — Delete is the one action here that actually navigates.
  await expect(page).toHaveURL(/\/reports$/);
});
