import { test, expect } from '@playwright/test';

test('Dashboard handles 500 API response gracefully', async ({ page }) => {
  await page.route('**/api/**', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: "Internal Server Error" })
    });
  });

  await page.goto('http://localhost:3000/dashboard');
  await page.getByRole('button', { name: /Test PayFast Payment/i }).click();

  await expect(page.getByTestId('retry-ui')).toBeVisible();
});
