import { GeoraGlobe, DEFAULT_HALFTONE, DEFAULT_PROFILE } from "./core/GeoraGlobe.js"
import { DEFAULT_THEME } from "./themes/themes.js"
import { modeMeta } from "./data/modes.js"
import styles from "./styles.css?raw"

// SSR-safe base: importing the package on the server must not throw; the
// element simply never upgrades there.
const HTMLElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {}
const HAS_DOM = typeof document !== "undefined"

// attribute -> property. `auto-rotate` is the documented alias of `spinning`.
// Only globe-native options are exposed: the element is a canvas, and every
// interface (tooltips, cards, controls, navigation, settings) is something the
// host builds from the public events and the imperative API.
const PROP_BY_ATTR = {
  "auto-rotate": "spinning",
  theme: "theme",
  mode: "mode",
  modes: "modes",
  motion: "motion",
  "show-borders": "showBorders",
  "show-markers": "showMarkers",
  "flag-base": "flagBase",
  "globe-scale": "globeScale",
  "marker-scale": "markerScale",
  detail: "detail",
  animation: "animation",
  "halftone-density": "halftoneDensity",
  "halftone-scale": "halftoneScale",
  contrast: "contrast",
  threshold: "threshold",
  intensity: "intensity",
  ambient: "ambient",
  "ocean-opacity": "oceanOpacity",
  persistence: "persistence",
}

const ATTR_BY_PROP = Object.fromEntries(Object.entries(PROP_BY_ATTR).map(([attr, prop]) => [prop, attr]))

const KIND = {
  theme: "string",
  mode: "string",
  flagBase: "string",
  motion: "motion",
  modes: "modes",
  spinning: "bool",
  showBorders: "bool",
  showMarkers: "bool",
  persistence: "bool",
  globeScale: "number",
  markerScale: "number",
  detail: "number",
  animation: "number",
  halftoneDensity: "number",
  halftoneScale: "number",
  contrast: "number",
  threshold: "number",
  intensity: "number",
  ambient: "number",
  oceanOpacity: "number",
}

const HALFTONE_KEYS = {
  halftoneDensity: "density",
  halftoneScale: "scale",
  contrast: "contrast",
  threshold: "threshold",
  intensity: "intensity",
  ambient: "ambient",
  oceanOpacity: "ocean",
}

const DEFAULTS = {
  theme: DEFAULT_THEME,
  mode: "country",
  modes: null,
  motion: "auto",
  spinning: true,
  showBorders: true,
  showMarkers: true,
  persistence: false,
  flagBase: "",
  globeScale: DEFAULT_PROFILE.globeScale,
  markerScale: DEFAULT_PROFILE.markerScale,
  detail: DEFAULT_PROFILE.detail,
  animation: DEFAULT_PROFILE.animation,
  halftoneDensity: DEFAULT_HALFTONE.density,
  halftoneScale: DEFAULT_HALFTONE.scale,
  contrast: DEFAULT_HALFTONE.contrast,
  threshold: DEFAULT_HALFTONE.threshold,
  intensity: DEFAULT_HALFTONE.intensity,
  ambient: DEFAULT_HALFTONE.ambient,
  oceanOpacity: DEFAULT_HALFTONE.ocean,
}

// properties that delegate straight to the GeoraGlobe instance
const DELEGATED = [
  "theme", "mode", "spinning", "flagBase", "globeScale", "markerScale", "detail", "animation",
  "halftoneDensity", "halftoneScale", "contrast", "threshold", "intensity", "ambient", "oceanOpacity",
  "showBorders", "showMarkers", "persistence",
]

// A short spoken label for a selection, for the polite live region.
function announceMarker(marker) {
  if (!marker) return "Selection cleared"
  switch (marker.kind) {
    case "country": return `Country: ${marker.country?.country ?? ""}`
    case "center": return `AI data center: ${marker.center?.name ?? ""}`
    case "analytics": return `Analytics: ${marker.country?.country ?? ""}`
    case "polaroid": return `Photograph: ${marker.landmark?.caption ?? ""}`
    case "marker": return `Marker: ${marker.marker?.name ?? ""}`
    default: return "Selection"
  }
}

function templateMarkup() {
  return `
    <div class="stage" part="stage">
      <div class="sr" role="status" data-live></div>
    </div>
  `
}

