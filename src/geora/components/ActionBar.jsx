// Per-selection tools, shown as framed groups in the dock above the selection
// navigation. Every group sits in its own box so a tap target has a visible
// boundary, and the active choice fills its box instead of only recolouring
// type. Anything that belongs to a specific place lives in that place's card.
export default function ActionBar({
  mode,
  config,
  armed,
  onArm,
  onAddStickerImage,
  onClearStickers,
  onClearPhotos,
  stickers,
  photos,
  scale,
  onScale,
  metric,
  onMetric,
  analytics,
  tier,
  onTier,
  units,
  onUnits,
  onRefreshWeather,
  weatherBusy,
  weather,
  weatherAt,
  weatherError,
  pendingPhoto,
}) {
  const armedSticker = config.stickers.find((item) => item.id === armed) ?? null

  return (
    <div data-ui className="pointer-events-none flex w-full flex-col items-center gap-1.5">
      {mode === 'country' && (
        <Box tone="quiet">
          <Label className="opacity-70">{config.modes[0].hint}</Label>
        </Box>
      )}

      {mode === 'sticker' && (
        <>
          <Box>
            <div className="flex max-w-[22rem] flex-wrap items-center justify-center gap-1">
              {config.stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => onArm(sticker.id)}
                  title={sticker.label}
                  aria-pressed={armed === sticker.id}
                  data-pressed={armed === sticker.id ? 'true' : 'false'}
                  className="hud-btn pointer-events-auto text-[17px] leading-none"
                >
                  {sticker.glyph}
                </button>
              ))}
            </div>
          </Box>

          <Box tone={armed ? 'live' : 'quiet'}>
            <Label>
              {armed ? (
                <>
                  Tap the globe to pin
                  <span className="ml-1.5 font-bold text-(--accent-color)">
                    {armedSticker ? armedSticker.label : 'your image'}
                  </span>
                </>
              ) : (
                'Pick a sticker, then tap the globe'
              )}
            </Label>
          </Box>

          <Box>
            <Action onClick={onAddStickerImage}>Add image</Action>
            <Separator />
            <Size scale={scale} onScale={onScale} />
            <Separator />
            <Action onClick={onClearStickers} disabled={!stickers.length}>
              {stickers.length ? `Clear ${stickers.length}` : 'Clear'}
            </Action>
            <Separator />
            <Label opacity>{stickers.length} pinned</Label>
          </Box>
        </>
      )}

      {mode === 'polaroid' && (
        <>
          <Box tone={pendingPhoto ? 'live' : 'quiet'}>
            <Label>
              {pendingPhoto ? (
                <>
                  Photo to
                  <span className="ml-1.5 font-bold text-(--accent-color)">
                    {pendingPhoto.place ? pendingPhoto.place.country : 'this spot'}
                  </span>
                  <span className="ml-1.5 opacity-70">· choose a file</span>
                </>
              ) : (
                'Tap an island on the globe to add a photo'
              )}
            </Label>
          </Box>

          <Box>
            <Size scale={scale} onScale={onScale} />
            <Separator />
            <Action onClick={onClearPhotos} disabled={!photos.length}>
              {photos.length ? `Clear ${photos.length}` : 'Clear'}
            </Action>
            <Separator />
            <Label opacity>{photos.length} pinned</Label>
          </Box>
        </>
      )}

      {mode === 'analytics' && analytics && (
        <>
          <Gauge config={config} analytics={analytics} metric={metric} onMetric={onMetric} />
          <Rank metric={metric} analytics={analytics} config={config} />
        </>
      )}

      {mode === 'centers' && (
        <>
          <Box>
            <Label opacity>{config.centers.length} sites</Label>
            <Separator />
            <Choices
              value={tier}
              onPick={onTier}
              items={config.centerTiers.map((item) => ({ key: item.key, label: item.label }))}
            />
          </Box>
          <Box tone="quiet">
            <Label className="opacity-70">Tap a beacon to inspect a campus</Label>
          </Box>
        </>
      )}

      {mode === 'weather' && (
        <>
          <Box tone={weatherError ? 'quiet' : 'live'}>
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                weatherError ? 'font-bold' : 'font-bold text-(--accent-color)'
              }`}
            >
              {weatherError ? 'Unavailable' : weatherBusy ? 'Loading' : 'Live'}
            </span>
            <Separator />
            <Label opacity>
              {weatherError || `${Object.keys(weather).length} readings · open-meteo`}
              {weatherAt ? ` · ${weatherAt}` : ''}
            </Label>
          </Box>
          <Box>
            <Choices
              value={units}
              onPick={onUnits}
              items={[
                { key: 'c', label: '°C' },
                { key: 'f', label: '°F' },
              ]}
            />
            <Separator />
            <Action onClick={onRefreshWeather} disabled={weatherBusy}>
              Refresh
            </Action>
          </Box>
        </>
      )}
    </div>
  )
}

function format(value, meta) {
  if (!Number.isFinite(value)) return '--'
  return `${value.toFixed(meta.decimals)} ${meta.unit}`
}

// The world reading: a ring that draws itself to a percentage, next to the
// value it describes and the switch that chooses which value that is, all in
// one framed block.
function Gauge({ config, analytics, metric, onMetric }) {
  const index = config.worldIndex(analytics, metric)
  const meta = config.metricMeta(metric)
  const total = analytics.totals[metric]

  return (
    <Box className="w-full max-w-[22rem]" title={index.note}>
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
          <Choices
            value={metric}
            onPick={onMetric}
            items={config.metrics.map((item) => ({
              key: item.key,
              label: item.label,
              title: `${item.label} (${item.higherIsBetter ? 'higher is better' : 'lower is better'})`,
            }))}
          />
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
function Rank({ metric, analytics, config }) {
  const ranked = config.rankCodes(analytics, metric)
  const meta = config.metricMeta(metric)
  const best = ranked[0]?.value
  const top = ranked.slice(0, 3)
  const suffix = meta.unit === '%' || meta.unit === 'ms' ? '' : ` ${meta.unit}`

  return (
    <Box
      className="w-full max-w-[22rem]"
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

function Box({ children, className = '', tone = 'default', title }) {
  const surface =
    tone === 'live' ? 'bg-(--accent-subtle)' : tone === 'quiet' ? 'bg-transparent' : 'bg-(--card-bg)'
  return (
    <div
      title={title}
      data-tone={tone}
      className={`pointer-events-none rounded-xl border border-(--border-color) px-2.5 py-1.5 ${surface} ${className}`}
    >
      {children}
    </div>
  )
}

function Label({ children, opacity, className = '' }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-[0.16em] ${opacity ? 'opacity-60' : ''} ${className}`}
    >
      {children}
    </span>
  )
}

