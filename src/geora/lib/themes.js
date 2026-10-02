// Themes describe the globe stage and nothing else: the backdrop behind the
// sphere, the sphere the dot cloud is painted on, and the beacons that sit on
// it. The HUD chrome — panels, modals, buttons, text — is not themed. It keeps
// the fixed Paper White palette declared in geora.css, so a dark globe never
// drags the interface into unreadable contrast.
//
// `bg` is the stage backdrop, `globe` the sphere (falling back to `bg`), `fg`
// the dot colour and `border` the beacon/accent colour. Every `fg` is chosen to
// read against its own `globe`, so each entry is legible by construction, and
// Paper White carries the same blue the fixed chrome uses so the one theme that
// matches the interface really does match it.
export const THEMES = {
  paper: { label: "PAPER WHITE", bg: 0xffffff, globe: 0xebebeb, fg: 0x121316, border: 0x1a56db },
  bw: { label: "INK BLACK", bg: 0x07080a, fg: 0xffffff, border: 0x00ffaa },
  amber: { label: "AMBER SCREEN", bg: 0x0d0900, fg: 0xffb700, border: 0xffe066 },
  matrix: { label: "PHOSPHOR GREEN", bg: 0x020a04, fg: 0x00ff66, border: 0x88ffbb },
  blueprint: { label: "BLUEPRINT GRID", bg: 0x061225, fg: 0xcfe4ff, border: 0x4da3ff },
  dusk: { label: "DUSK VIOLET", bg: 0x120a1e, fg: 0xe8dcff, border: 0xb08cff },
}

export const THEME_KEYS = Object.keys(THEMES)

export function nextTheme(key) {
  return THEME_KEYS[(THEME_KEYS.indexOf(key) + 1) % THEME_KEYS.length]
}

// the same 0xRRGGBB value as `#rrggbb`, for the handful of places that paint a
// theme colour straight into the DOM instead of through a CSS variable
export function themeHex(value) {
  return `#${(value >>> 0).toString(16).padStart(6, "0")}`
}
