import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './geora.css'
import config, { MODE_KEYS } from './config.js'
import { createGlobeScene } from './lib/scene.js'
import { bindControls } from './lib/controls.js'
import { buildAnalytics } from './lib/analytics.js'
import { createAudio } from './lib/audio.js'
import TopBar from './components/TopBar.jsx'
import SelectionNav from './components/SelectionNav.jsx'
import ActionBar from './components/ActionBar.jsx'
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

export default function Geora() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const restoreRef = useRef(null)

  const [prefs, patchPrefs] = usePrefs()
  const [mode, setMode] = useState(config.defaultMode)
  const [card, setCard] = useState(null)
  const [hover, setHover] = useState(null)
  const [hudVisible, setHudVisible] = useState(true)
  const [spinning, setSpinning] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
    return true
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const analytics = useMemo(() => buildAnalytics(config.places), [])
  // the polaroid layer is declared in data/landmarks.js and fixed at build time:
  // one photograph per nation, at the coordinates of the landmark it shows
  const photos = useMemo(() => config.buildPolaroids(config.places), [])
  const audio = useMemo(() => createAudio(), [])

  // ---- card lifecycle --------------------------------------------------------
  const dismissCard = useCallback(() => {
    setCard(null)
    setHover(null)
    sceneRef.current?.setSelected(null)
    sceneRef.current?.setHoverHighlight(null)
    if (restoreRef.current) {
      sceneRef.current?.restore(restoreRef.current)
      restoreRef.current = null
    }
  }, [])

  const changeMode = useCallback(
    (next) => {
      dismissCard()
      setMode(next)
    },
    [dismissCard],
  )

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

  const handleCenter = useCallback((place) => {
    const scene = sceneRef.current
    if (!scene || place?.lat == null) return
    // only the first focus is snapshotted, so a second card cannot hand the
    // globe back to the wrong place
    if (!restoreRef.current) restoreRef.current = scene.snapshot()
    scene.flyTo(place)
  }, [])

  // ---- scene lifecycle -------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const scene = createGlobeScene({ container, config })
    sceneRef.current = scene
    scene.start()
    scene.setTheme(config.themes[prefs.theme] ?? config.themes[config.defaultTheme])
    scene.setHalftone(prefs.halftone)
    scene.setGlobeScale(prefs.profile.globeScale)
    scene.setMarkerScale(prefs.profile.markerScale)
    scene.setDetail(prefs.profile.detail)
    scene.setAnimationIntensity(prefs.profile.animation)
    scene.setMotion(prefs.profile.motion)
    scene.setAnalytics(analytics, config.defaultMetric)
    scene.setMode(config.defaultMode)

    const unbind = bindControls({
      scene,
      audio,
      onHover: (descriptor, x, y) => {
        // the pointer turns into a hand the moment a beacon is under it
        if (containerRef.current) containerRef.current.dataset.markerHover = String(Boolean(descriptor))
        scene.setHoverHighlight(descriptor)
        if (!descriptor) {
          setHover(null)
          return
        }
        setHover({ target: descriptor, x, y })
        audio.hoverBlip()
      },
      onSelect: (descriptor, x, y) => {
        setCard({ x, y, target: descriptor })
        setHover(null)
        scene.setHoverHighlight(null)
        scene.setSelected(descriptor)
        if (!restoreRef.current) restoreRef.current = scene.snapshot()
        if (descriptor.place) scene.flyTo(descriptor.place)
        else if (descriptor.kind === 'polaroid' && Number.isFinite(descriptor.photo?.lat)) {
          // a photo focuses on the landmark it shows, not on its capital
          scene.flyTo({ lat: descriptor.photo.lat, lon: descriptor.photo.lon })
        }
        audio.selectChime()
      },
      // every marker is declared in code, so the globe has nothing to place from
      // a tap: a tap on bare space simply drops the open card
      onSphere: () => {
        dismissCard()
      },
    })

    return () => {
      unbind()
      scene.dispose()
      sceneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => audio.dispose(), [audio])

  useEffect(() => {
    audio.setEnabled(prefs.sound)
  }, [audio, prefs.sound])

  useEffect(() => {
    const theme = config.themes[prefs.theme] ?? config.themes[config.defaultTheme]
    document.body.className = theme.body
    sceneRef.current?.setTheme(theme)
  }, [prefs.theme])

  useEffect(() => {
    const scene = sceneRef.current
    if (scene) scene.setHalftone(prefs.halftone)
  }, [prefs.halftone])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    scene.setGlobeScale(prefs.profile.globeScale)
    scene.setMarkerScale(prefs.profile.markerScale)
    scene.setDetail(prefs.profile.detail)
    scene.setAnimationIntensity(prefs.profile.animation)
    scene.setMotion(prefs.profile.motion)
  }, [prefs.profile])

  // automatic rotation is gated by both the spin switch and motion sensitivity,
  // so they are asserted together instead of fighting each other
  useEffect(() => {
    sceneRef.current?.setAutoRotate(spinning && prefs.profile.motion)
  }, [spinning, prefs.profile.motion])

  useEffect(() => {
    sceneRef.current?.setMode(mode)
    sceneRef.current?.setSelected(card?.target ?? null)
  }, [mode, card])

  useEffect(() => {
    sceneRef.current?.setPolaroids(photos)
  }, [photos])

  // ---- layers ---------------------------------------------------------------
  const handleStep = useCallback(
    (delta) => {
      changeMode(config.step(mode, delta))
      audio.pip(delta > 0 ? 'E6' : 'C6')
    },
    [changeMode, mode, audio],
  )

  const selectMode = useCallback(
    (key) => {
      changeMode(key)
      audio.pip('C6')
    },
    [changeMode, audio],
  )

  // ---- keyboard --------------------------------------------------------------
  useEffect(() => {
    const onKey = (event) => {
      if (event.target instanceof HTMLInputElement) return
      const key = event.key.toLowerCase()

      if (event.key === 'Escape') {
        if (docsOpen) setDocsOpen(false)
        else if (settingsOpen) setSettingsOpen(false)
        else dismissCard()
        return
      }
      if (event.key >= '1' && event.key <= String(MODE_KEYS.length)) {
        selectMode(MODE_KEYS[Number(event.key) - 1])
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
    <div ref={containerRef} className="relative h-full w-full overflow-hidden" role="application" aria-label="Geora interactive globe">
      {hudVisible ? (
        <>
          <TopBar docsOn={docsOpen} settingsOn={settingsOpen} onDocs={toggleDocs} onSettings={toggleSettings} />

          <GlobeControls
            spinning={spinning}
            spinEnabled={prefs.profile.motion}
            onReset={() => {
              dismissCard()
              sceneRef.current?.reset()
              audio.pip('C6')
            }}
            onSpin={() => {
              setSpinning((on) => !on)
              audio.pip('D6')
            }}
          />

          {/* The layer readout sits above the dock. It reports what the running
              layer holds and nothing else: every choice a host might want to
              expose is declared in config.js instead of being made here. */}
          <div
            className="pointer-events-none fixed inset-x-0 z-20 flex flex-col items-center gap-2 px-3"
            style={{ bottom: 'calc(var(--hud-safe-bottom) + 3rem)' }}
          >
            <div
              data-ui
              className="bit-panel geora-dock flex w-full max-w-[min(42rem,calc(100vw-1.5rem))] flex-col items-center gap-2 rounded-2xl border px-3 py-2 sm:px-4"
            >
              <ActionBar mode={mode} config={config} analytics={analytics} />
            </div>

            <SelectionNav mode={mode} onMode={selectMode} />
          </div>
        </>
      ) : null}

      <HudToggle visible={hudVisible} onToggle={() => setHud(!hudVisible)} />
      <BeaconTooltip hover={hover} />

      {card ? (
        <InfoCard card={card} config={config} onClose={dismissCard} onCenter={handleCenter} />
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
