import { test, expect, type Page } from '@playwright/test';

// This is the highest-stakes spec in the suite: every successful run
// permanently FINALIZES a real report (no un-finalize path exists anywhere
// in the app — Delete only renders for Draft reports) and triggers one real
// Gemini API call (no dev/test mock switch exists for it). Accepted
// deliberately, not an oversight — see the report-lifecycle plan.
const VENDOR_1 = 'Syarikat Perkhidmatan Nadi Sdn Bhd';
const VENDOR_2 = 'Restoran Warisan Selera Sdn Bhd';

const SECTION_LABELS = [
  'Vendor Summary',
  'Delivery Performance',
  'Pricing Analysis',
  'Order Accuracy',
];

async function selectVendors(page: Page) {
  await page.getByRole('checkbox', { name: VENDOR_1 }).check();
  await page.getByRole('checkbox', { name: VENDOR_2 }).check();
}

async function submitAndWaitForGeneration(page: Page) {
  await page.getByRole('button', { name: /Create Report/i }).click();
  await expect(page).toHaveURL(/\/reports\/\d+$/);

  // Auto-generation triggers on arrival (AddReportForm sets a sessionStorage
  // flag; ReportEditor consumes it and calls handleGenerate() itself) — no
  // manual "Generate" click needed for this first run.
  await expect(page.getByRole('status').filter({ hasText: /Gathering vendor data|Analyzing performance metrics|Writing your report|Finishing up/ })).toBeVisible();

  // Real Gemini call with retry/backoff on rate-limit/unavailable errors. A
  // manual dry run hit a real 503 that the app's own retry logic absorbed,
  // but the whole round trip (503 -> backoff -> retry -> success) still took
  // ~41s — 60s was too tight a margin, so this is deliberately generous.
  await expect(page.getByRole('button', { name: /^Edit$/ })).toBeVisible({ timeout: 120000 });

  // The same dry run also surfaced a real, reproducible-looking anomaly: one
  // run where the Edit button appeared (busy cleared, i.e. the route
  // "succeeded") but every section still read "Not written yet" and Metrics
  // showed "No metrics yet" — confirmed NOT a data problem (both vendors
  // have 6 real Q3 2026 transactions each). Root cause wasn't tracked down
  // further per the user's steer to stop running this live and just hand
  // over the file. Asserting real content landed here, right after
  // generation, so if this recurs the test fails clearly at this step with
  // an obvious message instead of a confusing downstream Finalize-button
  // timeout.
  await expect(page.getByText('Not written yet')).toHaveCount(0);
}

async function editOneSectionAndSave(page: Page) {
  await page.getByRole('button', { name: /^Edit$/ }).click();
  const vendorSummaryField = page.getByLabel(SECTION_LABELS[0]);
  const existing = await vendorSummaryField.inputValue();
  await vendorSummaryField.fill(`${existing}\n\n(Edited by Playwright report-lifecycle test.)`);
  await page.getByRole('button', { name: /^Save$/ }).click();
  await expect(page.getByRole('button', { name: /^Edit$/ })).toBeVisible({ timeout: 15000 });
}

async function finalizeReport(page: Page, referenceNumber: string, periodStart: string, periodEnd: string) {
  await page.getByRole('button', { name: /^Finalize$/ }).click();

  // Exact text, not a paraphrase — this is the app's one explicit
  // irreversibility warning to the user, worth pinning precisely.
  await expect(
    page.getByText(
      `Finalize ${referenceNumber}? This report covers ${periodStart} to ${periodEnd}. After you finalize, it cannot be edited or deleted.`
    )
  ).toBeVisible();

  await page.getByRole('button', { name: /^Finalize report$/ }).click();
  await expect(page.getByText('Finalized', { exact: true })).toBeVisible({ timeout: 15000 });

  // Structural disappearance, not just disabled — Edit/Delete/Generate all
  // live inside the same isDraft-gated block, which stops rendering once
  // the report is no longer a Draft.
  await expect(page.getByRole('button', { name: /^Edit$/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Delete$/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Generate$/ })).toHaveCount(0);
}

async function exportPdfAndVerifyDownload(page: Page, referenceNumber: string) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export PDF/i }).click(),
  ]);

  expect(download.suggestedFilename()).toBe(`${referenceNumber}.pdf`);
  const filePath = await download.path();
  expect(filePath).not.toBeNull();
  const fs = await import('fs');
  const stats = fs.statSync(filePath!);
  expect(stats.size).toBeGreaterThan(0);
}

test('report full lifecycle — Quarterly period (Q3 2026)', async ({ page }) => {
  test.setTimeout(240000);

  await page.goto('/reports/add');
  await page.locator('#periodType').selectOption('Quarterly');
  await page.locator('#quarterYear').selectOption('2026');
  await page.locator('#quarterNumber').selectOption('3');
  await selectVendors(page);

  await submitAndWaitForGeneration(page);

  const referenceNumber = (await page.locator('h1').textContent())?.trim() ?? '';
  expect(referenceNumber).toMatch(/^VPR-/);

  await editOneSectionAndSave(page);
  await finalizeReport(page, referenceNumber, '2026-07-01', '2026-09-30');
  await exportPdfAndVerifyDownload(page, referenceNumber);
});

test('report full lifecycle — Custom period (2026-01-01 to 2026-03-31)', async ({ page }) => {
  test.setTimeout(240000);

  await page.goto('/reports/add');
  await page.locator('#periodType').selectOption('Custom');
  await page.locator('#customStartDate').fill('2026-01-01');
  await page.locator('#customEndDate').fill('2026-03-31');
  await selectVendors(page);

  await submitAndWaitForGeneration(page);

  const referenceNumber = (await page.locator('h1').textContent())?.trim() ?? '';
  expect(referenceNumber).toMatch(/^VPR-/);

  await editOneSectionAndSave(page);
  await finalizeReport(page, referenceNumber, '2026-01-01', '2026-03-31');
  await exportPdfAndVerifyDownload(page, referenceNumber);
});
