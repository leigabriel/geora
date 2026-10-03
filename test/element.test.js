import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GeoraGlobeElement, defaultCountries, registerGeoraGlobe } from "geora-globe"

// The element owns a GeoraGlobe which owns a scene: replace the scene with a
// recording stub so tests run without WebGL.
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

function makeElement(attributes = {}) {
  const el = document.createElement("geora-globe")
  for (const [name, value] of Object.entries(attributes)) {
    if (value === true) el.setAttribute(name, "")
    else el.setAttribute(name, String(value))
  }
  return el
}

function mount(attributes = {}) {
  const el = makeElement(attributes)
  document.body.appendChild(el)
  return el
}

function stage(el) {
  return el.shadowRoot.querySelector(".stage")
}

const currentScene = () => __scenes.at(-1)

beforeEach(() => {
  __scenes.length = 0
  localStorage.clear()
})

afterEach(() => {
  document.body.replaceChildren()
  localStorage.clear()
})

describe("custom element registration", () => {
  it("registers <geora-globe> on import", () => {
    expect(customElements.get("geora-globe")).toBe(GeoraGlobeElement)
    const el = document.createElement("geora-globe")
    expect(el).toBeInstanceOf(GeoraGlobeElement)
    expect(el).toBeInstanceOf(HTMLElement)
  })

  it("registers aliases without redefining the default tag", () => {
    expect(registerGeoraGlobe("geora-globe")).toBe(GeoraGlobeElement)
    const alias = registerGeoraGlobe("geora-alt")
    expect(customElements.get("geora-alt")).toBe(alias)
    const el = document.createElement("geora-alt")
    expect(el).toBeInstanceOf(alias)
    expect(el).toBeInstanceOf(GeoraGlobeElement)
  })
})

describe("initialization", () => {
  it("creates one scene bound to its own shadow stage", () => {
    const el = mount()
    expect(__scenes).toHaveLength(1)
    expect(currentScene().args.container).toBe(stage(el))
    expect(currentScene().args.options.flagBase).toBe("")
  })

  it("emits geora-ready when it starts", () => {
    const el = makeElement()
    const ready = vi.fn()
    el.addEventListener("geora-ready", ready)
    document.body.appendChild(el)
    expect(ready).toHaveBeenCalledTimes(1)
  })

  // Frameworks attach listeners in a mount hook that runs after the element is
  // already in the document, so connectedCallback's event has been and gone by
  // then. React, Vue and Svelte all do this.
  it("replays geora-ready for listeners added after the element is connected", async () => {
    const el = mount()
    expect(el.ready).toBe(true)

    const late = vi.fn()
    el.addEventListener("geora-ready", late)
    expect(late).not.toHaveBeenCalled()
    await Promise.resolve()
    expect(late).toHaveBeenCalledTimes(1)

    // a listener registered after a replay is still eligible for one, which is
    // what React StrictMode's add → remove → add cycle does
    el.removeEventListener("geora-ready", late)
    el.addEventListener("geora-ready", late)
    await Promise.resolve()
    expect(late).toHaveBeenCalledTimes(2)
  })

  it("does not replay geora-ready twice to the same live listener", async () => {
    const el = mount()
    const ready = vi.fn()
    el.addEventListener("geora-ready", ready)
    await Promise.resolve()
    expect(ready).toHaveBeenCalledTimes(1)
  })

  it("resolves whenReady() after the fact and while still pending", async () => {
    const el = mount()
    await expect(el.whenReady()).resolves.toBe(el)

    const later = document.createElement("geora-globe")
    const pending = later.whenReady()
    document.body.appendChild(later)
    await expect(pending).resolves.toBe(later)
  })

  it("does not report ready before it is connected", () => {
    const el = makeElement()
    expect(el.ready).toBe(false)
  })

  it("labels itself for assistive technology", () => {
    const el = mount()
    expect(el.getAttribute("tabindex")).toBe("0")
    expect(el.getAttribute("role")).toBe("application")
    expect(el.getAttribute("aria-label")).toBe("Geora interactive globe")
    el.setAttribute("aria-label", "World")
    expect(el.getAttribute("aria-label")).toBe("World")
  })

  it("initializes only once when connectedCallback repeats", () => {
    const el = mount()
    el.connectedCallback()
    el.connectedCallback()
    expect(__scenes).toHaveLength(1)
  })

  it("disposes on removal and rebuilds on re-attach", () => {
    const el = mount()
    const first = currentScene()
    el.remove()
    expect(first.called("dispose")).toBe(true)
    el.remove()
    expect(__scenes).toHaveLength(1)

    document.body.appendChild(el)
    expect(__scenes).toHaveLength(2)
    expect(currentScene().called("dispose")).toBe(false)
  })

  it("supports explicit destroy followed by start", () => {
    const el = mount()
    el.destroy()
    expect(currentScene().called("dispose")).toBe(true)
    el.start()
    expect(__scenes).toHaveLength(2)
  })
})

