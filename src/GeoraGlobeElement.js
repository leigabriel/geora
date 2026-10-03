import { GeoraGlobe, DEFAULT_HALFTONE, DEFAULT_PROFILE } from "./core/GeoraGlobe.js"
import { THEMES, THEME_KEYS, DEFAULT_THEME, themeHex } from "./themes/themes.js"
import { modeMeta } from "./data/modes.js"
import styles from "./styles.css?raw"

// SSR-safe base: importing the package on the server must not throw; the
// element simply never upgrades there.
const HTMLElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {}
const HAS_DOM = typeof document !== "undefined"

// attribute -> property. `auto-rotate` is the documented alias of `spinning`.
const PROP_BY_ATTR = {
  "auto-rotate": "spinning",
  theme: "theme",
  mode: "mode",
  modes: "modes",
  motion: "motion",
  "show-borders": "showBorders",
  "show-markers": "showMarkers",
  "show-controls": "showControls",
  "show-navigation": "showNavigation",
  "show-info-card": "showInfoCard",
  "show-tooltip": "showTooltip",
  "show-settings": "showSettings",
  "show-hud": "showHud",
  minimal: "minimal",
  persistence: "persistence",
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
}

const ATTR_BY_PROP = Object.fromEntries(Object.entries(PROP_BY_ATTR).map(([attr, prop]) => [prop, attr]))

const KIND = {}
for (const prop of Object.values(PROP_BY_ATTR)) KIND[prop] = "bool"
for (const prop of ["globeScale", "markerScale", "detail", "animation", "halftoneDensity", "halftoneScale", "contrast", "threshold", "intensity", "ambient", "oceanOpacity"]) KIND[prop] = "number"
KIND.theme = "string"
KIND.mode = "string"
KIND.flagBase = "string"
KIND.motion = "motion"
KIND.modes = "modes"

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
  showTooltip: true,
  showInfoCard: true,
  showControls: true,
  showNavigation: true,
  showHud: true,
  showSettings: false,
  minimal: false,
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
  "showBorders", "showMarkers", "showTooltip", "showInfoCard", "showControls", "showNavigation",
  "showSettings", "showHud", "minimal", "persistence",
]

const TOOLTIP_TAGS = {
  country: "BEACON",
  center: "AI CENTER",
  analytics: "TELEMETRY",
  polaroid: "PHOTO",
  marker: "MARKER",
}

const CARD_KINDS = {
  country: "Country",
  center: "AI data center",
  analytics: "Analytics",
  polaroid: "Polaroid",
  marker: "Marker",
}

function formatCoord(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return "—"
  return `${num >= 0 ? "+" : "-"}${Math.abs(num).toFixed(2)}°`
}

// One tooltip row; empty values are dropped rather than rendered as blanks.
function cardRow(label, value) {
  if (value === null || value === undefined || value === "") return null
  return [label, String(value)]
}

