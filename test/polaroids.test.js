import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as THREE from "three"
import { createPolaroids } from "../src/core/GlobePolaroids.js"

// The polaroid layer against a real (headless) Three.js scene. The bug this
// guards was invisible to every other test: entries are first built from the
// defaults, which carry coordinates and captions but no imagery, and a host
// supplying `image` afterwards reuses the same entry.

function makeContext() {
  const pickables = []
  const ctx = {
    radius: 1,
    layers: { polaroid: new THREE.Group() },
    prefs: { motion: false },
    emphasis: { forDescriptor: () => "normal" },
    facingFade: () => 1,
    pickables,
    disposables: [],
  }
  ctx.polaroids = createPolaroids(ctx)
  return ctx
}

const photo = (over = {}) => ({
  id: "landmark-jp",
  iso2: "jp",
  country: "Japan",
  caption: "Itsukushima",
  lat: 34.3,
  lon: 132.3,
  ...over,
})

// jsdom never loads an image, so drive onload/onerror by hand.
function imageRequests() {
  const created = []
  const Original = globalThis.Image
  globalThis.Image = class {
    constructor() {
      this.crossOrigin = null
      this._src = null
      created.push(this)
    }
    set src(value) {
      this._src = value
      created.at(-1).requested = value
    }
    get src() {
      return this._src
    }
  }
  return {
    created,
    settle(index, ok = true) {
      const img = created[index]
      if (ok) img.onload?.()
      else img.onerror?.()
    },
    restore() {
      globalThis.Image = Original
    },
  }
}

// jsdom ships no 2D canvas, so stand in for the handful of calls the card
// painter makes. Anything it starts using shows up here as a no-op rather than
// a crash, which is the trade for keeping this test canvas-free.
function stubCanvas() {
  const Original = HTMLCanvasElement.prototype.getContext
  const context = {
    canvas: null,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "",
    textBaseline: "",
    globalAlpha: 1,
    fillRect() {},
    strokeRect() {},
    clearRect() {},
    drawImage() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    save() {},
    restore() {},
    fillText() {},
    measureText: (text) => ({ width: String(text).length * 8 }),
  }
  HTMLCanvasElement.prototype.getContext = function getContext() {
    context.canvas = this
    return context
  }
  return () => {
    HTMLCanvasElement.prototype.getContext = Original
  }
}

let ctx
let images
let restoreCanvas

beforeEach(() => {
  restoreCanvas = stubCanvas()
  ctx = makeContext()
  images = imageRequests()
})

afterEach(() => {
  images.restore()
  restoreCanvas()
})

describe("polaroid photographs", () => {
  it("loads an image supplied with the entry", () => {
    ctx.polaroids.setPolaroids([photo({ image: "landmarks/jp.jpg" })])
    expect(images.created).toHaveLength(1)
    expect(images.created[0].requested).toBe("landmarks/jp.jpg")
    expect(images.created[0].crossOrigin).toBe("anonymous")
  })

  it("picks up an image added to an entry that already exists", () => {
    // the default dataset: coordinates and a caption, no photograph
    ctx.polaroids.setPolaroids([photo()])
    expect(images.created).toHaveLength(0)

    // the host now supplies the photograph — same id, so the card is reused
    ctx.polaroids.setPolaroids([photo({ image: "landmarks/jp.jpg" })])
    expect(images.created).toHaveLength(1)
    expect(images.created[0].requested).toBe("landmarks/jp.jpg")

    images.settle(0)
    expect(ctx.layers.polaroid.children).toHaveLength(1)
  })

  it("swaps the photograph when the url changes", () => {
    ctx.polaroids.setPolaroids([photo({ image: "a.jpg" })])
    ctx.polaroids.setPolaroids([photo({ image: "b.jpg" })])
    expect(images.created.map((i) => i.requested)).toEqual(["a.jpg", "b.jpg"])
  })

  it("does not refetch an unchanged url", () => {
    ctx.polaroids.setPolaroids([photo({ image: "a.jpg" })])
    ctx.polaroids.setPolaroids([photo({ image: "a.jpg" })])
    ctx.polaroids.setPolaroids([photo({ image: "a.jpg" })])
    expect(images.created).toHaveLength(1)
  })

  it("warns once and keeps the card usable when a photo cannot be loaded", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    ctx.polaroids.setPolaroids([
      photo({ id: "landmark-jp", image: "missing.jpg" }),
      photo({ id: "landmark-ph", iso2: "ph", image: "missing.jpg" }),
    ])
    expect(images.created).toHaveLength(2)

    images.settle(0, false)
    images.settle(1, false)

    // two cards, both still on screen
    expect(ctx.layers.polaroid.children.length).toBeGreaterThan(0)
    // one warning for the shared url, and it names the url
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0].join(" ")).toContain("missing.jpg")
    warn.mockRestore()
  })

  it("drops the photograph again when it is removed", () => {
    ctx.polaroids.setPolaroids([photo({ image: "a.jpg" })])
    images.settle(0)
    expect(images.created).toHaveLength(1)
    // no url at all: the card must fall back, not keep the stale photograph
    ctx.polaroids.setPolaroids([photo()])
    expect(ctx.layers.polaroid.children).toHaveLength(1)
  })
})