describe("configuration through attributes and properties", () => {
  it("maps attributes into the engine", () => {
    const el = mount({
      theme: "dark",
      mode: "analytics",
      detail: "1",
      "globe-scale": "0.9",
      "marker-scale": "1.5",
      "halftone-density": "1.25",
      "ocean-opacity": "0.4",
      "flag-base": "flags",
      "show-borders": true,
    })
    expect(el.theme).toBe("dark")
    expect(el.mode).toBe("analytics")
    expect(el.detail).toBe(1)
    expect(el.globeScale).toBe(0.9)
    expect(el.markerScale).toBe(1.5)
    expect(el.halftoneDensity).toBe(1.25)
    expect(el.oceanOpacity).toBe(0.4)
    expect(el.flagBase).toBe("flags")
    expect(el.showBorders).toBe(true)
    expect(currentScene().last("setGlobeScale").args[0]).toBe(0.9)
    expect(currentScene().args.options.flagBase).toBe("flags")
  })

  it("supports auto-rotate with value-aware booleans", () => {
    expect(mount({ "auto-rotate": true }).spinning).toBe(true)
    expect(mount({ "auto-rotate": "false" }).spinning).toBe(false)
    const bare = makeElement()
    expect(bare.spinning).toBe(true)
    bare.setAttribute("auto-rotate", "false")
    expect(bare.spinning).toBe(false)
  })

  it("parses the tri-state motion attribute", () => {
    expect(mount({ motion: "off" }).motion).toBe(false)
    expect(mount({ motion: "auto" }).motion).toBe("auto")
    expect(mount({ motion: "on" }).motion).toBe(true)
    expect(mount().motion).toBe("auto")
  })

  it("reads the modes list from a comma-separated attribute", () => {
    const el = mount({ modes: "country, centers" })
    expect(el.modes).toEqual(["country", "centers"])
    el.modes = ["polaroid"]
    expect(el.modes).toEqual(["polaroid"])
  })

  it("ignores invalid configuration and keeps defaults", () => {
    const el = mount({ theme: "neon", mode: "space", detail: "high", "globe-scale": "huge" })
    expect(el.theme).toBe("paper")
    expect(el.mode).toBe("country")
    expect(el.detail).toBe(2)
    expect(el.globeScale).toBe(0.7)
    expect(el.isConnected).toBe(true)
  })

  it("applies attribute changes made after connection", () => {
    const el = mount()
    el.setAttribute("theme", "matrix")
    expect(el.theme).toBe("matrix")
    expect(currentScene().last("setTheme").args[0].key).toBe("matrix")
    el.removeAttribute("theme")
    expect(el.theme).toBe("paper")
  })

  it("lets a property written before connection win over the attribute", () => {
    const el = makeElement({ theme: "dark" })
    el.theme = "amber"
    document.body.appendChild(el)
    expect(el.theme).toBe("amber")
  })

  it("applies property writes after connection", () => {
    const el = mount()
    el.detail = 0
    el.spinning = false
    expect(currentScene().last("setDetail").args[0]).toBe(0)
    expect(currentScene().last("setAutoRotate").args[0]).toBe(false)
    expect(el.detail).toBe(0)
    expect(el.spinning).toBe(false)
  })

  it("keeps globe markers visible regardless of interface choices", () => {
    const el = mount()
    expect(currentScene().last("setMarkersVisible").args[0]).toBe(true)
    el.showMarkers = false
    expect(currentScene().last("setMarkersVisible").args[0]).toBe(false)
    el.showMarkers = true
    expect(currentScene().last("setMarkersVisible").args[0]).toBe(true)
  })

  it("ignores the retired HUD attributes", () => {
    // the element draws no chrome of its own, so the switches that used to
    // trim it are neither observed nor exposed as properties
    const el = mount({
      minimal: true,
      "show-hud": "false",
      "show-tooltip": "false",
      "show-info-card": "false",
      "show-controls": "false",
      "show-navigation": "false",
      "show-settings": "true",
    })
    const observed = GeoraGlobeElement.observedAttributes
    for (const attr of ["minimal", "show-hud", "show-tooltip", "show-info-card", "show-controls", "show-navigation", "show-settings"]) {
      expect(observed).not.toContain(attr)
      expect(el.hasAttribute(attr)).toBe(true)
    }
    expect(el.minimal).toBeUndefined()
    expect(el.showHud).toBeUndefined()
    expect(el.showTooltip).toBeUndefined()
  })
})