function cardContent(marker) {
  if (!marker) return null

  if (marker.kind === "country") {
    const c = marker.country ?? {}
    return {
      kind: CARD_KINDS.country,
      title: c.country ?? c.code ?? "",
      subtitle: c.region ?? "",
      rows: [
        cardRow("Capital", c.name),
        cardRow("Pop", c.pop),
        cardRow("Time", c.tz),
        cardRow("Currency", c.curr),
        cardRow("Region", c.region),
        cardRow("Lat", formatCoord(c.lat)),
        cardRow("Lon", formatCoord(c.lon)),
      ],
      note: c.fact ?? "",
    }
  }

  if (marker.kind === "center") {
    const center = marker.center ?? {}
    const place = marker.country ?? null
    return {
      kind: CARD_KINDS.center,
      title: center.name ?? "",
      subtitle: center.status ?? "",
      rows: [
        cardRow("Operator", center.operator),
        cardRow("Country", place ? place.country : center.code),
        cardRow("Capacity", center.powerGW ? `${center.powerGW} GW announced` : "Not disclosed"),
        cardRow("Status", center.status),
        cardRow("Focus", center.focus),
        cardRow("Lat", formatCoord(center.lat)),
        cardRow("Lon", formatCoord(center.lon)),
      ],
      note: "Capacity is the operator's announced figure, or blank where none has been published.",
    }
  }

  if (marker.kind === "analytics") {
    const country = marker.country ?? {}
    const row = marker.row ?? null
    if (!row) {
      return {
        kind: CARD_KINDS.analytics,
        title: country.country ?? "",
        subtitle: country.region ?? "",
        rows: [],
        note: "No telemetry for this nation.",
      }
    }
    return {
      kind: CARD_KINDS.analytics,
      title: country.country ?? "",
      subtitle: `${country.region ?? ""} · modeled`.replace(/^ · /, ""),
      rows: [
        cardRow("Traffic", Number.isFinite(row.traffic) ? `${row.traffic} Gbps` : null),
        cardRow("Sessions", Number.isFinite(row.sessions) ? `${row.sessions} k/hr` : null),
        cardRow("Uptime", Number.isFinite(row.uptime) ? `${row.uptime}%` : null),
        cardRow("Latency", Number.isFinite(row.latency) ? `${row.latency} ms` : null),
      ],
      note: "Modeled from population, timezone and a hash of the country code. Not measured traffic.",
    }
  }

  if (marker.kind === "polaroid") {
    const photo = marker.landmark ?? {}
    return {
      kind: CARD_KINDS.polaroid,
      title: photo.caption ?? "Photograph",
      subtitle: photo.country ?? "",
      image: photo.image ?? photo.src ?? null,
      rows: [
        cardRow("Landmark", photo.caption),
        cardRow("Country", photo.country),
        cardRow("Lat", formatCoord(photo.lat)),
        cardRow("Lon", formatCoord(photo.lon)),
      ],
      note: "",
    }
  }

  if (marker.kind === "marker") {
    const m = marker.marker ?? {}
    return {
      kind: CARD_KINDS.marker,
      title: m.name ?? "",
      subtitle: m.type ?? "",
      rows: [
        cardRow("Type", m.type),
        cardRow("Lat", formatCoord(m.lat)),
        cardRow("Lon", formatCoord(m.lon)),
      ],
      note: "",
    }
  }

  return null
}

function tooltipContent(marker) {
  const tag = TOOLTIP_TAGS[marker.kind] ?? "BEACON"
  if (marker.kind === "country") {
    return { tag, headline: marker.country?.country ?? "", detail: marker.country?.name ?? tag }
  }
  if (marker.kind === "polaroid") {
    return { tag, headline: marker.landmark?.caption ?? tag, detail: marker.landmark?.country ?? tag }
  }
  if (marker.kind === "center") {
    return { tag, headline: marker.center?.name ?? tag, detail: tag }
  }
  if (marker.kind === "analytics") {
    return { tag, headline: marker.country?.country ?? tag, detail: tag }
  }
  if (marker.kind === "marker") {
    return { tag, headline: marker.marker?.name ?? tag, detail: marker.marker?.type ?? tag }
  }
  return { tag, headline: tag, detail: tag }
}

function templateMarkup() {
  return `
    <div class="stage" part="stage">
      <div class="tooltip panel" part="tooltip" data-ui data-visible="false" aria-hidden="true">
        <div class="tooltip-tag"></div>
        <div class="tooltip-title"></div>
        <div class="tooltip-sub"></div>
      </div>
      <div class="card panel" part="card" data-ui role="dialog" aria-label="Selection details" hidden>
        <div class="card-head">
          <div class="card-text">
            <div class="card-kind"></div>
            <div class="card-title"></div>
            <div class="card-sub"></div>
          </div>
          <button type="button" class="card-close" data-action="close-card" aria-label="Close details" title="Close (Esc)">&#10005;</button>
        </div>
        <div class="card-body"></div>
      </div>
      <div class="controls panel" part="controls" data-ui role="group" aria-label="Globe controls" hidden>
        <button type="button" class="btn" data-action="reset">Reset</button>
        <button type="button" class="btn" data-action="spin" aria-pressed="true">Spin</button>
      </div>
      <nav class="nav panel" part="nav" data-ui aria-label="Layers" hidden>
        <button type="button" class="btn" data-action="prev" aria-label="Previous layer" title="Previous layer">&#8249;</button>
        <span class="nav-label"></span>
        <span class="nav-count"></span>
        <button type="button" class="btn" data-action="next" aria-label="Next layer" title="Next layer">&#8250;</button>
      </nav>
      <button type="button" class="btn panel settings-toggle" part="settings-toggle" data-ui data-action="settings" aria-label="Settings" title="Settings" aria-expanded="false" hidden>&#9881;</button>
      <div class="settings panel" part="settings" data-ui hidden>
        <div class="settings-section">
          <h3 id="geora-theme-label">Theme</h3>
          <div class="theme-grid" role="group" aria-labelledby="geora-theme-label"></div>
        </div>
        <div class="settings-section">
          <h3 id="geora-detail-label">Detail</h3>
          <div class="row" role="group" aria-labelledby="geora-detail-label">
            <button type="button" class="btn" data-action="detail" data-detail="0">Low</button>
            <button type="button" class="btn" data-action="detail" data-detail="1">Med</button>
            <button type="button" class="btn" data-action="detail" data-detail="2">High</button>
          </div>
        </div>
        <div class="settings-section">
          <h3 id="geora-motion-label">Motion</h3>
          <div class="row">
            <button type="button" class="btn" data-action="motion" role="switch" aria-checked="true" aria-labelledby="geora-motion-label">Enabled</button>
          </div>
        </div>
      </div>
      <div class="sr" role="status" data-live></div>
    </div>
  `
}

