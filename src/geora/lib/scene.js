import * as THREE from "three"
import { geoEquirectangular, geoPath } from "d3-geo"
import { feature, mesh } from "topojson-client"
import { flagUrl } from "./assets.js"
import { COUNTRIES_DATA } from "../data/countries.js"
import MAP_URL from "world-atlas/countries-110m.json?url"

const RADIUS = 2.1
const FOV = 45
const MAP_W = 2048
const MAP_H = 1024
const MIN_RATIO = 0.62
const MAX_RATIO = 1.7
const FOCUS_RATIO = 0.8
// how much of the shorter viewport axis the globe is allowed to fill when idle
const GLOBE_FILL = 1.5
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const FALLBACK_LAND = [
  [[-168, 65], [-140, 70], [-100, 70], [-60, 55], [-75, 35], [-80, 25], [-97, 26], [-105, 20], [-120, 35], [-130, 54]],
  [[-77, 8], [-52, 5], [-35, -5], [-39, -14], [-53, -33], [-66, -54], [-75, -50], [-81, -5]],
  [[10, 54], [30, 60], [70, 70], [120, 72], [170, 66], [140, 50], [120, 30], [105, 10], [80, 13], [60, 22], [35, 33], [10, 37], [0, 45]],
  [[-10, 30], [10, 37], [32, 31], [43, 12], [51, 11], [38, -15], [26, -34], [15, -28], [9, 4], [-17, 14]],
  [[114, -22], [136, -12], [153, -28], [140, -38], [118, -35]],
]

// camera distance that keeps the whole globe inside the narrower viewport axis
function fitDistance(aspect = window.innerWidth / Math.max(1, window.innerHeight)) {
  const vFov = (FOV * Math.PI) / 180
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(aspect, 0.35))
  const distance = RADIUS / Math.sin(Math.min(vFov, hFov) / 2)
  return Math.max(4.4, distance * GLOBE_FILL)
}

function latLonToVector3(lat, lon, radius) {
  const phi = (lat * Math.PI) / 180
  const lambda = (lon * Math.PI) / 180
  return new THREE.Vector3(
    radius * Math.cos(phi) * Math.sin(lambda),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.cos(lambda),
  )
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawFlagTexture(ctx, img) {
  ctx.clearRect(0, 0, 128, 96)
  ctx.save()
  roundedRect(ctx, 4, 4, 120, 88, 10)
  ctx.clip()
  ctx.drawImage(img, 4, 4, 120, 88)
  ctx.restore()
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 5
  roundedRect(ctx, 4, 4, 120, 88, 10)
  ctx.stroke()
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)"
  ctx.lineWidth = 1.5
  roundedRect(ctx, 4, 4, 120, 88, 10)
  ctx.stroke()
}

const DOT_VERTEX = `
  attribute float aLand;
  attribute float aBorder;
  varying float vLand;
  varying float vBorder;
  varying float vLighting;
  uniform float uDotScale;
  uniform float uAmbient;
  uniform float uShowBorders;

  void main() {
    vLand = aLand;
    vBorder = aBorder * uShowBorders;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    vec3 norm = normalize(mat3(modelMatrix) * position);
    float front = max(dot(norm, normalize(vec3(2.5, 3.0, 4.0))), 0.0);
    float back = max(dot(norm, normalize(vec3(-2.0, -1.8, -3.5))), 0.0) * 0.45;
    vLighting = uAmbient + (front + back) * (1.0 - uAmbient);

    float baseSize = mix(2.2, 5.2, aLand);
    if (vBorder > 0.3) baseSize += 1.4;

    float distFactor = 320.0 / -mvPosition.z;
    gl_PointSize = baseSize * uDotScale * (0.85 + 0.28 * vLighting) * distFactor * 0.016;
  }
`

const DOT_FRAGMENT = `
  precision mediump float;
  varying float vLand;
  varying float vBorder;
  varying float vLighting;
  uniform vec3 uColor;
  uniform vec3 uBorderColor;
  uniform float uOceanOpacity;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float delta = fwidth(dist);
    float alpha = 1.0 - smoothstep(0.44 - delta, 0.5, dist);

    vec3 toneColor = vBorder > 0.3 ? uBorderColor : uColor;
    float dotAlpha = vBorder > 0.3 ? 1.0 : mix(uOceanOpacity, 0.98, vLand);
    dotAlpha *= 0.75 + 0.25 * vLighting;

    gl_FragColor = vec4(toneColor, alpha * dotAlpha);
  }
`

