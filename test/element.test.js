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

function byAction(root, action) {
  return root.querySelector(`[data-action="${action}"]`)
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

  it("hides every HUD piece in minimal mode", () => {
    const el = mount({ minimal: true })
    const root = el.shadowRoot
    expect(root.querySelector(".controls").hidden).toBe(true)
    expect(root.querySelector(".nav").hidden).toBe(true)
    expect(root.querySelector(".settings-toggle").hidden).toBe(true)
    el.minimal = false
    expect(root.querySelector(".controls").hidden).toBe(false)
    expect(root.querySelector(".nav").hidden).toBe(false)
    expect(root.querySelector(".settings-toggle").hidden).toBe(true)
  })

  it("keeps globe markers visible while the HUD is hidden", () => {
    const el = mount({ minimal: true })
    expect(currentScene().last("setMarkersVisible").args[0]).toBe(true)
    el.showMarkers = false
    expect(currentScene().last("setMarkersVisible").args[0]).toBe(false)
    el.showMarkers = true
    expect(currentScene().last("setMarkersVisible").args[0]).toBe(true)
  })

  it("gates the HUD with show-hud", () => {
    const el = mount({ "show-hud": "false" })
    expect(el.shadowRoot.querySelector(".controls").hidden).toBe(true)
    expect(el.shadowRoot.querySelector(".nav").hidden).toBe(true)
    el.showHud = true
    expect(el.shadowRoot.querySelector(".controls").hidden).toBe(false)
  })

  it("shows the settings toggle only when settings are enabled", () => {
    const el = mount({ "show-settings": true })
    const toggle = el.shadowRoot.querySelector(".settings-toggle")
    expect(toggle.hidden).toBe(false)
    el.showSettings = false
    expect(toggle.hidden).toBe(true)
  })
})

