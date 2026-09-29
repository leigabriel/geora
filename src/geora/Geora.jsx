import { useCallback, useEffect, useRef, useState } from 'react'
import './geora.css'
import { createGlobeScene } from './lib/scene.js'
import { createAudio } from './lib/audio.js'
import { bindControls } from './lib/controls.js'
import { THEMES, nextTheme } from './lib/themes.js'
import AtlasPanel from './components/AtlasPanel.jsx'
import BeaconTooltip from './components/BeaconTooltip.jsx'
import BottomBar from './components/BottomBar.jsx'
import CountryCard from './components/CountryCard.jsx'
import HudToggle from './components/HudToggle.jsx'
import TopBar from './components/TopBar.jsx'

export default function Geora() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const audioRef = useRef(null)
  const resumeSpin = useRef(false)
  const hovered = useRef(null)

  const [hud, setHud] = useState(true)
  const [atlas, setAtlas] = useState(false)
  const [sound, setSound] = useState(false)
  const [themeKey, setThemeKey] = useState('paper')
  const [spinning, setSpinning] = useState(true)
  const [sliders, setSliders] = useState({ ambient: 0.76, ocean: 0.38, dot: 1.1 })
  const [layers, setLayers] = useState({ borders: true, cities: true, scanlines: false })
  const [hover, setHover] = useState(null)
  const [card, setCard] = useState(null)

  const closeCard = useCallback(() => {
    if (resumeSpin.current) {
      resumeSpin.current = false
      sceneRef.current?.setAutoRotate(true)
      setSpinning(true)
    }
    setCard(null)
  }, [])

  const pinPlace = useCallback(
    (place, x, y) => {
      hovered.current = null
      setHover(null)
      if (sceneRef.current?.isAutoRotating()) {
        resumeSpin.current = true
        sceneRef.current.setAutoRotate(false)
        setSpinning(false)
      }
      audioRef.current?.selectChime()
      setCard({ place, x, y })
    },
    [],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const scene = createGlobeScene({ container })
    const audio = createAudio()
    sceneRef.current = scene
    audioRef.current = audio

    const unbind = bindControls({
      scene,
      audio,
      onHover: (place, x, y) => {
        if (!place) {
          hovered.current = null
          setHover(null)
          return
        }
        setHover({ place, x, y })
        if (hovered.current !== place) {
          hovered.current = place
          audio.hoverBlip()
        }
      },
      onSelect: pinPlace,
      onClear: closeCard,
    })

    scene.start()

    return () => {
      unbind()
      scene.dispose()
      audio.dispose()
      sceneRef.current = null
      audioRef.current = null
    }
  }, [pinPlace, closeCard])

  useEffect(() => {
    document.body.className = THEMES[themeKey].body
    sceneRef.current?.setTheme(THEMES[themeKey])
  }, [themeKey])

  useEffect(() => {
    sceneRef.current?.setAmbient(sliders.ambient)
    sceneRef.current?.setOceanOpacity(sliders.ocean)
    sceneRef.current?.setDotScale(sliders.dot)
  }, [sliders])

  useEffect(() => {
    sceneRef.current?.setBorders(layers.borders)
    sceneRef.current?.setCities(layers.cities)
  }, [layers])

  const toggleHud = useCallback(() => {
    setAtlas(false)
    setHud((value) => !value)
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setAtlas(false)
        closeCard()
      }
      if (event.key.toLowerCase() === 'h') toggleHud()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeCard, toggleHud])

  const flyTo = useCallback((place) => {
    sceneRef.current?.flyTo(place)
    audioRef.current?.pip("A6")
  }, [])

  const pickPlace = useCallback(
    (place) => {
      flyTo(place)
      pinPlace(place, window.innerWidth / 2, window.innerHeight * 0.45)
    },
    [flyTo, pinPlace],
  )

  function toggleSound() {
    const on = audioRef.current?.setEnabled(!sound) ?? false
    setSound(on)
    if (on) audioRef.current?.pip("E6")
  }

  function toggleSpin() {
    const next = !spinning
    resumeSpin.current = false
    setSpinning(next)
    sceneRef.current?.setAutoRotate(next)
    if (next) audioRef.current?.pip("C6")
    else audioRef.current?.closeBlip()
  }

  function resetView() {
    closeCard()
    setSpinning(true)
    sceneRef.current?.reset()
    sceneRef.current?.setAutoRotate(true)
    audioRef.current?.pip("C6")
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0 z-0 h-full w-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />

      {layers.scanlines && (
        <div
          className="scanlines pointer-events-none absolute inset-0 z-10"
          style={{ opacity: THEMES[themeKey].scan }}
        />
      )}

      {hud && (
        <>
          <TopBar
            soundOn={sound}
            themeLabel={THEMES[themeKey].label}
            atlasOn={atlas}
            onSound={toggleSound}
            onTheme={() => setThemeKey((key) => nextTheme(key))}
            onAtlas={() => setAtlas((value) => !value)}
          />
          <BottomBar spinning={spinning} place={card?.place ?? null} onReset={resetView} onSpin={toggleSpin} />
        </>
      )}

      <AtlasPanel
        open={atlas && hud}
        themeKey={themeKey}
        sliders={sliders}
        layers={layers}
        onClose={() => setAtlas(false)}
        onTheme={setThemeKey}
        onSliders={setSliders}
        onLayers={setLayers}
        onPickPlace={pickPlace}
      />

      <BeaconTooltip hover={hover} />
      <CountryCard card={card} onClose={closeCard} onCenter={flyTo} />
      <HudToggle visible={hud} onToggle={toggleHud} />
    </div>
  )
}
