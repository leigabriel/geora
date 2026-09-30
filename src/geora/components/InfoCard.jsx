import { useRef } from 'react'
import useFloating from '../lib/useFloating.js'
import { formatCoord } from '../lib/format.js'
import Flag from './Flag.jsx'

// Every selection opens the same card: one header, one scrollable body, one
// row of text actions. The frame is bounded so a tall photo or a long fact can
// never push the card off screen, and it always sits below the side panels.
function Shell({ kind, title, subtitle, flag, onClose, actions, children }) {
  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-(--border-color) pb-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          {flag}
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.24em] text-(--accent-color)">{kind}</div>
            <div className="truncate text-[13px] font-bold uppercase tracking-[0.12em]">{title}</div>
            {subtitle ? <div className="truncate text-[11px] opacity-60">{subtitle}</div> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="hud-btn shrink-0 border border-(--border-color) text-[13px] leading-none opacity-60"
          title="Close (Esc)"
          aria-label="Close"
        >
          ✕
        </button>
      </header>

      <div className="custom-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 select-text">{children}</div>

      {actions ? (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-(--border-color) pt-2.5">
          {actions}
        </div>
      ) : null}
    </>
  )
}

function Stats({ rows }) {
  return (
    <div className="mt-2.5 border-t border-(--border-color)">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-3 border-b border-(--border-color) py-1 last:border-b-0"
        >
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] opacity-55">{label}</span>
          <span className="min-w-0 truncate text-right font-bold">{value}</span>
        </div>
      ))}
    </div>
  )
}

function Action({ children, onClick, tone = 'quiet' }) {
  const quiet = tone === 'quiet'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`hud-btn text-[11px] font-bold uppercase tracking-[0.16em] ${
        quiet
          ? 'border border-(--border-color) opacity-70 hover:opacity-100'
          : 'border border-(--accent-color) text-(--accent-color)'
      }`}
    >
      {children}
    </button>
  )
}

function Stepper({ label, value, display, onChange }) {
  return (
    <div className="mt-2.5 flex items-center justify-between gap-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-55">{label}</span>
      <span className="flex items-center gap-2 text-[12px]">
        <button
          type="button"
          onClick={() => onChange(Math.max(0.4, Math.round((value - 0.2) * 10) / 10))}
          title={`Shrink ${label.toLowerCase()}`}
          aria-label={`Shrink ${label.toLowerCase()}`}
          className="hud-btn border border-(--border-color) px-1.5 font-bold"
        >
          −
        </button>
        <span className="w-9 text-center font-bold text-(--accent-color)">{display}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(2.4, Math.round((value + 0.2) * 10) / 10))}
          title={`Enlarge ${label.toLowerCase()}`}
          aria-label={`Enlarge ${label.toLowerCase()}`}
          className="hud-btn border border-(--border-color) px-1.5 font-bold"
        >
          +
        </button>
      </span>
    </div>
  )
}

