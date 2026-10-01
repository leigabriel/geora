export default function HudToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      data-ui
      onClick={onToggle}
      title={visible ? 'Hide interface (H)' : 'Show interface (H)'}
      aria-label={visible ? 'Hide interface' : 'Show interface'}
      aria-pressed={visible}
      style={{ bottom: 'var(--hud-safe-bottom)' }}
      className="bit-panel hud-corner fixed right-3 z-20 flex w-9 items-center justify-center border transition-colors hover:border-(--accent-color) hover:text-(--accent-color) active:scale-95 sm:right-4"
    >
      <i className={`fa-solid ${visible ? 'fa-eye' : 'fa-eye-slash'}`} aria-hidden="true" />
    </button>
  )
}
