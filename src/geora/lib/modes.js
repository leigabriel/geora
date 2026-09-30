// The selection navigation at the bottom of the screen walks this list in order.
// `key` must match a layer name in the scene, so adding a selection here plus a
// layer in the engine is all it takes to extend the globe.
export const MODES = [
  { key: 'country', label: 'COUNTRIES', icon: 'fa-earth-americas', hint: 'Tap a beacon to inspect a nation' },
  { key: 'sticker', label: 'STICKERS', icon: 'fa-star', hint: 'Arm a sticker, then tap the globe to pin it' },
  { key: 'polaroid', label: 'POLAROIDS', icon: 'fa-image', hint: 'Tap an island to add a photo there' },
  { key: 'analytics', label: 'ANALYTICS', icon: 'fa-chart-column', hint: 'Modeled telemetry per nation' },
  { key: 'centers', label: 'AI CENTERS', icon: 'fa-server', hint: 'AI compute campuses' },
  { key: 'weather', label: 'WEATHER', icon: 'fa-cloud-sun', hint: 'Live conditions, nothing shown if unavailable' },
]

export const MODE_KEYS = MODES.map((mode) => mode.key)

export function modeMeta(key) {
  return MODES.find((mode) => mode.key === key) ?? MODES[0]
}

export function step(key, delta) {
  const index = MODE_KEYS.indexOf(key)
  if (index < 0) return MODE_KEYS[0]
  return MODE_KEYS[(index + delta + MODE_KEYS.length) % MODE_KEYS.length]
}
