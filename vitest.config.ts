import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/cli/__tests__/**/*.test.ts'],
    globals: false,
  },
})
