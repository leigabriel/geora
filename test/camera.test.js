import { describe, expect, it } from "vitest"
import * as THREE from "three"
import { createCamera } from "../src/core/GlobeCamera.js"
import { FOCUS_RATIO, HOME_QUATERNION, MAX_RATIO, MIN_RATIO } from "../src/core/constants.js"

function makeCtx(width = 800, height = 600) {
  return {
    view: { w: width, h: height, left: 0, top: 0 },
    state: {
      autoRotate: true,
      inertia: 0.0018,
      axis: new THREE.Vector3(0, 1, 0),
      target: null,
      fit: 0,
      zoom: 0,
      ratio: 1,
      globeScale: 0.7,
      easing: false,
      locked: false,
      dragging: false,
    },
    prefs: { motion: true },
    globe: { quaternion: new THREE.Quaternion() },
  }
}

describe("camera framing and resize", () => {
  it("fits the globe into the container aspect", () => {
    const ctx = makeCtx()
    const camera = createCamera(ctx)
    expect(ctx.state.fit).toBeGreaterThan(0)
    expect(camera.camera.aspect).toBeCloseTo(800 / 600, 5)
    expect(camera.camera.position.z).toBe(ctx.state.fit)
  })

  it("reframes on container resize without window.resize", () => {
    const ctx = makeCtx()
    const camera = createCamera(ctx)
    const initialFit = ctx.state.fit

    ctx.view.w = 400
    ctx.view.h = 900
    camera.handleResize()

    expect(camera.camera.aspect).toBeCloseTo(400 / 900, 5)
    expect(ctx.state.fit).not.toBe(initialFit)
    // unlocked resize re-centres the default framing
    expect(ctx.state.ratio).toBe(1)
    expect(camera.camera.position.z).toBe(ctx.state.zoom)
  })

  it("keeps the user zoom level across a resize once locked", () => {
    const ctx = makeCtx()
    const camera = createCamera(ctx)
    camera.zoomBy(1)
    const ratio = ctx.state.ratio

    ctx.view.w = 500
    ctx.view.h = 500
    camera.handleResize()
    expect(ctx.state.ratio).toBeCloseTo(ratio, 5)
    expect(ctx.state.locked).toBe(true)
  })
})

describe("camera zoom, focus and reset", () => {
  it("clamps zoom between the framing limits", () => {
    const ctx = makeCtx()
    const camera = createCamera(ctx)
    camera.zoomBy(1000)
    expect(ctx.state.ratio).toBe(MAX_RATIO)
    camera.zoomBy(-10000)
    expect(ctx.state.ratio).toBe(MIN_RATIO)
    expect(ctx.state.locked).toBe(true)
    expect(ctx.state.easing).toBe(true)
  })

  it("frames a selected place close up", () => {
    const ctx = makeCtx()
    const camera = createCamera(ctx)
    camera.zoomBy(1)
    camera.flyTo({ lat: 14.5995, lon: 120.9842 })
    expect(ctx.state.target).not.toBeNull()
    expect(ctx.state.target).not.toBe(ctx.globe.quaternion)
    expect(ctx.state.ratio).toBeLessThanOrEqual(Math.min(1, FOCUS_RATIO))
    expect(ctx.state.easing).toBe(true)
  })

  it("returns to the home view on reset", () => {
    const ctx = makeCtx()
    const camera = createCamera(ctx)
    camera.flyTo({ lat: 10, lon: 10 })
    camera.zoomBy(1.5)
    camera.reset()

    expect(ctx.state.target.equals(HOME_QUATERNION())).toBe(true)
    expect(ctx.state.ratio).toBe(1)
    expect(ctx.state.locked).toBe(false)
    expect(ctx.state.inertia).toBeGreaterThan(0)
  })

  it("stills inertia under reduced motion", () => {
    const ctx = makeCtx()
    ctx.prefs.motion = false
    const camera = createCamera(ctx)
    camera.reset()
    expect(ctx.state.inertia).toBe(0)
  })

  it("hands the pre-selection framing back on restore", () => {
    const ctx = makeCtx()
    const camera = createCamera(ctx)
    const saved = camera.snapshot()
    camera.flyTo({ lat: 1, lon: 2 })
    camera.zoomBy(1)
    const zoomedRatio = ctx.state.ratio

    camera.restore(saved)
    expect(ctx.state.ratio).toBe(saved.ratio)
    expect(ctx.state.ratio).not.toBe(zoomedRatio)
    expect(ctx.state.target.equals(saved.quaternion)).toBe(true)
    expect(camera.restore(null)).toBeUndefined()
  })

  it("treats globeScale as a preference, not part of the snapshot", () => {
    const ctx = makeCtx()
    const camera = createCamera(ctx)
    const saved = camera.snapshot()
    camera.setGlobeScale(1.2)
    camera.restore(saved)
    expect(ctx.state.globeScale).toBe(1.2)
  })
})
