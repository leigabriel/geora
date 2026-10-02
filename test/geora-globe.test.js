import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GeoraGlobe, defaultCountries, defaultCenters, defaultLandmarks } from "geora-globe"
import { sceneFactory, stubMatchMedia } from "./helpers.js"

function mount(options = {}) {
  const factory = sceneFactory()
  const container = document.createElement("div")
  const globe = new GeoraGlobe({ container, sceneFactory: factory, ...options })
  return { globe, container, scene: factory.scenes[0], factory }
}

describe("GeoraGlobe defaults", () => {
  it("starts with the paper theme, country mode and auto modes", () => {
    const { globe, scene } = mount()
    expect(globe.theme).toBe("paper")
    expect(globe.mode).toBe("country")
    expect(globe.modes).toEqual(["country", "polaroid", "analytics", "centers"])
    expect(globe.spinning).toBe(true)
    expect(globe.detail).toBe(2)
    expect(scene.called("setTheme")).toBe(true)
    expect(scene.called("setMode")).toBe(true)
    globe.destroy()
  })

  it("loads the default dataset", () => {
    const { globe } = mount()
    expect(globe.data.countries.length).toBe(defaultCountries.length)
    expect(globe.data.centers.length).toBe(defaultCenters.length)
    expect(globe.data.landmarks.length).toBe(defaultLandmarks.length)
    expect(globe.data.markers).toEqual([])
    expect(globe.analytics.byCode.PHL.traffic).toBeGreaterThan(0)
    globe.destroy()
  })

  it("emits geora-ready once on start", () => {
    const { globe } = mount()
    const ready = vi.fn()
    globe.addEventListener("geora-ready", ready)
    globe.start()
    globe.start()
    expect(ready).toHaveBeenCalledTimes(1)
    globe.destroy()
  })
})

describe("GeoraGlobe configuration", () => {
  it("switches themes by key and by object", () => {
    const { globe, scene } = mount()
    globe.theme = "dark"
    expect(globe.theme).toBe("dark")
    expect(scene.last("setTheme").args[0].key).toBe("dark")

    globe.theme = { background: "#102030", accent: "#c6fe69" }
    expect(globe.theme).toMatchObject({ background: "#102030", accent: "#c6fe69" })
    expect(scene.last("setTheme").args[0].bg).toBe(0x102030)

    const events = []
    globe.addEventListener("geora-theme-change", (event) => events.push(event.detail.key))
    globe.theme = "amber"
    expect(events).toEqual(["amber"])
    globe.destroy()
  })

  it("falls back to paper for an unknown theme", () => {
    const { globe } = mount({ theme: "does-not-exist" })
    expect(globe.theme).toBe("paper")
    globe.destroy()
  })

  it("narrows modes and keeps the current mode valid", () => {
    const { globe, scene } = mount({ mode: "analytics", modes: ["country", "analytics"] })
    expect(globe.mode).toBe("analytics")
    expect(globe.modes).toEqual(["country", "analytics"])

    globe.modes = ["centers"]
    expect(globe.mode).toBe("centers")
    expect(scene.called("setMode")).toBe(true)
    globe.destroy()
  })

  it("ignores an invalid modes list", () => {
    const { globe } = mount({ modes: ["country", "nonsense"] })
    // a list with at least one valid key still applies, invalid keys dropped
    expect(globe.modes).toEqual(["country"])
    globe.modes = ["bogus", "also-bogus"]
    expect(globe.modes).toEqual(["country"])
    globe.destroy()
  })

  it("adds the markers mode only when marker data exists", () => {
    const { globe } = mount()
    expect(globe.modes).not.toContain("markers")
    globe.setData({ markers: [{ id: "m1", name: "A", lat: 1, lon: 2 }] })
    expect(globe.modes).toContain("markers")
    globe.destroy()
  })

  it("coerces invalid numeric configuration to defaults", () => {
    const { globe } = mount({ detail: "abc", globeScale: Number.NaN })
    expect(globe.detail).toBe(2)
    expect(globe.globeScale).toBe(0.7)
    globe.detail = "abc"
    expect(globe.detail).toBe(2)
    globe.destroy()
  })

  it("applies halftone overrides", () => {
    const { globe, scene } = mount({ halftone: { density: 1.4, ocean: 0.5 } })
    expect(globe.halftone.density).toBe(1.4)
    expect(globe.halftone.ocean).toBe(0.5)
    expect(globe.halftone.contrast).toBe(1)
    globe.contrast = 2
    expect(scene.last("setHalftone").args[0].contrast).toBe(2)
    globe.destroy()
  })
})