export default function InfoCard({
  card,
  config,
  metric,
  units,
  onClose,
  onCenter,
  onRemoveSticker,
  onRemovePolaroid,
  onStickerScale,
  onPolaroidScale,
}) {
  const ref = useRef(null)
  const style = useFloating(ref, card?.x, card?.y, { offsetY: 18 })
  if (!card) return null

  const target = card.target
  const place = target.place ?? null
  const frame = (body) => (
    <div
      ref={ref}
      data-ui
      data-info-card
      style={style}
      className="bit-panel fixed z-40 flex max-h-[min(70vh,32rem)] w-[min(300px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border p-4 text-[12px] shadow-2xl"
    >
      {body}
    </div>
  )

  if (target.kind === 'sticker') {
    const { sticker } = target
    return frame(
      <Shell
        kind="Sticker"
        title={sticker.name || sticker.label || 'Sticker'}
        subtitle={
          sticker.country ??
          (sticker.lat != null ? `${formatCoord(sticker.lat)}  ${formatCoord(sticker.lon)}` : null)
        }
        onClose={onClose}
        actions={<Action onClick={() => onRemoveSticker(sticker.id)}>Remove sticker</Action>}
      >
        {sticker.src ? (
          <img src={sticker.src} alt="" className="mt-2 h-24 w-24 rounded-lg object-cover" />
        ) : (
          <div className="mt-2 text-4xl leading-none">{sticker.glyph}</div>
        )}
        <Stepper
          label="Scale"
          value={sticker.scale ?? 1}
          display={`${(sticker.scale ?? 1).toFixed(1)}x`}
          onChange={(scale) => onStickerScale(sticker.id, scale)}
        />
        {sticker.meta ? (
          <p className="mt-2 rounded-lg bg-(--accent-subtle) p-2 leading-snug">{sticker.meta}</p>
        ) : null}
      </Shell>,
    )
  }

  if (target.kind === 'polaroid') {
    const { photo } = target
    const photoPlace = place ?? config.places.find((item) => item.code === photo.code) ?? null
    return frame(
      <Shell
        kind="Polaroid"
        title={photo.caption || 'Photo'}
        subtitle={photoPlace ? `${photoPlace.country} · ${photoPlace.name}` : 'pinned'}
        flag={photoPlace ? <Flag place={photoPlace} className="h-7 w-10 rounded shadow-md" /> : null}
        onClose={onClose}
        actions={
          <>
            {Number.isFinite(photo.lat) ? (
              <Action tone="primary" onClick={() => onCenter({ lat: photo.lat, lon: photo.lon })}>
                Center on location
              </Action>
            ) : (
              <span />
            )}
            <Action onClick={() => onRemovePolaroid(photo.id)}>Remove photo</Action>
          </>
        }
      >
        <img src={photo.src} alt="" className="mt-2 h-36 w-full rounded-lg object-cover" />
        <Stepper
          label="Scale"
          value={photo.scale ?? 1}
          display={`${(photo.scale ?? 1).toFixed(1)}x`}
          onChange={(scale) => onPolaroidScale(photo.id, scale)}
        />
        {photo.lat != null ? (
          <Stats
            rows={[
              ['Country', photo.country ?? 'Unattributed'],
              ['Lat', formatCoord(photo.lat)],
              ['Lon', formatCoord(photo.lon)],
            ]}
          />
        ) : null}
      </Shell>,
    )
  }

  if (target.kind === 'center') {
    const { center } = target
    return frame(
      <Shell
        kind="AI data center"
        title={center.name}
        subtitle={center.tier === 'core' ? 'Core site' : 'Edge site'}
        flag={place ? <Flag place={place} className="h-7 w-10 rounded shadow-md" /> : null}
        onClose={onClose}
        actions={
          place ? (
            <Action tone="primary" onClick={() => onCenter(place)}>
              Center on territory
            </Action>
          ) : (
            <span />
          )
        }
      >
        <Stats
          rows={[
            ['Country', place ? place.country : center.code],
            ['Scale', `${center.accelerators} acc.`],
            ['Power', `${center.powerMW} MW`],
            ['Focus', center.focus],
            ['Lat', formatCoord(center.lat)],
            ['Lon', formatCoord(center.lon)],
          ]}
        />
        <p className="mt-2 text-[10px] leading-snug opacity-45">
          Rounded public figures for scale, not audited values.
        </p>
      </Shell>,
    )
  }

  if (target.kind === 'weather') {
    // emoji and numbers only, no condition text
    const row = target.row
    const temp = row && row.temp != null ? (units === 'f' ? Math.round((row.temp * 9) / 5 + 32) : Math.round(row.temp)) : null
    return frame(
      <Shell
        kind="Weather"
        title={place.name}
        subtitle={place.country}
        flag={<Flag place={place} className="h-7 w-10 rounded shadow-md" />}
        onClose={onClose}
        actions={
          <Action tone="primary" onClick={() => onCenter(place)}>
            Center on territory
          </Action>
        }
      >
        <div className="mt-2 flex items-center gap-3">
          <span className="text-4xl leading-none">{row ? config.weatherGlyph(row.wmo) : '·'}</span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold leading-none text-(--accent-color)">
              {temp == null ? '--' : `${temp}°`}
            </span>
            {row && Number.isFinite(row.wind) ? (
              <span className="text-[11px] opacity-60">{row.wind} km/h</span>
            ) : null}
          </div>
        </div>
        {!row ? <p className="mt-2 text-[11px] opacity-60">No reading for this location.</p> : null}
      </Shell>,
    )
  }

  if (target.kind === 'analytics') {
    const meta = config.metricMeta(metric)
    const row = target.row
    const value = row?.[metric]
    const shown = row?.series ? `${Math.min(...row.series)} - ${Math.max(...row.series)}` : '--'
    return frame(
      <Shell
        kind="Analytics"
        title={place.country}
        subtitle={`${place.region} · modeled`}
        flag={<Flag place={place} className="h-7 w-10 rounded shadow-md" />}
        onClose={onClose}
        actions={
          <Action tone="primary" onClick={() => onCenter(place)}>
            Center on territory
          </Action>
        }
      >
        {!row ? (
          <p className="mt-2 text-[11px] opacity-60">No telemetry for this nation.</p>
        ) : (
          <>
            <div className="mt-2 flex items-end gap-1.5">
              <span className="text-4xl font-bold leading-none text-(--accent-color)">
                {Number.isFinite(value) ? value.toFixed(meta.decimals) : '--'}
              </span>
              <span className="pb-1 text-[11px] opacity-60">{meta.unit}</span>
            </div>
            <Stats
              rows={[
                [meta.label, `${value} ${meta.unit}`],
                ['Range', shown],
                ['Traffic', `${row.traffic} Gbps`],
                ['Sessions', `${row.sessions} k/hr`],
                ['Uptime', `${row.uptime}%`],
                ['Latency', `${row.latency} ms`],
              ]}
            />
            <p className="mt-2 text-[10px] leading-snug opacity-45">
              Modeled from population, timezone and a hash of the country code. Not measured traffic.
            </p>
          </>
        )}
      </Shell>,
    )
  }

  return frame(
    <Shell
      kind="Country"
      title={place.country}
      subtitle={place.region}
      flag={<Flag place={place} className="h-7 w-10 rounded shadow-md" />}
      onClose={onClose}
      actions={
        <Action tone="primary" onClick={() => onCenter(place)}>
          Center on territory
        </Action>
      }
    >
      <div className="mt-2 flex items-center gap-1.5 font-semibold">
        <span className="text-(--accent-color)">▸</span>
        <span>{place.name}</span>
      </div>
      <div className="mt-0.5 text-[11px] opacity-70">
        LAT {formatCoord(place.lat)} LON {formatCoord(place.lon)}
      </div>

      <Stats
        rows={[
          ['Pop', place.pop],
          ['Time', place.tz],
          ['Currency', place.curr],
          ['Region', place.region],
        ]}
      />

      <p className="mt-2.5 rounded-lg bg-(--accent-subtle) p-2 leading-snug opacity-90">{place.fact}</p>
    </Shell>,
  )
}
