import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { GeoraGlobe } from "geora-globe"
import { sceneFactory, stubMatchMedia } from "./helpers.js"

// <geora-globe> owns a GeoraGlobe which owns a scene. Swapping the scene for a
// recording stub lets mount/unmount cycles be counted without WebGL: what has
// to hold is that every cycle builds one scene and leaves it disposed.
vi.mock("../src/core/GlobeScene.js", async () => {
  const { makeScene } = await import("./helpers.js")
  const scenes = []
  return {
    __scenes: scenes,
    createGlobeScene(args) {
      const scene = makeScene()
      scene.args = args
      scenes.push(scene)
      return scene
    },
  }
})

import { __scenes } from "../src/core/GlobeScene.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const read = (name) => readFileSync(path.join(root, "src", "core", name), "utf8")

// The body of the first declaration whose header matches, brace-matched, so a
// teardown contract can be asserted against what the code actually releases
// rather than against what a comment claims.
function bodyOf(source, header) {
  const at = source.indexOf(header)
  if (at < 0) return ""
  const open = source.indexOf("{", at)
  let depth = 0
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1
    else if (source[i] === "}") {
      depth -= 1
      if (depth === 0) return source.slice(open, i + 1)
    }
  }
  return ""
}

function mount() {
  const el = document.createElement("geora-globe")
  document.body.appendChild(el)
  return el
}

const liveRegion = (el) => el.shadowRoot.querySelector("[data-live]")

let originalMatchMedia = null

beforeEach(() => {
  __scenes.length = 0
  originalMatchMedia = window.matchMedia
})

afterEach(() => {
  document.body.replaceChildren()
  window.matchMedia = originalMatchMedia
})

describe("repeated mount and unmount cycles", () => {
  it("builds one scene per cycle and disposes each of them", () => {
    const cycles = 8
    for (let i = 0; i < cycles; i += 1) {
      const el = mount()
      expect(__scenes).toHaveLength(i + 1)
      expect(__scenes[i].called("dispose")).toBe(false)

      el.remove()
      expect(__scenes[i].count("dispose")).toBe(1)
    }
    expect(__scenes).toHaveLength(cycles)
    expect(__scenes.every((scene) => scene.called("dispose"))).toBe(true)
  })

  it("keeps a re-attached element working without rebuilding twice", () => {
    const el = mount()
    el.remove()
    el.remove()
    expect(__scenes[0].count("dispose")).toBe(1)
    expect(__scenes).toHaveLength(1)

    document.body.appendChild(el)
    expect(__scenes).toHaveLength(2)
    expect(__scenes[1].called("dispose")).toBe(false)
    expect(el.ready).toBe(true)
    expect(el.settings).not.toBeNull()

    el.remove()
    expect(__scenes[1].called("dispose")).toBe(true)
  })

  it("stops answering to the engine once it is out of the document", () => {
    const el = mount()
    const scene = __scenes[0]
    el.remove()

    const before = scene.calls.length
    el.theme = "dark"
    el.mode = "centers"
    el.reset()
    el.zoom(1)
    el.selectCountry("PHL")

    expect(scene.calls.length).toBe(before)
    expect(el.settings).toBeNull()
    expect(el.selection).toBeNull()
  })

  it("forgets its announcement when it leaves the document", () => {
    const el = mount()
    el.dispatchEvent(
      new CustomEvent("geora-select", {
        detail: { marker: { kind: "country", country: { country: "Philippines" } }, x: 1, y: 1 },
      }),
    )
    expect(liveRegion(el).textContent).toContain("Philippines")

    el.remove()
    expect(liveRegion(el).textContent).toBe("")
  })
})

