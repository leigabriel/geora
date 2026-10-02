import { seededRandom } from '../utils/rand.js'

// Modeled telemetry. There is no geora backend, so the numbers are synthesized
// from each nation's population, timezone and a hash of its code: stable across
// reloads, plausible in magnitude, and labelled as modeled everywhere it shows.
export const METRICS = [
  { key: 'traffic', label: 'TRAFFIC', unit: 'Gbps', decimals: 1, higherIsBetter: true, floor: 0, cap: 0 },
  { key: 'sessions', label: 'SESSIONS', unit: 'k/hr', decimals: 1, higherIsBetter: true, floor: 0, cap: 0 },
  { key: 'uptime', label: 'UPTIME', unit: '%', decimals: 2, higherIsBetter: true, floor: 98.9, cap: 100 },
  { key: 'latency', label: 'LATENCY', unit: 'ms', decimals: 0, higherIsBetter: false, floor: 0, cap: 110 },
]

export function metricMeta(key) {
  return METRICS.find((metric) => metric.key === key) ?? METRICS[0]
}

function popMillions(text) {
  const value = Number.parseFloat(text) || 0
  if (text.includes('B')) return value * 1000
  if (text.includes('K')) return value / 1000
  return value
}

function round(value, decimals) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function buildAnalytics(places) {
  const byCode = {}
  let totalTraffic = 0
  let totalSessions = 0
  let uptimeWeighted = 0
  let latencyWeighted = 0

  for (const place of places) {
    const rnd = seededRandom(place.code ?? place.name ?? 'geo')
    const pop = popMillions(place.pop ?? '0')
    const tz = String(place.tz ?? 'UTC')
    const east = tz.includes('+') || tz === 'UTC+0'
    const capacity = 4 + pop * 0.85 * (0.55 + rnd() * 0.5) + rnd() * 26
    const sessions = pop * 9 * (0.6 + rnd() * 0.8)
    const uptime = 99.02 + rnd() * 0.96
    const latency = 14 + rnd() * 66 + (east ? 0 : 5)

    const series = []
    for (let hour = 0; hour < 24; hour += 1) {
      // diurnal curve peaking mid afternoon UTC, with a deterministic jitter
      const curve = 0.5 + 0.5 * Math.sin(((hour - 7) / 24) * Math.PI * 2)
      const jitter = 0.9 + ((hour * 37 + place.code.charCodeAt(0)) % 11) / 55
      series.push(round(capacity * (0.42 + curve * 0.82) * jitter, 1))
    }

    const trend = round((series[23] / series[0] - 1) * 100 + (rnd() - 0.5) * 6, 1)
    const row = {
      code: place.code ?? null,
      traffic: round(capacity, 1),
      sessions: round(sessions, 1),
      uptime: round(uptime, 2),
      latency: Math.round(latency),
      series,
      trend,
    }

    byCode[place.code] = row
    totalTraffic += row.traffic
    totalSessions += row.sessions
    uptimeWeighted += row.uptime * pop
    latencyWeighted += row.latency * pop
  }

  const population = Object.keys(byCode).reduce((sum, code) => sum + popMillions(places.find((p) => p.code === code)?.pop ?? '0'), 0)
  const weight = population > 0 ? population : 1

  return {
    byCode,
    totals: {
      traffic: round(totalTraffic, 1),
      sessions: round(totalSessions, 1),
      uptime: round(uptimeWeighted / weight, 2),
      latency: Math.round(latencyWeighted / weight),
      countries: places.length,
    },
  }
}

// min/max across the dataset so the globe can scale bars without rescanning per frame
export function metricRange(analytics, key) {
  const meta = metricMeta(key)
  let min = Infinity
  let max = -Infinity
  for (const code of Object.keys(analytics.byCode)) {
    const value = analytics.byCode[code][key]
    if (value < min) min = value
    if (value > max) max = value
  }
  return { ...meta, min, max }
}

// mag = how tall the bar is, score = how healthy the nation is, both 0..1
export function normalizeMetric(range, value) {
  const span = range.max - range.min
  const raw = span > 0 ? (value - range.min) / span : 0.5
  const clamped = Math.max(0, Math.min(1, raw))
  return {
    mag: 0.12 + clamped * 0.88,
    score: range.higherIsBetter ? clamped : 1 - clamped,
  }
}

export function rankCodes(analytics, key) {
  const meta = metricMeta(key)
  return Object.values(analytics.byCode)
    .map((row) => ({ code: row.code, value: row[key], score: meta.higherIsBetter ? row[key] : -row[key] }))
    .sort((a, b) => b.score - a.score)
}

// How close a single nation sits to the leader, as a percentage. A lower number
// wins for lower-is-better metrics, so the leader always reads as 100.
export function rankShare(meta, value, best) {
  if (!Number.isFinite(value) || !Number.isFinite(best) || best <= 0) return 0
  const ratio = meta.higherIsBetter ? value / best : best / value
  return Math.round(Math.max(0, Math.min(1, ratio)) * 100)
}

// One percentage for the whole planet, so the ring has something honest to draw.
// Summed metrics show how much the ten leaders hold of the total; averaged
// metrics are scored against the band the model itself declares.
export function worldIndex(analytics, key) {
  const meta = metricMeta(key)
  const total = analytics.totals[key]
  const ranked = rankCodes(analytics, key)
  const average = meta.unit === '%' || meta.unit === 'ms'
  const span = meta.cap - meta.floor

  if (average) {
    if (span <= 0 || !Number.isFinite(total)) return { percent: 0, label: 'No reading', leader: ranked[0] ?? null }
    const raw = (total - meta.floor) / span
    const scored = meta.higherIsBetter ? raw : 1 - raw
    return {
      percent: Math.round(Math.max(0, Math.min(1, scored)) * 100),
      label: 'World index',
      leader: ranked[0] ?? null,
      note: `The model scores ${meta.label.toLowerCase()} inside its own ${meta.floor}-${meta.cap}${meta.unit} band.`,
    }
  }

  const top = ranked.slice(0, 10)
  const held = top.reduce((sum, row) => sum + (Number.isFinite(row.value) ? row.value : 0), 0)
  const share = total > 0 ? held / total : 0
  return {
    percent: Math.round(Math.max(0, Math.min(1, share)) * 100),
    label: 'Top 10 share',
    leader: ranked[0] ?? null,
    note: 'How much of the global total the ten largest nations hold between them.',
  }
}
