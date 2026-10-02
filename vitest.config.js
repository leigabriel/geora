import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Tests import the package through its public specifier, exactly like a
// consumer would: `geora-globe` resolves to the package entry.
export default defineConfig({
  resolve: {
    alias: {
      'geora-globe': fileURLToPath(new URL('./src/index.js', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
  },
})
