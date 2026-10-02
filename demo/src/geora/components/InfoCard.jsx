import { useRef } from 'react'
import useFloating from '../lib/useFloating.js'
import { formatCoord } from '../lib/format.js'
import Flag from './Flag.jsx'

// Every selection opens the same card: one header and one fitted body.
// The frame is set to a 4:5 aspect ratio.
//
// The kind eyebrow carries the same icon as the layer, so the card always
// reads as belonging to the mode that opened it.
const KIND_ICONS = {
    Country: 'fa-earth-americas',
    Polaroid: 'fa-image',
    Analytics: 'fa-chart-column',
    'AI data center': 'fa-server',
}

function Shell({ kind, title, subtitle, flag, onClose, children }) {
    const icon = KIND_ICONS[kind] ?? null
    return (
        <>
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-dotted border-white/40 pb-2.5">
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    {flag ? <div className="shrink-0">{flag}</div> : null}
                    <div className="min-w-0 flex-1 pr-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.24em] text-white">
                            {icon ? <i className={`fa-solid ${icon} text-[10px] text-white`} aria-hidden="true" /> : null}
                            <span>{kind}</span>
                        </div>
                        <div className="truncate text-[12px] font-bold uppercase tracking-[0.12em] text-white leading-snug">
                            {title}
                        </div>
                        {subtitle ? (
                            <div className="truncate text-[10px] text-white/80 leading-normal">
                                {subtitle}
                            </div>
                        ) : null}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="hud-btn h-7 w-7 min-h-7 min-w-7 shrink-0 border border-white/40 text-[13px] leading-none text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                    title="Close (Esc)"
                    aria-label="Close details"
                >
                    ✕
                </button>
            </header>

            <div className="min-h-0 flex-1 overflow-hidden py-1 select-text text-white">
                {children}
            </div>
        </>
    )
}

function Stats({ rows }) {
    return (
        <div className="mt-2 border-t border-dotted border-white/40">
            {rows.map(([label, value]) => (
                <div
                    key={label}
                    className="flex items-baseline justify-between gap-2 border-b border-dotted border-white/40 py-0.5 text-[11px] last:border-b-0"
                >
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-white/70">
                        {label}
                    </span>
                    <span className="min-w-0 truncate text-right font-bold text-white">
                        {value}
                    </span>
                </div>
            ))}
        </div>
    )
}

export default function InfoCard({ card, config, onClose }) {
    const ref = useRef(null)
    const style = useFloating(ref, card?.x, card?.y, { offsetY: 18 })
    if (!card) return null

    const target = card.target
    const place = target.country ?? null
    // Popups grow out of the tapped point: origin sits on the edge facing it.
    const originBelow = (card?.y ?? 0) < (typeof window === 'undefined' ? 0 : window.innerHeight * 0.4)
    const frame = (body, label = 'Details') => (
        <div
            ref={ref}
            data-ui
            data-info-card
            style={{
                ...style,
                transformOrigin: originBelow ? '50% 0%' : '50% 100%',
                backgroundColor: '#0034ff',
                color: '#ffffff',
                '--accent-color': '#ffffff',
                '--accent-subtle': 'rgba(255, 255, 255, 0.12)',
                '--border-color': 'rgba(255, 255, 255, 0.4)',
            }}
            role="dialog"
            aria-modal="false"
            aria-label={label}
            className="bit-panel card-in fixed z-40 flex aspect-3/4 w-[min(21rem,calc(100vw-24px),68vh)] flex-col overflow-hidden border border-black p-3.5 text-[12px] shadow-xl"
        >
            {body}
        </div>
    )

    if (target.kind === 'polaroid') {
        const landmark = target.landmark
        // the photo is filed under a nation, but it is pinned at the landmark, so the
        // card names the landmark and reads its coordinates rather than the capital's
        const photoPlace = config.places.find((item) => item.code === landmark.code) ?? null
        return frame(
            <Shell
                kind="Polaroid"
                title={landmark.caption ?? photoPlace?.country ?? 'Photograph'}
                subtitle={photoPlace ? `${photoPlace.country} · ${photoPlace.name}` : null}
                flag={photoPlace ? <Flag place={photoPlace} className="h-6 w-9 shadow-md" /> : null}
                onClose={onClose}
            >
                <img
                    src={landmark.image}
                    alt={landmark.caption ?? `Photograph from ${landmark.country ?? 'a nation'}`}
                    className="mt-1.5 h-26 w-full object-cover border border-white/20"
                />
                <Stats
                    rows={[
                        ['Landmark', landmark.caption ?? '—'],
                        ['Country', landmark.country ?? '—'],
                        ['Lat', formatCoord(landmark.lat)],
                        ['Lon', formatCoord(landmark.lon)],
                    ]}
                />
                <p className="mt-2 line-clamp-2 text-[10px] leading-snug text-white/70">
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
                flag={place ? <Flag place={place} className="h-6 w-9 shadow-md" /> : null}
                onClose={onClose}
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
                <p className="mt-2 line-clamp-2 text-[10px] leading-snug text-white/70">
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
                flag={<Flag place={place} className="h-6 w-9 shadow-md" />}
                onClose={onClose}
            >
                {!row ? (
                    <p className="mt-2 text-[11px] text-white/70">No telemetry for this nation.</p>
                ) : (
                    <>
                        <div className="mt-1.5 flex items-end gap-1.5">
                            <span className="text-3xl font-bold leading-none text-white">
                                {Number.isFinite(value) ? value.toFixed(meta.decimals) : '--'}
                            </span>
                            <span className="pb-0.5 text-[11px] text-white/80">{meta.unit}</span>
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
                        <p className="mt-1.5 line-clamp-2 text-[10px] leading-snug text-white/70">
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
            flag={<Flag place={place} className="h-6 w-9 shadow-md" />}
            onClose={onClose}
        >
            <div className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-white">
                <span className="text-white">▸</span>
                <span className="truncate">{place.name}</span>
            </div>
            <div className="mt-0.5 text-[10px] text-white/80">
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

            <p className="mt-2 line-clamp-3 bg-white/10 p-2 text-[11px] leading-snug text-white">
                {place.fact}
            </p>
        </Shell>,
    )
}