// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests', // ✅ Only run tests in the tests/ folder
  timeout: 30 * 1000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
})
