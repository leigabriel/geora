// WMO 4677 weather interpretation codes, the vocabulary every weather provider
// reports in. The globe draws the emoji only: no text, no tinted card.
const CODES = {
  0: ['CLEAR', '☀️'],
  1: ['MOSTLY CLEAR', '🌤️'],
  2: ['PARTLY CLOUDY', '⛅'],
  3: ['OVERCAST', '☁️'],
  45: ['FOG', '🌫️'],
  48: ['RIME FOG', '🌫️'],
  51: ['LIGHT DRIZZLE', '🌦️'],
  53: ['DRIZZLE', '🌦️'],
  55: ['HEAVY DRIZZLE', '🌧️'],
  56: ['FREEZING DRIZZLE', '🌨️'],
  57: ['FREEZING DRIZZLE', '🌨️'],
  61: ['LIGHT RAIN', '🌦️'],
  63: ['RAIN', '🌧️'],
  65: ['HEAVY RAIN', '🌧️'],
  66: ['FREEZING RAIN', '🌨️'],
  67: ['FREEZING RAIN', '🌨️'],
  71: ['LIGHT SNOW', '🌨️'],
  73: ['SNOW', '❄️'],
  75: ['HEAVY SNOW', '❄️'],
  77: ['SNOW GRAINS', '🌨️'],
  80: ['RAIN SHOWERS', '🌦️'],
  81: ['RAIN SHOWERS', '🌧️'],
  82: ['VIOLENT SHOWERS', '⛈️'],
  85: ['SNOW SHOWERS', '🌨️'],
  86: ['SNOW SHOWERS', '❄️'],
  95: ['THUNDERSTORM', '⛈️'],
  96: ['STORM WITH HAIL', '⛈️'],
  99: ['STORM WITH HAIL', '⛈️'],
}

// a neutral glyph is used only while a location has no reading at all, so the
// marker never implies a condition that was not actually reported
export const NO_READING = '·'

export function wmoLabel(code) {
  return CODES[code]?.[0] ?? 'UNKNOWN'
}

export function weatherGlyph(code) {
  return CODES[code]?.[1] ?? NO_READING
}

export function severity(code) {
  const glyph = weatherGlyph(code)
  if (glyph === '⛈️') return 5
  if (glyph === '❄️' || glyph === '🌨️') return 4
  if (glyph === '🌧️') return 3
  if (glyph === '🌦️' || glyph === '🌫️') return 2
  if (glyph === '☁️') return 1
  return 0
}
