import { test, expect } from '@playwright/test';

test('delete confirm popover blocks deletion until confirmed', async ({ page }) => {
  const unique = Date.now();
  const vendorName = `ZZZPWTest-Delete-${unique}`;
  const registrationNumber = `PW-DEL-${unique}`;

  // Setup: create a vendor to test deletion against
  await page.goto('/vendors/add');
  await page.getByLabel('Vendor name').fill(vendorName);
  await page.getByLabel('Registration number').fill(registrationNumber);
  await page.getByLabel('Contact info').fill('playwright.test@example.com');
  await page.getByRole('button', { name: /add vendor/i }).click();
  await expect(page).toHaveURL(/\/vendors$/);

  // Navigate to the vendor's detail page
  await page.getByRole('link', { name: vendorName }).click();

  // Open the confirm popover, then CANCEL — vendor must survive
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();

  // Confirm we're still here and the vendor still exists (reload to be sure
  // it's not just leftover UI state — this forces a real re-fetch from the DB)
  await page.reload();
  await expect(page.getByText(vendorName)).toBeVisible();

  // Now actually delete it for real — also serves as this test's own cleanup
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();

  await expect(page).toHaveURL(/\/vendors$/);
  await expect(page.getByText(vendorName)).not.toBeVisible();
});