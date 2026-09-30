import * as THREE from "three"
import { geoEquirectangular, geoPath } from "d3-geo"
import { feature, mesh } from "topojson-client"
import { flagUrl } from "./assets.js"
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
const WARN_COLOR = 0xff5d5d
const HOME_QUATERNION = () => new THREE.Quaternion().setFromEuler(new THREE.Euler(0.18, -1.2, 0, "YXZ"))
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

// How far from the nearest seat of government a tap may sit and still be
// credited to it. The dataset holds one point per nation, so the middle of a
// large country is thousands of kilometres from its own capital; the land test
// from the raster map is what stops an ocean click being blamed on someone.
const NEAREST_KM = 4000

function greatCircleKm(latA, lonA, latB, lonB) {
  const toRad = Math.PI / 180
  const dLat = (latB - latA) * toRad
  const dLon = (lonB - lonA) * toRad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA * toRad) * Math.cos(latB * toRad) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// uniform-ish point on the whole sphere
function randomPoint(radius = 1) {
  const z = Math.random() * 2 - 1
  const angle = Math.random() * Math.PI * 2
  const ring = Math.sqrt(Math.max(0, 1 - z * z))
  return new THREE.Vector3(ring * Math.cos(angle), z, ring * Math.sin(angle)).multiplyScalar(radius)
}

// stable per-point value in [0,1) so lowering the density thins the cloud
// evenly instead of shaving off a latitude band
function scatterValue(index) {
  const raw = Math.sin(index * 12.9898 + 78.233) * 43758.5453
  return raw - Math.floor(raw)
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

function drawCover(ctx, img, x, y, w, h) {
  const ratio = Math.max(w / img.width, h / img.height)
  const dw = img.width * ratio
  const dh = img.height * ratio
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
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

const CARD_W = 96

function drawCardBackdrop(ctx, w, h, radius) {
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  roundedRect(ctx, 5, 5, w - 10, h - 10, radius)
  ctx.clip()
  ctx.fillStyle = "#0b0f16"
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 4
  roundedRect(ctx, 5, 5, w - 10, h - 10, radius)
  ctx.stroke()
}

function paintServerGlyph(ctx) {
  ctx.fillStyle = "#e8ecf5"
  for (let i = 0; i < 3; i += 1) {
    const y = 20 + i * 20
    roundedRect(ctx, 22, y, 52, 15, 3)
    ctx.fill()
  }
  ctx.fillStyle = "#0b0f16"
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(52, 25 + i * 20, 16, 5)
  }
  ctx.fillStyle = "#1a56db"
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(27, 26 + i * 20, 7, 4)
  }
}

const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'

// weather markers are emoji only: a glyph with a white outline, no card,
// no backdrop and no text
function paintOutlinedEmoji(ctx, glyph, size) {
  ctx.clearRect(0, 0, size, size)
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${Math.round(size * 0.62)}px ${EMOJI_FONT}`
  ctx.lineJoin = "round"
  ctx.miterLimit = 2
  ctx.lineWidth = Math.round(size * 0.13)
  ctx.strokeStyle = "#ffffff"
  ctx.strokeText(glyph, size / 2, size / 2 + size * 0.03)
  ctx.fillText(glyph, size / 2, size / 2 + size * 0.03)
}

// a sticker reads as a sticker on any theme: a dark halo to lift it off the
// point cloud, a white inner outline for contrast, then the glyph itself
function paintStickerGlyph(ctx, glyph, size) {
  ctx.clearRect(0, 0, size, size)
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${Math.round(size * 0.62)}px ${EMOJI_FONT}`
  ctx.lineJoin = "round"
  ctx.miterLimit = 2
  ctx.lineWidth = Math.round(size * 0.16)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)"
  ctx.strokeText(glyph, size / 2, size / 2 + size * 0.03)
  ctx.lineWidth = Math.round(size * 0.08)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)"
  ctx.strokeText(glyph, size / 2, size / 2 + size * 0.03)
  ctx.fillText(glyph, size / 2, size / 2 + size * 0.03)
}

