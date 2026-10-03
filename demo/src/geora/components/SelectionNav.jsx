import { modeMeta } from 'geora-globe'

export default function SelectionNav({ modes, mode, onMode }) {
  const list = modes?.length ? modes : [mode]
  const index = Math.max(0, list.indexOf(mode))
  const total = list.length
  const active = modeMeta(mode)

  const goLeft = () => {
    onMode(list[(index - 1 + total) % total])
  }

  const goRight = () => {
    onMode(list[(index + 1) % total])
  }

  return (
    <nav
      data-ui
      aria-label="Globe layers navigation"
      className="bit-panel pointer-events-auto flex flex-col border px-1.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={goLeft}
          aria-label="Previous layer"
          className="hud-btn min-h-[2rem] min-w-[2rem] text-[13px] leading-none"
        >
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <span className="px-1.5">{active.label}</span>
        <span className="opacity-60">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={goRight}
          aria-label="Next layer"
          className="hud-btn min-h-[2rem] min-w-[2rem] text-[13px] leading-none"
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
      {/* The active layer says what it shows, so a first-time visitor does not
          have to guess what a switch to ANALYTICS will reveal. */}
      <p className="mt-1 max-w-[17rem] border-t border-dotted border-(--border-color)/60 pt-1 text-center text-[9px] font-medium normal-case leading-tight tracking-normal opacity-70">
        {active.hint}
      </p>
    </nav>
  )
}
