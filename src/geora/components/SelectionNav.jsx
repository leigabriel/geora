// The layer console at the bottom centre: a strip of numbered cells that switches
// layers on tap, plus a readout that opens the full console. The panel never
// outlives the gesture that opened it — picking a layer, a pointerdown anywhere
// outside the dock, Tab or Escape all close it and hand focus back.
import { useCallback, useEffect, useRef, useState } from 'react'
import { MODE_KEYS, modeMeta } from '../lib/modes.js'
import { Box, KeyCap, Label } from './ui.jsx'

const PANEL_ID = 'geora-layer-console'

export default function SelectionNav({ mode, onMode }) {
  // the console is keyed to the layer it was opened on, so a layer chosen from
  // the keyboard or from a card closes it without an effect watching `mode`
  const [openFor, setOpenFor] = useState(null)
  const open = openFor === mode
  const navRef = useRef(null)
  const triggerRef = useRef(null)
  const itemRefs = useRef([])
  const index = Math.max(0, MODE_KEYS.indexOf(mode))
  const active = modeMeta(mode)
  const close = useCallback(() => setOpenFor(null), [])

  // Escape is caught on the way in so it closes the console and nothing else:
  // the app's own Escape handler would also drop an open card behind the panel.
  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (event.button && event.button !== 0) return
      if (navRef.current?.contains(event.target)) return
      // the globe canvas lives under this dock, so a tap anywhere else dismisses
      // the console before the click reaches whatever opened it
      close()
    }
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      close()
      triggerRef.current?.focus()
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open, close])

  // opening always lands on the running layer, so the console reads as a
  // position in a list rather than as five unrelated buttons
  useEffect(() => {
    if (open) itemRefs.current[index]?.focus()
  }, [open, index])

  const pick = useCallback(
    (key) => {
      onMode(key)
      close()
      triggerRef.current?.focus()
    },
    [onMode, close],
  )

  const onPanelKey = (event) => {
    const count = MODE_KEYS.length
    const from = itemRefs.current.indexOf(document.activeElement)
    const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (delta) {
      event.preventDefault()
      event.stopPropagation()
      itemRefs.current[(from + delta + count) % count]?.focus()
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      event.stopPropagation()
      itemRefs.current[event.key === 'Home' ? 0 : count - 1]?.focus()
      return
    }
    if (event.key === 'Tab') close()
  }

  return (
    <nav
      ref={navRef}
      data-ui
      aria-label="Globe layers"
      className="pointer-events-auto relative w-full max-w-[calc(100vw-1.5rem)]"
    >
      {open ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(100%+0.5rem)] flex justify-center px-3">
          <Box
            id={PANEL_ID}
            role="menu"
            aria-label="Layers"
            onKeyDown={onPanelKey}
            className="dock-pop pointer-events-auto w-[21rem] rounded-2xl p-0 shadow-xl"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <Label opacity>Layer</Label>
              <span className="flex items-center gap-1">
                <span className="font-readout text-[9px] opacity-40">1–{MODE_KEYS.length}</span>
                <KeyCap>esc</KeyCap>
              </span>
            </div>

            <ul className="border-t border-(--border-color)">
              {MODE_KEYS.map((key, i) => {
                const meta = modeMeta(key)
                const selected = key === mode
                return (
                  <li key={key}>
                    <button
                      type="button"
                      role="menuitemradio"
                      ref={(node) => {
                        itemRefs.current[i] = node
                      }}
                      tabIndex={-1}
                      aria-checked={selected}
                      data-selected={selected ? 'true' : 'false'}
                      onClick={() => pick(key)}
                      title={`${meta.label} — ${meta.hint}`}
                      className="mode-row flex w-full items-center gap-2.5 border-b border-(--border-color) px-3 py-1.5 text-left transition-colors last:border-b-0 hover:bg-(--accent-subtle)"
                    >
                      <span className="font-readout w-4 shrink-0 text-[10px] opacity-45">{i + 1}</span>
                      <i className={`fa-solid ${meta.icon} w-3 shrink-0 text-[11px]`} aria-hidden="true" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[11px] font-bold uppercase tracking-[0.16em]">
                          {meta.label}
                        </span>
                        <span className="truncate text-[9px] leading-snug opacity-55">{meta.hint}</span>
                      </span>
                      <KeyCap>{i + 1}</KeyCap>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Box>
        </div>
      ) : null}

      <div className="bit-panel mx-auto flex w-fit max-w-full items-stretch overflow-hidden rounded-full border shadow-lg">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? close() : setOpenFor(mode))}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={PANEL_ID}
          aria-label={`${active.label}, layer ${index + 1} of ${MODE_KEYS.length}. ${open ? 'Hide' : 'Show'} the layer console`}
          title={`${active.label} — ${active.hint}`}
          className="flex min-h-[2.5rem] items-center gap-2 px-3 transition-colors hover:bg-(--accent-subtle) hover:text-(--accent-color)"
        >
          <span
            aria-hidden="true"
            className={`h-3 w-[3px] rounded-[1px] transition-colors ${open ? 'bg-(--accent-color)' : 'bg-(--dim-color)'}`}
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{active.label}</span>
          <i
            className={`fa-solid fa-chevron-up text-[8px] opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        <span aria-hidden="true" className="w-px self-stretch bg-(--border-color)" />

        <span role="group" aria-label="Switch layer" className="flex items-stretch divide-x divide-(--border-color)">
          {MODE_KEYS.map((key, i) => {
            const meta = modeMeta(key)
            const selected = key === mode
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                aria-label={`${meta.label} — ${meta.hint}`}
                title={`${meta.label} (${i + 1})`}
                onClick={() => pick(key)}
                className="mode-cell flex h-[2.5rem] w-[2.4rem] flex-col items-center justify-center gap-[3px]"
              >
                <i className={`fa-solid ${meta.icon} text-[11px]`} aria-hidden="true" />
                <span className="font-readout text-[8px] leading-none opacity-70">{i + 1}</span>
              </button>
            )
          })}
        </span>
      </div>
    </nav>
  )
}
