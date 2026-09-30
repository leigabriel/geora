import { MODE_KEYS, modeMeta, step } from '../lib/modes.js'

// The selection navigation at the bottom of the screen: previous, active and
// next, written as plain words. No panel, no border, no icon set — the globe
// stays the interface and only the type moves.
//
// Every arrow carries the name of the selection it leads to, so the direction
// and what is available are legible without opening anything. Below the small
// breakpoint the neighbour names drop away and only the arrows remain, which
// keeps the row clear of the controls pinned to both bottom corners.
export default function SelectionNav({ mode, onStep, onMode }) {
  const active = modeMeta(mode)
  const index = MODE_KEYS.indexOf(mode)
  const previous = modeMeta(step(mode, -1))
  const next = modeMeta(step(mode, 1))

  return (
    <div
      data-ui
      className="pointer-events-none flex w-full flex-wrap items-center justify-center gap-x-1 gap-y-1 rounded-xl border border-(--border-color) px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] sm:gap-x-3"
    >
      <button
        type="button"
        onClick={() => onStep(-1)}
        title={`Previous: ${previous.label}`}
        aria-label={`Previous selection: ${previous.label}`}
        className="hud-btn pointer-events-auto"
      >
        <span aria-hidden="true">‹</span>
        <span className="hidden sm:inline"> {previous.label}</span>
      </button>

      <button
        type="button"
        onClick={() => onMode(mode)}
        title={`${active.label} — ${active.hint}`}
        aria-current="true"
        data-active-mode={mode}
        data-pressed="true"
        className="hud-btn pointer-events-auto text-(--accent-color)"
      >
        {active.label}
        <span className="ml-2 font-readout text-[10px] opacity-55">
          {index + 1}/{MODE_KEYS.length}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onStep(1)}
        title={`Next: ${next.label}`}
        aria-label={`Next selection: ${next.label}`}
        className="hud-btn pointer-events-auto"
      >
        <span className="hidden sm:inline">{next.label} </span>
        <span aria-hidden="true">›</span>
      </button>
    </div>
  )
}