describe("GeoraGlobe data API", () => {
  it("accepts fully custom data and rebuilds analytics", () => {
    const { globe, scene } = mount()
    const data = globe.setData({
      countries: [
        { code: "AAA", country: "Alpha", name: "A-Town", iso2: "aa", lat: 10, lon: 20 },
        { code: "BBB", country: "Beta", lat: "not-a-number", lon: 20 },
      ],
      centers: [{ id: "c1", name: "Site", code: "AAA", lat: 1, lon: 2 }],
      markers: [{ id: "m1", name: "Beacon", lat: 3, lon: 4, type: "custom" }],
      landmarks: [{ id: "l1", country: "Alpha", caption: "Thing", lat: 5, lon: 6 }],
    })

    // entries without valid coordinates are dropped, never rendered broken
    expect(data.countries.map((c) => c.code)).toEqual(["AAA"])
    expect(data.centers).toHaveLength(1)
    expect(data.markers[0].name).toBe("Beacon")
    expect(data.landmarks[0].caption).toBe("Thing")
    expect(globe.analytics.byCode.AAA).toBeTruthy()
    expect(scene.called("setData")).toBe(true)
    expect(scene.called("setPolaroids")).toBe(true)
    globe.destroy()
  })

  it("survives empty and malformed data", () => {
    const { globe } = mount()
    globe.setData({})
    globe.setData({ countries: null, markers: "nope" })
    expect(globe.data.countries.length).toBe(defaultCountries.length)
    globe.destroy()
  })

  it("exposes the data property as a setter", () => {
    const { globe } = mount()
    globe.data = { markers: [{ lat: 0, lon: 0 }] }
    expect(globe.data.markers).toHaveLength(1)
    globe.destroy()
  })
})

describe("GeoraGlobe selection and events", () => {
  it("selects a country by alpha-3 and by alpha-2", () => {
    const { globe, scene } = mount()
    const seen = []
    globe.addEventListener("geora-country-select", (event) => seen.push(event.detail.country.country))

    expect(globe.selectCountry("PHL")).toBe(true)
    expect(globe.selection.kind).toBe("country")
    expect(seen).toEqual(["Philippines"])
    expect(scene.called("flyTo")).toBe(true)

    expect(globe.selectCountry("ph")).toBe(true)
    expect(seen).toHaveLength(2)
    expect(globe.selectCountry("nope")).toBe(false)
    globe.destroy()
  })

  it("emits structured select and clear events", () => {
    const { globe, scene } = mount()
    const select = vi.fn()
    const clear = vi.fn()
    globe.addEventListener("geora-select", select)
    globe.addEventListener("geora-clear", clear)

    globe.selectCountry("JPN")
    expect(select.mock.calls[0][0].detail).toMatchObject({ marker: { kind: "country" }, x: null, y: null })
    expect(globe.clearSelection()).toBe(true)
    expect(clear).toHaveBeenCalledTimes(1)
    expect(globe.clearSelection()).toBe(false)
    expect(scene.called("restore")).toBe(true)
    globe.destroy()
  })

  it("routes pointer handlers to public events", () => {
    const { globe, scene } = mount()
    globe.start()
    const hover = vi.fn()
    const sphere = vi.fn()
    globe.addEventListener("geora-hover", hover)
    globe.addEventListener("geora-sphere-select", sphere)

    scene.handlers.onHover({ kind: "country", place: defaultCountries[0] }, 12, 34)
    expect(hover.mock.calls[0][0].detail.marker.country.country).toBe(defaultCountries[0].country)
    expect(hover.mock.calls[0][0].detail).toMatchObject({ x: 12, y: 34 })

    scene.handlers.onHover(null)
    expect(hover.mock.calls[1][0].detail.marker).toBeNull()

    scene.handlers.onSphere({ lat: 1.5, lon: 2.5 }, 5, 6)
    expect(sphere.mock.calls[0][0].detail).toMatchObject({ lat: 1.5, lon: 2.5, onLand: false })
    globe.destroy()
  })

  it("clears selection when the mode changes", () => {
    const { globe } = mount()
    globe.selectCountry("PHL")
    const clear = vi.fn()
    globe.addEventListener("geora-clear", clear)
    globe.mode = "analytics"
    expect(clear).toHaveBeenCalledTimes(1)
    expect(globe.selection).toBeNull()
    globe.destroy()
  })

  it("emits geora-reset from reset()", () => {
    const { globe, scene } = mount()
    const reset = vi.fn()
    globe.addEventListener("geora-reset", reset)
    globe.selectCountry("PHL")
    globe.reset()
    expect(reset).toHaveBeenCalledTimes(1)
    expect(scene.called("reset")).toBe(true)
    expect(globe.selection).toBeNull()
    globe.destroy()
  })

  it("sends only plain data on the wire", () => {
    const { globe } = mount()
    const select = vi.fn()
    globe.addEventListener("geora-select", select)
    globe.selectCountry("USA")
    const detail = select.mock.calls[0][0].detail
    expect(JSON.parse(JSON.stringify(detail))).toEqual(detail)
    globe.destroy()
  })
})