function Choices({ items, value, onPick }) {
  return (
    <span className="flex flex-wrap items-center justify-center gap-1">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onPick(item.key)}
          title={item.title ?? item.label}
          aria-pressed={value === item.key}
          data-pressed={value === item.key ? 'true' : 'false'}
          className="hud-btn pointer-events-auto text-[10px] font-bold uppercase tracking-[0.14em]"
        >
          {item.label}
        </button>
      ))}
    </span>
  )
}

function Action({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="hud-btn pointer-events-auto text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function Separator() {
  return (
    <span aria-hidden="true" className="px-1 text-[10px] opacity-35">
      ·
    </span>
  )
}

function Size({ scale, onScale }) {
  return (
    <span className="flex items-center gap-0.5">
      <Label opacity>Size</Label>
      <button
        type="button"
        onClick={() => onScale(Math.max(0.4, Math.round((scale - 0.2) * 10) / 10))}
        aria-label="Smaller"
        className="hud-btn pointer-events-auto px-1.5 text-[11px] font-bold"
      >
        −
      </button>
      <span className="w-8 text-center text-[10px] font-bold text-(--accent-color)">{scale.toFixed(1)}x</span>
      <button
        type="button"
        onClick={() => onScale(Math.min(2.4, Math.round((scale + 0.2) * 10) / 10))}
        aria-label="Larger"
        className="hud-btn pointer-events-auto px-1.5 text-[11px] font-bold"
      >
        +
      </button>
    </span>
  )
}