describe("several globes on one page", () => {
  it("gives each element its own scene, settings and lifetime", () => {
    const a = mount()
    const b = mount()
    expect(__scenes).toHaveLength(2)
    expect(__scenes[0].args.container).not.toBe(__scenes[1].args.container)

    expect(__scenes[1].count("setTheme")).toBe(1) // b's own initial sync
    a.theme = "dark"
    expect(__scenes[1].count("setTheme")).toBe(1) // a's theme never reaches b
    b.theme = "matrix"
    expect(__scenes[1].count("setTheme")).toBe(2)
    expect(a.settings.theme).toBe("dark")
    expect(b.settings.theme).toBe("matrix")

    a.mode = "centers"
    expect(a.mode).toBe("centers")
    expect(b.mode).toBe("country")
    expect(__scenes[1].count("setMode")).toBe(1) // a.mode never reaches b

    a.remove()
    expect(__scenes[0].called("dispose")).toBe(true)
    expect(__scenes[1].called("dispose")).toBe(false)

    b.theme = "amber"
    expect(__scenes[1].count("setTheme")).toBe(3) // still listening after a went away
    b.remove()
    expect(__scenes[1].called("dispose")).toBe(true)
  })

  it("runs independent engines against independent scenes", () => {
    const factory = sceneFactory()
    const globes = [0, 1, 2].map(
      () => new GeoraGlobe({ container: document.createElement("div"), sceneFactory: factory }),
    )
    expect(factory.scenes).toHaveLength(3)

    globes[0].theme = "dark"
    expect(factory.scenes[0].count("setTheme")).toBe(2) // initial sync + the change
    expect(factory.scenes[1].count("setTheme")).toBe(1)
    expect(factory.scenes[2].count("setTheme")).toBe(1)

    globes[1].selectCountry("PHL")
    expect(globes[1].selection).not.toBeNull()
    expect(globes[0].selection).toBeNull()
    expect(globes[2].selection).toBeNull()

    for (const globe of globes) globe.destroy()
    expect(factory.scenes.every((scene) => scene.count("dispose") === 1)).toBe(true)
  })

  it("detaches its reduced-motion listener on destroy, and only once", () => {
    const query = stubMatchMedia(true)
    const globe = new GeoraGlobe({
      container: document.createElement("div"),
      sceneFactory: sceneFactory(),
    })
    expect(query.listenerCount).toBe(1)

    globe.destroy()
    expect(query.listenerCount).toBe(0)
    globe.destroy()
    expect(query.listenerCount).toBe(0)
  })
})

// WebGL cannot be constructed under jsdom, so the parts of teardown that touch
// a GPU context are pinned against the code that performs them. This is the
// only place the contract is visible: nothing else fails when the animation
// loop, the window listeners or the context are left behind.
describe("scene teardown contract", () => {
  it("releases everything createGlobeScene acquires", () => {
    const dispose = bodyOf(read("GlobeScene.js"), "dispose() {")
    expect(dispose).not.toBe("")
    expect(dispose).toContain("api.stop()") // the animation loop
    expect(dispose).toContain("lifecycle.abort()") // window resize/orientationchange
    expect(dispose).toContain("observer?.disconnect()") // the ResizeObserver
    expect(dispose).toContain("unbind?.()") // pointer, wheel and touch handlers
    expect(dispose).toContain("rendererApi.dispose()")
  })

  it("hands the WebGL context back instead of leaving it for the browser", () => {
    const dispose = bodyOf(read("GlobeRenderer.js"), "function dispose() {")
    expect(dispose).not.toBe("")
    expect(dispose).toContain("geometry.dispose()")
    expect(dispose).toContain("material.dispose()")
    expect(dispose).toContain("renderer.dispose()")
    // browsers cap how many contexts may be live at once, so a page that
    // mounts and unmounts the globe would otherwise exhaust them
    expect(dispose).toContain("renderer.forceContextLoss()")
    expect(dispose).toContain("renderer.domElement.remove()")
  })
})

// The two dials that decide what a phone pays per frame. Both already exist;
// these assertions stop them being quietly widened.
describe("renderer budget", () => {
  const source = () => read("GlobeRenderer.js")

  it("caps the pixel ratio at 2x when created and whenever it resizes", () => {
    const capped = source().match(/setPixelRatio\(Math\.min\(window\.devicePixelRatio \|\| 1, 2\)\)/g)
    expect(capped).toHaveLength(2)
  })

  it("builds half the point cloud on a narrow viewport", () => {
    expect(source()).toMatch(/width < 640 \? 30000 : 65000/)
  })
})
