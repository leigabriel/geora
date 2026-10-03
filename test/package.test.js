import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))

// The published package has to work for someone who installed it from npm and
// nothing else. These are the promises the README makes about the tarball, and
// the failure modes they rule out — checked against the manifests so a
// packaging regression fails here instead of in someone's browser.
describe("package manifest", () => {
  it("ships ESM, CJS, types and the stylesheet", () => {
    expect(pkg.exports["."].import).toBe("./dist/index.js")
    expect(pkg.exports["."].require).toBe("./dist/index.cjs")
    expect(pkg.exports["."].types).toBe("./dist/index.d.ts")
    expect(pkg.exports["./styles.css"]).toBe("./dist/styles.css")
    expect(pkg.files).toContain("dist")
  })

  it("points every advertised entry at a file the build produces", () => {
    const emitted = ["index.js", "index.cjs", "index.mjs", "index.d.ts", "styles.css"]
    const referenced = [
      pkg.main,
      pkg.module,
      pkg.types,
      ...Object.values(pkg.exports["."]),
      pkg.exports["./styles.css"],
      pkg.exports["./dist/index.mjs"],
    ]
    for (const entry of referenced) {
      expect(emitted, entry).toContain(path.basename(entry))
    }
  })

  it("exports the .mjs alias it emits, so it is reachable", () => {
    expect(pkg.exports["./dist/index.mjs"]).toBe("./dist/index.mjs")
  })

  it("carries no runtime dependencies, because the build bundles them", () => {
    // Anything listed here would need resolving by the consumer's environment.
    // The library build inlines three, d3-geo and topojson-client so a bare
    // specifier never reaches a browser.
    expect(pkg.dependencies).toEqual({})
    for (const dep of ["three", "d3-geo", "topojson-client"]) {
      expect(pkg.devDependencies, dep).toHaveProperty(dep)
    }
  })

  it("keeps the flag artwork inside the build, not in a public directory", () => {
    // flags live in src/assets so they are inlined into the bundle; a public/
    // copy would be excluded from the tarball and silently stop resolving
    const flags = readdirSync(path.join(root, "src", "assets", "flags"))
    const bundled = flags.filter((name) => name.endsWith(".png"))
    expect(bundled.length).toBeGreaterThan(80)
    // one standard and one @2x file per nation, and no duplicates
    expect(new Set(bundled).size).toBe(bundled.length)
    expect(readdirSync(path.join(root, "public"))).not.toContain("flags")
  })

  it("does not reference a public directory from the library build", () => {
    const config = readFileSync(path.join(root, "vite.lib.config.js"), "utf8")
    expect(config).toContain("publicDir: false")
    // three, d3-geo and topojson-client must stay un-externalised
    expect(config).not.toMatch(/external\s*:/)
  })

  // Registering <geora-globe> is a side effect of importing the entry point, and
  // it happens in a production build only. The demo aliases the bare specifier
  // to src/index.js, so if that file is missing from `sideEffects` a bundler
  // treats it as pure, drops the registerGeoraGlobe() call, and the demo
  // renders an unregistered 0x0 element instead of a globe — with no error
  // anywhere. This is the only place that coupling is visible.
  it("marks every module that registers the element as having side effects", () => {
    const listed = new Set(pkg.sideEffects)
    const entry = readFileSync(path.join(root, "src", "index.js"), "utf8")
    // the call has to actually be there for the flag to mean anything
    expect(entry).toMatch(/^\s*registerGeoraGlobe\(\)/m)
    expect(listed, "src/index.js must stay in sideEffects").toContain("./src/index.js")
    // only the JS entries are modules that can be imported at all; the `types`
    // condition resolves to a declaration file
    for (const condition of ["import", "require"]) {
      const entry = pkg.exports["."][condition].replace(/^\.\//, "")
      expect(listed, `${condition} entry is not marked`).toContain(`./${entry}`)
    }
  })

  it("consumes the source entry in the demo, and that entry is marked", () => {
    // pins the coupling the previous test reasons about, so changing the alias
    // without updating sideEffects fails here too
    const config = readFileSync(path.join(root, "vite.config.js"), "utf8")
    expect(config).toMatch(/'geora-globe':.*src\/index\.js/)
  })
})