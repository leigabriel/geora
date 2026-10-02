// A recording stand-in for createGlobeScene: every public method logs its
// call so tests can assert on configuration flow without a WebGL context.
export function makeScene() {
  const calls = []
  const record = (name, result) => (...args) => {
    calls.push({ name, args })
    return typeof result === "function" ? result(...args) : result
  }

  const scene = {
    calls,
    handlers: null,
    called: (name) => calls.some((entry) => entry.name === name),
    count: (name) => calls.filter((entry) => entry.name === name).length,
    last: (name) => calls.filter((entry) => entry.name === name).at(-1),
    argsOf: (name) => calls.filter((entry) => entry.name === name).map((entry) => entry.args),
  }

  const methods = [
    "setTheme", "setHalftone", "setGlobeScale", "setMarkerScale", "setDetail",
    "setAnimationIntensity", "setShowBorders", "setMarkersVisible", "setMode",
    "setAutoRotate", "setMotion", "setAnalytics", "setPolaroids", "setData",
    "setFlagBase", "setDragging", "setHoverHighlight", "setSelected",
    "start", "stop", "dispose", "drag", "zoomBy", "flyTo", "reset",
  ]
  for (const name of methods) scene[name] = record(name)

  scene.bindControls = record("bindControls", (handlers) => {
    scene.handlers = handlers
    return () => {}
  })
  scene.snapshot = record("snapshot", () => ({ saved: true }))
  scene.restore = record("restore")
  scene.locate = record("locate", () => ({ onLand: false, place: null, distanceKm: null }))
  scene.pick = record("pick", () => null)
  scene.probe = record("probe", () => null)
  scene.isAutoRotating = record("isAutoRotating", () => false)

  return scene
}

export function sceneFactory() {
  const scenes = []
  const factory = () => {
    const scene = makeScene()
    scenes.push(scene)
    return scene
  }
  factory.scenes = scenes
  return factory
}

// Installs a window.matchMedia stub for reduced-motion tests. jsdom has no
// matchMedia of its own.
export function stubMatchMedia(reduced) {
  const listeners = []
  const query = {
    matches: Boolean(reduced),
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (type, listener) => listeners.push(listener),
    removeEventListener: (type, listener) => {
      const index = listeners.indexOf(listener)
      if (index >= 0) listeners.splice(index, 1)
    },
    get listenerCount() {
      return listeners.length
    },
    get listeners() {
      return [...listeners]
    },
  }
  window.matchMedia = () => query
  return query
}
