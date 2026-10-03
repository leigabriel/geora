// Type definitions for geora-globe.

// ---- data schemas ----------------------------------------------------------

export interface CountryData {
  /** ISO 3166-1 alpha-3 code, e.g. "PHL" */
  code: string
  /** full country name, e.g. "Philippines" */
  country?: string
  /** capital city name, e.g. "Manila" */
  capital?: string
  /** lowercase ISO 3166-1 alpha-2 code, e.g. "ph" */
  iso2?: string
  lat: number
  lon: number
  region?: string
  continent?: string
  pop?: string
  tz?: string
  curr?: string
  fact?: string
  flag?: string
  [key: string]: unknown
}

export interface CenterData {
  id?: string
  name: string
  operator?: string
  /** ISO 3166-1 alpha-3 code of the host country */
  code?: string
  lat: number
  lon: number
  status?: string
  focus?: string
  powerGW?: number
  tier?: string
  weight?: number
  [key: string]: unknown
}

export interface MarkerData {
  id?: string
  name?: string
  lat: number
  lon: number
  type?: string
  [key: string]: unknown
}

export interface LandmarkData {
  id?: string
  /** ISO 3166-1 alpha-2 code of the host country */
  iso2?: string
  /** display country name */
  country?: string
  caption?: string
  lat: number
  lon: number
  /** image URL rendered on the polaroid card */
  image?: string
  scale?: number
  [key: string]: unknown
}

export interface GlobeData {
  countries?: CountryData[]
  centers?: CenterData[]
  markers?: MarkerData[]
  landmarks?: LandmarkData[]
}

// ---- configuration ---------------------------------------------------------

export interface ThemeColors {
  /** stage backdrop */
  background: string
  /** the sphere */
  globe: string
  /** dot colour */
  foreground: string
  /** beacon / highlight colour */
  accent: string
  /** country outline colour */
  border: string
}

/** a built-in theme key ("paper", "dark", ...) or a custom colour object */
export type Theme = string | Partial<ThemeColors>

export type ModeKey = "country" | "polaroid" | "analytics" | "centers" | "markers"

export interface ModeInfo {
  key: ModeKey
  label: string
  icon: string
  hint: string
}

/** `true`/`false` forces motion; `"auto"` follows prefers-reduced-motion */
export type MotionPref = boolean | "auto"

export interface Halftone {
  density: number
  scale: number
  contrast: number
  threshold: number
  intensity: number
  ambient: number
  ocean: number
}

export interface GeoraGlobeOptions {
  container: Element
  eventTarget?: EventTarget | null
  data?: GlobeData | null
  theme?: Theme
  mode?: ModeKey
  /** `null` = auto: every mode the data supports, in display order */
  modes?: ModeKey[] | null
  spinning?: boolean
  motion?: MotionPref
  showBorders?: boolean
  showMarkers?: boolean
  persistence?: boolean
  /**
   * Base path for your own flag images, resolved as
   * `${flagBase}/${iso2}.png` (plus a `@2x` variant). Leave it unset to use the
   * flags bundled with the package.
   */
  flagBase?: string
  globeScale?: number
  markerScale?: number
  /** 0 (low), 1 (medium) or 2 (high) */
  detail?: number
  animation?: number
  halftone?: Partial<Halftone> | null
}

// ---- events ----------------------------------------------------------------

export interface AnalyticsRow {
  code: string | null
  traffic: number
  sessions: number
  uptime: number
  latency: number
  series: number[]
  trend: number
  [key: string]: unknown
}

export type PublicMarker =
  | { kind: "country"; country: CountryData }
  | { kind: "center"; center: CenterData; country: CountryData | null }
  | { kind: "analytics"; country: CountryData; row: AnalyticsRow | null }
  | { kind: "polaroid"; landmark: LandmarkData }
  | { kind: "marker"; marker: MarkerData }

export interface GeoraEventMap {
  "geora-ready": CustomEvent<Record<string, never>>
  "geora-hover": CustomEvent<{ marker: PublicMarker | null; x?: number; y?: number }>
  "geora-select": CustomEvent<{ marker: PublicMarker | null; x: number | null; y: number | null }>
  "geora-country-select": CustomEvent<{ country: CountryData; x: number | null; y: number | null }>
  "geora-marker-select": CustomEvent<{ marker: MarkerData; x: number | null; y: number | null }>
  "geora-sphere-select": CustomEvent<{
    lat: number
    lon: number
    onLand: boolean
    country: CountryData | null
    distanceKm: number | null
    x: number
    y: number
  }>
  "geora-clear": CustomEvent<Record<string, never>>
  "geora-mode-change": CustomEvent<{ mode: ModeKey; modes: ModeKey[] }>
  "geora-theme-change": CustomEvent<{ theme: ThemeColors; key: string | null }>
  "geora-reset": CustomEvent<Record<string, never>>
}

export interface GlobeSettings {
  theme: string | ThemeColors
  mode: ModeKey
  spinning: boolean
  motion: MotionPref
  showBorders: boolean
  showMarkers: boolean
  persistence: boolean
  flagBase: string
  globeScale: number
  markerScale: number
  detail: number
  animation: number
  halftone: Halftone
}

type GeoraEventListener<K extends keyof GeoraEventMap> = (event: GeoraEventMap[K]) => void
type GeoraListenerOptions = boolean | AddEventListenerOptions