export function createGlobeScene({ container }) {
  const lifecycle = new AbortController()
  const { signal } = lifecycle

  const scene = new THREE.Scene()
  const view = {
    w: container.clientWidth || window.innerWidth,
    h: container.clientHeight || window.innerHeight,
  }
  const camera = new THREE.PerspectiveCamera(FOV, view.w / view.h, 0.1, 100)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(view.w, view.h)
  container.appendChild(renderer.domElement)

  const globe = new THREE.Group()
  globe.quaternion.setFromEuler(new THREE.Euler(0.18, -1.2, 0, "YXZ"))
  scene.add(globe)

  const fit = fitDistance(view.w / view.h)
  const state = {
    autoRotate: true,
    inertia: 0.0018,
    axis: Y_AXIS.clone(),
    target: null,
    fit,
    zoom: fit,
    // zoom is kept relative to the fitted distance so a resize or a rotation
    // never leaves the camera parked far from the globe
    ratio: 1,
    easing: false,
    locked: false,
    dragging: false,
  }
  camera.position.z = fit

  function applyZoom() {
    const clamped = Math.min(Math.max(state.ratio, MIN_RATIO), MAX_RATIO)
    state.ratio = clamped
    state.zoom = state.fit * clamped
  }

  // raster map: red channel = land, green channel = borders
  const mapCanvas = document.createElement("canvas")
  mapCanvas.width = MAP_W
  mapCanvas.height = MAP_H
  const mapCtx = mapCanvas.getContext("2d", { willReadFrequently: true })
  mapCtx.fillStyle = "#000000"
  mapCtx.fillRect(0, 0, MAP_W, MAP_H)

  const projection = geoEquirectangular().scale(MAP_W / (2 * Math.PI)).translate([MAP_W / 2, MAP_H / 2])
  const path = geoPath(projection, mapCtx)
  let mapPixels = mapCtx.getImageData(0, 0, MAP_W, MAP_H).data

  const sample = (u, v) => {
    const x = Math.min(MAP_W - 1, Math.max(0, Math.floor(u * (MAP_W - 1))))
    const y = Math.min(MAP_H - 1, Math.max(0, Math.floor(v * (MAP_H - 1))))
    const i = (y * MAP_W + x) * 4
    return { land: mapPixels[i] / 255, border: mapPixels[i + 1] / 255 }
  }

  // fibonacci sphere point cloud
  const count = window.innerWidth < 640 ? 18000 : 36000
  const positions = new Float32Array(count * 3)
  const landValues = new Float32Array(count)
  const borderValues = new Float32Array(count)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const ring = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = goldenAngle * i
    const x = Math.sin(theta) * ring
    const z = Math.cos(theta) * ring

    positions[i * 3] = x * RADIUS
    positions[i * 3 + 1] = y * RADIUS
    positions[i * 3 + 2] = z * RADIUS

    const hit = sample(Math.atan2(x, z) / (2 * Math.PI) + 0.5, 0.5 - Math.asin(y) / Math.PI)
    landValues[i] = hit.land
    borderValues[i] = hit.border
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  const landAttr = new THREE.BufferAttribute(landValues, 1)
  const borderAttr = new THREE.BufferAttribute(borderValues, 1)
  geometry.setAttribute("aLand", landAttr)
  geometry.setAttribute("aBorder", borderAttr)

  const uniforms = {
    uDotScale: { value: 1.1 },
    uAmbient: { value: 0.76 },
    uOceanOpacity: { value: 0.38 },
    uShowBorders: { value: 1 },
    uColor: { value: new THREE.Color(0x121316) },
    uBorderColor: { value: new THREE.Color(0x1a56db) },
  }

  const dots = new THREE.Points(
    geometry,
    new THREE.ShaderMaterial({
      vertexShader: DOT_VERTEX,
      fragmentShader: DOT_FRAGMENT,
      uniforms,
      transparent: true,
      depthWrite: false,
    }),
  )
  globe.add(dots)

  // inner sphere hides the backside dots
  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 0.985, 48, 48), coreMaterial))

  const markers = []
  const hits = []
  const places = new THREE.Group()
  places.renderOrder = 3
  globe.add(places)

  function createFlagSprite(place) {
    const canvas = document.createElement("canvas")
    canvas.width = 128
    canvas.height = 96
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = "#1e293b"
    roundedRect(ctx, 4, 4, 120, 88, 10)
    ctx.fill()
    ctx.fillStyle = "#ffffff"
    ctx.font = 'bold 36px "JetBrains Mono", monospace'
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(place.code.slice(0, 2), 64, 48)

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearMipmapLinearFilter

    const img = new Image()
    img.onload = () => {
      drawFlagTexture(ctx, img)
      texture.needsUpdate = true
    }
    img.src = flagUrl(place.iso2, true)

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
    sprite.scale.set(0.18, 0.135, 1)
    return sprite
  }

  COUNTRIES_DATA.forEach((place) => {
    const surface = latLonToVector3(place.lat, place.lon, RADIUS * 1.002)
    const top = latLonToVector3(place.lat, place.lon, RADIUS * 1.028)

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.018, 0.034, 24),
      new THREE.MeshBasicMaterial({ color: 0x1a56db, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
    )
    ring.position.copy(surface)
    ring.lookAt(surface.clone().multiplyScalar(2))
    places.add(ring)

    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x1a56db, transparent: true }),
    )
    pin.position.copy(surface)
    places.add(pin)

    const stem = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([surface, top]),
      new THREE.LineBasicMaterial({ color: 0x1a56db, transparent: true, opacity: 0.75 }),
    )
    places.add(stem)

    const sprite = createFlagSprite(place)
    sprite.position.copy(top)
    places.add(sprite)

    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ visible: false }))
    hit.position.copy(top)
    places.add(hit)

    const marker = { place, ring, pin, stem, sprite, hit, anchor: surface }
    markers.push(marker)
    hits.push(hit)
  })

  function refreshDots() {
    mapPixels = mapCtx.getImageData(0, 0, MAP_W, MAP_H).data
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3]
      const y = positions[i * 3 + 1]
      const z = positions[i * 3 + 2]
      const hit = sample(Math.atan2(x, z) / (2 * Math.PI) + 0.5, 0.5 - Math.asin(y / RADIUS) / Math.PI)
      landValues[i] = hit.land
      borderValues[i] = hit.border
    }
    landAttr.needsUpdate = true
    borderAttr.needsUpdate = true
  }

  function paintMap() {
    mapCtx.fillStyle = "#000000"
    mapCtx.fillRect(0, 0, MAP_W, MAP_H)
  }

  function paintNaturalEarth(topology) {
    paintMap()
    mapCtx.fillStyle = "#ffffff"
    mapCtx.beginPath()
    path(feature(topology, topology.objects.land))
    mapCtx.fill()

    mapCtx.strokeStyle = "#00ff88"
    mapCtx.lineWidth = 1.4
    mapCtx.beginPath()
    path(mesh(topology, topology.objects.countries, (a, b) => a !== b))
    mapCtx.stroke()
  }

  function paintFallbackLand() {
    paintMap()
    mapCtx.fillStyle = "#ffffff"
    FALLBACK_LAND.forEach((polygon) => {
      mapCtx.beginPath()
      polygon.forEach(([lon, lat], i) => {
        const [px, py] = projection([lon, lat])
        if (i === 0) mapCtx.moveTo(px, py)
        else mapCtx.lineTo(px, py)
      })
      mapCtx.closePath()
      mapCtx.fill()
    })
  }

  async function loadCartography() {
    try {
      const res = await fetch(MAP_URL)
      if (!res.ok) throw new Error(String(res.status))
      const topology = await res.json()
      if (signal.aborted) return
      paintNaturalEarth(topology)
      refreshDots()
    } catch {
      if (signal.aborted) return
      paintFallbackLand()
      refreshDots()
    }
  }

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  function pick(clientX, clientY) {
    pointer.x = (clientX / view.w) * 2 - 1
    pointer.y = -(clientY / view.h) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const [hit] = raycaster.intersectObjects(hits)
    if (!hit) return null
    const marker = markers.find((m) => m.hit === hit.object)
    if (!marker) return null
    const facing = marker.anchor.clone().applyQuaternion(globe.quaternion).normalize().dot(camera.position.clone().normalize())
    return facing > 0.05 ? marker : null
  }

  let raf = 0

  function render(now) {
    raf = requestAnimationFrame(render)

    if (state.easing) {
      camera.position.z += (state.zoom - camera.position.z) * 0.12
      if (Math.abs(state.zoom - camera.position.z) < 0.01) {
        camera.position.z = state.zoom
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
        globe.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(state.axis, state.inertia))
        state.inertia *= 0.94
      } else if (state.autoRotate) {
        globe.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(Y_AXIS, 0.0016))
      }
    }

    const camDir = camera.position.clone().normalize()
    const scale = camera.position.z / 6
    markers.forEach((marker, i) => {
      const pulse = (Math.sin(now * 0.004 + i * 0.5) + 1) * 0.5
      marker.ring.scale.setScalar(1 + pulse * 1.5)
      marker.ring.material.opacity = (1 - pulse) * 0.85

      marker.sprite.scale.set(0.18 * scale, 0.135 * scale, 1)
      marker.hit.scale.setScalar(scale)

      const facing = marker.anchor.clone().applyQuaternion(globe.quaternion).normalize().dot(camDir)
      const visible = Math.max(0, Math.min(1, (facing - 0.18) * 4.5))
      const show = visible > 0.02
      marker.sprite.material.opacity = visible * 0.98
      marker.stem.material.opacity = visible * 0.75
      marker.pin.material.opacity = visible
      marker.ring.visible = show
      marker.sprite.visible = show
      marker.stem.visible = show
      marker.pin.visible = show
    })

    renderer.render(scene, camera)
  }

  function resize() {
    view.w = container.clientWidth || window.innerWidth
    view.h = container.clientHeight || window.innerHeight
    camera.aspect = view.w / view.h
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(view.w, view.h)
    state.fit = fitDistance(view.w / view.h)

    if (!state.locked) {
      state.ratio = 1
      state.easing = false
    }
    applyZoom()
    if (!state.easing) camera.position.z = state.zoom
  }

  const observer = new ResizeObserver(resize)
  observer.observe(container)

  window.addEventListener("resize", resize, { signal })
  window.addEventListener("orientationchange", resize, { signal })

  const api = {
    places: COUNTRIES_DATA,

    start() {
      loadCartography()
      raf = requestAnimationFrame(render)
    },

    pick,

    setTheme(theme) {
      uniforms.uColor.value.setHex(theme.fg)
      uniforms.uBorderColor.value.setHex(theme.border)
      coreMaterial.color.setHex(theme.bg)
      markers.forEach((marker) => {
        marker.ring.material.color.setHex(theme.border)
        marker.pin.material.color.setHex(theme.border)
        marker.stem.material.color.setHex(theme.border)
      })
    },

    setDotScale(value) {
      uniforms.uDotScale.value = value
    },
    setAmbient(value) {
      uniforms.uAmbient.value = value
    },
    setOceanOpacity(value) {
      uniforms.uOceanOpacity.value = value
    },
    setBorders(on) {
      uniforms.uShowBorders.value = on ? 1 : 0
    },
    setCities(on) {
      places.visible = on
    },

    setDragging(on) {
      state.dragging = on
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
      state.inertia = Math.min(0.045, angle * 0.45)
      state.target = null
    },

    zoomBy(delta) {
      state.locked = true
      state.easing = true
      state.ratio = (state.zoom + delta) / state.fit
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
      state.target = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.18, -1.2, 0, "YXZ"))
      state.axis.copy(Y_AXIS)
      state.inertia = 0.0018
      state.locked = false
      state.easing = true
      state.ratio = 1
      applyZoom()
    },

    dispose() {
      lifecycle.abort()
      observer.disconnect()
      cancelAnimationFrame(raf)
      geometry.dispose()
      dots.material.dispose()
      coreMaterial.dispose()
      markers.forEach((marker) => {
        marker.ring.geometry.dispose()
        marker.ring.material.dispose()
        marker.pin.geometry.dispose()
        marker.pin.material.dispose()
        marker.stem.geometry.dispose()
        marker.stem.material.dispose()
        marker.sprite.material.map?.dispose()
        marker.sprite.material.dispose()
        marker.hit.geometry.dispose()
        marker.hit.material.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    },
  }

  return api
}
