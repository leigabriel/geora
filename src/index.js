// geora-globe — framework-agnostic halftone globe for the web.
//
// Two ways in:
//   import 'geora-globe'                  registers <geora-globe>
//   const globe = new GeoraGlobe({...})   headless, attach to any container
//
// The default dataset ships alongside the engine but is optional: pass your
// own `data` to `new GeoraGlobe({ data })`, `setData()` or `<geora-globe>`'s
// `setData()`.

import { GeoraGlobeElement } from "./GeoraGlobeElement.js"

export { GeoraGlobe, DEFAULT_HALFTONE, DEFAULT_PROFILE } from "./core/GeoraGlobe.js"
export { GeoraGlobeElement }
export { THEMES, THEME_KEYS, DEFAULT_THEME, nextTheme, themeHex } from "./themes/themes.js"
export { MODES, MODE_KEYS, modeMeta } from "./data/modes.js"
export { COUNTRIES_DATA as defaultCountries } from "./data/countries.js"
export { AI_CENTERS as defaultCenters, CENTER_STATUSES } from "./data/centers.js"
export { defaultLandmarks, joinLandmarks } from "./data/landmarks.js"
export { METRICS, metricMeta } from "./analytics/analytics.js"

// Registers the element under `tagName`. Called once on import with the
// default tag; call it yourself for an alias (e.g. "my-globe"). Aliases get a
// subclass because the platform only allows one definition per constructor.
// Safe on the server and a no-op if the tag is already taken.
export function registerGeoraGlobe(tagName = "geora-globe") {
  if (typeof customElements === "undefined") return false
  const existing = customElements.get(tagName)
  if (existing) return existing
  const constructor = tagName === "geora-globe" ? GeoraGlobeElement : class extends GeoraGlobeElement {}
  customElements.define(tagName, constructor)
  return constructor
}

registerGeoraGlobe()
