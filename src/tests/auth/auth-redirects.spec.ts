import { test, expect } from '@playwright/test';

test('Redirects unauthenticated user from dashboard', async ({ page }) => {
  await page.route('**/auth/user', route => route.abort());
  await page.goto('http://localhost:3000/dashboard');
  await expect(page).toHaveURL(/\/auth$/);
});

test('Redirects non-SystemAdmin from admin page', async ({ page }) => {
  await page.goto('http://localhost:3000/admin?mockRole=OrgUser');
  await expect(page).toHaveURL(/\/auth$/); // ✅ redirected because OrgUser is unauthorized
});
