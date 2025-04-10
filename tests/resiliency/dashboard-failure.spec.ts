import { test, expect } from '@playwright/test';

test('Dashboard handles API failure gracefully', async ({ page }) => {
  await page.route('**/api/**', route => route.abort()); // simulate API failure

  await page.goto('http://localhost:3000/dashboard');
  await page.getByRole('button', { name: /Test PayFast Payment/i }).click(); // trigger failure

  await expect(page.getByTestId('retry-ui')).toBeVisible(); // assert UI recovery
});
