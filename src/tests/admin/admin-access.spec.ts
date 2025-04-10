import { test, expect } from '@playwright/test';

test('SystemAdmin can see the user list', async ({ page }) => {
  await page.goto('http://localhost:3000/admin?mockRole=SystemAdmin');

  await expect(page.getByText('System Admin Dashboard')).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
});
