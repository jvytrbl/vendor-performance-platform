import path from 'path';
import { test, expect } from '@playwright/test';

// Real fixture, not synthesized: excel-test-files/03_mixed_valid_invalid_rows.csv,
// a genuine deliberately-mixed file already built from the project's own edge
// cases (FR-SH-010, per-row skip and report). Its own excel-test-files/README.md
// claims a 4-valid/4-invalid split, but that turned out to be stale/wrong —
// confirmed against a real run instead of trusted at face value: the file's
// row 6 (Gamuda Land, Fencing installation) has agreed_delivery_date before
// transaction_date, a 5th failure the README never mentions, and its
// "nonexistent vendor" row fails by vendor NAME ("Zenith Logistics Sdn Bhd"
// isn't in the current vendor list), not the ID-999 framing the README
// implies. Real, confirmed result: 3 inserted, 5 failed.
const MIXED_FILE = path.resolve(__dirname, '../excel-test-files/03_mixed_valid_invalid_rows.csv');

test('bulk upload with a mixed valid/invalid file shows a correct partial-commit summary', async ({ page }) => {
  await page.goto('/transactions/bulk-upload');

  await page.getByLabel('CSV or Excel file').setInputFiles(MIXED_FILE);
  await page.getByRole('button', { name: /upload/i }).click();

  // No preview/confirm step — this is a single-shot POST (see BulkUploadForm.tsx),
  // so the next visible state is the post-upload summary itself.
  await expect(page.getByText('3 inserted')).toBeVisible();
  await expect(page.getByText('5 failed')).toBeVisible();

  // Per-row error table only renders when summary.errors.length > 0.
  const errorRows = page.locator('table tbody tr');
  await expect(errorRows).toHaveCount(5);

  await expect(page.getByRole('row', { name: /^3 item_description/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /^4 vendor_name/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /^5 agreed_price/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /^6 agreed_delivery_date/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /^8 transaction_date/ })).toBeVisible();
});