// The <geora-globe> custom element: hosts the render loop for one container and
// translates attributes and properties into GeoraGlobe options. It renders only
// the globe; tooltips, cards, controls and any other interface are built by the
// host from the public events and the imperative API.
export class GeoraGlobeElement extends HTMLElementBase {
  static get observedAttributes() {
    return Object.keys(PROP_BY_ATTR)
  }

  #globe = null
  #pending = {}
  #stage = null
  #live = null

  constructor() {
    super()
    if (!HAS_DOM) return

    const root = this.attachShadow({ mode: "open" })
    const style = document.createElement("style")
    style.textContent = styles
    const template = document.createElement("template")
    template.innerHTML = templateMarkup()
    root.appendChild(style)
    root.appendChild(template.content.cloneNode(true))

    const q = (selector) => root.querySelector(selector)
    this.#stage = q(".stage")
    this.#live = q("[data-live]")

    for (const prop of DELEGATED) {
      Object.defineProperty(this, prop, {
        configurable: true,
        enumerable: true,
        get: () => this.#getDelegated(prop),
        set: (value) => {
          this.#setDelegated(prop, value)
        },
      })
    }

    // The element keeps no visual chrome of its own, but it still narrates its
    // own state to assistive technology: what is hovered, selected, cleared and
    // which layer is active.
    this.addEventListener("geora-select", (event) => {
      if (event.target !== this) return
      this.#announce(announceMarker(event.detail?.marker))
    })
    this.addEventListener("geora-clear", (event) => {
      if (event.target !== this) return
      this.#announce("Selection cleared")
    })
    this.addEventListener("geora-mode-change", (event) => {
      if (event.target !== this) return
      this.#announce(`Layer: ${modeMeta(event.detail.mode).label}`)
    })

    this.#stage.addEventListener("pointerdown", (event) => this.#onStagePointerDown(event))
    this.addEventListener("keydown", (event) => this.#onKeydown(event))
    this.#replayReady()
  }

  // `geora-ready` is emitted from inside `connectedCallback`, so a listener
  // added afterwards — which is exactly what React's `useEffect`, Vue's
  // `onMount` and Svelte's `onMount` do — never hears it. Replay it for those
  // late listeners so the documented event keeps working, and leave
  // `whenReady()` for anyone who would rather await a promise.
  #replayReady() {
    const nativeAdd = this.addEventListener.bind(this)
    const nativeRemove = this.removeEventListener.bind(this)
    const replayed = new WeakSet()

    this.addEventListener = (type, listener, options) => {
      nativeAdd(type, listener, options)
      if (type !== "geora-ready" || typeof listener !== "function") return
      if (!this.#globe?.ready || replayed.has(listener)) return
      if (options?.signal?.aborted) return
      replayed.add(listener)
      // delivered asynchronously so it never lands inside connectedCallback
      queueMicrotask(() => {
        if (options?.signal?.aborted) return
        this.dispatchEvent(new CustomEvent("geora-ready", { detail: {} }))
        if (options?.once) nativeRemove(type, listener, options)
      })
    }

    // a listener that was removed is eligible for a replay again, which keeps
    // StrictMode's add → remove → add mount cycle behaving like two mounts
    this.removeEventListener = (type, listener, options) => {
      nativeRemove(type, listener, options)
      if (type === "geora-ready") replayed.delete(listener)
    }
  }

  // ---- lifecycle ----------------------------------------------------------

  connectedCallback() {
    if (!HAS_DOM || this.#globe) return
    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0")
    if (!this.hasAttribute("role")) this.setAttribute("role", "application")
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Geora interactive globe")

    this.#globe = new GeoraGlobe({
      ...this.#optionsForInit(),
      container: this.#stage,
      eventTarget: this,
    })
    this.#globe.start()
  }

  disconnectedCallback() {
    this.#teardown()
  }

  attributeChangedCallback(name) {
    const prop = PROP_BY_ATTR[name]
    if (!prop) return
    // a changed attribute is the declarative input: it supersedes any
    // property value written before it
    delete this.#pending[prop]
    if (!this.#globe) return
    this.#globe[prop] = this.#valueFromAttr(name, KIND[prop])
  }

  // ---- attribute plumbing -------------------------------------------------

  #boolFromAttr(attr) {
    const value = (this.getAttribute(attr) ?? "").trim().toLowerCase()
    return !(value === "false" || value === "0" || value === "off")
  }