// ---- GeoraGlobe (headless) -------------------------------------------------

export class GeoraGlobe extends EventTarget {
  constructor(options: GeoraGlobeOptions)

  readonly container: Element

  theme: Theme
  mode: ModeKey
  modes: ModeKey[]
  spinning: boolean
  autoRotate: boolean
  /** effective state: `motionPref === "auto"` resolved against the OS setting */
  motion: boolean
  data: GlobeData
  readonly analytics: unknown

  globeScale: number
  markerScale: number
  detail: number
  animation: number
  halftone: Halftone
  halftoneDensity: number
  halftoneScale: number
  contrast: number
  threshold: number
  intensity: number
  ambient: number
  oceanOpacity: number

  showBorders: boolean
  showMarkers: boolean
  persistence: boolean
  flagBase: string

  readonly selection: PublicMarker | null
  readonly settings: GlobeSettings

  /** true once `start()` has run and `geora-ready` has been emitted */
  readonly ready: boolean
  /** resolves once ready; use this from framework mount hooks */
  whenReady(): Promise<this>

  start(): void
  stop(): void
  destroy(): void
  reset(): void
  clearSelection(): boolean
  selectCountry(code: string): boolean
  flyTo(lat: number, lon: number): void
  rotate(dx: number, dy: number): void
  zoom(delta: number): void
  setData(next: GlobeData): GlobeData

  addEventListener<K extends keyof GeoraEventMap>(
    type: K,
    listener: GeoraEventListener<K>,
    options?: GeoraListenerOptions,
  ): void
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: GeoraListenerOptions): void
  removeEventListener<K extends keyof GeoraEventMap>(
    type: K,
    listener: GeoraEventListener<K>,
    options?: GeoraListenerOptions,
  ): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: GeoraListenerOptions): void
}

// ---- <geora-globe> ---------------------------------------------------------

export class GeoraGlobeElement extends HTMLElement {
  static readonly observedAttributes: string[]

  theme: Theme
  mode: ModeKey
  /** `null` until connected or set; afterwards the active mode list */
  modes: ModeKey[] | null
  spinning: boolean
  autoRotate: boolean
  /** preference as configured: `true` | `false` | `"auto"` */
  motion: MotionPref
  data: GlobeData | null

  globeScale: number
  markerScale: number
  detail: number
  animation: number
  halftone: Halftone
  halftoneDensity: number
  halftoneScale: number
  contrast: number
  threshold: number
  intensity: number
  ambient: number
  oceanOpacity: number

  showBorders: boolean
  showMarkers: boolean
  persistence: boolean
  flagBase: string

  /**
   * `geora-ready` is emitted from `connectedCallback`, before framework mount
   * hooks run. `whenReady()` is the race-free way to continue afterwards;
   * a `geora-ready` listener added after mount is still delivered, replayed.
   */
  readonly ready: boolean
  whenReady(): Promise<this>

  start(): void
  stop(): void
  destroy(): void
  reset(): void
  clearSelection(): boolean
  selectCountry(code: string): boolean
  flyTo(lat: number, lon: number): void
  rotate(dx: number, dy: number): void
  zoom(delta: number): void
  setData(next: GlobeData): GlobeData

  addEventListener<K extends keyof GeoraEventMap>(
    type: K,
    listener: GeoraEventListener<K>,
    options?: GeoraListenerOptions,
  ): void
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: GeoraListenerOptions): void
  removeEventListener<K extends keyof GeoraEventMap>(
    type: K,
    listener: GeoraEventListener<K>,
    options?: GeoraListenerOptions,
  ): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: GeoraListenerOptions): void
}

// ---- registration ----------------------------------------------------------

/** defines `<geora-globe>` (once, on import); no-op on the server */
export function registerGeoraGlobe(tagName?: string): CustomElementConstructor | false

// ---- themes, modes and default data ---------------------------------------

export const THEMES: Record<
  string,
  { label: string; background: number; globe?: number; foreground: number; accent?: number; border: number }
>
export const THEME_KEYS: string[]
export const DEFAULT_THEME: "paper"
export function nextTheme(key: string): string
/** 0xRRGGBB -> "#rrggbb" */
export function themeHex(value: number): string

export const MODES: ModeInfo[]
export const MODE_KEYS: ModeKey[]
export function modeMeta(key: ModeKey | string): ModeInfo

export const DEFAULT_HALFTONE: Readonly<Halftone>
export const DEFAULT_PROFILE: Readonly<{
  globeScale: number
  markerScale: number
  detail: number
  animation: number
}>

export const defaultCountries: CountryData[]
export const defaultCenters: CenterData[]
export const defaultLandmarks: LandmarkData[]
export function joinLandmarks(places: CountryData[], imageBase?: string): LandmarkData[]

/** status labels for the entries in `defaultCenters` */
export interface CenterStatus {
  /** value as it appears on `CenterData.status` */
  key: string
  label: string
}
export const CENTER_STATUSES: CenterStatus[]

/** a single modeled telemetry metric */
export interface MetricMeta {
  key: string
  label: string
  unit: string
  decimals: number
  higherIsBetter: boolean
  floor: number
  cap: number
}
export const METRICS: MetricMeta[]
export function metricMeta(key: string): MetricMeta
