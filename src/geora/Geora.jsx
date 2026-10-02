import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './geora.css'
import config, { MODE_KEYS } from './config.js'
import { themeHex } from './lib/themes.js'
import { createGlobeScene } from './lib/scene.js'
import { bindControls } from './lib/controls.js'
import { buildAnalytics } from './lib/analytics.js'
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
  // The active theme paints the globe stage only: the backdrop under the canvas
  // plus the scene itself. The HUD chrome never follows it, so panels, modals
  // and text keep their fixed Paper White contrast whatever is picked here.
  const theme = config.themes[prefs.theme] ?? config.themes[config.defaultTheme]
  const stageBg = themeHex(theme.bg)

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

  // ---- scene lifecycle -------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const scene = createGlobeScene({ container, config })
    sceneRef.current = scene
    scene.start()
    scene.setTheme(theme)
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

  // a theme switch repaints the scene only; `theme` also feeds --stage-bg on the
  // container, so the backdrop behind the canvas and the globe move together
  useEffect(() => {
    sceneRef.current?.setTheme(theme)
  }, [theme])

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
    <div
      ref={containerRef}
      className="geora-stage relative h-full w-full overflow-hidden"
      style={{ '--stage-bg': stageBg }}
      role="application"
      aria-label="Geora interactive globe"
    >
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

          {/* The layer nav shares the corner controls' baseline on wide screens
              and stacks above them on narrow ones: Reset/Spin bottom-left, the
              eye bottom-right, the nav between. */}
          <div className="bottom-nav-slot pointer-events-none fixed inset-x-0 z-20 flex justify-center px-3">
            <SelectionNav mode={mode} onMode={selectMode} />
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
