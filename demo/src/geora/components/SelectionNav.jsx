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
      className="bit-panel pointer-events-auto flex h-9 items-center gap-1 border px-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
    >
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
    </nav>
  )
}
