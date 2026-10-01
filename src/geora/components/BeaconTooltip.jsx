import { useRef } from 'react'
import useFloating from '../lib/useFloating.js'
import Flag from './Flag.jsx'

const TAGS = {
  country: 'BEACON',
  center: 'AI CENTER',
  analytics: 'TELEMETRY',
  polaroid: 'PHOTO',
}

export default function BeaconTooltip({ hover }) {
  const ref = useRef(null)
  const style = useFloating(ref, hover?.x, hover?.y, { offsetX: 14, offsetY: -40 })

  const target = hover?.target
  if (!target) return null
  const place = target.place ?? null
  const tag = TAGS[target.kind] ?? TAGS.country
  const headline =
    target.kind === 'country' ? place?.country : (target.photo?.caption ?? target.center?.name)
  const detail =
    target.kind === 'country'
      ? place?.name
      : target.kind === 'polaroid'
        ? (target.photo?.country ?? tag)
        : tag

  return (
    <div
      ref={ref}
      style={style}
      data-beacon-tooltip
      aria-hidden="true"
      className="bit-panel pointer-events-none fixed z-30 max-w-[min(16rem,calc(100vw-2rem))] rounded-xl border px-2 py-1 shadow-lg"
    >
      <div className="flex items-center gap-2">
        {place ? <Flag place={place} className="h-5 w-7" /> : <span className="h-5 w-7 shrink-0" />}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[12px] font-bold">{headline}</span>
            {place ? (
              <span className="rounded bg-(--border-color) px-1 py-0.5 font-readout text-[11px] font-bold text-(--accent-color)">
                {place.code}
              </span>
            ) : null}
          </div>
          <span className="flex items-center gap-1 truncate text-[11px] uppercase tracking-[0.12em] opacity-70">
            {detail}
            <span className="opacity-60">· tap to inspect</span>
          </span>
        </div>
      </div>
    </div>
  )
}
