import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
// importing the package registers <geora-globe>
import { joinLandmarks } from 'geora-globe'
import './geora.css'
import config, { step } from './config.js'
import { createAudio } from './lib/audio.js'
import TopBar from './components/TopBar.jsx'
import SelectionNav from './components/SelectionNav.jsx'
import InfoCard from './components/InfoCard.jsx'
import BeaconTooltip from './components/BeaconTooltip.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import DocsPanel from './components/DocsPanel.jsx'
import HudToggle from './components/HudToggle.jsx'
import GlobeControls from './components/GlobeControls.jsx'

// One read-modify-write per preference block, stored under a single key.
function usePrefs() {
  const [prefs, setPrefs] = useState(() => {
    let stored
    try {
      stored = JSON.parse(localStorage.getItem(config.storageKey)) || {}
    } catch {
      stored = {}
    }
    return {
      theme: stored.theme ?? config.defaultTheme,
      halftone: { ...config.halftone, ...(stored.halftone || {}) },
      profile: { ...config.profile, ...(stored.profile || {}) },
      sound: stored.sound ?? true,
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify(prefs))
    } catch {
      // a blocked or full store must not break the globe
    }
  }, [prefs])

  const patch = useCallback((block, value) => {
    setPrefs((current) => ({ ...current, [block]: value }))
  }, [])

  return [prefs, patch]
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  try {
    return Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  } catch {
    return false
  }
}

