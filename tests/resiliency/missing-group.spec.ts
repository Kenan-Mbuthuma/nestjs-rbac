import { test, expect } from '@playwright/test';

test('Redirects to /auth if token has no user group', async ({ page }) => {
  const tokenWithoutGroup = [
    'header',
    btoa(JSON.stringify({ email: "test@example.com" })), // no cognito:groups
    'signature'
  ].join('.');

  await page.addInitScript((token) => {
    localStorage.setItem('amplify-authenticator-cache', JSON.stringify({
      tokens: { idToken: token }
    }));
  }, tokenWithoutGroup);

  await page.goto('http://localhost:3000/dashboard');
  await expect(page).toHaveURL(/\/auth$/);
});
