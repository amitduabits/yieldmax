import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/YieldMax/);
});

test('can navigate to portfolio', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Portfolio');
  await expect(page).toHaveURL('/portfolio');
});
