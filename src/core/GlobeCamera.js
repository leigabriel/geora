import * as THREE from "three"
import { RADIUS, FOV, GLOBE_FILL, MIN_RATIO, MAX_RATIO, FOCUS_RATIO, HOME_QUATERNION, Y_AXIS } from "./constants.js"

// camera distance that keeps the whole globe inside the narrower viewport axis
function fitDistance(aspect) {
  const vFov = (FOV * Math.PI) / 180
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(aspect, 0.35))
  const distance = RADIUS / Math.sin(Math.min(vFov, hFov) / 2)
  return Math.max(4.4, distance * GLOBE_FILL)
}

// The camera owns framing: fit distance, zoom ratio, focus flights and the
// home view. Zoom is kept relative to the fitted distance so a resize or a
// rotation never leaves the camera parked far from the globe.
export function createCamera(ctx) {
  const { view, state } = ctx

  const camera = new THREE.PerspectiveCamera(FOV, view.w / view.h, 0.1, 100)

  function applyZoom() {
    const clamped = Math.min(Math.max(state.ratio, MIN_RATIO), MAX_RATIO)
    state.ratio = clamped
    // globeScale is a size preference, not a distance: a bigger scale pulls the
    // camera in so the planet really does read bigger on screen
    state.zoom = (state.fit * clamped) / state.globeScale
  }

  state.fit = fitDistance(view.w / view.h)
  state.zoom = state.fit
  camera.position.z = state.fit

  const api = {
    camera,

    applyZoom,

    handleResize() {
      camera.aspect = view.w / view.h
      camera.updateProjectionMatrix()
      state.fit = fitDistance(view.w / view.h)

      if (!state.locked) {
        state.ratio = 1
        state.easing = false
      }
      applyZoom()
      if (!state.easing) camera.position.z = state.zoom
    },

    setGlobeScale(value) {
      state.globeScale = Number.isFinite(value) ? value : 0.7
      applyZoom()
      // the loop only chases state.zoom while easing, so the preference has to
      // re-arm it or the slider moves nothing
      state.easing = true
    },

    zoomBy(delta) {
      state.locked = true
      state.easing = true
      state.ratio = ((state.zoom + delta) * state.globeScale) / state.fit
      applyZoom()
    },

    flyTo(place) {
      const lat = (place.lat * Math.PI) / 180
      const lon = (place.lon * Math.PI) / 180
      const spinY = new THREE.Quaternion().setFromAxisAngle(Y_AXIS, -lon)
      const tiltX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), lat)
      state.target = tiltX.multiply(spinY)
      state.inertia = 0
      state.locked = true
      state.easing = true
      // always frame the territory close up, never push the camera back
      state.ratio = Math.min(state.ratio, FOCUS_RATIO)
      applyZoom()
    },

    reset() {
      state.target = HOME_QUATERNION()
      state.axis.copy(Y_AXIS)
      state.inertia = ctx.prefs.motion ? 0.0018 : 0
      state.locked = false
      state.easing = true
      state.ratio = 1
      applyZoom()
    },

    // remember where the globe was so a focused selection can hand it back
    snapshot() {
      return {
        quaternion: ctx.globe.quaternion.clone(),
        ratio: state.ratio,
        autoRotate: state.autoRotate,
        locked: state.locked,
      }
    },

    restore(saved) {
      if (!saved) return
      state.target = saved.quaternion.clone()
      // globeScale is deliberately absent: it is a preference, not part of the
      // framing, so closing a card must never undo the slider
      state.ratio = saved.ratio
      state.inertia = 0
      state.locked = saved.locked
      state.easing = true
      state.autoRotate = ctx.prefs.motion ? saved.autoRotate : false
      applyZoom()
    },
  }

  return api
}
