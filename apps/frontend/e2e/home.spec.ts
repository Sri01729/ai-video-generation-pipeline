import { test, expect } from '@playwright/test';

test('home page loads and shows heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toBeVisible();
});