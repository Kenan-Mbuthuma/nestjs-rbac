import { test, expect } from '@playwright/test';

test('Redirects to /auth if fetchAuthSession is slow/unavailable', async ({ page }) => {
  await page.route('**/amplify/**', async route => {
    await new Promise(res => setTimeout(res, 5000)); // simulate hang
    route.abort(); // simulate failure
  });

  await page.goto('http://localhost:3000/admin');
  await expect(page).toHaveURL(/\/auth$/);
});
