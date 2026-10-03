import {
  defaultCountries,
  defaultCenters,
  CENTER_STATUSES,
  THEMES,
  THEME_KEYS,
  nextTheme,
  MODES,
  MODE_KEYS,
  modeMeta,
  METRICS,
  metricMeta,
} from 'geora-globe'

// Everything Geora displays is declared here. <geora-globe> reads only the
// fields it needs from this object, so swapping the content is a matter of
// replacing an array rather than editing the renderer.
//
// The shape a host would supply for a custom deployment:
//
// {
//   countries: [{ code, iso2, country, capital, region, lat, lon, pop, tz, curr, fact }],
//   centers:   [{ id, name, operator, code, lat, lon, tier, powerGW, status, focus }],
//   markers:   [{ id, name, lat, lon, type }],
//   landmarks: [{ iso2, country, caption, lat, lon, image }],
// }
export const config = {
  places: defaultCountries,
  centers: defaultCenters,
  centerStatuses: CENTER_STATUSES,
  modes: MODES,
  themes: THEMES,
  themeKeys: THEME_KEYS,
  metrics: METRICS,
  modeMeta,
  metricMeta,
  nextTheme,
  defaultMode: 'country',
  defaultMetric: 'traffic',
  // seeded values for the persisted preference blocks: dense by default
  halftone: { density: 1.0, scale: 1.0, contrast: 1.0, threshold: 0.400, intensity: 1.0, ambient: 0.2, ocean: 1.0 },
  profile: { globeScale: 0.7, markerScale: 0.75, detail: 2, animation: 1, motion: true },
  defaultTheme: 'paper',
  // persisted user preferences live under this key (v3 reseeds globe scale 0.7)
  storageKey: 'geora:prefs:v3',
}

// step through a mode list, wrapping at either end
export function step(key, delta, keys = MODE_KEYS) {
  const index = keys.indexOf(key)
  if (index < 0) return keys[0] ?? key
  return keys[(index + delta + keys.length) % keys.length]
}

export { MODE_KEYS }
export default config
