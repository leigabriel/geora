// Bottom left: the two controls that act on the globe itself. Same height,
// radius, border and type as every other control so the HUD reads as one
// instrument.
export default function GlobeControls({
  spinning,
  spinEnabled,
  spinHint = 'Motion sensitivity is off in Settings',
  onReset,
  onSpin,
}) {
  // what the control reports has to be what the globe will actually do: the
  // engine follows prefers-reduced-motion under motion="auto", so an enabled
  // Spin that cannot spin would be a lie
  const spinningNow = spinning && spinEnabled
  return (
    <div
      data-ui
      role="group"
      aria-label="Globe controls"
      style={{ bottom: 'var(--hud-safe-bottom)' }}
      className="bit-panel fixed left-3 z-20 flex h-9 items-center gap-1 border px-1.5 text-[10px] font-bold uppercase tracking-[0.16em] sm:left-4"
    >
      <button
        type="button"
        onClick={onReset}
        title="Return to the default globe state"
        aria-label="Reset globe view"
        className="hud-btn pointer-events-auto min-h-[2rem]"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={onSpin}
        disabled={!spinEnabled}
        aria-pressed={spinningNow}
        data-pressed={spinningNow ? 'true' : 'false'}
        title={
          spinEnabled ? `Automatic rotation ${spinningNow ? 'on' : 'off'}` : spinHint
        }
        aria-label={spinningNow ? 'Pause automatic rotation' : 'Resume automatic rotation'}
        className="hud-btn pointer-events-auto min-h-[2rem] disabled:opacity-30"
      >
        Spin
      </button>
    </div>
  )
}