describe("rendering only the globe", () => {
  it("draws no chrome of its own", () => {
    const el = mount()
    const root = el.shadowRoot
    // every interface is the host's to build, so none of the old HUD survives
    for (const selector of [".tooltip", ".card", ".controls", ".nav", ".settings", ".settings-toggle"]) {
      expect(root.querySelector(selector)).toBeNull()
    }
    expect(root.querySelector("[data-ui]")).toBeNull()
    // what remains is the stage that hosts the canvas and the live region
    expect(root.querySelector(".stage")).not.toBeNull()
    expect(root.querySelector("[data-live]")).not.toBeNull()
  })

  it("keeps the stage background at its default when the theme changes", () => {
    const el = mount()
    const themeChange = vi.fn()
    el.addEventListener("geora-theme-change", themeChange)
    expect(stage(el).style.getPropertyValue("--geora-stage-bg")).toBe("")

    el.theme = "dark"
    expect(stage(el).style.getPropertyValue("--geora-stage-bg")).toBe("")
    expect(themeChange).toHaveBeenCalledTimes(1)
    const detail = themeChange.mock.calls[0][0].detail
    expect(detail.key).toBe("dark")
    expect(detail.theme.background).toMatch(/^#/)

    el.theme = "paper"
    expect(stage(el).style.getPropertyValue("--geora-stage-bg")).toBe("")
  })
})

describe("announcing selections to assistive technology", () => {
  function live(el) {
    return el.shadowRoot.querySelector("[data-live]")
  }

  it("narrates a selection and its dismissal", () => {
    const el = mount()
    el.dispatchEvent(new CustomEvent("geora-select", {
      detail: { marker: { kind: "country", country: defaultCountries[0] }, x: 10, y: 10 },
    }))
    expect(live(el).textContent).toContain("Country")
    expect(live(el).textContent).toContain(defaultCountries[0].country)

    el.dispatchEvent(new CustomEvent("geora-clear", { detail: {} }))
    expect(live(el).textContent).toBe("Selection cleared")
  })

  it("names each kind of marker it announces", () => {
    const el = mount()
    const announce = (marker) => {
      el.dispatchEvent(new CustomEvent("geora-select", { detail: { marker, x: 1, y: 1 } }))
      return live(el).textContent
    }

    expect(announce({ kind: "center", center: { name: "Site A" }, country: null })).toContain("AI data center")
    expect(announce({ kind: "analytics", country: defaultCountries[0], row: null })).toContain("Analytics")
    expect(announce({ kind: "polaroid", landmark: { caption: "Mount Fuji" } })).toContain("Photograph")
    expect(announce({ kind: "marker", marker: { name: "Relay" } })).toContain("Marker")
  })

  it("narrates the layer when the mode changes", () => {
    const el = mount()
    el.dispatchEvent(new CustomEvent("geora-mode-change", { detail: { mode: "polaroid", modes: ["country", "polaroid"] } }))
    expect(live(el).textContent).toBe("Layer: POLAROIDS")
  })

  it("still lets the host hear every event it can build a UI from", () => {
    const el = mount()
    const hover = vi.fn()
    const select = vi.fn()
    el.addEventListener("geora-hover", hover)
    el.addEventListener("geora-select", select)

    const marker = { kind: "country", country: defaultCountries[0] }
    el.dispatchEvent(new CustomEvent("geora-hover", { detail: { marker, x: 10, y: 20 } }))
    el.dispatchEvent(new CustomEvent("geora-select", { detail: { marker, x: 10, y: 10 } }))

    expect(hover).toHaveBeenCalledTimes(1)
    expect(select).toHaveBeenCalledTimes(1)
    expect(select.mock.calls[0][0].detail.marker.country).toBe(defaultCountries[0])
    // and a selection leaves no element of its own behind
    expect(el.shadowRoot.querySelector(".card")).toBeNull()
    expect(el.shadowRoot.querySelector(".tooltip")).toBeNull()
  })
})

describe("keyboard accessibility", () => {
  it("rotates with the arrow keys and zooms with the plus/minus keys", () => {
    const el = mount()
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }))
    expect(currentScene().last("drag").args[0]).toBeLessThan(0)

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "+", bubbles: true, cancelable: true }))
    expect(currentScene().last("zoomBy").args[0]).toBeLessThan(0)
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "-", bubbles: true, cancelable: true }))
    expect(currentScene().last("zoomBy").args[0]).toBeGreaterThan(0)
  })

  it("resets with Home and steps modes with digit keys", () => {
    const el = mount()
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }))
    expect(currentScene().called("reset")).toBe(true)

    const event = new KeyboardEvent("keydown", { key: "3", bubbles: true, cancelable: true })
    el.dispatchEvent(event)
    expect(el.mode).toBe("analytics")
    expect(event.defaultPrevented).toBe(true)
    // the layer change is announced rather than drawn
    expect(el.shadowRoot.querySelector("[data-live]").textContent).toBe("Layer: ANALYTICS")
  })

  it("clears the selection with Escape", () => {
    const el = mount()
    el.selectCountry("PHL")
    expect(el.selection).not.toBeNull()
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
    expect(el.selection).toBeNull()
    expect(currentScene().called("restore")).toBe(true)
    // a second Escape has nothing to clear, so it is not consumed
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
    el.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})

