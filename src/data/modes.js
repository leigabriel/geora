// The selection navigation walks this list in order. `key` must match a layer
// name in the engine, so adding a mode here plus a layer in the engine is all
// it takes to extend the globe. The `markers` mode only becomes available when
// the host supplies marker data.
export const MODES = [
  { key: 'country', label: 'COUNTRIES', icon: 'fa-earth-americas', hint: 'Tap a beacon to inspect a nation' },
  { key: 'polaroid', label: 'POLAROIDS', icon: 'fa-image', hint: 'One landmark per nation, pinned where it stands' },
  { key: 'analytics', label: 'ANALYTICS', icon: 'fa-chart-column', hint: 'Modeled telemetry per nation' },
  { key: 'centers', label: 'AI DATA CENTERS', icon: 'fa-server', hint: 'Announced AI compute campuses' },
  { key: 'markers', label: 'MARKERS', icon: 'fa-location-dot', hint: 'Markers supplied by the host' },
]

export const MODE_KEYS = MODES.map((mode) => mode.key)

export function modeMeta(key) {
  return MODES.find((mode) => mode.key === key) ?? MODES[0]
}
