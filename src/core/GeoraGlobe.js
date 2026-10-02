import { createGlobeScene } from "./GlobeScene.js"
import { resolveTheme, themeToPublic, DEFAULT_THEME, THEME_KEYS, THEMES, nextTheme } from "../themes/themes.js"
import { MODE_KEYS, modeMeta } from "../data/modes.js"
import { COUNTRIES_DATA } from "../data/countries.js"
import { AI_CENTERS } from "../data/centers.js"
import { defaultLandmarks } from "../data/landmarks.js"
import { buildAnalytics } from "../analytics/analytics.js"

export const DEFAULT_HALFTONE = {
  density: 1.0,
  scale: 1.0,
  contrast: 1.0,
  threshold: 0.4,
  intensity: 1.0,
  ambient: 0.2,
  ocean: 1.0,
}

export const DEFAULT_PROFILE = {
  globeScale: 0.7,
  markerScale: 0.75,
  detail: 2,
  animation: 1,
}

const PREFS_KEY = "geora-globe:prefs:v1"

const AUTO_MODE_KEYS = ["country", "polaroid", "analytics", "centers"]

// Turns an internal descriptor into the plain, structured payload hosts see on
// the wire: data objects only, never engine internals.
function toPublicMarker(descriptor) {
  if (!descriptor) return null
  switch (descriptor.kind) {
    case "country":
      return { kind: "country", country: descriptor.place }
    case "center":
      return { kind: "center", center: descriptor.center, country: descriptor.place }
    case "analytics":
      return { kind: "analytics", country: descriptor.place, row: descriptor.row }
    case "polaroid":
      return { kind: "polaroid", landmark: descriptor.photo }
    case "marker":
      return { kind: "marker", marker: descriptor.marker }
    default:
      return { kind: descriptor.kind }
  }
}

function finite(value, fallback) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function normalizeCountries(list) {
  if (!Array.isArray(list)) return null
  return list
    .filter((item) => item && typeof item === "object" && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)))
    .map((item) => ({ ...item, code: String(item.code ?? ""), lat: Number(item.lat), lon: Number(item.lon) }))
}

function normalizeCenters(list) {
  if (!Array.isArray(list)) return null
  return list
    .filter((item) => item && typeof item === "object" && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)))
    .map((item, index) => ({
      ...item,
      id: String(item.id ?? `center-${index}`),
      lat: Number(item.lat),
      lon: Number(item.lon),
    }))
}

function normalizeMarkers(list) {
  if (!Array.isArray(list)) return null
  return list
    .filter((item) => item && typeof item === "object" && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)))
    .map((item, index) => ({
      ...item,
      id: String(item.id ?? `marker-${index}`),
      name: String(item.name ?? item.id ?? "Marker"),
      lat: Number(item.lat),
      lon: Number(item.lon),
      type: String(item.type ?? "custom"),
    }))
}

