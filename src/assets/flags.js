// Flag artwork ships with the package.
//
// The beacons need an image URL per nation, resolved at runtime — so the
// bundler cannot rewrite a string we build ourselves. Instead every file is
// imported here at build time and the bundler emits it as a real asset with a
// URL that is correct for the consumer's `base`, whether that base is `/`, a
// sub-path deployment, a CDN, or an `import.meta.url` file URL.
//
// Consumers who want their own artwork pass `flagBase` and these are ignored.

const modules = import.meta.glob("./flags/*.png", {
  eager: true,
  query: "?url",
  import: "default",
})

// "us.png" -> url keyed "us", "us@2x.png" -> keyed "us@2x", so a lookup never
// touches the filesystem layout and the two densities cannot collide.
const byCode = new Map()
for (const [path, url] of Object.entries(modules)) {
  const file = path.slice(path.lastIndexOf("/") + 1)
  byCode.set(file.replace(/\.png$/, ""), url)
}

/** The bundled standard-density flag for an ISO alpha-2 code, or null. */
export function bundledFlag(iso2, retina = false) {
  const code = String(iso2 ?? "").toLowerCase()
  if (!code) return null
  return byCode.get(retina ? `${code}@2x` : code) ?? null
}

/** Every ISO alpha-2 code the bundled artwork covers, once. */
export function bundledFlagCodes() {
  return [...new Set([...byCode.keys()].map((k) => k.replace(/@2x$/, "")))].sort()
}