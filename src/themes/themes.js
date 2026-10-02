// Themes describe the globe stage and nothing else: the backdrop behind the
// sphere, the sphere the dot cloud is painted on, and the beacons that sit on
// it. Everything else — host page chrome, or the component's own optional
// controls — keeps its own palette, so a dark globe never drags the interface
// into unreadable contrast.
//
// A theme holds five colours:
//   background  the stage backdrop
//   globe       the sphere (falls back to background)
//   foreground  the dot colour
//   accent      the beacon / highlight colour
//   border      the country outline colour
//
// Built-ins are addressed by key ("paper", "dark", ...). A custom theme is a
// plain object in the same shape, given through the `theme` property.
export const THEMES = {
  paper: { label: "PAPER WHITE", background: 0xffffff, globe: 0xebebeb, foreground: 0x121316, accent: 0x1a56db, border: 0x1a56db },
  dark: { label: "INK BLACK", background: 0x07080a, foreground: 0xffffff, accent: 0x00ffaa, border: 0x00ffaa },
  amber: { label: "AMBER SCREEN", background: 0x0d0900, foreground: 0xffb700, accent: 0xffe066, border: 0xffe066 },
  matrix: { label: "PHOSPHOR GREEN", background: 0x020a04, foreground: 0x00ff66, accent: 0x88ffbb, border: 0x88ffbb },
  blueprint: { label: "BLUEPRINT GRID", background: 0x061225, foreground: 0xcfe4ff, accent: 0x4da3ff, border: 0x4da3ff },
  dusk: { label: "DUSK VIOLET", background: 0x120a1e, foreground: 0xe8dcff, accent: 0xb08cff, border: 0xb08cff },
}

export const THEME_KEYS = Object.keys(THEMES)

export const DEFAULT_THEME = "paper"

export function nextTheme(key) {
  return THEME_KEYS[(THEME_KEYS.indexOf(key) + 1) % THEME_KEYS.length]
}

// the same 0xRRGGBB value as `#rrggbb`, for the handful of places that paint a
// theme colour straight into the DOM instead of through a CSS variable
export function themeHex(value) {
  return `#${(value >>> 0).toString(16).padStart(6, "0")}`
}

// Accepts "#rrggbb", "#rgb" or a 0xRRGGBB number and returns a number.
function toColor(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return value >>> 0
  if (typeof value === "string") {
    const text = value.trim().replace(/^#/, "")
    if (/^[0-9a-fA-F]{3}$/.test(text)) {
      return Number.parseInt(text.replace(/./g, (c) => c + c), 16)
    }
    if (/^[0-9a-fA-F]{6}$/.test(text)) return Number.parseInt(text, 16)
  }
  return fallback
}

// Normalizes a built-in theme key or a custom theme object into the internal
// five-colour shape. Missing colours fall back so a partial custom theme is
// still legible by construction.
export function resolveTheme(input) {
  if (typeof input === "string") {
    const builtIn = THEMES[input] ?? THEMES[DEFAULT_THEME]
    return {
      key: THEMES[input] ? input : DEFAULT_THEME,
      label: builtIn.label,
      bg: builtIn.background >>> 0,
      globe: (builtIn.globe ?? builtIn.background) >>> 0,
      fg: builtIn.foreground >>> 0,
      accent: (builtIn.accent ?? builtIn.border) >>> 0,
      border: (builtIn.border ?? builtIn.accent) >>> 0,
    }
  }

  const theme = input && typeof input === "object" ? input : {}
  const bg = toColor(theme.background ?? theme.bg, THEMES[DEFAULT_THEME].background)
  const accent = toColor(theme.accent ?? theme.border, THEMES[DEFAULT_THEME].accent)
  return {
    key: null,
    label: typeof theme.label === "string" ? theme.label : "CUSTOM",
    bg,
    globe: toColor(theme.globe, bg),
    fg: toColor(theme.foreground ?? theme.fg, THEMES[DEFAULT_THEME].foreground),
    accent,
    border: toColor(theme.border, accent),
  }
}

// the public, JSON-friendly view of a resolved theme
export function themeToPublic(theme) {
  return {
    background: themeHex(theme.bg),
    globe: themeHex(theme.globe),
    foreground: themeHex(theme.fg),
    accent: themeHex(theme.accent),
    border: themeHex(theme.border),
  }
}