describe("HUD chrome behaviour", () => {
  it("opens and closes the settings panel", () => {
    const el = mount({ "show-settings": true })
    const root = el.shadowRoot
    const toggle = root.querySelector(".settings-toggle")
    const panel = root.querySelector(".settings")

    expect(panel.hidden).toBe(true)
    toggle.click()
    expect(panel.hidden).toBe(false)
    expect(toggle.getAttribute("aria-expanded")).toBe("true")
    toggle.click()
    expect(panel.hidden).toBe(true)
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
  })

  it("toggles auto-rotation from the spin control", () => {
    const el = mount()
    const spin = byAction(el.shadowRoot, "spin")
    expect(spin.getAttribute("aria-pressed")).toBe("true")
    spin.click()
    expect(el.spinning).toBe(false)
    expect(spin.getAttribute("aria-pressed")).toBe("false")
    expect(spin.getAttribute("aria-label")).toBe("Resume rotation")
    expect(currentScene().last("setAutoRotate").args[0]).toBe(false)
  })

  it("resets the view from the reset control", () => {
    const el = mount()
    byAction(el.shadowRoot, "reset").click()
    expect(currentScene().called("reset")).toBe(true)
  })

  it("cycles layers from the navigation and updates its label", () => {
    const el = mount()
    const root = el.shadowRoot
    const label = root.querySelector(".nav-label")
    const count = root.querySelector(".nav-count")
    expect(label.textContent).toBe("COUNTRIES")
    expect(count.textContent).toBe("1 / 4")

    byAction(root, "next").click()
    expect(el.mode).toBe("polaroid")
    expect(label.textContent).toBe("POLAROIDS")
    expect(count.textContent).toBe("2 / 4")

    byAction(root, "prev").click()
    expect(el.mode).toBe("country")
  })

  it("switches theme and detail from the settings panel", () => {
    const el = mount({ "show-settings": true })
    const root = el.shadowRoot
    byAction(root, "settings").click()
    const amber = root.querySelector('[data-theme="amber"]')
    amber.click()
    expect(el.theme).toBe("amber")
    expect(amber.getAttribute("aria-pressed")).toBe("true")

    byAction(root, "detail").click()
    expect(el.detail).toBe(0)
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

describe("events driving the built-in UI", () => {
  function hoverDetail(marker, x = 10, y = 20) {
    return { marker, x, y }
  }

  it("shows and hides the tooltip from geora-hover", () => {
    const el = mount()
    const tooltip = el.shadowRoot.querySelector(".tooltip")

    el.dispatchEvent(new CustomEvent("geora-hover", {
      detail: hoverDetail({ kind: "country", country: defaultCountries[0] }),
    }))
    expect(tooltip.dataset.visible).toBe("true")
    expect(tooltip.querySelector(".tooltip-title").textContent).toBe(defaultCountries[0].country)

    el.dispatchEvent(new CustomEvent("geora-hover", { detail: { marker: null } }))
    expect(tooltip.dataset.visible).toBe("false")
  })

  it("respects show-tooltip", () => {
    const el = mount({ "show-tooltip": false })
    el.dispatchEvent(new CustomEvent("geora-hover", {
      detail: hoverDetail({ kind: "country", country: defaultCountries[0] }),
    }))
    expect(el.shadowRoot.querySelector(".tooltip").dataset.visible).toBe("false")
  })

  it("opens the info card from geora-select and closes it from geora-clear", () => {
    const el = mount()
    const card = el.shadowRoot.querySelector(".card")

    el.dispatchEvent(new CustomEvent("geora-select", {
      detail: { marker: { kind: "country", country: defaultCountries[0] }, x: 10, y: 10 },
    }))
    expect(card.hidden).toBe(false)
    expect(card.querySelector(".card-kind").textContent).toBe("Country")
    expect(card.querySelector(".card-title").textContent).toBe(defaultCountries[0].country)
    expect(card.querySelector(".card-body").textContent).toContain("Capital")
    expect(el.shadowRoot.querySelector("[data-live]").textContent).toContain("Country")

    el.dispatchEvent(new CustomEvent("geora-clear", { detail: {} }))
    expect(card.hidden).toBe(true)
    expect(el.shadowRoot.querySelector("[data-live]").textContent).toBe("Selection cleared")
  })

  it("renders marker cards", () => {
    const el = mount()
    const card = el.shadowRoot.querySelector(".card")
    el.dispatchEvent(new CustomEvent("geora-select", {
      detail: { marker: { kind: "marker", marker: { id: "m1", name: "Relay", lat: 1, lon: 2, type: "dish" } }, x: 5, y: 5 },
    }))
    expect(card.querySelector(".card-kind").textContent).toBe("Marker")
    expect(card.querySelector(".card-title").textContent).toBe("Relay")
    expect(card.querySelector(".card-body").textContent).toContain("dish")
  })

  it("keeps the card closed under show-info-card false but still announces", () => {
    const el = mount({ "show-info-card": false })
    const card = el.shadowRoot.querySelector(".card")
    el.dispatchEvent(new CustomEvent("geora-select", {
      detail: { marker: { kind: "country", country: defaultCountries[0] }, x: 1, y: 1 },
    }))
    expect(card.hidden).toBe(true)
    expect(el.shadowRoot.querySelector("[data-live]").textContent).toContain("Country")
  })

  it("closes the card from its close button via clearSelection", () => {
    const el = mount()
    el.selectCountry("PHL")
    const card = el.shadowRoot.querySelector(".card")
    expect(card.hidden).toBe(false)
    card.querySelector(".card-close").click()
    expect(el.clearSelection()).toBe(false)
    expect(card.hidden).toBe(true)
    expect(currentScene().called("restore")).toBe(true)
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
    expect(el.shadowRoot.querySelector(".nav-label").textContent).toBe("ANALYTICS")
  })

  it("clears the selection with Escape", () => {
    const el = mount()
    el.selectCountry("PHL")
    const card = el.shadowRoot.querySelector(".card")
    expect(card.hidden).toBe(false)
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
    expect(card.hidden).toBe(true)
    expect(el.clearSelection()).toBe(false)
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
    expect(el.shadowRoot.querySelector(".card").hidden).toBe(false)
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