  #motionFromAttr() {
    const value = (this.getAttribute("motion") ?? "").trim().toLowerCase()
    if (value === "auto") return "auto"
    if (value === "false" || value === "0" || value === "off") return false
    return true
  }

  #modesFromAttr() {
    const value = (this.getAttribute("modes") ?? "").trim()
    if (!value) return null
    const keys = value.split(",").map((part) => part.trim()).filter(Boolean)
    return keys.length > 0 ? keys : null
  }

  #valueFromAttr(attr, kind) {
    if (kind === "bool") return this.#boolFromAttr(attr)
    if (kind === "motion") return this.#motionFromAttr()
    if (kind === "modes") return this.#modesFromAttr()
    if (this.getAttribute(attr) === null) return DEFAULTS[PROP_BY_ATTR[attr]]
    if (kind === "number") {
      const num = Number(this.getAttribute(attr))
      return Number.isFinite(num) ? num : DEFAULTS[PROP_BY_ATTR[attr]]
    }
    return this.getAttribute(attr)
  }

  // property written before the first connect: remembered, then replayed over
  // the attribute-derived options so the last write wins
  #readPending(prop) {
    return Object.prototype.hasOwnProperty.call(this.#pending, prop) ? this.#pending[prop] : undefined
  }

  #optionsForInit() {
    const options = {}
    const halftone = {}

    for (const [attr, prop] of Object.entries(PROP_BY_ATTR)) {
      if (!this.hasAttribute(attr)) continue
      const kind = KIND[prop]
      const value = this.#valueFromAttr(attr, kind)
      if (kind === "number") {
        // #valueFromAttr already falls back to the default for invalid input
        if (HALFTONE_KEYS[prop]) halftone[HALFTONE_KEYS[prop]] = value
        else options[prop] = value
        continue
      }
      options[prop] = value
    }

    for (const [prop, value] of Object.entries(this.#pending)) {
      if (value === undefined) continue
      if (prop === "halftone") {
        Object.assign(halftone, value)
      } else if (HALFTONE_KEYS[prop]) {
        const num = Number(value)
        if (Number.isFinite(num)) halftone[HALFTONE_KEYS[prop]] = num
      } else if (KIND[prop] === "number") {
        const num = Number(value)
        if (Number.isFinite(num)) options[prop] = num
      } else {
        options[prop] = value
      }
    }

    if (Object.keys(halftone).length > 0) options.halftone = { ...(options.halftone ?? {}), ...halftone }
    return options
  }

  #teardown() {
    const globe = this.#globe
    this.#globe = null
    globe?.destroy()
    this.#announce("")
    if (this.#stage) {
      this.#stage.dataset.markerHover = ""
      this.#stage.dataset.dragging = ""
    }
  }

  // ---- property plumbing --------------------------------------------------

  #getDelegated(prop) {
    if (this.#globe) return this.#globe[prop]
    const attr = ATTR_BY_PROP[prop]
    const pending = this.#readPending(prop)
    if (pending !== undefined) return pending
    if (attr && this.hasAttribute(attr)) return this.#valueFromAttr(attr, KIND[prop])
    return DEFAULTS[prop]
  }

  #setDelegated(prop, value) {
    this.#pending[prop] = value
    if (!this.#globe) return
    this.#globe[prop] = value
  }

  get autoRotate() {
    return this.spinning
  }

  set autoRotate(value) {
    this.spinning = value
  }

  get modes() {
    if (this.#globe) return this.#globe.modes
    const pending = this.#readPending("modes")
    if (pending !== undefined) return pending
    if (this.hasAttribute("modes")) return this.#modesFromAttr()
    return DEFAULTS.modes
  }

  set modes(value) {
    this.#pending.modes = value
    if (!this.#globe) return
    this.#globe.modes = value
  }

  get motion() {
    if (this.#globe) return this.#globe.settings.motion
    const pending = this.#readPending("motion")
    if (pending !== undefined) return pending
    if (this.hasAttribute("motion")) return this.#motionFromAttr()
    return DEFAULTS.motion
  }

  set motion(value) {
    this.#pending.motion = value
    if (!this.#globe) return
    this.#globe.motion = value
  }

  get halftone() {
    if (this.#globe) return this.#globe.halftone
    const merged = { ...DEFAULT_HALFTONE, ...(this.#readPending("halftone") ?? {}) }
    for (const [prop, key] of Object.entries(HALFTONE_KEYS)) {
      const attr = ATTR_BY_PROP[prop]
      if (this.hasAttribute(attr)) {
        const num = Number(this.getAttribute(attr))
        if (Number.isFinite(num)) merged[key] = num
      }
      const pending = this.#readPending(prop)
      if (pending !== undefined) {
        const num = Number(pending)
        if (Number.isFinite(num)) merged[key] = num
      }
    }
    return merged
  }

  set halftone(value) {
    this.#pending.halftone = value
    if (!this.#globe) return
    this.#globe.halftone = value
  }

  get data() {
    if (this.#globe) return this.#globe.data
    return this.#readPending("data") ?? null
  }

  set data(value) {
    this.#pending.data = value
    if (this.#globe) this.#globe.data = value
  }

  // ---- public methods -----------------------------------------------------

  start() {
    if (HAS_DOM && this.isConnected && !this.#globe) {
      this.connectedCallback()
      return
    }
    this.#globe?.start()
  }

  stop() {
    this.#globe?.stop()
  }

  destroy() {
    this.#teardown()
  }

  reset() {
    this.#globe?.reset()
  }

  /** True once the element has mounted its globe and emitted `geora-ready`. */
  get ready() {
    return this.#globe ? this.#globe.ready : false
  }

  /**
   * Resolves once the globe is up. Framework mount hooks run *after*
   * `connectedCallback`, so a `geora-ready` listener added there is too late to
   * hear the event; await this instead.
   *
   *   onMount(async () => { await el.whenReady(); ... })
   */
  whenReady() {
    // resolves with the element, so a host can chain off the same reference it
    // already holds rather than reaching for the internal engine
    if (this.#globe) return this.#globe.whenReady().then(() => this)
    // not connected yet: resolve as soon as connectedCallback builds the globe
    return new Promise((resolve) => {
      const check = () => {
        if (!this.#globe) return false
        this.removeEventListener("geora-ready", check)
        resolve(this)
        return true
      }
      if (check()) return
      this.addEventListener("geora-ready", check)
    })
  }

  // read-only views onto the engine, mirrored from GeoraGlobe so hosts never
  // have to reach through #globe
  get selection() {
    return this.#globe ? this.#globe.selection : null
  }

  get settings() {
    return this.#globe ? this.#globe.settings : null
  }

  clearSelection() {
    return this.#globe ? this.#globe.clearSelection() : false
  }

  selectCountry(code) {
    return this.#globe ? this.#globe.selectCountry(code) : false
  }

  flyTo(lat, lon) {
    this.#globe?.flyTo(lat, lon)
  }

  setData(next) {
    return this.#globe ? this.#globe.setData(next ?? {}) : (this.data ?? {})
  }

  rotate(dx, dy) {
    this.#globe?.rotate(dx, dy)
  }

  zoom(delta) {
    this.#globe?.zoom(delta)
  }

  // ---- accessibility ------------------------------------------------------

  #announce(text) {
    if (this.#live) this.#live.textContent = text
  }

  // ---- interaction --------------------------------------------------------

  #onStagePointerDown() {
    this.focus({ preventScroll: true })
  }

  #onKeydown(event) {
    const globe = this.#globe
    if (!globe || event.defaultPrevented) return
    const key = event.key

    if (key === "Escape") {
      if (globe.clearSelection()) {
        event.preventDefault()
        this.focus({ preventScroll: true })
      }
      return
    }

    if (key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown") {
      const step = 36
      const dx = key === "ArrowLeft" ? -step : key === "ArrowRight" ? step : 0
      const dy = key === "ArrowUp" ? -step : key === "ArrowDown" ? step : 0
      globe.rotate(dx, dy)
      event.preventDefault()
      return
    }

    if (key === "+" || key === "=" || key === "PageUp") {
      globe.zoom(-0.5)
      event.preventDefault()
      return
    }
    if (key === "-" || key === "_" || key === "PageDown") {
      globe.zoom(0.5)
      event.preventDefault()
      return
    }
    if (key === "Home") {
      globe.reset()
      event.preventDefault()
      return
    }

    if (/^[1-9]$/.test(key)) {
      const target = globe.modes[Number(key) - 1]
      if (target) {
        globe.mode = target
        event.preventDefault()
      }
    }
  }
}
