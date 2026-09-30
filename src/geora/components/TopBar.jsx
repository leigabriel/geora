const buttonClass =
  'bit-panel flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors active:scale-95 sm:px-3'

export default function TopBar({ docsOn, settingsOn, onDocs, onSettings }) {
  return (
    <header
      data-ui
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <div className="bit-panel pointer-events-auto flex w-fit items-center gap-2.5 rounded-xl border px-3 py-2">
        <span className="inline-block h-2 w-2 rounded-full bg-(--accent-color) animate-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] sm:text-xs">Geora Globe</span>
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          className={`${buttonClass} ${
            docsOn
              ? 'border-(--accent-color) text-(--accent-color)'
              : 'hover:border-(--accent-color) hover:text-(--accent-color)'
          }`}
          onClick={onDocs}
          title="Developer documentation (D)"
          aria-pressed={docsOn}
        >
          <i className="fa-solid fa-book text-(--accent-color)" aria-hidden="true" />
          <span>Docs</span>
        </button>

        <button
          type="button"
          className={`${buttonClass} ${
            settingsOn
              ? 'border-(--accent-color) text-(--accent-color)'
              : 'hover:border-(--accent-color) hover:text-(--accent-color)'
          }`}
          onClick={onSettings}
          title="Halftone calibration, visual profile, sounds and themes"
          aria-pressed={settingsOn}
        >
          <i className="fa-solid fa-sliders text-(--accent-color)" aria-hidden="true" />
          <span>Settings</span>
        </button>
      </div>
    </header>
  )
}
