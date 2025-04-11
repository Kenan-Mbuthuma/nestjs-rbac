import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true, // ✅ lets you use `test`, `expect`, etc. without importing
    setupFiles: './vitest.setup.ts', // ✅ points to your setup file
    include: ['src/__unit__/**/*.test.ts?(x)'],
    exclude: [
        'tests/**', // 👈 Ignore Playwright tests
        '.github/**', // 👈 Ignore GitHub Action tests
        'node_modules/**',
        'dist/**',
      ],
  },
})