describe("GeoraGlobe lifecycle", () => {
  it("stops and disposes on destroy, and is inert afterwards", () => {
    const { globe, scene } = mount()
    globe.start()
    globe.destroy()
    expect(scene.called("dispose")).toBe(true)

    const before = scene.calls.length
    globe.start()
    globe.stop()
    globe.reset()
    globe.selectCountry("PHL")
    globe.rotate(1, 1)
    globe.zoom(1)
    expect(scene.calls.length).toBe(before)
    expect(globe.clearSelection()).toBe(false)
  })

  it("supports repeated construction against one container", () => {
    const container = document.createElement("div")
    const factory = sceneFactory()
    const first = new GeoraGlobe({ container, sceneFactory: factory })
    first.destroy()
    const second = new GeoraGlobe({ container, sceneFactory: factory })
    expect(factory.scenes).toHaveLength(2)
    expect(factory.scenes[0].called("dispose")).toBe(true)
    second.destroy()
  })

  it("honours prefers-reduced-motion under motion: auto", () => {
    const query = stubMatchMedia(true)
    const { globe, scene } = mount({ motion: "auto", spinning: true })
    expect(globe.motion).toBe(false)
    expect(scene.last("setMotion").args[0]).toBe(false)
    expect(scene.last("setAutoRotate").args[0]).toBe(false)

    query.matches = false
    query.listeners.forEach((listener) => listener())
    expect(globe.motion).toBe(true)
    expect(scene.last("setAutoRotate").args[0]).toBe(true)
    globe.destroy()
  })

  it("forces motion off regardless of the OS setting when motion is false", () => {
    stubMatchMedia(false)
    const { globe, scene } = mount({ motion: false })
    expect(globe.motion).toBe(false)
    expect(scene.called("setMotion")).toBe(true)
    globe.destroy()
  })
})

describe("GeoraGlobe persistence", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("writes nothing unless persistence is enabled", () => {
    const { globe } = mount()
    globe.theme = "dark"
    expect(localStorage.getItem("geora-globe:prefs:v1")).toBeNull()
    globe.destroy()
  })

  it("stores preferences and restores them for the next instance", () => {
    const first = mount({ persistence: true })
    first.globe.theme = "matrix"
    first.globe.spinning = false
    first.globe.detail = 0
    first.globe.destroy()

    const second = mount({ persistence: true })
    expect(second.globe.theme).toBe("matrix")
    expect(second.globe.spinning).toBe(false)
    expect(second.globe.detail).toBe(0)
    second.globe.destroy()
  })

  it("lets explicit options win over stored preferences", () => {
    const first = mount({ persistence: true })
    first.globe.theme = "dark"
    first.globe.destroy()

    const second = mount({ persistence: true, theme: "amber" })
    expect(second.globe.theme).toBe("amber")
    second.globe.destroy()
  })
})
