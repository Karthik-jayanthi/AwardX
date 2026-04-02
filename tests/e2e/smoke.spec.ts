import { expect, test } from '@playwright/test';

test('marketing home renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AwardX/i);
  await expect(page.getByText('Get Started Free')).toBeVisible();
});
