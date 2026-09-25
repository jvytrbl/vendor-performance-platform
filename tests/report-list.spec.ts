import { test, expect } from '@playwright/test';

test('reports list loads for an authenticated user', async ({ page }) => {
  await page.goto('/reports');

  await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
  await expect(page.getByRole('link', { name: /new report/i })).toBeVisible();
});