// Caches the runtime assets the demo needs so it runs with no network access:
// the UI fonts. Flags now live in the package (src/assets/flags) and are
// re-fetched with `npm run assets` after changing the nation list in
// src/data/countries.js.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
// One css2 request per family; each needs a browser UA to return woff2 URLs.
// The demo bundles these from its own source tree so a build served from a
// sub-path resolves them.
const FONTS = [
  ['JetBrains+Mono:wght@400;500;600;700', 'demo/src/fonts/jetbrains-mono-latin.woff2'],
  ['Geist+Pixel', 'demo/src/fonts/geist-pixel.woff2'],
]
const FLAG_SIZES = [
  ['https://flagcdn.com/w40/{code}.png', 'src/assets/flags'],
  ['https://flagcdn.com/w160/{code}.png', 'src/assets/flags'],
]

async function save(url, target, headers = {}) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const body = Buffer.from(await res.arrayBuffer())
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, body)
  return body.byteLength
}

async function cacheFonts() {
  for (const [family, file] of FONTS) {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&display=swap`, { headers: { 'User-Agent': CHROME_UA } })).text()
    // Google returns one @font-face per subset; geora only ships the latin one.
    const block = css.split('@font-face').find((part) => part.includes('U+0000-00FF'))
    const url = block?.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
    if (!url) throw new Error(`could not resolve the ${family} latin subset`)
    const bytes = await save(url, path.join(root, file), { 'User-Agent': CHROME_UA })
    console.log(`font   ${file} ${(bytes / 1024).toFixed(1)} kB`)
  }
}

async function cacheFlags() {
  const source = await readFile(path.join(root, 'src/data/countries.js'), 'utf8')
  const codes = [...new Set([...source.matchAll(/iso2:\s*"([a-z]{2})"/g)].map((match) => match[1]))]
  let bytes = 0
  for (const code of codes) {
    for (const [template, folder] of FLAG_SIZES) {
      const name = template.includes('/w160/') ? `${code}@2x.png` : `${code}.png`
      bytes += await save(template.replace('{code}', code), path.join(root, folder, name))
    }
  }
  console.log(`flags  ${codes.length} nations ${(bytes / 1024).toFixed(1)} kB`)
}

await cacheFonts()
await cacheFlags()
console.log('assets cached')