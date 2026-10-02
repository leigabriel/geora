import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// The demo lives in demo/ and consumes the package exactly like an external
// consumer: the `geora-globe` specifier is aliased to the package entry so
// nothing in demo/ reaches into internal source files.
export default defineConfig({
  root: 'demo',
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      'geora-globe': fileURLToPath(new URL('./src/index.js', import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./demo-dist', import.meta.url)),
    emptyOutDir: true,
  },
})
