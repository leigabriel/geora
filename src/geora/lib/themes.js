export const THEMES = {
  paper: { label: "PAPER", bg: 0xffffff, fg: 0x121316, border: 0x1a56db, scan: 0, body: "" },
  bw: { label: "B&W", bg: 0x07080a, fg: 0xffffff, border: 0x00ffaa, scan: 0.55, body: "theme-bw" },
  amber: { label: "AMBER", bg: 0x0d0900, fg: 0xffb700, border: 0xffe066, scan: 0.5, body: "theme-amber" },
  matrix: { label: "CYBER", bg: 0x020a04, fg: 0x00ff66, border: 0x88ffbb, scan: 0.5, body: "theme-matrix" },
}

export const THEME_KEYS = Object.keys(THEMES)

export function nextTheme(key) {
  return THEME_KEYS[(THEME_KEYS.indexOf(key) + 1) % THEME_KEYS.length]
}
