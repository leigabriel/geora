import Flag from './Flag.jsx'

export default function BottomBar({ spinning, place, onReset, onSpin }) {
  return (
    <footer
      data-ui
      className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-end justify-between gap-2 sm:inset-x-auto sm:left-4 sm:bottom-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bit-panel pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-[12px] shadow-xl sm:gap-3 sm:px-3.5 sm:py-2.5">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 opacity-80 transition-opacity hover:opacity-100"
          title="Reset view"
        >
          <i className="fa-solid fa-arrows-rotate" />
          <span className="hidden sm:inline">RESET</span>
        </button>

        <span className="opacity-30">•</span>

        <button
          type="button"
          onClick={onSpin}
          className="flex items-center gap-1.5 opacity-80 transition-opacity hover:opacity-100"
          title="Pause or resume rotation"
        >
          <i className={`fa-solid ${spinning ? 'fa-pause' : 'fa-play'}`} />
          <span>{spinning ? 'SPIN' : 'PAUSED'}</span>
        </button>

        <span className="opacity-30">•</span>

        <span className="flex items-center gap-1.5 rounded bg-[var(--border-color)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent-color)]">
          {place ? <Flag place={place} /> : <span>🌐</span>}
          <span className="truncate">{place ? place.code : 'GLOBAL'}</span>
        </span>
      </div>
    </footer>
  )
}
