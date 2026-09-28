import { test, expect } from '@playwright/test';

// Deliberately a single vendor and one real generate call — this test's job
// is proving the regenerate-confirm branch appears and genuinely blocks a
// second run, not re-proving the full lifecycle (already covered by
// report-lifecycle.spec.ts). Cancels instead of confirming regenerate, so
// this costs one real Gemini call, not two, and never overwrites the
// original content it's asserting against.
const VENDOR = 'Kilang Papan Utara Sdn Bhd';

test('regenerating a report with existing content shows a replace-confirmation, and Cancel truly aborts it', async ({ page }) => {
  test.setTimeout(180000);

  await page.goto('/reports/add');
  await page.locator('#periodType').selectOption('Quarterly');
  await page.locator('#quarterYear').selectOption('2026');
  await page.locator('#quarterNumber').selectOption('2');
  await page.getByRole('checkbox', { name: VENDOR }).check();
  await page.getByRole('button', { name: /Create Report/i }).click();

  await expect(page).toHaveURL(/\/reports\/\d+$/);

  // Auto-generation runs on first arrival (see report-lifecycle.spec.ts for
  // why this needs a generous timeout — a real Gemini call, with retry).
  await expect(page.getByRole('button', { name: /^Edit$/ })).toBeVisible({ timeout: 120000 });
  await expect(page.getByText('Not written yet')).toHaveCount(0);

  const referenceNumber = (await page.locator('h1').textContent())?.trim() ?? '';
  expect(referenceNumber).toMatch(/^VPR-/);

  const originalVendorSummary = await page
    .locator('h2', { hasText: 'Vendor Summary' })
    .locator('xpath=following-sibling::*[1]')
    .innerText();

  // Second, manual click on the same "Generate" button — this time sections
  // already have text, so requestGenerate() takes the confirm-first branch
  // instead of silently regenerating (the branch the auto-generate-on-first-
  // arrival path in report-lifecycle.spec.ts never exercises).
  await page.getByRole('button', { name: /^Re-generate$/ }).click();

  await expect(
    page.getByText(
      `Generate again for ${referenceNumber}? This replaces Vendor Summary, Delivery Performance, Pricing Analysis, and Order Accuracy.`
    )
  ).toBeVisible();

  // Confirm no silent regeneration has happened just from clicking Generate
  // once — the generating UI must NOT be showing yet, content must be intact.
  await expect(page.getByRole('status').filter({ hasText: /Gathering vendor data|Analyzing performance metrics|Writing your report|Finishing up/ })).toHaveCount(0);

  await page.getByRole('button', { name: /^Cancel$/ }).click();

  // Confirm panel is gone and original content survived untouched.
  await expect(page.getByText(/Generate again for/)).toHaveCount(0);
  const vendorSummaryAfterCancel = await page
    .locator('h2', { hasText: 'Vendor Summary' })
    .locator('xpath=following-sibling::*[1]')
    .innerText();
  expect(vendorSummaryAfterCancel).toBe(originalVendorSummary);

  // --- Cleanup: this report is still a Draft, so it can be deleted. ---
  await page.getByRole('button', { name: /^Delete$/ }).click();
  await page.getByRole('button', { name: /^Yes, delete$/ }).click();
  await expect(page).toHaveURL(/\/reports$/);
});
