import { test, expect } from '@playwright/test';

test('Redirects to /auth when fetchAuthSession fails on admin page', async ({ page }) => {
  // Intercept and abort all network requests that fetch the session/token
  await page.route('**/amplify-auth/user**', route => route.abort());
  await page.route('**/amplify/**', route => route.abort()); // general fail-safe

  await page.goto('http://localhost:3000/admin');

  // ✅ Expect graceful fallback (e.g., redirect to /auth)
  await expect(page).toHaveURL(/\/auth$/);
});