const DOT_VERTEX = `
  attribute float aLand;
  attribute float aBorder;
  attribute float aScatter;
  varying float vLand;
  varying float vBorder;
  varying float vLighting;
  uniform float uDotScale;
  uniform float uAmbient;
  uniform float uContrast;
  uniform float uDensity;
  uniform float uDetail;
  uniform float uShowBorders;

  void main() {
    vLand = aLand;
    vBorder = aBorder * uShowBorders;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    vec3 norm = normalize(mat3(modelMatrix) * position);
    float front = max(dot(norm, normalize(vec3(2.5, 3.0, 4.0))), 0.0);
    float back = max(dot(norm, normalize(vec3(-2.0, -1.8, -3.5))), 0.0) * 0.45;
    float lighting = uAmbient + (front + back) * (1.0 - uAmbient);
    // contrast pivots the lighting around mid grey, which tightens or
    // flattens the terminator without touching the palette
    vLighting = clamp((lighting - 0.5) * uContrast + 0.5, 0.0, 1.4);

    // halftone density culls an even, stable subset of the cloud; the visual
    // profile's detail level scales how much of what is left survives, so the
    // pattern thins evenly instead of randomly
    if (aScatter > uDensity * uDetail) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

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
  uniform float uThreshold;
  uniform float uIntensity;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float delta = fwidth(dist);
    float alpha = 1.0 - smoothstep(uThreshold - delta, uThreshold + 0.06, dist);

    vec3 toneColor = vBorder > 0.3 ? uBorderColor : uColor;
    float dotAlpha = vBorder > 0.3 ? 1.0 : mix(uOceanOpacity, 0.98, vLand);
    dotAlpha *= 0.75 + 0.25 * vLighting;
    dotAlpha *= uIntensity;

    gl_FragColor = vec4(toneColor, alpha * dotAlpha);
  }
`

