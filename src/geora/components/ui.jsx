// The dock is one instrument: every panel, control and readout in it is drawn
// from these four primitives, so a frame in the mode console matches a frame in
// the mode tools without either file restating the geometry.

export function Box({ children, className = '', tone = 'default', title }) {
  const surface =
    tone === 'live' ? 'bg-(--accent-subtle)' : tone === 'quiet' ? 'bg-transparent' : 'bg-(--card-bg)'
  return (
    <div
      title={title}
      data-tone={tone}
      className={`rounded-xl border border-(--border-color) px-2.5 py-1.5 ${surface} ${className}`}
    >
      {children}
    </div>
  )
}

export function Label({ children, opacity, className = '' }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-[0.16em] ${opacity ? 'opacity-60' : ''} ${className}`}
    >
      {children}
    </span>
  )
}

// A key drawn as a key: the only chrome in the HUD that pretends to be hardware.
export function KeyCap({ children }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-[1.15rem] min-w-[1.15rem] shrink-0 items-center justify-center rounded-[3px] border border-(--border-color) bg-(--card-bg) px-1 font-readout text-[9px] font-bold leading-none opacity-55"
    >
      {children}
    </span>
  )
}

export function Choices({ items, value, onPick }) {
  return (
    <span className="flex flex-wrap items-center justify-center gap-1" role="group">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onPick(item.key)}
          title={item.title ?? item.label}
          aria-pressed={value === item.key}
          aria-label={item.title ?? item.label}
          data-pressed={value === item.key ? 'true' : 'false'}
          className="hud-btn pointer-events-auto min-h-8 text-[10px] font-bold uppercase tracking-[0.14em]"
        >
          {item.label}
        </button>
      ))}
    </span>
  )
}

export function Action({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="hud-btn pointer-events-auto min-h-8 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export function Separator() {
  return (
    <span aria-hidden="true" className="px-1 text-[10px] opacity-35">
      ·
    </span>
  )
}
