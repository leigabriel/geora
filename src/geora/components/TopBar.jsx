const buttonClass =
  'bit-panel flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs transition-colors active:scale-95 hover:border-[var(--fg-color)] sm:px-3'

export default function TopBar({ soundOn, themeLabel, atlasOn, onSound, onTheme, onAtlas }) {
  return (
    <header
      data-ui
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-3 sm:p-4"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <div className="bit-panel pointer-events-auto flex w-fit items-center gap-2.5 rounded-xl border px-3 py-2 text-xs">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent-color)] animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest">Geora</span>
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
        <button type="button" className={buttonClass} onClick={onSound} title="Toggle bit audio">
          <i className={`fa-solid ${soundOn ? 'fa-volume-high text-[var(--accent-color)]' : 'fa-volume-xmark'}`} />
          <span className="hidden text-[11px] font-bold uppercase tracking-wider lg:inline">
            {soundOn ? 'Audio' : 'Mute'}
          </span>
        </button>

        <button type="button" className={buttonClass} onClick={onTheme} title="Switch visual profile">
          <i className="fa-solid fa-palette text-[var(--accent-color)]" />
          <span className="hidden text-[11px] font-bold uppercase tracking-wider lg:inline">{themeLabel}</span>
        </button>

        <button
          type="button"
          className={`${buttonClass} ${atlasOn ? 'border-[var(--accent-color)] text-[var(--accent-color)]' : 'hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]'}`}
          onClick={onAtlas}
          title="Open atlas and calibration panel"
        >
          <i className="fa-solid fa-earth-americas text-[var(--accent-color)]" />
          <span className="hidden text-[11px] font-bold uppercase tracking-wider lg:inline">Atlas</span>
        </button>
      </div>
    </header>
  )
}
