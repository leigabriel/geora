export default function HudToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      data-ui
      onClick={onToggle}
      title={visible ? 'Hide interface (H)' : 'Show interface (H)'}
      aria-label={visible ? 'Hide interface' : 'Show interface'}
      className="bit-panel fixed right-3 bottom-3 z-20 flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:border-(--accent-color) hover:text-(--accent-color) active:scale-95 sm:right-4 sm:bottom-4"
    >
      <i className={`fa-solid ${visible ? 'fa-eye' : 'fa-eye-slash'}`} />
    </button>
  )
}
