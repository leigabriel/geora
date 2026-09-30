// Themes control the background, globe, text, markers, HUD chrome and accents as
// one set. Names describe what the screen actually looks like rather than
// borrowing a genre label.
//
// `bg` is the page behind everything (and the theme swatch in Settings); `globe`
// is the sphere the dot cloud is painted on. They are the same value unless a
// theme wants the globe to sit visibly against its own page.
export const THEMES = {
  paper: { label: "PAPER WHITE", bg: 0xffffff, globe: 0xebebeb, fg: 0x121316, border: 0x1a56db, scan: 0, body: "" },
  bw: { label: "INK BLACK", bg: 0x07080a, fg: 0xffffff, border: 0x00ffaa, scan: 0.55, body: "theme-bw" },
  amber: { label: "AMBER SCREEN", bg: 0x0d0900, fg: 0xffb700, border: 0xffe066, scan: 0.5, body: "theme-amber" },
  matrix: { label: "PHOSPHOR GREEN", bg: 0x020a04, fg: 0x00ff66, border: 0x88ffbb, scan: 0.5, body: "theme-matrix" },
  blueprint: { label: "BLUEPRINT GRID", bg: 0x061225, fg: 0xcfe4ff, border: 0x4da3ff, scan: 0.3, body: "theme-blueprint" },
  dusk: { label: "DUSK VIOLET", bg: 0x120a1e, fg: 0xe8dcff, border: 0xb08cff, scan: 0.35, body: "theme-dusk" },
}

export const THEME_KEYS = Object.keys(THEMES)

export function nextTheme(key) {
  return THEME_KEYS[(THEME_KEYS.indexOf(key) + 1) % THEME_KEYS.length]
}
