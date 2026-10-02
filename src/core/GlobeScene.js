import * as THREE from "three"
import { RADIUS, Y_AXIS, HOME_QUATERNION } from "./constants.js"
import { createRenderer } from "./GlobeRenderer.js"
import { createCamera } from "./GlobeCamera.js"
import { createMarkers } from "./GlobeMarkers.js"
import { createPolaroids } from "./GlobePolaroids.js"
import { createInteraction } from "./GlobeInteraction.js"
import { bindControls } from "./GlobeControls.js"

const LAYER_ORDER = ["country", "polaroid", "analytics", "centers", "markers"]

function sameTarget(a, b) {
  if (!a || !b || a.kind !== b.kind) return false
  if (a.place && b.place) return a.place.code === b.place.code
  if (a.center && b.center) return a.center.id === b.center.id
  if (a.photo && b.photo) return a.photo.id === b.photo.id
  if (a.marker && b.marker) return a.marker.id === b.marker.id
  return false
}

// Globe interaction states: idle / hover / selected. Hover lifts one beacon,
// selection emphasizes it and de-emphasizes the rest so the chosen territory
// reads instantly without competing with the point cloud.
function createEmphasis() {
  let hovered = null
  let selected = null

  return {
    setHovered(descriptor) {
      hovered = descriptor ?? null
    },
    setSelected(descriptor) {
      selected = descriptor ?? null
    },
    forDescriptor(descriptor) {
      if (selected && sameTarget(descriptor, selected)) return "selected"
      if (hovered && sameTarget(descriptor, hovered)) return "hover"
      if (selected) return "dimmed"
      return "idle"
    },
  }
}

