import { useRef } from 'react'
import useFloating from '../lib/useFloating.js'
import { formatCoord } from '../lib/format.js'
import Flag from './Flag.jsx'

// Every selection opens the same square card: one header, one fitted body, one
// row of text actions. The frame is always a 2:2 canvas and content is sized
// to fit it, so nothing ever scrolls inside the card.
//
// The kind eyebrow carries the same icon as the mode dock, so the card always
// reads as belonging to the mode that opened it.
const KIND_ICONS = {
  Country: 'fa-earth-americas',
  Polaroid: 'fa-image',
  Analytics: 'fa-chart-column',
  'AI data center': 'fa-server',
}

function Shell({ kind, title, subtitle, flag, onClose, actions, children }) {
  const icon = KIND_ICONS[kind] ?? null
  return (
    <>
      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-(--border-color) pb-2">
        <div className="flex min-w-0 items-start gap-2">
          {flag}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.24em] text-(--accent-color)">
              {icon ? <i className={`fa-solid ${icon} text-[10px]`} aria-hidden="true" /> : null}
              <span>{kind}</span>
            </div>
            <div className="truncate text-[12px] font-bold uppercase tracking-[0.12em]">{title}</div>
            {subtitle ? <div className="truncate text-[10px] opacity-60">{subtitle}</div> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="hud-btn min-h-8 min-w-8 shrink-0 border border-(--border-color) text-[13px] leading-none opacity-60"
          title="Close (Esc)"
          aria-label="Close details"
        >
          ✕
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden py-1 select-text">{children}</div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-(--border-color) pt-2">
          {actions}
        </div>
      ) : null}
    </>
  )
}

function Stats({ rows }) {
  return (
    <div className="mt-2 border-t border-(--border-color)">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-2 border-b border-(--border-color) py-0.5 text-[11px] last:border-b-0"
        >
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] opacity-55">{label}</span>
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
      className={`hud-btn min-h-[1.9rem] text-[10px] font-bold uppercase tracking-[0.14em] ${
        quiet
          ? 'border border-(--border-color) opacity-70 hover:opacity-100'
          : 'border border-(--accent-color) text-(--accent-color)'
      }`}
    >
      {children}
    </button>
  )
}

export default function InfoCard({ card, config, onClose, onCenter }) {
  const ref = useRef(null)
  const style = useFloating(ref, card?.x, card?.y, { offsetY: 18 })
  if (!card) return null

  const target = card.target
  const place = target.place ?? null
  // Popups grow out of the tapped point: origin sits on the edge facing it.
  const originBelow = (card?.y ?? 0) < (typeof window === 'undefined' ? 0 : window.innerHeight * 0.4)
  const frame = (body, label = 'Details') => (
    <div
      ref={ref}
      data-ui
      data-info-card
      style={{ ...style, transformOrigin: originBelow ? '50% 0%' : '50% 100%' }}
      role="dialog"
      aria-modal="false"
      aria-label={label}
      className="bit-panel card-in fixed z-40 flex aspect-2/2 w-[min(22rem,calc(100vw-24px),66vh)] flex-col overflow-hidden rounded-2xl border p-3.5 text-[12px] shadow-xl"
    >
      {body}
    </div>
  )

  if (target.kind === 'polaroid') {
    const { photo } = target
    // the photo is filed under a nation, but it is pinned at the landmark, so the
    // card names the landmark and reads its coordinates rather than the capital's
    const photoPlace = place ?? config.places.find((item) => item.code === photo.code) ?? null
    return frame(
      <Shell
        kind="Polaroid"
        title={photo.caption ?? photoPlace?.country ?? 'Photograph'}
        subtitle={photoPlace ? `${photoPlace.country} · ${photoPlace.name}` : null}
        flag={photoPlace ? <Flag place={photoPlace} className="h-6 w-9 rounded shadow-md" /> : null}
        onClose={onClose}
        actions={
          <Action tone="primary" onClick={() => onCenter({ lat: photo.lat, lon: photo.lon })}>
            Center
          </Action>
        }
      >
        <img
          src={photo.src}
          alt={photo.caption ?? `Photograph from ${photo.country ?? 'a nation'}`}
          className="mt-1.5 h-24 w-full rounded-lg object-cover"
        />
        <Stats
          rows={[
            ['Landmark', photo.caption ?? '—'],
            ['Country', photo.country ?? '—'],
            ['Lat', formatCoord(photo.lat)],
            ['Lon', formatCoord(photo.lon)],
          ]}
        />
        <p className="mt-2 line-clamp-2 text-[10px] leading-snug opacity-45">
          Photograph from Wikipedia, credited in public/landmarks/credits.json.
        </p>
      </Shell>,
    )
  }

  if (target.kind === 'center') {
    const { center } = target
    const status = config.centerStatuses.find((item) => item.key === center.status)
    return frame(
      <Shell
        kind="AI data center"
        title={center.name}
        subtitle={status ? status.label : 'AI compute site'}
        flag={place ? <Flag place={place} className="h-6 w-9 rounded shadow-md" /> : null}
        onClose={onClose}
        actions={
          <Action tone="primary" onClick={() => onCenter({ lat: center.lat, lon: center.lon })}>
            Center
          </Action>
        }
      >
        <Stats
          rows={[
            ['Operator', center.operator],
            ['Country', place ? place.country : center.code],
            ['Capacity', center.powerGW ? `${center.powerGW} GW announced` : 'Not disclosed'],
            ['Status', status ? status.label : center.status],
            ['Focus', center.focus],
            ['Lat', formatCoord(center.lat)],
            ['Lon', formatCoord(center.lon)],
          ]}
        />
        <p className="mt-2 line-clamp-2 text-[10px] leading-snug opacity-45">
          Capacity is the operator's announced figure, or blank where none has been published.
        </p>
      </Shell>,
    )
  }

  if (target.kind === 'analytics') {
    const metric = config.defaultMetric
    const meta = config.metricMeta(metric)
    const row = target.row
    const value = row?.[metric]
    const shown = row?.series ? `${Math.min(...row.series)} - ${Math.max(...row.series)}` : '--'
    return frame(
      <Shell
        kind="Analytics"
        title={place.country}
        subtitle={`${place.region} · modeled`}
        flag={<Flag place={place} className="h-6 w-9 rounded shadow-md" />}
        onClose={onClose}
        actions={
          <Action tone="primary" onClick={() => onCenter(place)}>
            Center
          </Action>
        }
      >
        {!row ? (
          <p className="mt-2 text-[11px] opacity-60">No telemetry for this nation.</p>
        ) : (
          <>
            <div className="mt-1.5 flex items-end gap-1.5">
              <span className="text-3xl font-bold leading-none text-(--accent-color)">
                {Number.isFinite(value) ? value.toFixed(meta.decimals) : '--'}
              </span>
              <span className="pb-0.5 text-[11px] opacity-60">{meta.unit}</span>
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
            <p className="mt-1.5 line-clamp-2 text-[10px] leading-snug opacity-45">
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
      flag={<Flag place={place} className="h-6 w-9 rounded shadow-md" />}
      onClose={onClose}
      actions={
        <Action tone="primary" onClick={() => onCenter(place)}>
          Center
        </Action>
      }
    >
      <div className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold">
        <span className="text-(--accent-color)">▸</span>
        <span className="truncate">{place.name}</span>
      </div>
      <div className="mt-0.5 text-[10px] opacity-70">
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

      <p className="mt-2 line-clamp-3 rounded-lg bg-(--accent-subtle) p-2 text-[11px] leading-snug opacity-90">{place.fact}</p>
    </Shell>,
  )
}