describe("data, selection and persistence", () => {
  it("routes the data API into the scene", () => {
    const el = mount()
    const result = el.setData({ markers: [{ id: "m", name: "Node", lat: 0, lon: 0 }] })
    expect(result.markers).toHaveLength(1)
    expect(currentScene().called("setData")).toBe(true)
    expect(el.data.markers).toHaveLength(1)
    expect(el.modes).toContain("markers")
  })

  it("selects countries through the element surface", () => {
    const el = mount()
    expect(el.selection).toBeNull()
    expect(el.selectCountry("PHL")).toBe(true)
    expect(el.shadowRoot.querySelector("[data-live]").textContent).toContain("Philippines")
    expect(el.selection).toMatchObject({ kind: "country", country: { code: "PHL" } })
    expect(el.clearSelection()).toBe(true)
    expect(el.selection).toBeNull()
    expect(el.selectCountry("nope")).toBe(false)
  })

  it("exposes the effective settings snapshot", () => {
    const el = mount({ theme: "amber", mode: "centers" })
    expect(el.settings).toMatchObject({ theme: "amber", mode: "centers", showMarkers: true })
    el.theme = "dark"
    expect(el.settings.theme).toBe("dark")
  })

  it("persists preferences when the persistence attribute is present", () => {
    const el = mount({ persistence: true, theme: "dark" })
    el.theme = "matrix"
    const raw = localStorage.getItem("geora-globe:prefs:v1")
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw).theme).toBe("matrix")

    el.remove()
    const next = mount({ persistence: true })
    expect(next.theme).toBe("matrix")
  })

  it("never touches localStorage without persistence", () => {
    const el = mount()
    el.theme = "dark"
    expect(localStorage.getItem("geora-globe:prefs:v1")).toBeNull()
  })
})
