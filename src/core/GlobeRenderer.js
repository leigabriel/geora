import * as THREE from "three"
import { geoEquirectangular, geoPath } from "d3-geo"
import { feature, mesh } from "topojson-client"
import topology from "world-atlas/countries-110m.json"
import { DOT_VERTEX } from "../shaders/globe.vert.js"
import { DOT_FRAGMENT } from "../shaders/globe.frag.js"
import { MAP_W, MAP_H, FALLBACK_LAND } from "./constants.js"
import { scatterValue } from "../utils/geo.js"

// The renderer owns the WebGL context, the rasterized world map and the
// halftone point cloud built from it: everything that draws the planet itself,
// before any marker layer is added.
export function createRenderer(ctx) {
  const { container, view, globe, signal } = ctx

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(view.w, view.h)
  container.appendChild(renderer.domElement)

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

  // fibonacci sphere point cloud: dense enough to read as a solid halftone
  const width = container.clientWidth || window.innerWidth
  const count = width < 640 ? 30000 : 65000
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

    positions[i * 3] = x * ctx.radius
    positions[i * 3 + 1] = y * ctx.radius
    positions[i * 3 + 2] = z * ctx.radius
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
    uDotScale: { value: 1 },
    uAmbient: { value: 0.2 },
    uOceanOpacity: { value: 1 },
    uContrast: { value: 1 },
    uThreshold: { value: 0.4 },
    uIntensity: { value: 1 },
    uDensity: { value: 1 },
    uDetail: { value: 1 },
    uShowBorders: { value: 1 },
    uColor: { value: new THREE.Color(0x121316) },
    uBorderColor: { value: new THREE.Color(0x212121) },
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
  const core = new THREE.Mesh(new THREE.SphereGeometry(ctx.radius * 0.985, 48, 48), coreMaterial)
  globe.add(core)

  function refreshDots() {
    mapPixels = mapCtx.getImageData(0, 0, MAP_W, MAP_H).data
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3]
      const y = positions[i * 3 + 1]
      const z = positions[i * 3 + 2]
      const hit = sample(Math.atan2(x, z) / (2 * Math.PI) + 0.5, 0.5 - Math.asin(y / ctx.radius) / Math.PI)
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

  function paintNaturalEarth(topologyData) {
    paintMap()
    mapCtx.fillStyle = "#ffffff"
    mapCtx.beginPath()
    path(feature(topologyData, topologyData.objects.land))
    mapCtx.fill()

    mapCtx.strokeStyle = "#00ff88"
    mapCtx.lineWidth = 1.4
    mapCtx.beginPath()
    path(mesh(topologyData, topologyData.objects.countries, (a, b) => a !== b))
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

  // The world topology ships with the package, so painting the map needs no
  // network access. Failures still degrade to the built-in fallback land.
  let cartographyLoaded = false
  async function loadCartography() {
    if (cartographyLoaded) return
    cartographyLoaded = true
    try {
      if (signal.aborted) return
      paintNaturalEarth(topology)
      refreshDots()
    } catch {
      if (signal.aborted) return
      paintFallbackLand()
      refreshDots()
    }
  }

  function handleResize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(view.w, view.h)
  }

  function dispose() {
    geometry.dispose()
    dots.material.dispose()
    coreMaterial.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }

  return {
    renderer,
    uniforms,
    coreMaterial,
    sample,
    loadCartography,
    handleResize,
    dispose,
  }
}