// The <geora-globe> custom element: builds the shadow DOM chrome, translates
// attributes and properties into GeoraGlobe options, and renders the optional
// HUD (tooltip, info card, controls, layer navigation, settings) from public
// events. Hosts that want a different interface can hide every piece with
// `minimal` or the individual `show-*` switches and build their own.
export class GeoraGlobeElement extends HTMLElementBase {
  static get observedAttributes() {
    return Object.keys(PROP_BY_ATTR)
  }

  #globe = null
  #pending = {}
  #stage = null
  #tooltip = null
  #card = null
  #controls = null
  #nav = null
  #settingsToggle = null
  #settings = null
  #live = null
  #navLabel = null
  #navCount = null
  #spinButton = null
  #tooltipAllowed = true
  #cardAllowed = true

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
    this.#tooltip = q(".tooltip")
    this.#card = q(".card")
    this.#controls = q(".controls")
    this.#nav = q(".nav")
    this.#settingsToggle = q(".settings-toggle")
    this.#settings = q(".settings")
    this.#live = q("[data-live]")
    this.#navLabel = q(".nav-label")
    this.#navCount = q(".nav-count")
    this.#spinButton = q('[data-action="spin"]')

    const themeGrid = q(".theme-grid")
    for (const key of THEME_KEYS) {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "btn"
      button.dataset.action = "theme"
      button.dataset.theme = key
      const swatch = document.createElement("span")
      swatch.className = "swatch"
      swatch.style.background = themeHex(THEMES[key].background)
      swatch.style.borderColor = themeHex(THEMES[key].accent ?? THEMES[key].border)
      const label = document.createElement("span")
      label.className = "theme-name"
      label.textContent = THEMES[key].label
      button.append(swatch, label)
      themeGrid.appendChild(button)
    }

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

    this.addEventListener("geora-hover", (event) => {
      if (event.target !== this) return
      this.#showTooltip(event.detail)
    })
    this.addEventListener("geora-select", (event) => {
      if (event.target !== this) return
      this.#openCard(event.detail)
    })
    this.addEventListener("geora-clear", (event) => {
      if (event.target !== this) return
      this.#closeCard()
      this.#announce("Selection cleared")
    })
    this.addEventListener("geora-mode-change", (event) => {
      if (event.target !== this) return
      this.#renderNav(event.detail)
      this.#syncSettingsPressed()
    })
    this.addEventListener("geora-theme-change", (event) => {
      if (event.target !== this) return
      this.#syncSettingsPressed()
    })
    this.addEventListener("geora-reset", (event) => {
      if (event.target !== this) return
      this.#syncChrome()
    })

    this.#stage.addEventListener("click", (event) => this.#onStageClick(event))
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
    this.#syncChrome()
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
    this.#syncChrome()
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
    this.#hideTooltip()
    this.#closeCard()
    this.#closeSettings()
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
    this.#syncChrome()
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
    this.#syncChrome()
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
    this.#syncChrome()
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
    this.#syncChrome()
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