export function createGlobeScene({ container, config }) {
  const lifecycle = new AbortController()
  const { signal } = lifecycle
  const places = config.places
  const centers = config.centers
  // a center knows its country code; resolving it to a place lets selection
  // frame the right patch of the globe and cards show the flag
  const placeByCode = new Map(places.map((place) => [place.code, place]))

  const scene = new THREE.Scene()
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
  const camera = new THREE.PerspectiveCamera(FOV, view.w / view.h, 0.1, 100)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(view.w, view.h)
  container.appendChild(renderer.domElement)

  const globe = new THREE.Group()
  globe.quaternion.copy(HOME_QUATERNION())
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
    globeScale: 1,
    easing: false,
    locked: false,
    dragging: false,
  }
  camera.position.z = fit

  // visual profile knobs
  let markerScale = 1
  let animation = 1
  let motion = true

  function applyZoom() {
    const clamped = Math.min(Math.max(state.ratio, MIN_RATIO), MAX_RATIO)
    state.ratio = clamped
    state.zoom = state.fit * clamped * state.globeScale
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
  const scatterValues = new Float32Array(count)
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
    scatterValues[i] = scatterValue(i)

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
  geometry.setAttribute("aScatter", new THREE.BufferAttribute(scatterValues, 1))

  const uniforms = {
    uDotScale: { value: 1.1 },
    uAmbient: { value: 0.76 },
    uOceanOpacity: { value: 0.38 },
    uContrast: { value: 1 },
    uThreshold: { value: 0.44 },
    uIntensity: { value: 1 },
    uDensity: { value: 1 },
    uDetail: { value: 1 },
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

  // ---- display layers -------------------------------------------------------
  const layers = {}
  const layerOrder = ["country", "sticker", "polaroid", "analytics", "centers", "weather"]
  for (const key of layerOrder) {
    const group = new THREE.Group()
    group.visible = key === "country"
    layers[key] = group
    globe.add(group)
  }

  let accentHex = 0x1a56db

  // every raycastable record, tagged with the layer it belongs to
  const pickables = []
  const disposables = []

  function track(object) {
    disposables.push(object)
    return object
  }

  const scratch = new THREE.Vector3()
  const camDir = new THREE.Vector3()

  function updateCamDir() {
    camDir.copy(camera.position).normalize()
  }

  function facingRaw(anchor) {
    scratch.copy(anchor).applyQuaternion(globe.quaternion).normalize()
    return scratch.dot(camDir)
  }

  function facingFade(anchor) {
    return Math.max(0, Math.min(1, (facingRaw(anchor) - 0.18) * 4.5))
  }

  function makeHit(anchor, radius = 0.1) {
    const hit = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), new THREE.MeshBasicMaterial({ visible: false }))
    hit.position.copy(anchor)
    hit.userData.baseRadius = radius
    return track(hit)
  }

  function makeRing(anchor, inner, outer, hex) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 24),
      new THREE.MeshBasicMaterial({ color: hex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
    )
    ring.position.copy(anchor)
    ring.lookAt(anchor.clone().multiplyScalar(2))
    return track(ring)
  }

  function makeStem(from, to, hex) {
    return track(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([from, to]),
        new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: 0.75 }),
      ),
    )
  }

  function makePin(anchor, hex) {
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 12),
      new THREE.MeshBasicMaterial({ color: hex, transparent: true }),
    )
    pin.position.copy(anchor)
    return track(pin)
  }

  function createSprite(canvas, sx, sy) {
    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearMipmapLinearFilter
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
    sprite.scale.set(sx, sy, 1)
    sprite.userData.base = new THREE.Vector2(sx, sy)
    return track(sprite)
  }

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

    const sprite = createSprite(canvas, 0.18, 0.135)

    const img = new Image()
    img.onload = () => {
      drawFlagTexture(ctx, img)
      sprite.material.map.needsUpdate = true
    }
    img.src = flagUrl(place.iso2, true)

    return sprite
  }

  // ---- country beacons ------------------------------------------------------
  const countryEntries = []

  places.forEach((place) => {
    const surface = latLonToVector3(place.lat, place.lon, RADIUS * 1.002)
    const top = latLonToVector3(place.lat, place.lon, RADIUS * 1.028)

    const ring = makeRing(surface, 0.018, 0.034, accentHex)
    const pin = makePin(surface, accentHex)
    const stem = makeStem(surface, top, accentHex)
    const sprite = createFlagSprite(place)
    sprite.position.copy(top)
    const hit = makeHit(top, 0.1)

    layers.country.add(ring, pin, stem, sprite, hit)

    const entry = {
      layer: "country",
      anchor: surface,
      ring,
      pin,
      stem,
      sprite,
      hit,
      descriptor: { kind: "country", place },
    }
    countryEntries.push(entry)
    pickables.push(entry)
  })

  // ---- weather markers ------------------------------------------------------
  // emoji with a white outline, nothing else on the globe
  const WEATHER_CANVAS = 72
  const weatherEntries = []

  places.forEach((place) => {
    const group = new THREE.Group()
    const surface = latLonToVector3(place.lat, place.lon, RADIUS * 1.002)
    const top = latLonToVector3(place.lat, place.lon, RADIUS * 1.022)

    const canvas = document.createElement("canvas")
    canvas.width = WEATHER_CANVAS
    canvas.height = WEATHER_CANVAS
    const ctx = canvas.getContext("2d")

    const sprite = createSprite(canvas, 0.13, 0.13)
    sprite.position.copy(top)
    const hit = makeHit(top, 0.09)

    group.add(sprite, hit)
    layers.weather.add(group)

    const entry = {
      layer: "weather",
      group,
      anchor: surface,
      sprite,
      hit,
      ctx,
      glyph: null,
      row: null,
      descriptor: { kind: "weather", place, row: null },
    }
    weatherEntries.push(entry)
    pickables.push(entry)
  })

  function paintWeatherGlyph(entry, glyph) {
    if (entry.glyph === glyph) return
    entry.glyph = glyph
    paintOutlinedEmoji(entry.ctx, glyph, WEATHER_CANVAS)
    entry.sprite.material.map.needsUpdate = true
  }

  // ---- AI data center beacons ----------------------------------------------
  const centerEntries = []

  centers.forEach((center) => {
    const group = new THREE.Group()
    const surface = latLonToVector3(center.lat, center.lon, RADIUS * 1.002)
    const top = latLonToVector3(center.lat, center.lon, RADIUS * 1.026)

    const canvas = document.createElement("canvas")
    canvas.width = CARD_W
    canvas.height = CARD_W
    const ctx = canvas.getContext("2d")
    drawCardBackdrop(ctx, CARD_W, CARD_W, 14)
    paintServerGlyph(ctx)

    const sprite = createSprite(canvas, 0.15, 0.15)
    sprite.position.copy(top)
    const ring = makeRing(surface, 0.014, 0.028, accentHex)
    const halo = center.weight > 1 ? makeRing(surface, 0.04, 0.05, accentHex) : null
    const pin = makePin(surface, accentHex)
    const hit = makeHit(top, 0.1)

    group.add(ring, pin, sprite, hit)
    if (halo) group.add(halo)
    layers.centers.add(group)

    const entry = {
      layer: "centers",
      group,
      anchor: surface,
      ring,
      halo,
      pin,
      sprite,
      hit,
      descriptor: { kind: "center", center, place: placeByCode.get(center.code) ?? null },
    }
    centerEntries.push(entry)
    pickables.push(entry)
  })

  // ---- analytics beacons ----------------------------------------------------
  // text-based analytics: the globe only carries a health beacon, the numbers
  // live in the action toolbar and the info card
  const analyticsEntries = []

  places.forEach((place) => {
    const group = new THREE.Group()
    const surface = latLonToVector3(place.lat, place.lon, RADIUS * 1.004)

    const ring = makeRing(surface, 0.02, 0.04, accentHex)
    const pin = makePin(surface, accentHex)
    const hit = makeHit(surface, 0.075)

    group.add(ring, pin, hit)
    layers.analytics.add(group)

    const entry = {
      layer: "analytics",
      group,
      anchor: surface,
      ring,
      pin,
      hit,
      score: 0.5,
      mag: 0.5,
      row: null,
      descriptor: { kind: "analytics", place, row: null },
    }
    analyticsEntries.push(entry)
    pickables.push(entry)
  })

  // ---- user stickers --------------------------------------------------------
  const stickerEntries = new Map()

  function paintStickerFace(entry, sticker) {
    if (entry.painted === (sticker.src ?? sticker.glyph)) return
    entry.painted = sticker.src ?? sticker.glyph
    if (sticker.src) {
      const img = new Image()
      img.onload = () => {
        const size = entry.canvas.width
        entry.ctx.clearRect(0, 0, size, size)
        drawCover(entry.ctx, img, 6, 6, size - 12, size - 12)
        entry.sprite.material.map.needsUpdate = true
      }
      img.src = sticker.src
    } else {
      paintStickerGlyph(entry.ctx, sticker.glyph, entry.canvas.width)
    }
    entry.sprite.material.map.needsUpdate = true
  }

  function createSticker(sticker) {
    const group = new THREE.Group()
    const surface = latLonToVector3(sticker.lat, sticker.lon, RADIUS * 1.004)
    const top = latLonToVector3(sticker.lat, sticker.lon, RADIUS * 1.036)

    const canvas = document.createElement("canvas")
    canvas.width = 96
    canvas.height = 96
    const ctx = canvas.getContext("2d")

    const sprite = createSprite(canvas, 0.13, 0.13)
    sprite.position.copy(top)
    const ring = makeRing(surface, 0.016, 0.032, accentHex)
    const pin = makePin(surface, accentHex)
    const stem = makeStem(surface, top, accentHex)
    const hit = makeHit(top, 0.09)

    group.add(ring, pin, stem, sprite, hit)
    layers.sticker.add(group)

    const entry = {
      layer: "sticker",
      group,
      canvas,
      ctx,
      anchor: surface,
      ring,
      pin,
      stem,
      sprite,
      hit,
      scale: 1,
      painted: null,
      descriptor: { kind: "sticker", sticker },
    }
    stickerEntries.set(sticker.id, entry)
    pickables.push(entry)
    applySticker(entry, sticker)
    return entry
  }

  function applySticker(entry, sticker) {
    entry.scale = Number.isFinite(sticker.scale) ? sticker.scale : 1
    entry.descriptor.sticker = sticker
    paintStickerFace(entry, sticker)
  }

  // ---- user polaroids -------------------------------------------------------
  const POLAROID_W = 192
  const POLAROID_H = 244
  const polaroidEntries = new Map()

  function drawPolaroidCard(ctx, img, caption) {
    ctx.fillStyle = "#f6f5f2"
    ctx.fillRect(0, 0, POLAROID_W, POLAROID_H)
    ctx.fillStyle = "#1b1b1f"
    ctx.fillRect(9, 9, POLAROID_W - 18, POLAROID_W - 18)
    if (img) drawCover(ctx, img, 9, 9, POLAROID_W - 18, POLAROID_W - 18)
    else {
      ctx.fillStyle = "#3c4353"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.font = '28px "JetBrains Mono", monospace'
      ctx.fillText("...", POLAROID_W / 2, POLAROID_W / 2)
    }
    ctx.fillStyle = "#1b1b1f"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = 'bold 22px "JetBrains Mono", monospace'
    ctx.fillText(String(caption || "").slice(0, 18), POLAROID_W / 2, POLAROID_H - 28)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)"
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, POLAROID_W - 2, POLAROID_H - 2)
  }

  function createPolaroid(photo) {
    const group = new THREE.Group()
    // a photo belongs to a place: fall back to a random point only when the
    // caller could not resolve coordinates
    const anchor = Number.isFinite(photo.lat) && Number.isFinite(photo.lon)
      ? latLonToVector3(photo.lat, photo.lon, RADIUS * 1.075)
      : randomPoint(RADIUS * 1.075)
    const normal = anchor.clone().normalize()

    const canvas = document.createElement("canvas")
    canvas.width = POLAROID_W
    canvas.height = POLAROID_H
    const ctx = canvas.getContext("2d")
    drawPolaroidCard(ctx, null, photo.caption)

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearMipmapLinearFilter
    const material = track(
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    )
    const mesh = track(new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.267), material))
    mesh.position.copy(anchor)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
    // tilt each card so the scatter reads as pinned photos, not billboards
    mesh.rotateY((Math.random() - 0.5) * 0.5)
    mesh.rotateX((Math.random() - 0.5) * 0.5)

    const stem = track(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([normal.clone().multiplyScalar(RADIUS * 1.004), anchor]),
        new THREE.LineBasicMaterial({ color: 0x9aa0ad, transparent: true, opacity: 0.55 }),
      ),
    )
    const hit = makeHit(anchor, 0.09)

    group.add(mesh, stem, hit)
    layers.polaroid.add(group)

    const entry = {
      layer: "polaroid",
      group,
      anchor,
      mesh,
      stem,
      hit,
      scale: 1,
      descriptor: { kind: "polaroid", photo },
    }
    polaroidEntries.set(photo.id, entry)
    pickables.push(entry)
    applyPolaroid(entry, photo)

    const img = new Image()
    img.onload = () => {
      drawPolaroidCard(ctx, img, photo.caption)
      texture.needsUpdate = true
    }
    img.src = photo.src

    return entry
  }

  function applyPolaroid(entry, photo) {
    entry.scale = Number.isFinite(photo.scale) ? photo.scale : 1
    entry.descriptor.photo = photo
  }

  function dropEntry(entry) {
    entry.group.parent?.remove(entry.group)
    const index = pickables.indexOf(entry)
    if (index >= 0) pickables.splice(index, 1)

    const owned = []
    entry.group.traverse((node) => {
      owned.push(node)
      node.geometry?.dispose()
      const material = node.material
      if (!material) return
      material.map?.dispose()
      material.dispose()
    })

    // forget the tracked references too, otherwise a removed upload keeps its
    // decoded bitmap alive for the lifetime of the page
    for (let i = disposables.length - 1; i >= 0; i -= 1) {
      if (owned.includes(disposables[i])) disposables.splice(i, 1)
    }
  }

  function setStickers(list) {
    const seen = new Set()
    for (const sticker of list) {
      seen.add(sticker.id)
      const existing = stickerEntries.get(sticker.id)
      if (existing) applySticker(existing, sticker)
      else createSticker(sticker)
    }
    for (const [id, entry] of [...stickerEntries]) {
      if (seen.has(id)) continue
      stickerEntries.delete(id)
      dropEntry(entry)
    }
  }

  function setPolaroids(list) {
    const seen = new Set()
    for (const photo of list) {
      seen.add(photo.id)
      const existing = polaroidEntries.get(photo.id)
      if (existing) applyPolaroid(existing, photo)
      else createPolaroid(photo)
    }
    for (const [id, entry] of [...polaroidEntries]) {
      if (seen.has(id)) continue
      polaroidEntries.delete(id)
      dropEntry(entry)
    }
  }

  function paintAnalytics(entry) {
    const hex = entry.score >= 0.5 ? accentHex : WARN_COLOR
    entry.ring.material.color.setHex(hex)
    entry.pin.material.color.setHex(hex)
  }

  function setAnalytics(analytics, metric) {
    if (!analytics) return
    const range = config.metricRange(analytics, metric)
    for (const entry of analyticsEntries) {
      const row = analytics.byCode[entry.descriptor.place.code]
      if (!row) continue
      const { score, mag } = config.normalizeMetric(range, row[metric])
      entry.score = score
      entry.mag = mag
      entry.row = row
      entry.descriptor.row = row
      paintAnalytics(entry)
    }
  }

  function setWeather(byCode) {
    if (!byCode) return
    for (const entry of weatherEntries) {
      const row = byCode[entry.descriptor.place.code]
      if (!row) continue
      entry.row = row
      entry.descriptor.row = row
      paintWeatherGlyph(entry, config.weatherGlyph(row.wmo))
    }
  }

  function setCenters(filter) {
    for (const entry of centerEntries) {
      const center = entry.descriptor.center
      entry.group.visible = !filter || filter === "all" || center.tier === filter
    }
  }

  function setMode(next) {
    for (const key of layerOrder) layers[key].visible = key === next
  }

  // ---- raycasting -----------------------------------------------------------
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const sphereHit = track(
    new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.0005, 48, 32), new THREE.MeshBasicMaterial({ visible: false })),
  )
  globe.add(sphereHit)

  function aim(clientX, clientY) {
    pointer.x = ((clientX - view.left) / view.w) * 2 - 1
    pointer.y = -(((clientY - view.top) / view.h) * 2 - 1)
    raycaster.setFromCamera(pointer, camera)
  }

  function markerUnder(clientX, clientY) {
    aim(clientX, clientY)
    updateCamDir()
    const targets = []
    for (const record of pickables) {
      if (record.group && !record.group.visible) continue
      if (!layers[record.layer].visible) continue
      targets.push(record.hit)
    }
    const found = raycaster.intersectObjects(targets, false)
    for (const hit of found) {
      const record = pickables.find((item) => item.hit === hit.object)
      if (!record) continue
      if (facingRaw(record.anchor) > 0.05) return record
    }
    return null
  }

  // hover resolution: any marker under the cursor, whichever layer it belongs to
  function pick(clientX, clientY) {
    const record = markerUnder(clientX, clientY)
    if (!record) return null
    return record.descriptor
  }

  // tap resolution: an existing marker if one is under the cursor, otherwise the
  // bare sphere, which is where a sticker or photo gets pinned
  function probe(clientX, clientY) {
    const record = markerUnder(clientX, clientY)
    if (record) return { hit: "marker", descriptor: record.descriptor, place: record.descriptor.place ?? null }

    aim(clientX, clientY)
    const found = raycaster.intersectObject(sphereHit, false)
    if (!found.length) return null

    // intersect() reports world space, but pins are children of the globe group
    // which carries the spin and the home tilt. Turning the world point straight
    // into lat/lon double-applies that rotation, so the pin lands one turn away
    // from where the pointer actually was — local space first, then spherical.
    const local = globe.worldToLocal(found[0].point.clone()).normalize()
    const lat = Math.asin(Math.min(1, Math.max(-1, local.y))) * (180 / Math.PI)
    const lon = Math.atan2(local.x, local.z) * (180 / Math.PI)
    return { hit: "sphere", lat, lon }
  }

  // which nation a point belongs to. The raster map is the only land test this
  // app has, and the dataset only holds capitals, so an attribution is accepted
  // as long as the nearest one is plausibly close to the tapped island.
  function locate(lat, lon) {
    const { land } = sample((lon + 180) / 360, (90 - lat) / 180)
    let place = null
    let distance = Infinity
    for (const candidate of places) {
      const km = greatCircleKm(lat, lon, candidate.lat, candidate.lon)
      if (km < distance) {
        distance = km
        place = candidate
      }
    }
    if (distance > NEAREST_KM) place = null
    return { onLand: land > 0.25, place, distanceKm: distance }
  }

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

  let raf = 0

  function pulseFor(now, speed, offset) {
    if (!motion) return 0
    return (Math.sin(now * speed + offset) + 1) * 0.5
  }

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
      } else if (state.autoRotate && motion) {
        globe.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(Y_AXIS, 0.0016 * animation))
      }
    }

    updateCamDir()
    const scale = (camera.position.z / 6) * markerScale
    const breathe = motion ? (Math.sin(now * 0.0016 * animation) + 1) * 0.5 : 0.5

    if (layers.country.visible) {
      countryEntries.forEach((entry, i) => {
        const pulse = pulseFor(now, 0.004 * animation, i * 0.5)
        entry.ring.scale.setScalar((1 + pulse * 1.5) * markerScale)
        entry.ring.material.opacity = (1 - pulse) * 0.85
        const visible = facingFade(entry.anchor)
        entry.sprite.scale.set(entry.sprite.userData.base.x * scale, entry.sprite.userData.base.y * scale, 1)
        entry.hit.scale.setScalar(scale)
        entry.sprite.material.opacity = visible * 0.98
        entry.stem.material.opacity = visible * 0.75
        entry.pin.material.opacity = visible
        const show = visible > 0.02
        entry.ring.visible = show
        entry.sprite.visible = show
        entry.stem.visible = show
        entry.pin.visible = show
      })
    }

    if (layers.weather.visible) {
      weatherEntries.forEach((entry) => {
        // lightweight: a static outlined emoji that fades on the far side
        const visible = facingFade(entry.anchor)
        entry.sprite.scale.set(entry.sprite.userData.base.x * scale, entry.sprite.userData.base.y * scale, 1)
        entry.hit.scale.setScalar(scale)
        entry.sprite.material.opacity = visible
        entry.sprite.visible = visible > 0.02
      })
    }

    if (layers.centers.visible) {
      centerEntries.forEach((entry, i) => {
        if (!entry.group.visible) return
        const pulse = pulseFor(now, 0.005 * animation, i * 0.83)
        entry.ring.scale.setScalar((1 + pulse * 1.8) * markerScale)
        entry.ring.material.opacity = (1 - pulse) * 0.9
        if (entry.halo) {
          entry.halo.scale.setScalar((0.9 + pulse * 0.5 + breathe * 0.15) * markerScale)
          entry.halo.material.opacity = 0.22 + breathe * 0.25
        }
        const visible = facingFade(entry.anchor)
        entry.sprite.scale.set(entry.sprite.userData.base.x * scale, entry.sprite.userData.base.y * scale, 1)
        entry.hit.scale.setScalar(scale)
        entry.sprite.material.opacity = visible * 0.98
        entry.pin.material.opacity = visible
        entry.sprite.visible = visible > 0.02
        entry.ring.visible = entry.sprite.visible
        entry.pin.visible = entry.sprite.visible
        if (entry.halo) entry.halo.visible = entry.sprite.visible
      })
    }

    if (layers.analytics.visible) {
      analyticsEntries.forEach((entry, i) => {
        const visible = facingFade(entry.anchor)
        const wobble = motion ? 1 + Math.sin(now * 0.0025 * animation + i * 0.61) * 0.06 : 1
        // the ring grows with the active metric, so the layer encodes the
        // number without drawing a single bar
        entry.ring.scale.setScalar((0.55 + entry.mag * 0.75) * wobble * markerScale)
        entry.hit.scale.setScalar(scale)
        entry.ring.material.opacity = 0.35 + visible * 0.6
        entry.pin.material.opacity = visible * 0.8
        entry.ring.visible = visible > 0.02
        entry.pin.visible = entry.ring.visible
      })
    }

    if (layers.sticker.visible && stickerEntries.size > 0) {
      let i = 0
      stickerEntries.forEach((entry) => {
        const pulse = pulseFor(now, 0.005 * animation, i * 0.9)
        entry.ring.scale.setScalar((1 + pulse * 1.6) * markerScale)
        entry.ring.material.opacity = (1 - pulse) * 0.9
        const visible = facingFade(entry.anchor)
        const s = scale * entry.scale
        entry.sprite.scale.set(entry.sprite.userData.base.x * s, entry.sprite.userData.base.y * s, 1)
        entry.hit.scale.setScalar(s)
        entry.sprite.material.opacity = visible
        entry.pin.material.opacity = visible
        entry.stem.material.opacity = visible * 0.75
        const show = visible > 0.02
        entry.sprite.visible = show
        entry.ring.visible = show
        entry.pin.visible = show
        entry.stem.visible = show
        i += 1
      })
    }

    if (layers.polaroid.visible && polaroidEntries.size > 0) {
      let i = 0
      polaroidEntries.forEach((entry) => {
        const visible = facingFade(entry.anchor)
        const bob = motion ? 1 + Math.sin(now * 0.0014 * animation + i * 1.7) * 0.018 : 1
        // the plane is already built at card size, so the scale here is only
        // the marker profile times the user's per-card scale
        const s = scale * entry.scale
        entry.mesh.position.copy(entry.anchor).multiplyScalar(bob)
        entry.mesh.scale.set(s, s, 1)
        entry.mesh.material.opacity = visible * 0.97
        entry.stem.material.opacity = visible * 0.5
        entry.hit.scale.setScalar(s)
        const show = visible > 0.02
        entry.mesh.visible = show
        entry.stem.visible = show
        i += 1
      })
    }

    renderer.render(scene, camera)
  }

  function resize() {
    const box = container.getBoundingClientRect()
    view.w = container.clientWidth || window.innerWidth
    view.h = container.clientHeight || window.innerHeight
    view.left = box.left
    view.top = box.top
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
    start() {
      setMode("country")
      setCenters("all")
      loadCartography()
      raf = requestAnimationFrame(render)
    },

    pick,
    probe,
    locate,

    setTheme(theme) {
      accentHex = theme.border
      uniforms.uColor.value.setHex(theme.fg)
      uniforms.uBorderColor.value.setHex(theme.border)
      coreMaterial.color.setHex(theme.globe ?? theme.bg)
      countryEntries.forEach((entry) => {
        entry.ring.material.color.setHex(theme.border)
        entry.pin.material.color.setHex(theme.border)
        entry.stem.material.color.setHex(theme.border)
      })
      centerEntries.forEach((entry) => {
        entry.ring.material.color.setHex(theme.border)
        entry.pin.material.color.setHex(theme.border)
        entry.halo?.material.color.setHex(theme.border)
      })
      analyticsEntries.forEach(paintAnalytics)
      stickerEntries.forEach((entry) => {
        entry.ring.material.color.setHex(theme.border)
        entry.pin.material.color.setHex(theme.border)
        entry.stem.material.color.setHex(theme.border)
      })
    },

    // ---- halftone calibration -------------------------------------------
    setHalftone({ density, scale, contrast, threshold, intensity, ocean, ambient }) {
      if (Number.isFinite(density)) uniforms.uDensity.value = density
      if (Number.isFinite(scale)) uniforms.uDotScale.value = scale
      if (Number.isFinite(contrast)) uniforms.uContrast.value = contrast
      if (Number.isFinite(threshold)) uniforms.uThreshold.value = threshold
      if (Number.isFinite(intensity)) uniforms.uIntensity.value = intensity
      if (Number.isFinite(ocean)) uniforms.uOceanOpacity.value = ocean
      if (Number.isFinite(ambient)) uniforms.uAmbient.value = ambient
    },

    // ---- visual profile ---------------------------------------------------
    setGlobeScale(value) {
      state.globeScale = Number.isFinite(value) ? value : 1
      applyZoom()
    },
    setMarkerScale(value) {
      markerScale = Number.isFinite(value) ? value : 1
    },
    setAnimationIntensity(value) {
      animation = Number.isFinite(value) ? value : 1
    },
    setDetail(value) {
      // the profile stores a 0/1/2 step; map it to how much of the cloud lives
      const step = Number.isFinite(value) ? Math.max(0, Math.min(2, Math.round(value))) : 1
      uniforms.uDetail.value = [0.55, 0.78, 1][step]
    },
    setMotion(enabled) {
      motion = Boolean(enabled)
      if (!motion) {
        state.inertia = 0
        state.autoRotate = false
      }
    },

    setMode,
    setWeather,
    setAnalytics,
    setCenters,
    setStickers,
    setPolaroids,

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
      state.inertia = motion ? Math.min(0.045, angle * 0.45) : 0
      state.target = null
    },

    zoomBy(delta) {
      state.locked = true
      state.easing = true
      state.ratio = (state.zoom + delta) / state.fit / state.globeScale
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
      state.inertia = motion ? 0.0018 : 0
      state.locked = false
      state.easing = true
      state.ratio = 1
      applyZoom()
    },

    // remember where the globe was so a focused selection can hand it back
    snapshot() {
      return {
        quaternion: globe.quaternion.clone(),
        ratio: state.ratio,
        globeScale: state.globeScale,
        autoRotate: state.autoRotate,
        locked: state.locked,
      }
    },

    restore(saved) {
      if (!saved) return
      state.target = saved.quaternion.clone()
      state.ratio = saved.ratio
      state.globeScale = saved.globeScale ?? 1
      state.inertia = 0
      state.locked = saved.locked
      state.easing = true
      state.autoRotate = motion ? saved.autoRotate : false
      applyZoom()
    },

    dispose() {
      lifecycle.abort()
      observer.disconnect()
      cancelAnimationFrame(raf)
      geometry.dispose()
      dots.material.dispose()
      coreMaterial.dispose()
      const seen = new Set()
      disposables.forEach((object) => {
        object.geometry?.dispose()
        const material = object.material
        if (!material || seen.has(material)) return
        seen.add(material)
        material.map?.dispose()
        material.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    },
  }

  return api
}