export default function Geora() {
  const globeRef = useRef(null)

  const [prefs, patchPrefs] = usePrefs()
  const [mode, setMode] = useState(config.defaultMode)
  // the element reports the modes that are actually available (the marker
  // layer only appears once marker data exists); null until first connect
  const [modes, setModes] = useState(null)
  const [card, setCard] = useState(null)
  const [hover, setHover] = useState(null)
  const [hudVisible, setHudVisible] = useState(true)
  const [spinning, setSpinning] = useState(() => !prefersReducedMotion())
  // motion="auto" follows the OS preference, so the globe holds still under
  // prefers-reduced-motion whatever Spin says — the control has to say that
  // too rather than offer a rotation that never happens
  const [reducedMotion] = useState(prefersReducedMotion)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const audio = useMemo(() => createAudio(), [])

  // the polaroid layer is declared in data/landmarks.js and fixed at build
  // time: one photograph per nation, at the coordinates of the landmark
  const landmarks = useMemo(() => joinLandmarks(config.places, 'landmarks'), [])
  const data = useMemo(() => ({ landmarks }), [landmarks])

  // ---- element wiring --------------------------------------------------------
  // runs before paint: listeners attach and the package sees the demo data as
  // soon as the element exists, so no selection can be missed
  useLayoutEffect(() => {
    const el = globeRef.current
    if (!el) return undefined

    el.data = data
    setModes(el.modes ?? [])

    const onHover = (event) => {
      const { marker, x, y } = event.detail
      if (!marker) {
        setHover(null)
        return
      }
      setHover({ target: marker, x, y })
      audio.hoverBlip()
    }
    const onSelect = (event) => {
      const { marker, x, y } = event.detail
      if (!marker) return
      setCard({ x, y, target: marker })
      setHover(null)
      audio.selectChime()
    }
    const onClear = () => {
      setCard(null)
      setHover(null)
    }
    const onModeChange = (event) => {
      setMode(event.detail.mode)
      setModes(event.detail.modes)
      audio.pip('C6')
    }
    const onReset = () => audio.pip('C6')

    el.addEventListener('geora-hover', onHover)
    el.addEventListener('geora-select', onSelect)
    el.addEventListener('geora-clear', onClear)
    el.addEventListener('geora-mode-change', onModeChange)
    el.addEventListener('geora-reset', onReset)

    return () => {
      el.removeEventListener('geora-hover', onHover)
      el.removeEventListener('geora-select', onSelect)
      el.removeEventListener('geora-clear', onClear)
      el.removeEventListener('geora-mode-change', onModeChange)
      el.removeEventListener('geora-reset', onReset)
    }
  }, [data, audio])

  useEffect(() => () => audio.dispose(), [audio])

  useEffect(() => {
    audio.setEnabled(prefs.sound)
  }, [audio, prefs.sound])

  // leaving the globe for the HUD must not leave the tooltip hanging around
  useEffect(() => {
    const onMove = (event) => {
      if (event.target?.closest?.('[data-ui]')) setHover(null)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // drag and wheel gestures are voiced here: the package owns the gestures,
  // the demo owns its soundscape
  useEffect(() => {
    const el = globeRef.current
    if (!el) return undefined
    let dragging = false
    let moved = 0
    let last = null

    const down = (event) => {
      if (event.button !== undefined && event.button !== 0) return
      dragging = true
      moved = 0
      last = { x: event.clientX, y: event.clientY }
    }
    const move = (event) => {
      if (!dragging || !last) return
      const dist = Math.hypot(event.clientX - last.x, event.clientY - last.y)
      last = { x: event.clientX, y: event.clientY }
      moved += dist
      if (dist > 3) audio.swipe(dist / 32)
    }
    const up = () => {
      if (!dragging) return
      dragging = false
      last = null
      if (moved >= 6) audio.swipeStop()
    }
    const wheel = () => audio.pip('G6')

    el.addEventListener('pointerdown', down)
    el.addEventListener('wheel', wheel, { passive: true })
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('wheel', wheel)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [audio])

  // ---- card lifecycle --------------------------------------------------------
  const dismissCard = useCallback(() => {
    setCard(null)
    setHover(null)
    globeRef.current?.clearSelection()
  }, [])

  // hiding the interface takes the whole HUD with it, including anything open
  const setHud = useCallback(
    (visible) => {
      setHudVisible(visible)
      if (visible) return
      setDocsOpen(false)
      setSettingsOpen(false)
      dismissCard()
    },
    [dismissCard],
  )

  // a side panel always takes the card with it: the card would otherwise float
  // above the panel's backdrop
  const toggleDocs = useCallback(() => {
    dismissCard()
    setSettingsOpen(false)
    setDocsOpen((open) => !open)
  }, [dismissCard])

  const toggleSettings = useCallback(() => {
    dismissCard()
    setDocsOpen(false)
    setSettingsOpen((open) => !open)
  }, [dismissCard])

  // ---- layers ----------------------------------------------------------------
  const selectMode = useCallback((key) => {
    const el = globeRef.current
    if (el) el.mode = key
  }, [])

  const handleStep = useCallback((delta) => {
    const el = globeRef.current
    if (!el) return
    const list = el.modes
    el.mode = step(el.mode, delta, list)
  }, [])

  // ---- keyboard --------------------------------------------------------------
  useEffect(() => {
    const onKey = (event) => {
      // the element handles its own keys when focus is inside it
      if (event.defaultPrevented) return
      if (event.target instanceof HTMLInputElement) return
      const key = event.key.toLowerCase()

      if (event.key === 'Escape') {
        if (docsOpen) setDocsOpen(false)
        else if (settingsOpen) setSettingsOpen(false)
        else dismissCard()
        return
      }
      const list = globeRef.current?.modes ?? []
      if (event.key >= '1' && event.key <= '9') {
        const target = list[Number(event.key) - 1]
        if (target) selectMode(target)
        return
      }
      if (event.key === 'ArrowRight') handleStep(1)
      else if (event.key === 'ArrowLeft') handleStep(-1)
      else if (key === 'h') setHud(!hudVisible)
      else if (key === 'd') toggleDocs()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismissCard, selectMode, handleStep, toggleDocs, setHud, docsOpen, settingsOpen, hudVisible])

  return (
    <div className="geora-stage relative h-full w-full overflow-hidden">
      <geora-globe
        ref={globeRef}
        theme={prefs.theme}
        mode={mode}
        spinning={spinning}
        motion={prefs.profile.motion ? 'auto' : false}
        globeScale={prefs.profile.globeScale}
        markerScale={prefs.profile.markerScale}
        detail={prefs.profile.detail}
        animation={prefs.profile.animation}
        halftoneDensity={prefs.halftone.density}
        halftoneScale={prefs.halftone.scale}
        contrast={prefs.halftone.contrast}
        threshold={prefs.halftone.threshold}
        intensity={prefs.halftone.intensity}
        ambient={prefs.halftone.ambient}
        oceanOpacity={prefs.halftone.ocean}
      />

      {hudVisible ? (
        <>
          <TopBar docsOn={docsOpen} settingsOn={settingsOpen} onDocs={toggleDocs} onSettings={toggleSettings} />

          <GlobeControls
            spinning={spinning}
            spinEnabled={prefs.profile.motion && !reducedMotion}
            spinHint={
              prefs.profile.motion
                ? 'Your system prefers reduced motion, so the globe holds still'
                : 'Motion sensitivity is off in Settings'
            }
            onReset={() => {
              dismissCard()
              globeRef.current?.reset()
            }}
            onSpin={() => setSpinning((on) => !on)}
          />

          {/* The layer nav shares the corner controls' baseline on wide screens
              and stacks above them on narrow ones: Reset/Spin bottom-left, the
              eye bottom-right, the nav between. */}
          <div className="bottom-nav-slot pointer-events-none fixed inset-x-0 z-20 flex justify-center px-3">
            <SelectionNav modes={modes} mode={mode} onMode={selectMode} />
          </div>
        </>
      ) : null}

      <HudToggle visible={hudVisible} onToggle={() => setHud(!hudVisible)} />
      <BeaconTooltip hover={hover} />

      {card ? (
        <InfoCard card={card} config={config} onClose={dismissCard} />
      ) : null}

      <SettingsPanel
        open={settingsOpen}
        themeKey={prefs.theme}
        onClose={() => setSettingsOpen(false)}
        onTheme={(key) => {
          patchPrefs('theme', key)
          audio.pip('C7')
        }}
        halftone={prefs.halftone}
        onHalftone={(next) => patchPrefs('halftone', next)}
        profile={prefs.profile}
        onProfile={(next) => patchPrefs('profile', next)}
        sound={prefs.sound}
        onSound={(value) => {
          patchPrefs('sound', value)
          audio.setEnabled(value)
        }}
      />

      <DocsPanel open={docsOpen} onClose={() => setDocsOpen(false)} />
    </div>
  )
}
