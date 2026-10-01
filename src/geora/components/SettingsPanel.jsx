import { THEMES } from '../lib/themes.js'

function Slider({ label, value, min, max, step, display, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex justify-between text-[12px]">
        <span>{label}</span>
        <span className="font-readout text-(--accent-color)">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    </label>
  )
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-(--border-color)"
    >
      <span className="flex flex-col">
        <span>{label}</span>
        {hint ? <span className="text-[10px] opacity-55">{hint}</span> : null}
      </span>
      <span
        className={`flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
          checked ? 'justify-end border-(--accent-color) bg-(--accent-color)' : 'justify-start border-(--border-color)'
        }`}
      >
        <span className="mx-0.5 h-3.5 w-3.5 rounded-full bg-(--bg-color)" />
      </span>
    </button>
  )
}

function Section({ title, children, note }) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="border-b border-(--border-color) pb-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider opacity-80">{title}</h2>
        {note ? <p className="text-[10px] leading-snug opacity-50">{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default function SettingsPanel({
  open,
  themeKey,
  onClose,
  onTheme,
  halftone,
  onHalftone,
  profile,
  onProfile,
  sound,
  onSound,
}) {
  const set = (patch) => onHalftone({ ...halftone, ...patch })
  const setProfile = (patch) => onProfile({ ...profile, ...patch })

  return (
    <>
      <div
        data-ui
        onPointerDown={onClose}
        className={`fixed inset-0 z-[50] bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        data-ui
        data-closed={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className={`bit-panel slide-right fixed inset-y-0 right-0 z-[60] flex w-[92vw] max-w-[520px] flex-col gap-4 border-l p-4 shadow-2xl sm:w-[520px] sm:max-w-[min(520px,80vw)] sm:p-5 ${
          open ? '' : 'pointer-events-none'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-(--border-color) pb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-(--accent-color)" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Settings</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hud-btn min-h-[2rem] min-w-[2rem] p-1.5 text-sm opacity-70"
            title="Close panel (Esc)"
            aria-label="Close settings"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="custom-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pr-1 select-text">

        <Section title="Display" note="Globe detail, marker visibility and theme.">
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Theme">
            {Object.entries(THEMES).map(([key, theme]) => (
              <button
                key={key}
                type="button"
                onClick={() => onTheme(key)}
                aria-pressed={themeKey === key}
                aria-label={`Theme ${theme.label}`}
                className={`flex min-h-[2.5rem] items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[11px] transition-colors ${
                  themeKey === key
                    ? 'border-(--accent-color) text-(--accent-color)'
                    : 'border-(--border-color) opacity-75 hover:opacity-100'
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border"
                  aria-hidden="true"
                  style={{ background: `#${theme.bg.toString(16).padStart(6, '0')}` }}
                />
                <span className="min-w-0">
                  <span className="block truncate font-bold">{theme.label}</span>
                  <span className="block truncate text-[9px] opacity-55">#{theme.border.toString(16).padStart(6, '0')}</span>
                </span>
              </button>
            ))}
          </div>
          <Slider
            label="Globe scale"
            value={profile.globeScale}
            min={0.7}
            max={1.35}
            step={0.01}
            display={`${profile.globeScale.toFixed(2)}x`}
            onChange={(globeScale) => setProfile({ globeScale })}
          />
          <Slider
            label="Marker visibility"
            value={profile.markerScale}
            min={0.5}
            max={1.8}
            step={0.05}
            display={`${profile.markerScale.toFixed(2)}x`}
            onChange={(markerScale) => setProfile({ markerScale })}
          />
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[12px]">
              <span id="detail-label">Globe detail</span>
              <span className="font-readout text-(--accent-color)" aria-hidden="true">{profile.detail}</span>
            </div>
            <div className="flex gap-1" role="group" aria-labelledby="detail-label">
              {['LOW', 'MEDIUM', 'HIGH'].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setProfile({ detail: index })}
                  aria-pressed={profile.detail === index}
                  aria-label={`Detail ${label}`}
                  className={`min-h-[2.25rem] flex-1 rounded-lg border py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    profile.detail === index
                      ? 'border-(--accent-color) text-(--accent-color)'
                      : 'border-(--border-color) opacity-70 hover:opacity-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <details className="rounded-lg border border-(--border-color) px-2 py-1.5">
            <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider opacity-80">
              Halftone calibration
            </summary>
            <div className="mt-2 flex flex-col gap-2.5">
              <Slider
                label="Density"
                value={halftone.density}
                min={0.2}
                max={1}
                step={0.02}
                display={`${Math.round(halftone.density * 100)}%`}
                onChange={(density) => set({ density })}
              />
              <Slider
                label="Dot scale"
                value={halftone.scale}
                min={0.5}
                max={2.4}
                step={0.05}
                display={`${halftone.scale.toFixed(2)}x`}
                onChange={(scale) => set({ scale })}
              />
              <Slider
                label="Contrast"
                value={halftone.contrast}
                min={0.3}
                max={2.2}
                step={0.05}
                display={`${halftone.contrast.toFixed(2)}x`}
                onChange={(contrast) => set({ contrast })}
              />
              <Slider
                label="Threshold"
                value={halftone.threshold}
                min={0.3}
                max={0.52}
                step={0.005}
                display={halftone.threshold.toFixed(3)}
                onChange={(threshold) => set({ threshold })}
              />
              <Slider
                label="Intensity"
                value={halftone.intensity}
                min={0.3}
                max={1.6}
                step={0.05}
                display={`${halftone.intensity.toFixed(2)}x`}
                onChange={(intensity) => set({ intensity })}
              />
              <div className="grid grid-cols-2 gap-2 border-t border-(--border-color) pt-2.5">
                <Slider
                  label="Ambient fill"
                  value={halftone.ambient}
                  min={0.2}
                  max={1}
                  step={0.02}
                  display={halftone.ambient.toFixed(2)}
                  onChange={(ambient) => set({ ambient })}
                />
                <Slider
                  label="Ocean dots"
                  value={halftone.ocean}
                  min={0}
                  max={1}
                  step={0.02}
                  display={halftone.ocean.toFixed(2)}
                  onChange={(ocean) => set({ ocean })}
                />
              </div>
            </div>
          </details>
        </Section>

        <Section title="Interaction" note="Auto rotation, camera behaviour and sensitivity.">
          <Toggle
            label="Motion sensitivity"
            hint="Turn off to freeze spin, pulses and inertia."
            checked={profile.motion}
            onChange={(motion) => setProfile({ motion })}
          />
          <Slider
            label="Animation intensity"
            value={profile.animation}
            min={0}
            max={2.5}
            step={0.05}
            display={`${profile.animation.toFixed(2)}x`}
            onChange={(animation) => setProfile({ animation })}
          />
        </Section>

        <Section title="Audio" note="Interface sounds, synthesized in the browser.">
          <Toggle label="Interface sounds" hint="Hover blips, selection chimes and UI pips." checked={sound} onChange={onSound} />
        </Section>
        </div>
      </aside>
    </>
  )
}
