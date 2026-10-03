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
  // the package ships no photographs: landmark images are the consumer's to
  // supply. Flag artwork is bundled from src/assets.
  publicDir: false,
  build: {
    target: 'es2022',
    sourcemap: true,
    // Flag artwork is inlined as data URIs on purpose. An emitted file would
    // need a URL that is correct for every consumer's deploy base, and lib
    // builds resolve those against `/`; inlining removes the whole question
    // (no request, no base path, no CORS, works from file:// and a CDN) for
    // about 57 kB.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    lib: {
      entry: fileURLToPath(new URL('./src/index.js', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    // three, d3-geo and topojson-client are bundled on purpose. Leaving them
    // external emits bare `import "three"`, which a browser cannot resolve
    // without a bundler — and the chain is transitive (d3-geo pulls d3-array
    // and internmap), so an import map would have to mirror the whole tree.
    // Bundling makes one file work from a plain <script type="module">, an
    // import map, a CDN, or any bundler, with nothing installed alongside it.
    rollupOptions: {},
  },
})
