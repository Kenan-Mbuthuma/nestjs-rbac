import { test, expect } from '@playwright/test';

test('OrgUser can access dashboard content', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await expect(page.getByText('Welcome to the company dashboard!')).toBeVisible();
});

test('Retry button appears after API failure', async ({ page }) => {
  await page.route('**/api/**', route => route.abort()); // fail the API

  await page.goto('http://localhost:3000/dashboard');
  await page.getByRole('button', { name: /Test PayFast Payment/i }).click();
  await expect(page.getByTestId('retry-ui')).toBeVisible();
});

test('Retry button re-attempts API call', async ({ page }) => {
  let attempt = 0;

  await page.route('**/api/**', (route) => {
    attempt++;
    if (attempt === 1) {
      return route.abort(); // fail first
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ payment_url: 'https://mockpay.com' }),
    });
  });

  await page.goto('http://localhost:3000/dashboard');
  await page.getByRole('button', { name: /Test PayFast Payment/i }).click();
  await expect(page.getByTestId('retry-ui')).toBeVisible();
  await page.getByRole('button', { name: 'Retry' }).click(); // re-trigger
});
