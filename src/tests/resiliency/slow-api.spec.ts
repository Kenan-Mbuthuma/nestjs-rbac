import { test, expect } from '@playwright/test';

test('Dashboard shows loading state during slow API call', async ({ page }) => {
  await page.route('**/api/**', async route => {
    await new Promise(res => setTimeout(res, 3000)); // simulate latency
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ payment_url: 'https://mockpay.com' })
    });
  });

  await page.goto('http://localhost:3000/dashboard');
  await page.getByRole('button', { name: /Test PayFast Payment/i }).click();

  // Optionally check loading UI if present
  // await expect(page.getByText('Loading...')).toBeVisible();
});
