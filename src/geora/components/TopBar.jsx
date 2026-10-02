const buttonClass =
  'bit-panel hud-corner flex items-center gap-1.5 border px-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors active:scale-95 sm:px-3'

export default function TopBar({ docsOn, settingsOn, onDocs, onSettings }) {
  return (
    <header
      data-ui
      className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4"
      style={{ paddingTop: 'var(--hud-safe-top)' }}
    >
      <div className="bit-panel pointer-events-auto flex h-9 w-fit items-center gap-2 border px-3">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-(--accent-color)" aria-hidden="true" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Geora</span>
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
          aria-label="Open documentation"
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
          aria-label="Open settings"
        >
          <i className="fa-solid fa-sliders text-(--accent-color)" aria-hidden="true" />
          <span>Settings</span>
        </button>
      </div>
    </header>
  )
}
