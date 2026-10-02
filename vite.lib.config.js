import { copyFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// Everything the npm tarball needs that the bundler does not emit itself:
// the shadow-DOM stylesheet, the type declarations, and an `index.mjs` alias
// of the ESM build for tooling that expects that name.
function packageFiles() {
  return {
    name: 'geora-package-files',
    closeBundle() {
      const dist = path.join(rootDir, 'dist')
      mkdirSync(dist, { recursive: true })
      copyFileSync(path.join(rootDir, 'src', 'styles.css'), path.join(dist, 'styles.css'))
      copyFileSync(path.join(rootDir, 'src', 'index.d.ts'), path.join(dist, 'index.d.ts'))
      copyFileSync(path.join(dist, 'index.js'), path.join(dist, 'index.mjs'))
    },
  }
}

export default defineConfig({
  plugins: [packageFiles()],
  // the package tarball ships no demo assets: flags, fonts and photographs
  // belong to the consumer's public directory
  publicDir: false,
  build: {
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: fileURLToPath(new URL('./src/index.js', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      // rendering engine and projection stay dependencies of the consumer,
      // so several globes on one page share one copy of three.js
      external: ['three', 'd3-geo', 'topojson-client'],
    },
  },
})