// Builds the whole engine for one container: renderer, camera, layers,
// interaction, controls and the animation loop. Everything is torn down again
// by dispose(). The scene exposes an imperative API; the GeoraGlobe class on
// top of it owns configuration, data and events.
export function createGlobeScene({ container, content, options }) {
  const lifecycle = new AbortController()
  const { signal } = lifecycle

  const view = {
    w: container.clientWidth || window.innerWidth,
    h: container.clientHeight || window.innerHeight,
    // the canvas does not have to start at the viewport corner: raycasting is
    // fed client coordinates, so the container offset has to come off them
    left: 0,
    top: 0,
  }
  {
    const box = container.getBoundingClientRect()
    view.left = box.left
    view.top = box.top
  }

  const scene = new THREE.Scene()
  const globe = new THREE.Group()
  globe.quaternion.copy(HOME_QUATERNION())
  scene.add(globe)

  const state = {
    autoRotate: true,
    inertia: 0.0018,
    axis: Y_AXIS.clone(),
    target: null,
    fit: 0,
    zoom: 0,
    ratio: 1,
    globeScale: 0.7,
    easing: false,
    locked: false,
    dragging: false,
  }

  // visual profile knobs
  const prefs = {
    markerScale: 1,
    animation: 1,
    motion: true,
    detail: 1,
    markersVisible: true,
  }

  const ctx = {
    container,
    signal,
    radius: RADIUS,
    options,
    content,
    view,
    state,
    prefs,
    scene,
    globe,
    layers: {},
    pickables: [],
    disposables: [],
    emphasis: createEmphasis(),
  }

  for (const key of LAYER_ORDER) {
    const group = new THREE.Group()
    group.visible = key === "country"
    ctx.layers[key] = group
    globe.add(group)
  }

  const cameraApi = createCamera(ctx)
  ctx.camera = cameraApi.camera

  const rendererApi = createRenderer(ctx)
  ctx.renderer = rendererApi.renderer
  ctx.uniforms = rendererApi.uniforms
  ctx.coreMaterial = rendererApi.coreMaterial
  ctx.sample = rendererApi.sample

  const interaction = createInteraction(ctx)
  ctx.facingFade = interaction.facingFade
  ctx.facingRaw = interaction.facingRaw

  const markers = createMarkers(ctx)
  const polaroids = createPolaroids(ctx)
  // entries are built once here; setData/setFlagBase rebuild from this baseline
  markers.build()

  let mode = "country"
  let unbind = null
  let raf = 0

  function applyModeVisibility() {
    for (const key of LAYER_ORDER) {
      ctx.layers[key].visible = prefs.markersVisible && key === mode
    }
  }

  const scratchQuaternion = new THREE.Quaternion()

  function render(now) {
    raf = requestAnimationFrame(render)

    if (state.easing) {
      cameraApi.camera.position.z += (state.zoom - cameraApi.camera.position.z) * 0.12
      if (Math.abs(state.zoom - cameraApi.camera.position.z) < 0.01) {
        cameraApi.camera.position.z = state.zoom
        state.easing = false
      }
    }

    if (state.target) {
      globe.quaternion.slerp(state.target, 0.08)
      if (globe.quaternion.angleTo(state.target) < 0.002) {
        globe.quaternion.copy(state.target)
        state.target = null
      }
    } else if (!state.dragging) {
      if (state.inertia > 0.00005) {
        globe.quaternion.premultiply(scratchQuaternion.setFromAxisAngle(state.axis, state.inertia))
        state.inertia *= 0.94
      } else if (state.autoRotate && prefs.motion) {
        globe.quaternion.premultiply(scratchQuaternion.setFromAxisAngle(Y_AXIS, 0.0016 * prefs.animation))
      }
    }

    interaction.updateCamDir()
    const scale = (cameraApi.camera.position.z / 6) * prefs.markerScale
    const breathe = prefs.motion ? (Math.sin(now * 0.0016 * prefs.animation) + 1) * 0.5 : 0.5

    markers.update(now, scale, breathe)
    polaroids.update(now, scale)

    rendererApi.renderer.render(scene, cameraApi.camera)
  }

  function resize() {
    const box = container.getBoundingClientRect()
    view.w = container.clientWidth || window.innerWidth
    view.h = container.clientHeight || window.innerHeight
    view.left = box.left
    view.top = box.top
    cameraApi.handleResize()
    rendererApi.handleResize()
  }

  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
  observer?.observe(container)

  window.addEventListener("resize", resize, { signal })
  window.addEventListener("orientationchange", resize, { signal })

  const api = {
    start() {
      rendererApi.loadCartography()
      if (!raf) raf = requestAnimationFrame(render)
    },

    stop() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    },

    pick: interaction.pick,
    probe: interaction.probe,
    locate: interaction.locate,

    bindControls(handlers) {
      unbind?.()
      unbind = bindControls({ root: container, scene: api, ...handlers })
      return () => {
        unbind?.()
        unbind = null
      }
    },

    setTheme(theme) {
      markers.setTheme(theme)
    },

    // ---- halftone calibration -------------------------------------------
    setHalftone({ density, scale, contrast, threshold, intensity, ocean, ambient }) {
      const uniforms = ctx.uniforms
      if (Number.isFinite(density)) uniforms.uDensity.value = density
      if (Number.isFinite(scale)) uniforms.uDotScale.value = scale
      if (Number.isFinite(contrast)) uniforms.uContrast.value = contrast
      if (Number.isFinite(threshold)) uniforms.uThreshold.value = threshold
      if (Number.isFinite(intensity)) uniforms.uIntensity.value = intensity
      if (Number.isFinite(ocean)) uniforms.uOceanOpacity.value = ocean
      if (Number.isFinite(ambient)) uniforms.uAmbient.value = ambient
    },

    setShowBorders(show) {
      ctx.uniforms.uShowBorders.value = show ? 1 : 0
    },

    setMarkersVisible(visible) {
      prefs.markersVisible = Boolean(visible)
      applyModeVisibility()
    },

    // ---- visual profile ---------------------------------------------------
    setGlobeScale: cameraApi.setGlobeScale,
    setMarkerScale(value) {
      prefs.markerScale = Number.isFinite(value) ? value : 1
    },
    setAnimationIntensity(value) {
      prefs.animation = Number.isFinite(value) ? value : 1
    },
    setDetail(value) {
      // the profile stores a 0/1/2 step; map it to how much of the cloud lives
      const step = Number.isFinite(value) ? Math.max(0, Math.min(2, Math.round(value))) : 1
      ctx.uniforms.uDetail.value = [0.7, 0.9, 1][step]
      prefs.detail = step
    },
    setMotion(enabled) {
      prefs.motion = Boolean(enabled)
      if (!prefs.motion) {
        state.inertia = 0
        state.autoRotate = false
      }
    },

    setMode(next) {
      mode = next
      applyModeVisibility()
      // a layer swap always clears transient emphasis: hover belongs to the
      // old layer and selection is re-asserted by the card lifecycle.
      ctx.emphasis.setHovered(null)
    },

    setHoverHighlight(descriptor) {
      ctx.emphasis.setHovered(descriptor)
    },
    setSelected(descriptor) {
      ctx.emphasis.setSelected(descriptor)
    },
    setAnalytics: markers.setAnalytics,
    setPolaroids: polaroids.setPolaroids,

    setData(next = {}) {
      if (Array.isArray(next.countries)) {
        content.countries = next.countries
        markers.rebuildCountries()
      }
      if (Array.isArray(next.centers)) {
        content.centers = next.centers
        markers.rebuildCenters()
      }
      if (Array.isArray(next.markers)) {
        content.markers = next.markers
        markers.rebuildCustomMarkers()
      }
    },

    setFlagBase(base) {
      options.flagBase = base
      markers.rebuildCountries()
    },

    setDragging(on) {
      state.dragging = on
      // the cursor follows the gesture, not the element under it
      container.dataset.dragging = String(on)
    },

    setAutoRotate(on) {
      state.autoRotate = on
      if (!on) state.inertia = 0
    },

    isAutoRotating: () => state.autoRotate,

    // drag rotation, delta in pixels
    drag(dx, dy) {
      const dist = Math.hypot(dx, dy)
      if (dist < 0.001) return
      const axis = new THREE.Vector3(dy / dist, dx / dist, 0)
      const angle = dist * 0.0038
      globe.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, angle))
      state.axis.copy(axis)
      state.inertia = prefs.motion ? Math.min(0.045, angle * 0.45) : 0
      state.target = null
    },

    zoomBy: cameraApi.zoomBy,
    flyTo: cameraApi.flyTo,
    reset: cameraApi.reset,
    snapshot: cameraApi.snapshot,
    restore: cameraApi.restore,

    dispose() {
      api.stop()
      lifecycle.abort()
      observer?.disconnect()
      unbind?.()
      unbind = null
      const seen = new Set()
      for (const object of ctx.disposables) {
        object.geometry?.dispose()
        const material = object.material
        if (!material || seen.has(material)) continue
        seen.add(material)
        material.map?.dispose()
        material.dispose()
      }
      ctx.disposables.length = 0
      rendererApi.dispose()
    },
  }

  return api
}
