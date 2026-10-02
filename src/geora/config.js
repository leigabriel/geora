import { COUNTRIES_DATA } from './data/countries.js'
import { AI_CENTERS, CENTER_STATUSES } from './data/centers.js'
import { buildPolaroids } from './data/landmarks.js'
import { THEMES, THEME_KEYS, nextTheme } from './lib/themes.js'
import { MODES, modeMeta, step } from './lib/modes.js'
import { METRICS, metricMeta, buildAnalytics, metricRange, normalizeMetric, rankCodes, rankShare, worldIndex } from './lib/analytics.js'

// Everything Geora displays is declared here. The engine in lib/scene.js reads
// only the fields it needs from this object, so swapping the content is a matter
// of replacing an array rather than editing the renderer.
//
// The shape a host would supply for a custom deployment:
//
// {
//   places:   [{ code, iso2, name, country, region, lat, lon, pop, tz, curr, fact }],
//   centers:  [{ id, name, operator, code, lat, lon, tier, powerGW, status, focus }],
//   landmarks:[{ iso2, caption, lat, lon }],
//   modes:    [{ key, label, icon, hint }],
//   themes:   { key: { label, bg, globe, fg, border } },
// }
export const config = {
  places: COUNTRIES_DATA,
  centers: AI_CENTERS,
  centerStatuses: CENTER_STATUSES,
  modes: MODES,
  themes: THEMES,
  themeKeys: THEME_KEYS,
  metrics: METRICS,
  modeMeta,
  step,
  nextTheme,
  buildAnalytics,
  metricMeta,
  metricRange,
  normalizeMetric,
  rankCodes,
  rankShare,
  worldIndex,
  defaultMode: 'country',
  defaultMetric: 'traffic',
  buildPolaroids,
  // seeded values for the persisted preference blocks: dense by default
  halftone: { density: 1.0, scale: 1.0, contrast: 1.0, threshold: 0.400, intensity: 1.0, ambient: 0.2, ocean: 1.0 },
  profile: { globeScale: 0.7, markerScale: 0.75, detail: 2, animation: 1, motion: true },
  defaultTheme: 'paper',
  // persisted user preferences live under this key (v3 reseeds globe scale 0.7)
  storageKey: 'geora:prefs:v3',
}

export { MODE_KEYS } from './lib/modes.js'
export { config as default }
