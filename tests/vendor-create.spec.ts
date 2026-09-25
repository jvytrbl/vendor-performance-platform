import { test, expect } from '@playwright/test';

test('create a vendor and confirm it appears in the list', async ({ page }) => {
  const unique = Date.now();
  const vendorName = `ZZZPWTest${unique}`; // unique per run, avoids collisions even with cleanup in place — good safety net
  const registrationNumber = `PW-${unique}`; // registration_number is unique-constrained, so this must vary per run too

  await page.goto('/vendors/add');
  await page.getByLabel('Vendor name').fill(vendorName);
  await page.getByLabel('Registration number').fill(registrationNumber);
  await page.getByLabel('Contact info').fill('playwright.test@example.com');
  await page.getByRole('button', { name: /add vendor/i }).click();

  await expect(page).toHaveURL(/\/vendors$/);
  await expect(page.getByText(vendorName)).toBeVisible();

  // --- Cleanup: delete the vendor we just created ---
  await page.getByRole('link', { name: vendorName }).click();
  await page.getByRole('button', { name: 'Delete' }).click(); // opens the confirm popover
  await page.getByRole('button', { name: 'Yes, delete' }).click();

  await expect(page).toHaveURL(/\/vendors$/);
  await expect(page.getByText(vendorName)).not.toBeVisible();
});

