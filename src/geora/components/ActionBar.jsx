// The readout in the dock above the layer console: it reports what the running
// layer holds and nothing else. There are deliberately no pickers, steppers or
// buttons here — the content of each layer and the metric analytics is scored by
// are declared in config.js, so the interface is never a second place to
// configure them. One instruction at a time, one shared box system from ./ui.jsx.
import { Box, Label } from './ui.jsx'

export default function ActionBar({ mode, config, analytics }) {
  return (
    <div data-ui key={mode} className="mode-swap pointer-events-none flex w-full flex-col items-center gap-1.5">
      {mode === 'country' && (
        <Box tone="quiet">
          <Label className="opacity-70">{config.modes[0].hint}</Label>
        </Box>
      )}

      {mode === 'polaroid' && <Polaroids config={config} photos={config.buildPolaroids(config.places)} />}

      {mode === 'analytics' && analytics && (
        <>
          <Gauge config={config} analytics={analytics} />
          <Rank analytics={analytics} config={config} />
        </>
      )}

      {mode === 'centers' && <Centers config={config} />}
    </div>
  )
}

// What the bundled photograph set contains: how many nations have a picture, and
// where each one is pinned. Nothing here can be changed without editing
// data/landmarks.js and re-running npm run landmarks.
function Polaroids({ config, photos }) {
  const meta = config.modeMeta('polaroid')
  return (
    <>
      <Box className="w-full max-w-88" title="One photograph per nation, downloaded to public/landmarks by scripts/cache-landmarks.mjs.">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label opacity>Nations</Label>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--accent-color)">
              {photos.length}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-(--border-color) pt-1.5">
            <Label opacity>Source</Label>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">Wikipedia</span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-(--border-color) pt-1.5">
            <Label opacity>Pinned at</Label>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">The landmark</span>
          </div>
        </div>
      </Box>

      <Box tone="quiet">
        <Label className="opacity-70">{meta.hint}</Label>
      </Box>
    </>
  )
}

// The campus tally, split by how far each announcement has actually got: running,
// under construction, or announced and not yet built.
function Centers({ config }) {
  const counts = new Map(config.centerStatuses.map((status) => [status.key, 0]))
  for (const center of config.centers) counts.set(center.status, (counts.get(center.status) ?? 0) + 1)

  return (
    <>
      <Box className="w-full max-w-88">
        <div className="flex flex-col gap-1.5">
          {config.centerStatuses.map((status, index) => (
            <div
              key={status.key}
              className={`flex items-center justify-between gap-3 ${
                index ? 'border-t border-(--border-color) pt-1.5' : ''
              }`}
            >
              <Label opacity>{status.label}</Label>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--accent-color)">
                {counts.get(status.key) ?? 0}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-t border-(--border-color) pt-1.5">
            <Label opacity>Total</Label>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">
              {config.centers.length}
            </span>
          </div>
        </div>
      </Box>

      <Box tone="quiet">
        <Label className="opacity-70">{config.modeMeta('centers').hint}</Label>
      </Box>
    </>
  )
}

function format(value, meta) {
  if (!Number.isFinite(value)) return '--'
  return `${value.toFixed(meta.decimals)} ${meta.unit}`
}

// The world reading: a ring that draws itself to a percentage, next to the value
// it describes. The metric is config.defaultMetric rather than a switch, because
// choosing one at runtime would be configuration living in the interface.
function Gauge({ config, analytics }) {
  const metric = config.defaultMetric
  const index = config.worldIndex(analytics, metric)
  const meta = config.metricMeta(metric)
  const total = analytics.totals[metric]

  return (
    <Box className="w-full max-w-88" title={index.note}>
      <div className="flex items-center gap-3">
        <Ring percent={index.percent} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Label opacity>
            {meta.label} · global
          </Label>
          <span className="text-[15px] font-bold leading-tight text-(--accent-color)">
            {format(total, meta)}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-60" title={index.note}>
            {index.label} · {index.percent}%
          </span>
        </div>
      </div>
    </Box>
  )
}

function Ring({ percent, size = 44 }) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const centre = size / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      role="img"
      aria-label={`${percent} percent`}
    >
      <circle cx={centre} cy={centre} r={radius} fill="none" stroke="var(--border-color)" strokeWidth="5" />
      <circle
        className="ring-draw"
        cx={centre}
        cy={centre}
        r={radius}
        fill="none"
        stroke="var(--accent-color)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - Math.max(0, Math.min(100, percent)) / 100)}
        transform={`rotate(-90 ${centre} ${centre})`}
      />
    </svg>
  )
}

// Ranked read-out as a bar chart: the fill is the distance to the leader and
// the badge repeats it as a number, so the graph reads with colour and text.
function Rank({ analytics, config }) {
  const metric = config.defaultMetric
  const ranked = config.rankCodes(analytics, metric)
  const meta = config.metricMeta(metric)
  const best = ranked[0]?.value
  const top = ranked.slice(0, 3)
  const suffix = meta.unit === '%' || meta.unit === 'ms' ? '' : ` ${meta.unit}`

  return (
    <Box
      className="w-full max-w-88"
      title="There is no geora backend. These numbers are modeled from population, timezone and a hash of each country code."
    >
      <div className="mb-1 flex items-center justify-between">
        <Label opacity>Top nations</Label>
        <Label opacity>vs leader</Label>
      </div>
      <div className="flex flex-col gap-1">
        {top.map((row, index) => {
          const share = config.rankShare(meta, row.value, best)
          return (
            <div
              key={row.code}
              className="relative overflow-hidden rounded-lg border border-(--border-color)"
              title={`${row.code} · ${row.value}${suffix}`}
            >
              <div className="meter-fill absolute inset-y-0 left-0" style={{ width: `${share}%` }} />
              <div className="relative flex items-center justify-between gap-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
                <span className={index === 0 ? 'text-(--accent-color)' : 'opacity-70'}>
                  {index === 0 ? '★ ' : ''}
                  {row.code}
                </span>
                <span className="opacity-80">
                  {row.value}
                  {suffix}
                </span>
                <span className="min-w-[2.4rem] rounded bg-(--accent-subtle) px-1 text-center text-(--accent-color)">
                  {share}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] opacity-45">Modeled, not measured</p>
    </Box>
  )
}
