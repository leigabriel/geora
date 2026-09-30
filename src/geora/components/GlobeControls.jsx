// Bottom left: the two controls that act on the globe itself. Framed like every
// other tool cluster so the tap target has an edge.
export default function GlobeControls({ spinning, spinEnabled, onReset, onSpin }) {
  return (
    <div
      data-ui
      className="bit-panel fixed bottom-3 left-3 z-20 flex items-center gap-1 rounded-xl border px-1.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] sm:left-4"
    >
      <button
        type="button"
        onClick={onReset}
        title="Return to the default globe state"
        className="hud-btn pointer-events-auto"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={onSpin}
        disabled={!spinEnabled}
        aria-pressed={spinning}
        data-pressed={spinning && spinEnabled ? 'true' : 'false'}
        title={
          spinEnabled
            ? `Automatic rotation ${spinning ? 'on' : 'off'}`
            : 'Motion sensitivity is off in Settings'
        }
        className="hud-btn pointer-events-auto disabled:opacity-30"
      >
        Spin
      </button>
    </div>
  )
}