  // ---- chrome (HUD) -------------------------------------------------------

  #hudOn() {
    if (!this.#globe) return false
    return this.#globe.showHud && !this.#globe.minimal
  }

  #syncChrome() {
    const globe = this.#globe
    if (!globe) return
    const settings = globe.settings
    const hud = this.#hudOn()

    this.#controls.hidden = !(hud && settings.showControls)
    this.#nav.hidden = !(hud && settings.showNavigation)
    this.#settingsToggle.hidden = !(hud && settings.showSettings)
    this.#tooltipAllowed = hud && settings.showTooltip
    this.#cardAllowed = hud && settings.showInfoCard

    if (!this.#tooltipAllowed) this.#hideTooltip()
    if (!this.#cardAllowed) this.#closeCard()
    if (!hud || !settings.showSettings) this.#closeSettings()

    const spinning = Boolean(settings.spinning)
    this.#spinButton.setAttribute("aria-pressed", String(spinning))
    const spinLabel = spinning ? "Pause rotation" : "Resume rotation"
    this.#spinButton.setAttribute("aria-label", spinLabel)
    this.#spinButton.title = spinLabel
    this.#spinButton.disabled = !globe.motion

    this.#renderNav()
    this.#syncSettingsPressed()
  }

  #renderNav(detail) {
    const globe = this.#globe
    if (!globe) return
    const modes = detail?.modes ?? globe.modes
    const mode = detail?.mode ?? globe.mode
    const index = modes.indexOf(mode)
    this.#navLabel.textContent = modeMeta(mode).label
    this.#navCount.textContent = `${index + 1} / ${modes.length}`
    const single = modes.length < 2
    this.#nav.querySelector('[data-action="prev"]').disabled = single
    this.#nav.querySelector('[data-action="next"]').disabled = single
  }

