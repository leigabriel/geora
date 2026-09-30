import { COUNTRIES_DATA } from './data/countries.js'
import { AI_CENTERS, CENTER_TIERS } from './data/centers.js'
import { STICKERS } from './data/stickers.js'
import { weatherGlyph, wmoLabel } from './data/weather.js'
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
//   centers:  [{ id, name, code, lat, lon, tier, weight, accelerators, powerMW, focus }],
//   stickers: [{ id, glyph, label }],
//   modes:    [{ key, label, icon, hint }],
//   themes:   { key: { label, bg, fg, border, scan, body } },
// }
export const config = {
  places: COUNTRIES_DATA,
  centers: AI_CENTERS,
  centerTiers: CENTER_TIERS,
  stickers: STICKERS,
  modes: MODES,
  themes: THEMES,
  themeKeys: THEME_KEYS,
  metrics: METRICS,
  weatherGlyph,
  wmoLabel,
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
  defaultCenterTier: 'all',
  // seeded values for the persisted preference blocks
  halftone: { density: 0.62, scale: 1, contrast: 1, threshold: 0.42, intensity: 1, ambient: 0.55, ocean: 0.45 },
  profile: { globeScale: 1, markerScale: 1, detail: 1, animation: 1, motion: true },
  defaultTheme: THEME_KEYS[0],
  // how often the live weather layer refetches, in minutes
  weatherIntervalMinutes: 15,
  // persisted user preferences live under this key
  storageKey: 'geora:prefs:v1',
}

export { MODE_KEYS } from './lib/modes.js'
export { config as default }
