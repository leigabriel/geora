import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './geora.css'
import config, { MODE_KEYS } from './config.js'
import { createGlobeScene } from './lib/scene.js'
import { bindControls } from './lib/controls.js'
import { buildAnalytics } from './lib/analytics.js'
import { loadLiveWeather } from './lib/weather.js'
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
  const armedRef = useRef(null)
  const itemScaleRef = useRef(1)
  const fileRef = useRef(null)
  const fileKindRef = useRef('sticker')

  const [prefs, patchPrefs] = usePrefs()
  const [mode, setMode] = useState(config.defaultMode)
  const [card, setCard] = useState(null)
  const [hover, setHover] = useState(null)
  const [hudVisible, setHudVisible] = useState(true)
  const [spinning, setSpinning] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [armed, setArmed] = useState(null)
  // a photo that has a country chosen but no file yet: the globe decides where
  // the picture goes, the picker only supplies the bytes
  const [pendingPhoto, setPendingPhoto] = useState(null)
  // short lived status line in the bottom dock
  const [notice, setNoticeState] = useState(null)
  const [units, setUnits] = useState('c')
  const [metric, setMetric] = useState(config.defaultMetric)
  const [tier, setTier] = useState(config.defaultCenterTier)
  const [itemScale, setItemScale] = useState(1)
  const [stickers, setStickers] = useState([])
  const [photos, setPhotos] = useState([])
  const [weather, setWeather] = useState({})
  const [weatherBusy, setWeatherBusy] = useState(false)
  const [weatherError, setWeatherError] = useState(null)
  const [weatherAt, setWeatherAt] = useState(null)
  const analytics = useMemo(() => buildAnalytics(config.places), [])
  const audio = useMemo(() => createAudio(), [])

  // refs mirror the state the scene callback reads: bindControls runs once, so
  // anything it needs has to be reachable without re-binding every render
  const modeRef = useRef(mode)
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const uidRef = useRef(0)
  const pendingRef = useRef(null)
  const noticeTimerRef = useRef(0)
  const noticeIdRef = useRef(0)

  const setNotice = useCallback((text) => {
    noticeIdRef.current += 1
    setNoticeState({ id: noticeIdRef.current, text })
    window.clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = window.setTimeout(() => setNoticeState(null), 3400)
  }, [])

  useEffect(() => () => window.clearTimeout(noticeTimerRef.current), [])

  const clearPending = useCallback(() => {
    pendingRef.current = null
    setPendingPhoto(null)
  }, [])

  const openPicker = useCallback((kind) => {
    fileKindRef.current = kind
    fileRef.current?.click()
  }, [])

  // ---- card lifecycle --------------------------------------------------------
  const dismissCard = useCallback(() => {
    setCard(null)
    setHover(null)
    if (restoreRef.current) {
      sceneRef.current?.restore(restoreRef.current)
      restoreRef.current = null
    }
  }, [])

  // leaving a selection always drops an armed sticker or photo: otherwise a
  // tap in another mode would silently pin something on the far side of the
  // planet with no way to see it
  const disarm = useCallback(() => {
    armedRef.current = null
    setArmed(null)
  }, [])

  const changeMode = useCallback(
    (next) => {
      dismissCard()
      disarm()
      clearPending()
      setNoticeState(null)
      setMode(next)
    },
    [dismissCard, disarm, clearPending],
  )

  // hiding the interface takes the whole HUD with it, including anything open
  const setHud = useCallback(
    (visible) => {
      setHudVisible(visible)
      if (visible) return
      setDocsOpen(false)
      setSettingsOpen(false)
      disarm()
      clearPending()
      setNoticeState(null)
      dismissCard()
    },
    [disarm, dismissCard, clearPending],
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
    scene.setCenters(config.defaultCenterTier)

    const unbind = bindControls({
      scene,
      audio,
      onHover: (descriptor, x, y) => {
        // the pointer turns into a hand the moment a beacon is under it
        if (containerRef.current) containerRef.current.dataset.markerHover = String(Boolean(descriptor))
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
        armedRef.current = null
        setArmed(null)
        if (!restoreRef.current) restoreRef.current = scene.snapshot()
        if (descriptor.place) scene.flyTo(descriptor.place)
        else if (descriptor.kind === 'polaroid' && Number.isFinite(descriptor.photo?.lat)) {
          // a photo focuses on where it is pinned, not on a list entry
          scene.flyTo({ lat: descriptor.photo.lat, lon: descriptor.photo.lon })
        }
        audio.selectChime()
      },
      onSphere: (hit) => {
        const scene = sceneRef.current
        const active = modeRef.current
        const armedItem = armedRef.current
        const where = scene?.locate(hit.lat, hit.lon) ?? { onLand: false, place: null }

        // polaroids are chosen from the planet: tapping an island decides both
        // where the picture lands and which country it is filed under
        if (active === 'polaroid' && !armedItem) {
          if (!where.onLand) {
            clearPending()
            setNotice('Tap an island to add a photo')
            return
          }
          const target = { lat: hit.lat, lon: hit.lon, place: where.place }
          pendingRef.current = target
          setPendingPhoto(target)
          setNotice(where.place ? `Photo to ${where.place.country}` : 'Photo to this spot')
          openPicker('polaroid')
          return
        }

        if (active === 'sticker' && !armedItem) {
          setNotice('Pick a sticker first')
          return
        }

        if (!armedItem) {
          dismissCard()
          return
        }

        // an armed sticker or picture lands exactly where the pointer released
        const place = where.place
        const scale = itemScaleRef.current
        const id = `${armedItem.kind}-${(uidRef.current += 1)}`

        if (armedItem.kind === 'sticker') {
          setStickers((list) => [
            ...list,
            {
              id,
              glyph: armedItem.glyph,
              src: armedItem.src,
              name: armedItem.name,
              lat: hit.lat,
              lon: hit.lon,
              scale,
              code: place?.code ?? null,
              country: place?.country ?? null,
              meta: place
                ? `${place.country} · ${place.name}`
                : `${hit.lat.toFixed(1)}, ${hit.lon.toFixed(1)}`,
            },
          ])
          setNotice(place ? `Sticker pinned in ${place.country}` : 'Sticker pinned')
        } else {
          setPhotos((list) => [
            ...list,
            {
              id,
              src: armedItem.src,
              caption: armedItem.caption,
              lat: hit.lat,
              lon: hit.lon,
              scale,
              code: place?.code ?? null,
              country: place?.country ?? null,
            },
          ])
          setNotice(place ? `Photo pinned in ${place.country}` : 'Photo pinned')
        }

        armedRef.current = null
        setArmed(null)
        audio.selectChime()
        dismissCard()
      },
      onClear: () => {
        clearPending()
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
  }, [mode])

  useEffect(() => {
    sceneRef.current?.setStickers(stickers)
  }, [stickers])

  useEffect(() => {
    sceneRef.current?.setPolaroids(photos)
  }, [photos])

  useEffect(() => {
    sceneRef.current?.setCenters(tier)
  }, [tier])

  useEffect(() => {
    sceneRef.current?.setAnalytics(analytics, metric)
  }, [analytics, metric])

  // ---- live weather ----------------------------------------------------------
  const weatherTokenRef = useRef(0)
  const loadWeather = useCallback(async () => {
    const token = ++weatherTokenRef.current
    setWeatherBusy(true)
    try {
      const byCode = await loadLiveWeather(config.places)
      if (token !== weatherTokenRef.current) return
      setWeather(byCode)
      setWeatherError(null)
      setWeatherAt(new Date().toLocaleTimeString())
    } catch {
      if (token !== weatherTokenRef.current) return
      setWeather({})
      setWeatherError('live weather unavailable')
      setWeatherAt(null)
    } finally {
      if (token === weatherTokenRef.current) setWeatherBusy(false)
    }
  }, [])

  useEffect(() => {
    if (mode !== 'weather') return undefined
    const kick = setTimeout(loadWeather, 0)
    const timer = setInterval(loadWeather, config.weatherIntervalMinutes * 60_000)
    return () => {
      clearTimeout(kick)
      clearInterval(timer)
    }
  }, [mode, loadWeather])

  useEffect(() => {
    sceneRef.current?.setWeather(weather)
  }, [weather])

  // ---- stickers and photos ---------------------------------------------------
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

  const armSticker = useCallback(
    (id) => {
      const sticker = config.stickers.find((item) => item.id === id)
      if (!sticker) return
      dismissCard()
      const next = armedRef.current?.key === id ? null : { key: id, kind: 'sticker', glyph: sticker.glyph, name: sticker.label }
      armedRef.current = next
      setArmed(next?.key ?? null)
      setNotice(next ? 'Tap the globe to pin it' : 'Sticker put away')
      audio.pip('G6')
    },
    [dismissCard, audio, setNotice],
  )

  const handleFile = useCallback(
    (event) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      const url = URL.createObjectURL(file)
      const caption = file.name.replace(/\.[^.]+$/, '')
      dismissCard()

      if (fileKindRef.current === 'sticker') {
        armedRef.current = { key: url, kind: 'sticker', src: url, name: caption }
        setArmed(url)
        setMode('sticker')
        setNotice('Tap the globe to pin your image')
        audio.pip('A5')
        return
      }

      // the country was already picked from the globe: place it straight away
      const target = pendingRef.current
      if (target) {
        const country = target.place?.country ?? null
        setPhotos((list) => [
          ...list,
          {
            id: `photo-${(uidRef.current += 1)}`,
            src: url,
            caption,
            lat: target.lat,
            lon: target.lon,
            scale: itemScaleRef.current,
            code: target.place?.code ?? null,
            country,
          },
        ])
        clearPending()
        setNotice(country ? `Photo pinned in ${country}` : 'Photo pinned')
        audio.selectChime()
        return
      }

      armedRef.current = { key: url, kind: 'polaroid', src: url, caption }
      setArmed(url)
      setMode('polaroid')
      setNotice('Tap an island to place your photo')
      audio.pip('A5')
    },
    [dismissCard, audio, clearPending, setNotice],
  )

  // closing the file dialog without choosing anything drops the chosen country,
  // otherwise the next picture would silently land on a spot the user abandoned
  const handleFileCancel = useCallback(() => {
    clearPending()
  }, [clearPending])

  const clearStickers = useCallback(() => {
    setStickers([])
    setArmed(null)
    armedRef.current = null
    audio.closeBlip()
  }, [audio])

  const clearPhotos = useCallback(() => {
    setPhotos([])
    setArmed(null)
    armedRef.current = null
    audio.closeBlip()
  }, [audio])

  const removeSticker = useCallback(
    (id) => {
      setStickers((list) => list.filter((item) => item.id !== id))
      dismissCard()
      audio.closeBlip()
    },
    [dismissCard, audio],
  )

  const removePhoto = useCallback(
    (id) => {
      setPhotos((list) => list.filter((item) => item.id !== id))
      dismissCard()
      audio.closeBlip()
    },
    [dismissCard, audio],
  )

  const rescaleSticker = useCallback((id, scale) => {
    setStickers((list) => list.map((item) => (item.id === id ? { ...item, scale } : item)))
    setCard((current) =>
      current?.target.sticker?.id === id
        ? { ...current, target: { ...current.target, sticker: { ...current.target.sticker, scale } } }
        : current,
    )
  }, [])

  const rescalePhoto = useCallback((id, scale) => {
    setPhotos((list) => list.map((item) => (item.id === id ? { ...item, scale } : item)))
    setCard((current) =>
      current?.target.photo?.id === id
        ? { ...current, target: { ...current.target, photo: { ...current.target.photo, scale } } }
        : current,
    )
  }, [])

  // ---- keyboard --------------------------------------------------------------
  useEffect(() => {
    const onKey = (event) => {
      if (event.target instanceof HTMLInputElement) return
      const key = event.key.toLowerCase()

      if (event.key === 'Escape') {
        if (docsOpen) setDocsOpen(false)
        else if (settingsOpen) setSettingsOpen(false)
        else if (armedRef.current) disarm()
        else if (pendingRef.current) clearPending()
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
  }, [dismissCard, disarm, clearPending, selectMode, handleStep, toggleDocs, setHud, docsOpen, settingsOpen, hudVisible])

  const handleMetric = useCallback(
    (key) => {
      setMetric(key)
      audio.pip('D6')
    },
    [audio],
  )

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
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

          {/* The dock sits above the corner controls, so the panel can be as wide
              as its content needs without ever reaching Reset, Spin or the eye. */}
          <div className="pointer-events-none fixed inset-x-0 bottom-14 z-20 flex justify-center px-3 sm:bottom-16">
            <div
              data-ui
              className="bit-panel flex w-full max-w-[min(44rem,calc(100vw-1.5rem))] flex-col items-center gap-2 rounded-2xl border px-3 py-2.5 sm:px-4"
            >
              {notice && mode !== 'country' ? (
                <div
                  key={notice.id}
                  role="status"
                  className="notice rounded-lg border border-(--accent-color) bg-(--accent-subtle) px-2.5 py-1 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-(--accent-color)"
                >
                  {notice.text}
                </div>
              ) : null}

              <ActionBar
                mode={mode}
                config={config}
                armed={armed}
                onArm={armSticker}
                onAddStickerImage={() => openPicker('sticker')}
                onClearStickers={clearStickers}
                onClearPhotos={clearPhotos}
                stickers={stickers}
                photos={photos}
                scale={itemScale}
                onScale={(value) => {
                  itemScaleRef.current = value
                  setItemScale(value)
                }}
                metric={metric}
                onMetric={handleMetric}
                analytics={analytics}
                tier={tier}
                onTier={(key) => {
                  setTier(key)
                  audio.pip('B5')
                }}
                units={units}
                onUnits={setUnits}
                onRefreshWeather={loadWeather}
                weatherBusy={weatherBusy}
                weather={weather}
                weatherAt={weatherAt}
                weatherError={weatherError}
                pendingPhoto={pendingPhoto}
              />

              <SelectionNav mode={mode} onStep={handleStep} onMode={selectMode} />
            </div>
          </div>
        </>
      ) : null}

      <HudToggle visible={hudVisible} onToggle={() => setHud(!hudVisible)} />
      <BeaconTooltip hover={hover} />

      {card ? (
        <InfoCard
          card={card}
          config={config}
          metric={metric}
          units={units}
          onClose={dismissCard}
          onCenter={handleCenter}
          onRemoveSticker={removeSticker}
          onRemovePolaroid={removePhoto}
          onStickerScale={rescaleSticker}
          onPolaroidScale={rescalePhoto}
        />
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

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        onCancel={handleFileCancel}
      />
    </div>
  )
}