  #syncSettingsPressed() {
    const globe = this.#globe
    if (!globe) return
    const settings = globe.settings
    for (const button of this.#settings.querySelectorAll('[data-action="theme"]')) {
      button.setAttribute("aria-pressed", String(button.dataset.theme === settings.theme))
    }
    const detail = Math.round(Number(settings.detail))
    for (const button of this.#settings.querySelectorAll('[data-action="detail"]')) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.detail) === detail))
    }
    const motionButton = this.#settings.querySelector('[data-action="motion"]')
    motionButton.setAttribute("aria-checked", String(globe.motion))
    motionButton.textContent = globe.motion ? "Enabled" : "Disabled"
  }

  #openSettings() {
    this.#settings.hidden = false
    this.#settingsToggle.setAttribute("aria-expanded", "true")
    this.#syncSettingsPressed()
  }

  #closeSettings() {
    if (this.#settings.hidden) return
    this.#settings.hidden = true
    this.#settingsToggle.setAttribute("aria-expanded", "false")
  }

  // ---- tooltip and card ---------------------------------------------------

  #placeFloating(element, clientX, clientY, offsetX, offsetY) {
    const rect = this.#stage.getBoundingClientRect()
    const width = element.offsetWidth
    const height = element.offsetHeight
    const minX = 8
    const minY = 8
    const maxX = Math.max(minX, rect.width - width - 8)
    const maxY = Math.max(minY, rect.height - height - 8)
    const x = Math.min(Math.max(clientX - rect.left + offsetX, minX), maxX)
    const y = Math.min(Math.max(clientY - rect.top + offsetY, minY), maxY)
    element.style.left = `${x}px`
    element.style.top = `${y}px`
  }

  #showTooltip(detail) {
    const marker = detail?.marker
    if (!marker || !this.#tooltipAllowed) {
      this.#hideTooltip()
      return
    }
    const content = tooltipContent(marker)
    this.#tooltip.querySelector(".tooltip-tag").textContent = content.tag
    this.#tooltip.querySelector(".tooltip-title").textContent = content.headline
    this.#tooltip.querySelector(".tooltip-sub").textContent = `${content.detail} · select to inspect`
    this.#placeFloating(this.#tooltip, Number(detail.x) || 0, Number(detail.y) || 0, 14, -40)
    this.#tooltip.dataset.visible = "true"
  }

  #hideTooltip() {
    this.#tooltip.dataset.visible = "false"
  }

  #openCard(detail) {
    const marker = detail?.marker
    if (!marker) return
    this.#hideTooltip()
    this.#announceSelect(marker)

    if (!this.#cardAllowed) return
    const content = cardContent(marker)
    if (!content) return

    this.#card.querySelector(".card-kind").textContent = content.kind
    this.#card.querySelector(".card-title").textContent = content.title
    const sub = this.#card.querySelector(".card-sub")
    sub.textContent = content.subtitle ?? ""
    sub.hidden = !content.subtitle

    const body = this.#card.querySelector(".card-body")
    body.replaceChildren()

    if (content.image) {
      const image = document.createElement("img")
      image.className = "card-image"
      image.alt = content.title
      image.loading = "lazy"
      // a photo that will not load leaves the card as text rather than a
      // broken-image glyph
      image.addEventListener("error", () => image.remove(), { once: true })
      image.src = content.image
      body.appendChild(image)
    }

    const rows = (content.rows ?? []).filter(Boolean)
    if (rows.length > 0) {
      const list = document.createElement("div")
      for (const [label, value] of rows) {
        const row = document.createElement("div")
        row.className = "card-row"
        const name = document.createElement("span")
        name.className = "card-row-label"
        name.textContent = label
        const val = document.createElement("span")
        val.className = "card-row-value"
        val.textContent = value
        row.append(name, val)
        list.appendChild(row)
      }
      body.appendChild(list)
    }

    if (content.note) {
      const note = document.createElement("p")
      note.className = "card-note"
      note.textContent = content.note
      body.appendChild(note)
    }

    this.#card.hidden = false

    const rect = this.#stage.getBoundingClientRect()
    const x = Number(detail.x)
    const y = Number(detail.y)
    if (Number.isFinite(x) && Number.isFinite(y)) {
      const below = y - rect.top < rect.height * 0.4
      this.#card.style.transformOrigin = below ? "50% 0%" : "50% 100%"
      this.#placeFloating(this.#card, x, y, -this.#card.offsetWidth / 2, below ? 18 : -(this.#card.offsetHeight + 18))
    } else {
      this.#card.style.transformOrigin = "50% 50%"
      this.#placeFloating(this.#card, rect.left + rect.width / 2, rect.top + rect.height / 2, -this.#card.offsetWidth / 2, -this.#card.offsetHeight / 2)
    }
  }

  #closeCard() {
    if (this.#card.hidden) return
    this.#card.hidden = true
  }

  #announce(text) {
    this.#live.textContent = text
  }

  #announceSelect(marker) {
    const content = cardContent(marker)
    if (!content) return
    this.#announce([content.kind, content.title].filter(Boolean).join(": "))
  }

  // ---- interaction --------------------------------------------------------

  #onStageClick(event) {
    const button = event.target.closest?.("button[data-action]")
    if (!button) return
    const globe = this.#globe
    if (!globe) return

    switch (button.dataset.action) {
      case "reset":
        globe.reset()
        break
      case "spin":
        globe.spinning = !globe.spinning
        this.#syncChrome()
        break
      case "prev":
      case "next": {
        const modes = globe.modes
        const step = button.dataset.action === "next" ? 1 : -1
        globe.mode = modes[(modes.indexOf(globe.mode) + step + modes.length) % modes.length]
        break
      }
      case "settings":
        if (this.#settings.hidden) this.#openSettings()
        else this.#closeSettings()
        break
      case "theme":
        globe.theme = button.dataset.theme
        break
      case "detail":
        globe.detail = Number(button.dataset.detail)
        this.#syncSettingsPressed()
        break
      case "motion":
        globe.motion = !globe.motion
        this.#syncChrome()
        break
      case "close-card":
        globe.clearSelection()
        this.focus({ preventScroll: true })
        break
      default:
        break
    }
  }

  #onStagePointerDown(event) {
    if (event.target.closest?.("[data-ui]")) return
    this.focus({ preventScroll: true })
  }

  #onKeydown(event) {
    const globe = this.#globe
    if (!globe || event.defaultPrevented) return
    const key = event.key

    if (key === "Escape") {
      if (!this.#settings.hidden) {
        this.#closeSettings()
        this.#settingsToggle.focus()
        event.preventDefault()
        return
      }
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
