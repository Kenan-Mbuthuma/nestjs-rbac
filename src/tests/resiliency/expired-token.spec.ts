import { test, expect } from '@playwright/test';

test('Redirects to /auth when token is expired', async ({ page }) => {
  const expiredToken = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    btoa(JSON.stringify({
      "cognito:groups": ["OrgUser"],
      "exp": Math.floor(Date.now() / 1000) - 1000 // expired token
    })),
    'signature'
  ].join('.');

  await page.addInitScript((token) => {
    localStorage.setItem('amplify-authenticator-cache', JSON.stringify({
      tokens: { idToken: token }
    }));
  }, expiredToken);

  await page.goto('http://localhost:3000/dashboard');
  await expect(page).toHaveURL(/\/auth$/);
});