function normalizeLandmarks(list) {
  if (!Array.isArray(list)) return null
  return list.map((item, index) => ({
    ...item,
    id: String(item.id ?? `landmark-${index}`),
    country: String(item.country ?? ""),
    image: item.image ?? item.src ?? undefined,
  }))
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
  try {
    return Boolean(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  } catch {
    return false
  }
}

// The framework-agnostic globe: owns the engine for one container, exposes
// configuration, data, methods and DOM events. Used directly by hosts that do
// not want the custom element, and internally by <geora-globe>.
export class GeoraGlobe extends EventTarget {
  #container
  #eventTarget
  #scene = null
  #sceneFactory
  #destroyed = false
  #ready = false

  #content = { countries: [], centers: [], markers: [] }
  #landmarks = []
  #analytics = null
  #metric = "traffic"

  #theme
  #halftone = { ...DEFAULT_HALFTONE }
  #profile = { ...DEFAULT_PROFILE }
  #mode = "country"
  #modes = null
  #autoModes = true
  #spinning = true
  #motionPref = "auto"
  #motionQuery = null
  #motionListener = null
  #showBorders = true
  #showMarkers = true
  #showTooltip = true
  #showInfoCard = true
  #showControls = true
  #showNavigation = true
  #showSettings = false
  #showHud = true
  #minimal = false
  #persistence = false
  #flagBase = ""

  #selection = null
  #snapshot = null

  constructor(options = {}) {
    super()
    const {
      container,
      eventTarget = null,
      sceneFactory = createGlobeScene,
      data = null,
      theme = DEFAULT_THEME,
      mode = "country",
      modes = null,
      spinning = true,
      motion = "auto",
      showBorders = true,
      showMarkers = true,
      showTooltip = true,
      showInfoCard = true,
      showControls = true,
      showNavigation = true,
      showSettings = false,
      showHud = true,
      minimal = false,
      persistence = false,
      flagBase = "",
      globeScale = DEFAULT_PROFILE.globeScale,
      markerScale = DEFAULT_PROFILE.markerScale,
      detail = DEFAULT_PROFILE.detail,
      animation = DEFAULT_PROFILE.animation,
      halftone = null,
    } = options

    if (!container) throw new TypeError("GeoraGlobe requires a container element")

    this.#container = container
    this.#eventTarget = eventTarget ?? this
    this.#sceneFactory = sceneFactory

    // stored preferences apply first, explicit options win over them
    const stored = persistence ? this.#readPrefs() : null
    const pick = (key, storedValue, fallback) =>
      options[key] !== undefined ? options[key] : storedValue ?? fallback

    this.#spinning = pick("spinning", stored?.spinning, spinning)
    this.#motionPref = pick("motion", stored?.motion, motion)
    this.#showBorders = pick("showBorders", stored?.showBorders, showBorders)
    this.#showMarkers = pick("showMarkers", stored?.showMarkers, showMarkers)
    this.#showTooltip = pick("showTooltip", stored?.showTooltip, showTooltip)
    this.#showInfoCard = pick("showInfoCard", stored?.showInfoCard, showInfoCard)
    this.#showControls = pick("showControls", stored?.showControls, showControls)
    this.#showNavigation = pick("showNavigation", stored?.showNavigation, showNavigation)
    this.#showSettings = pick("showSettings", stored?.showSettings, showSettings)
    this.#showHud = pick("showHud", stored?.showHud, showHud)
    this.#minimal = pick("minimal", stored?.minimal, minimal)
    this.#flagBase = pick("flagBase", stored?.flagBase, flagBase)
    this.#persistence = Boolean(persistence)

    const storedProfile = stored?.profile ?? {}
    const profileValue = (key, value, fallback) =>
      options[key] !== undefined ? finite(value, fallback) : finite(storedProfile[key] ?? value, fallback)
    this.#profile = {
      globeScale: profileValue("globeScale", globeScale, DEFAULT_PROFILE.globeScale),
      markerScale: profileValue("markerScale", markerScale, DEFAULT_PROFILE.markerScale),
      detail: profileValue("detail", detail, DEFAULT_PROFILE.detail),
      animation: profileValue("animation", animation, DEFAULT_PROFILE.animation),
    }
    this.#halftone = { ...DEFAULT_HALFTONE, ...(stored?.halftone ?? {}), ...(halftone ?? {}) }

    this.#theme = resolveTheme(pick("theme", stored?.theme, theme))

    // data: stored data is not persisted; defaults or the explicit set wins
    const countries = normalizeCountries(data?.countries) ?? COUNTRIES_DATA
    const centers = normalizeCenters(data?.centers) ?? AI_CENTERS
    const markers = normalizeMarkers(data?.markers) ?? []
    const landmarks = normalizeLandmarks(data?.landmarks) ?? defaultLandmarks
    this.#content = { countries, centers, markers }
    this.#landmarks = landmarks
    this.#analytics = buildAnalytics(countries)

    const wantedMode = pick("mode", stored?.mode, mode)
    this.#setModes(pick("modes", stored?.modes, modes), true)
    this.#mode = MODE_KEYS.includes(wantedMode) ? wantedMode : "country"
    if (!this.#modes.includes(this.#mode)) this.#mode = this.#modes[0]

    this.#scene = this.#sceneFactory({
      container,
      content: this.#content,
      options: { flagBase: this.#flagBase },
    })

    this.#bindControls()
    this.#watchMotion()
    this.#sync()

    this.#scene.setAnalytics(this.#analytics, this.#metric)
    this.#scene.setPolaroids(this.#landmarks)
  }

  // ---- internals ----------------------------------------------------------

  #emit(type, detail) {
    const event = new CustomEvent(type, { detail, bubbles: true, composed: true })
    this.#eventTarget.dispatchEvent(event)
    return event
  }

  #readPrefs() {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(PREFS_KEY) : null
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  #writePrefs() {
    if (!this.#persistence) return
    try {
      const payload = {
        theme: this.#theme.key ?? themeToPublic(this.#theme),
        mode: this.#mode,
        spinning: this.#spinning,
        motion: this.#motionPref,
        showBorders: this.#showBorders,
        showMarkers: this.#showMarkers,
        showTooltip: this.#showTooltip,
        showInfoCard: this.#showInfoCard,
        showControls: this.#showControls,
        showNavigation: this.#showNavigation,
        showSettings: this.#showSettings,
        showHud: this.#showHud,
        minimal: this.#minimal,
        flagBase: this.#flagBase,
        profile: this.#profile,
        halftone: this.#halftone,
      }
      if (typeof localStorage !== "undefined") localStorage.setItem(PREFS_KEY, JSON.stringify(payload))
    } catch {
      // a blocked or full store must not break the globe
    }
  }

  #watchMotion() {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    try {
      this.#motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    } catch {
      this.#motionQuery = null
      return
    }
    this.#motionListener = () => {
      this.#applyMotion()
    }
    if (typeof this.#motionQuery.addEventListener === "function") {
      this.#motionQuery.addEventListener("change", this.#motionListener)
    }
  }

  #motionEnabled() {
    if (this.#motionPref === "auto") return !prefersReducedMotion()
    return Boolean(this.#motionPref)
  }

  #applyMotion() {
    const enabled = this.#motionEnabled()
    this.#scene?.setMotion(enabled)
    this.#scene?.setAutoRotate(Boolean(this.#spinning) && enabled)
  }

  #setModes(list, initial = false) {
    let next = null
    if (list == null) {
      next = [...AUTO_MODE_KEYS]
      if (this.#content.markers.length > 0) next.push("markers")
    } else if (Array.isArray(list)) {
      const keys = [
        ...new Set(
          list
            .map((item) => (typeof item === "string" ? item : item?.key))
            .filter((key) => typeof key === "string" && MODE_KEYS.includes(key)),
        ),
      ]
      // an invalid list leaves the current modes untouched
      if (keys.length > 0) next = keys
      else if (!initial) return
      else next = [...AUTO_MODE_KEYS]
    } else if (!initial) {
      return
    }

    if (next) this.#autoModes = list == null
    if (next) this.#modes = next
    if (!this.#modes) this.#modes = [...AUTO_MODE_KEYS]

    if (!this.#modes.includes(this.#mode)) {
      this.#mode = this.#modes[0]
      this.#scene?.setMode(this.#mode)
      if (!initial) {
        this.#clearSelection()
        this.#emit("geora-mode-change", { mode: this.#mode, modes: [...this.#modes] })
      }
    }
  }

  #sync() {
    const scene = this.#scene
    if (!scene || this.#destroyed) return
    scene.setTheme(this.#theme)
    scene.setHalftone(this.#halftone)
    scene.setGlobeScale(this.#profile.globeScale)
    scene.setMarkerScale(this.#profile.markerScale)
    scene.setDetail(this.#profile.detail)
    scene.setAnimationIntensity(this.#profile.animation)
    scene.setShowBorders(this.#showBorders)
    scene.setMarkersVisible(this.#showMarkers)
    scene.setMode(this.#mode)
    scene.setAutoRotate(Boolean(this.#spinning) && this.#motionEnabled())
    this.#applyMotion()
  }

  #bindControls() {
    this.#scene.bindControls({
      onHover: (descriptor, x, y) => {
        this.#scene.setHoverHighlight(descriptor)
        const marker = toPublicMarker(descriptor)
        this.#container.dataset.markerHover = String(Boolean(descriptor))
        this.#emit("geora-hover", { marker, x, y })
      },
      onSelect: (descriptor, x, y) => {
        this.#selectDescriptor(descriptor, x, y)
      },
      onSphere: (hit, x, y) => {
        const info = this.#scene.locate(hit.lat, hit.lon)
        this.clearSelection()
        this.#emit("geora-sphere-select", {
          lat: hit.lat,
          lon: hit.lon,
          onLand: Boolean(info.onLand),
          country: info.place ?? null,
          distanceKm: Number.isFinite(info.distanceKm) ? info.distanceKm : null,
          x,
          y,
        })
      },
    })
  }

  #selectDescriptor(descriptor, x = null, y = null) {
    if (!descriptor) return
    this.#scene.setSelected(descriptor)
    this.#selection = { descriptor, marker: toPublicMarker(descriptor) }
    if (!this.#snapshot) this.#snapshot = this.#scene.snapshot()

    const place = descriptor.place
      ?? (descriptor.kind === "polaroid" ? descriptor.photo : null)
      ?? (descriptor.kind === "center" ? descriptor.center : null)
      ?? (descriptor.kind === "marker" ? descriptor.marker : null)
    if (place && Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon))) {
      this.#scene.flyTo({ lat: Number(place.lat), lon: Number(place.lon) })
    }

    const detail = { marker: this.#selection.marker, x, y }
    this.#emit("geora-select", detail)
    if (descriptor.kind === "country") {
      this.#emit("geora-country-select", { country: descriptor.place, x, y })
    } else if (descriptor.kind === "marker") {
      this.#emit("geora-marker-select", { marker: descriptor.marker, x, y })
    }
  }

  #clearSelection() {
    if (!this.#selection) return false
    this.#selection = null
    this.#scene.setSelected(null)
    if (this.#snapshot) {
      this.#scene.restore(this.#snapshot)
      this.#snapshot = null
    }
    this.#emit("geora-clear", {})
    return true
  }

  // ---- public methods -----------------------------------------------------

  start() {
    if (this.#destroyed) return
    this.#scene.start()
    if (!this.#ready) {
      this.#ready = true
      this.#emit("geora-ready", {})
    }
  }

  stop() {
    if (this.#destroyed) return
    this.#scene.stop()
  }

  destroy() {
    if (this.#destroyed) return
    this.#destroyed = true
    this.#scene?.dispose()
    this.#scene = null
    if (this.#motionQuery && this.#motionListener && typeof this.#motionQuery.removeEventListener === "function") {
      this.#motionQuery.removeEventListener("change", this.#motionListener)
    }
    this.#motionQuery = null
    this.#motionListener = null
    this.#selection = null
    this.#snapshot = null
  }

  reset() {
    if (this.#destroyed) return
    this.clearSelection()
    this.#scene.reset()
    this.#emit("geora-reset", {})
  }

  clearSelection() {
    if (this.#destroyed) return false
    return this.#clearSelection()
  }

  selectCountry(code) {
    if (this.#destroyed) return false
    const key = String(code ?? "").toLowerCase()
    const place = this.#content.countries.find(
      (item) => String(item.code).toLowerCase() === key || String(item.iso2).toLowerCase() === key,
    )
    if (!place) return false
    if (!this.#modes.includes("country")) return false
    if (this.#mode !== "country") this.mode = "country"
    this.#selectDescriptor({ kind: "country", place })
    return true
  }

  flyTo(lat, lon) {
    if (this.#destroyed) return
    const latitude = Number(lat)
    const longitude = Number(lon)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
    this.#scene.flyTo({ lat: latitude, lon: longitude })
  }

  // keyboard-accessible equivalents of the drag and wheel gestures
  rotate(dx, dy) {
    if (this.#destroyed) return
    this.#scene.drag(Number(dx) || 0, Number(dy) || 0)
  }

  zoom(delta) {
    if (this.#destroyed) return
    this.#scene.zoomBy(Number(delta) || 0)
  }

  setData(next = {}) {
    if (this.#destroyed) return this.data
    const countries = normalizeCountries(next.countries)
    const centers = normalizeCenters(next.centers)
    const markers = normalizeMarkers(next.markers)
    const landmarks = normalizeLandmarks(next.landmarks)

    const sceneUpdates = {}
    if (countries) {
      this.#content.countries = countries
      this.#analytics = buildAnalytics(countries)
      sceneUpdates.countries = countries
    }
    if (centers) {
      this.#content.centers = centers
      sceneUpdates.centers = centers
    }
    if (markers) {
      this.#content.markers = markers
      sceneUpdates.markers = markers
    }
    if (Object.keys(sceneUpdates).length > 0) this.#scene.setData(sceneUpdates)

    const modesBefore = this.#modes.join(",")
    if (this.#autoModes) this.#setModes(null, true)
    if (countries) this.#scene.setAnalytics(this.#analytics, this.#metric)

    if (landmarks) {
      this.#landmarks = landmarks
      this.#scene.setPolaroids(landmarks)
    }

    this.#writePrefs()
    if (modesBefore !== this.#modes.join(",")) {
      this.#emit("geora-mode-change", { mode: this.#mode, modes: [...this.#modes] })
    }
    return this.data
  }

  // ---- public properties --------------------------------------------------

  get container() {
    return this.#container
  }

  get theme() {
    return this.#theme.key ?? themeToPublic(this.#theme)
  }

  set theme(value) {
    this.#theme = resolveTheme(value)
    this.#scene?.setTheme(this.#theme)
    this.#writePrefs()
    this.#emit("geora-theme-change", { theme: themeToPublic(this.#theme), key: this.#theme.key })
  }

  get mode() {
    return this.#mode
  }

  set mode(value) {
    const key = String(value ?? "")
    if (!this.#modes.includes(key) || key === this.#mode) return
    this.#clearSelection()
    this.#mode = key
    this.#scene?.setMode(key)
    this.#writePrefs()
    this.#emit("geora-mode-change", { mode: key, modes: [...this.#modes] })
  }

  get modes() {
    return [...this.#modes]
  }

  set modes(value) {
    this.#setModes(value)
    this.#writePrefs()
    this.#emit("geora-mode-change", { mode: this.#mode, modes: [...this.#modes] })
  }

  get spinning() {
    return Boolean(this.#spinning)
  }

  set spinning(value) {
    this.#spinning = Boolean(value)
    this.#scene?.setAutoRotate(this.#spinning && this.#motionEnabled())
    this.#writePrefs()
  }

  get autoRotate() {
    return this.spinning
  }

  set autoRotate(value) {
    this.spinning = value
  }

  get motion() {
    return this.#motionEnabled()
  }

  set motion(value) {
    this.#motionPref = value === "auto" ? "auto" : Boolean(value)
    this.#applyMotion()
    this.#writePrefs()
  }

  get data() {
    return {
      countries: this.#content.countries,
      centers: this.#content.centers,
      markers: this.#content.markers,
      landmarks: this.#landmarks,
    }
  }

  set data(value) {
    this.setData(value ?? {})
  }

  get analytics() {
    return this.#analytics
  }

  get settings() {
    return {
      theme: this.theme,
      mode: this.#mode,
      spinning: this.#spinning,
      motion: this.#motionPref,
      showBorders: this.#showBorders,
      showMarkers: this.#showMarkers,
      showTooltip: this.#showTooltip,
      showInfoCard: this.#showInfoCard,
      showControls: this.#showControls,
      showNavigation: this.#showNavigation,
      showSettings: this.#showSettings,
      showHud: this.#showHud,
      minimal: this.#minimal,
      persistence: this.#persistence,
      flagBase: this.#flagBase,
      ...this.#profile,
      halftone: { ...this.#halftone },
    }
  }

  get globeScale() {
    return this.#profile.globeScale
  }

  set globeScale(value) {
    this.#profile.globeScale = finite(value, DEFAULT_PROFILE.globeScale)
    this.#scene?.setGlobeScale(this.#profile.globeScale)
    this.#writePrefs()
  }

  get markerScale() {
    return this.#profile.markerScale
  }

  set markerScale(value) {
    this.#profile.markerScale = finite(value, DEFAULT_PROFILE.markerScale)
    this.#scene?.setMarkerScale(this.#profile.markerScale)
    this.#writePrefs()
  }

  get detail() {
    return this.#profile.detail
  }

  set detail(value) {
    this.#profile.detail = finite(value, DEFAULT_PROFILE.detail)
    this.#scene?.setDetail(this.#profile.detail)
    this.#writePrefs()
  }

  get animation() {
    return this.#profile.animation
  }

  set animation(value) {
    this.#profile.animation = finite(value, DEFAULT_PROFILE.animation)
    this.#scene?.setAnimationIntensity(this.#profile.animation)
    this.#writePrefs()
  }

  get halftone() {
    return { ...this.#halftone }
  }

  set halftone(value) {
    this.#halftone = { ...this.#halftone, ...(value ?? {}) }
    this.#scene?.setHalftone(this.#halftone)
    this.#writePrefs()
  }

  #setHalftoneValue(key, value) {
    this.#halftone[key] = finite(value, DEFAULT_HALFTONE[key])
    this.#scene?.setHalftone(this.#halftone)
    this.#writePrefs()
  }

  get halftoneDensity() {
    return this.#halftone.density
  }

  set halftoneDensity(value) {
    this.#setHalftoneValue("density", value)
  }

  get halftoneScale() {
    return this.#halftone.scale
  }

  set halftoneScale(value) {
    this.#setHalftoneValue("scale", value)
  }

  get contrast() {
    return this.#halftone.contrast
  }

  set contrast(value) {
    this.#setHalftoneValue("contrast", value)
  }

  get threshold() {
    return this.#halftone.threshold
  }

  set threshold(value) {
    this.#setHalftoneValue("threshold", value)
  }

  get intensity() {
    return this.#halftone.intensity
  }

  set intensity(value) {
    this.#setHalftoneValue("intensity", value)
  }

  get ambient() {
    return this.#halftone.ambient
  }

  set ambient(value) {
    this.#setHalftoneValue("ambient", value)
  }

  get oceanOpacity() {
    return this.#halftone.ocean
  }

  set oceanOpacity(value) {
    this.#setHalftoneValue("ocean", value)
  }

  get showBorders() {
    return this.#showBorders
  }

  set showBorders(value) {
    this.#showBorders = Boolean(value)
    this.#scene?.setShowBorders(this.#showBorders)
    this.#writePrefs()
  }

  get showMarkers() {
    return this.#showMarkers
  }

  set showMarkers(value) {
    this.#showMarkers = Boolean(value)
    this.#scene?.setMarkersVisible(this.#showMarkers)
    this.#writePrefs()
  }

  get showTooltip() {
    return this.#showTooltip
  }

  set showTooltip(value) {
    this.#showTooltip = Boolean(value)
    this.#writePrefs()
  }

  get showInfoCard() {
    return this.#showInfoCard
  }

  set showInfoCard(value) {
    this.#showInfoCard = Boolean(value)
    this.#writePrefs()
  }

  get showControls() {
    return this.#showControls
  }

  set showControls(value) {
    this.#showControls = Boolean(value)
    this.#writePrefs()
  }

  get showNavigation() {
    return this.#showNavigation
  }

  set showNavigation(value) {
    this.#showNavigation = Boolean(value)
    this.#writePrefs()
  }

  get showSettings() {
    return this.#showSettings
  }

  set showSettings(value) {
    this.#showSettings = Boolean(value)
    this.#writePrefs()
  }

  get showHud() {
    return this.#showHud
  }

  set showHud(value) {
    this.#showHud = Boolean(value)
    this.#writePrefs()
  }

  get minimal() {
    return this.#minimal
  }

  set minimal(value) {
    this.#minimal = Boolean(value)
    this.#writePrefs()
  }

  get persistence() {
    return this.#persistence
  }

  set persistence(value) {
    this.#persistence = Boolean(value)
    if (this.#persistence) this.#writePrefs()
  }

  get flagBase() {
    return this.#flagBase
  }

  set flagBase(value) {
    this.#flagBase = String(value ?? "")
    this.#scene?.setFlagBase(this.#flagBase)
    this.#writePrefs()
  }

  get selection() {
    return this.#selection ? this.#selection.marker : null
  }
}

export { DEFAULT_THEME, THEME_KEYS, THEMES, nextTheme, modeMeta }
