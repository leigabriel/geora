import { useRef } from 'react'
import useFloating from '../lib/useFloating.js'
import Flag from './Flag.jsx'

export default function BeaconTooltip({ hover }) {
  const ref = useRef(null)
  const style = useFloating(ref, hover?.x, hover?.y, { offsetX: 14, offsetY: -40 })

  if (!hover?.place) return null

  return (
    <div
      ref={ref}
      style={style}
      className="bit-panel pointer-events-none fixed z-40 rounded-xl border px-2.5 py-1.5 shadow-xl"
    >
      <div className="flex items-center gap-2">
        <Flag place={hover.place} className="h-5 w-7" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold">{hover.place.country}</span>
            <span className="rounded bg-[var(--border-color)] px-1 py-0.5 font-mono text-[11px] font-bold text-[var(--accent-color)]">
              {hover.place.code}
            </span>
          </div>
          <span className="text-[11px] opacity-70">{hover.place.name} • tap to inspect</span>
        </div>
      </div>
    </div>
  )
}
