import { useRef } from 'react'
import useFloating from '../lib/useFloating.js'
import { formatCoord } from '../lib/format.js'
import Flag from './Flag.jsx'

export default function CountryCard({ card, onClose, onCenter }) {
  const ref = useRef(null)
  const style = useFloating(ref, card?.x, card?.y, { offsetY: 18 })
  if (!card) return null

  const { place } = card

  return (
    <div
      ref={ref}
      data-ui
      style={style}
      className="bit-panel fixed z-50 w-[min(300px,calc(100vw-24px))] rounded-2xl border p-4 text-[12px] shadow-2xl"
    >
      <div className="mb-2 flex items-start justify-between gap-2 border-b border-(--border-color) pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <Flag place={place} className="h-7 w-10 rounded shadow-md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-bold uppercase tracking-wider">{place.country}</span>
              <span className="rounded bg-(--border-color) px-1.5 py-0.5 font-mono text-[11px] font-bold text-(--accent-color)">
                {place.code}
              </span>
            </div>
            <span className="font-mono text-[11px] uppercase opacity-60">{place.region}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 opacity-70 transition-colors hover:bg-(--border-color) hover:opacity-100"
          title="Close"
        >
          <i className="fa-solid fa-xmark text-[12px]" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 font-semibold">
        <i className="fa-solid fa-location-dot text-[11px] text-(--accent-color)" />
        <span>{place.name}</span>
      </div>
      <div className="mt-0.5 font-mono text-[11px] opacity-70">
        LAT {formatCoord(place.lat)} LON {formatCoord(place.lon)}
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-1.5 border-t border-(--border-color) pt-2 font-mono text-[11px] opacity-90">
        <div>Pop: <span className="font-bold">{place.pop}</span></div>
        <div>Time: <span className="font-bold">{place.tz}</span></div>
        <div>Currency: <span className="font-bold">{place.curr}</span></div>
        <div>Region: <span className="font-bold">{place.region}</span></div>
      </div>

      <p className="mt-2.5 rounded-lg bg-(--accent-subtle) p-2 text-[12px] leading-snug opacity-90">{place.fact}</p>

      <button
        type="button"
        onClick={() => onCenter(place)}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-(--fg-color) py-2 text-[12px] font-bold uppercase tracking-wider text-(--bg-color) transition-opacity hover:opacity-90 active:scale-95"
      >
        <i className="fa-solid fa-crosshairs text-[11px]" />
        <span>Center on territory</span>
      </button>
    </div>
  )
}
