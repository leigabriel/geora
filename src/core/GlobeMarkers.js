import * as THREE from "three"
import { latLonToVector3 } from "../utils/geo.js"
import { drawChip, drawFlagTexture, roundedRect } from "../utils/canvas.js"
import { metricMeta, metricRange, normalizeMetric } from "../analytics/analytics.js"
import { bundledFlag } from "../assets/flags.js"
import { makeHit, makeRing, makeStem, makePin, createSprite, dropEntry } from "./primitives.js"

const LABEL_W = 256
const LABEL_H = 96

// A stable hue per ISO code: neighbouring nations never share a colour, and
// the mapping survives reloads because it hashes the code rather than a seed.
function countryTextColor(code) {
  let hash = 0
  const text = String(code ?? "")
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  return `hsl(${hash % 360} 90% 70%)`
}

// Every beacon-style layer: nation beacons, AI campus pins, telemetry chips
// and host-supplied markers. Markers are rebuilt when the host swaps data,
// recoloured when the theme changes, and updated every frame for pulse,
// facing fade and selection emphasis.
export function createMarkers(ctx) {
  const { layers, content, prefs, emphasis, facingFade } = ctx

  const countryEntries = []
  const centerEntries = []
  const analyticsEntries = []
  const markerEntries = []

  let accent = 0x212121
  let analytics = null
  let metric = "traffic"

  // `flagBase` is the consumer's own artwork and wins whenever it is set.
  // Otherwise the flags bundled with the package are used, so a plain
  // `<geora-globe>` shows real flags with no configuration and no build step.
  // Either way the result is a pair of absolute URLs, already rewritten by the
  // consumer's bundler for whatever base it deploys under.
  const flagUrl = (place) => {
    const code = place.iso2
    if (!code) return null
    const base = ctx.options.flagBase
    if (base) {
      const clean = String(base).replace(/\/+$/, "")
      return { standard: `${clean}/${code}.png`, retina: `${clean}/${code}@2x.png` }
    }
    const retina = bundledFlag(code, true)
    const standard = bundledFlag(code, false)
    if (!retina && !standard) return null
    return { standard: standard ?? retina, retina: retina ?? standard }
  }

  function createFlagSprite(place) {
    const canvas = document.createElement("canvas")
    canvas.width = 128
    canvas.height = 96
    const ctx2d = canvas.getContext("2d")

    ctx2d.fillStyle = "#1e293b"
    roundedRect(ctx2d, 4, 4, 120, 88, 10)
    ctx2d.fill()
    ctx2d.fillStyle = "#ffffff"
    ctx2d.font = 'bold 36px "JetBrains Mono", ui-monospace, monospace'
    ctx2d.textAlign = "center"
    ctx2d.textBaseline = "middle"
    ctx2d.fillText(String(place.code ?? "??").slice(0, 2).toUpperCase(), 64, 48)

    // Compact beacon: small enough that neighbours stay separable, large
    // enough to remain a touch target once scaled by camera distance.
    const sprite = createSprite(ctx, canvas, 0.16, 0.12)

    const urls = flagUrl(place)
    if (urls) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      let stage = 0
      img.onload = () => {
        drawFlagTexture(ctx2d, img)
        sprite.material.map.needsUpdate = true
      }
      img.onerror = () => {
        // fall back from the retina file to the standard one, then to the
        // code chip that is already painted
        stage += 1
        if (stage === 1) img.src = urls.standard
      }
      img.src = urls.retina
    }

    return sprite
  }

  function buildCountries() {
    countryEntries.length = 0
    content.countries.forEach((place) => {
      const group = new THREE.Group()
      const surface = latLonToVector3(place.lat, place.lon, ctx.radius * 1.002)
      const top = latLonToVector3(place.lat, place.lon, ctx.radius * 1.028)

      const ring = makeRing(ctx, surface, 0.018, 0.034, accent)
      const pin = makePin(ctx, surface, accent)
      const stem = makeStem(ctx, surface, top, accent)
      const sprite = createFlagSprite(place)
      sprite.position.copy(top)
      const hit = makeHit(ctx, top, 0.1)

      group.add(ring, pin, stem, sprite, hit)
      layers.country.add(group)

      const entry = {
        layer: "country",
        group,
        anchor: surface,
        ring,
        pin,
        stem,
        sprite,
        hit,
        descriptor: { kind: "country", place },
      }
      countryEntries.push(entry)
      ctx.pickables.push(entry)
    })
  }

  // ---- AI data center labels -------------------------------------------------
  // the site name floats over its pin, the same way analytics floats a value:
  // one black chip, white text, sized to fit the name.
  function buildCenters() {
    centerEntries.length = 0
    const placeByCode = new Map(content.countries.map((place) => [place.code, place]))

    content.centers.forEach((center) => {
      const group = new THREE.Group()
      const surface = latLonToVector3(center.lat, center.lon, ctx.radius * 1.002)
      const top = latLonToVector3(center.lat, center.lon, ctx.radius * 1.03)

      const canvas = document.createElement("canvas")
      canvas.width = LABEL_W
      canvas.height = LABEL_H
      const ctx2d = canvas.getContext("2d")
      drawChip(ctx2d, {
        width: LABEL_W,
        height: LABEL_H,
        text: String(center.name ?? ""),
        color: "#ffffff",
        padding: 24,
        initialSize: 40,
        minSize: 12,
      })

      const sprite = createSprite(ctx, canvas, 0.3, 0.1125)
      sprite.position.copy(top)
      const ring = makeRing(ctx, surface, 0.014, 0.028, accent)
      const halo = center.weight > 1 ? makeRing(ctx, surface, 0.04, 0.05, accent) : null
      const pin = makePin(ctx, surface, accent)
      const hit = makeHit(ctx, top, 0.1)

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
      ctx.pickables.push(entry)
    })
  }

  // ---- analytics markers ----------------------------------------------------
  // the reading itself is the marker: a floating value over each nation instead
  // of a pulsing dot, so the layer is text you can read straight off the planet
  function buildAnalyticsEntries() {
    analyticsEntries.length = 0
    content.countries.forEach((place) => {
      const group = new THREE.Group()
      const surface = latLonToVector3(place.lat, place.lon, ctx.radius * 1.004)
      const top = latLonToVector3(place.lat, place.lon, ctx.radius * 1.03)

      const canvas = document.createElement("canvas")
      canvas.width = LABEL_W
      canvas.height = LABEL_H
      const ctx2d = canvas.getContext("2d")

      const sprite = createSprite(ctx, canvas, 0.27, 0.10125)
      sprite.position.copy(top)
      const hit = makeHit(ctx, top, 0.09)

      group.add(sprite, hit)
      layers.analytics.add(group)

      const entry = {
        layer: "analytics",
        group,
        anchor: surface,
        sprite,
        hit,
        ctx: ctx2d,
        painted: null,
        mag: 0.5,
        metric: null,
        row: null,
        descriptor: { kind: "analytics", place, row: null },
      }
      analyticsEntries.push(entry)
      ctx.pickables.push(entry)
    })
  }

  // Each reading is a number on a solid black chip. The chip is deliberately
  // theme-independent: it reads the same on paper and on a dark globe, and it
  // never collides with the accent colour the rest of the HUD is tuned to. The
  // value itself is tinted per nation, so neighbouring readings stay apart.
  function paintAnalytics(entry) {
    if (!entry.row) return
    const meta = metricMeta(entry.metric)
    const value = entry.row[entry.metric]
    if (!Number.isFinite(value)) return
    const unit = meta.unit === "%" || meta.unit === "ms" ? meta.unit : ` ${meta.unit}`
    const text = `${value.toFixed(meta.decimals)}${unit}`
    const key = `${text}|${meta.unit}`
    if (entry.painted === key) return
    entry.painted = key

    drawChip(entry.ctx, {
      width: LABEL_W,
      height: LABEL_H,
      text,
      color: countryTextColor(entry.descriptor.place.code),
      padding: 28,
      initialSize: 50,
      minSize: 16,
    })
    entry.sprite.material.map.needsUpdate = true
  }

  // ---- host-supplied markers ------------------------------------------------
  function buildCustomMarkers() {
    markerEntries.length = 0
    content.markers.forEach((marker) => {
      const group = new THREE.Group()
      const surface = latLonToVector3(marker.lat, marker.lon, ctx.radius * 1.002)
      const top = latLonToVector3(marker.lat, marker.lon, ctx.radius * 1.028)

      const canvas = document.createElement("canvas")
      canvas.width = LABEL_W
      canvas.height = LABEL_H
      const ctx2d = canvas.getContext("2d")
      drawChip(ctx2d, {
        width: LABEL_W,
        height: LABEL_H,
        text: String(marker.name ?? marker.id ?? "MARKER"),
        color: "#ffffff",
        padding: 24,
        initialSize: 40,
        minSize: 12,
      })

      const sprite = createSprite(ctx, canvas, 0.3, 0.1125)
      sprite.position.copy(top)
      const ring = makeRing(ctx, surface, 0.018, 0.034, accent)
      const pin = makePin(ctx, surface, accent)
      const stem = makeStem(ctx, surface, top, accent)
      const hit = makeHit(ctx, top, 0.1)

      group.add(ring, pin, stem, sprite, hit)
      layers.markers.add(group)

      const entry = {
        layer: "markers",
        group,
        anchor: surface,
        ring,
        pin,
        stem,
        sprite,
        hit,
        descriptor: { kind: "marker", marker },
      }
      markerEntries.push(entry)
      ctx.pickables.push(entry)
    })
  }

  function disposeEntries(entries) {
    for (const entry of entries) dropEntry(ctx, entry)
    entries.length = 0
  }

  function applyThemeTo(entries) {
    for (const entry of entries) {
      entry.ring?.material.color.setHex(accent)
      entry.pin?.material.color.setHex(accent)
      entry.stem?.material.color.setHex(accent)
      entry.halo?.material.color.setHex(accent)
    }
  }

  function setTheme(theme) {
    accent = theme.accent
    ctx.uniforms.uColor.value.setHex(theme.fg)
    ctx.uniforms.uBorderColor.value.setHex(theme.border)
    ctx.coreMaterial.color.setHex(theme.globe ?? theme.bg)
    applyThemeTo(countryEntries)
    applyThemeTo(centerEntries)
    applyThemeTo(markerEntries)
  }

  function setAnalytics(next, nextMetric) {
    if (next) analytics = next
    if (nextMetric) metric = nextMetric
    if (!analytics) return
    const range = metricRange(analytics, metric)
    for (const entry of analyticsEntries) {
      const row = analytics.byCode[entry.descriptor.place.code]
      if (!row) continue
      const { mag } = normalizeMetric(range, row[metric])
      entry.mag = mag
      entry.metric = metric
      entry.row = row
      entry.descriptor.row = row
      paintAnalytics(entry)
    }
  }

  function pulseFor(now, speed, offset) {
    if (!prefs.motion) return 0
    return (Math.sin(now * speed + offset) + 1) * 0.5
  }

  function update(now, scale, breathe) {
    const markerScale = prefs.markerScale
    const animation = prefs.animation

    if (layers.country.visible) {
      countryEntries.forEach((entry, i) => {
        const emphasisKind = emphasis.forDescriptor(entry.descriptor)
        const dim = emphasisKind === "dimmed" ? 0.38 : 1
        const lift = emphasisKind === "selected" ? 1.25 : emphasisKind === "hover" ? 1.15 : 1
        const pulse = pulseFor(now, 0.004 * animation, i * 0.5)
        entry.ring.scale.setScalar((1 + pulse * 1.2) * markerScale * lift)
        entry.ring.material.opacity = (1 - pulse) * 0.85 * dim + (emphasisKind === "selected" ? 0.15 : 0)
        const visible = facingFade(entry.anchor)
        entry.sprite.scale.set(
          entry.sprite.userData.base.x * scale * lift,
          entry.sprite.userData.base.y * scale * lift,
          1,
        )
        entry.hit.scale.setScalar(scale)
        entry.sprite.material.opacity = visible * 0.98 * dim + (emphasisKind === "selected" ? 0.02 : 0)
        entry.stem.material.opacity = visible * 0.6 * dim
        entry.pin.material.opacity = visible * dim
        const show = visible > 0.02
        entry.ring.visible = show
        entry.sprite.visible = show
        entry.stem.visible = show
        entry.pin.visible = show
      })
    }

    if (layers.centers.visible) {
      centerEntries.forEach((entry, i) => {
        const emphasisKind = emphasis.forDescriptor(entry.descriptor)
        const dim = emphasisKind === "dimmed" ? 0.38 : 1
        const lift = emphasisKind === "selected" ? 1.25 : emphasisKind === "hover" ? 1.15 : 1
        const pulse = pulseFor(now, 0.005 * animation, i * 0.83)
        entry.ring.scale.setScalar((1 + pulse * 1.4) * markerScale * lift)
        entry.ring.material.opacity = ((1 - pulse) * 0.9 + (emphasisKind === "selected" ? 0.1 : 0)) * dim
        if (entry.halo) {
          entry.halo.scale.setScalar((0.9 + pulse * 0.5 + breathe * 0.15) * markerScale)
          entry.halo.material.opacity = (0.22 + breathe * 0.25) * dim
        }
        const visible = facingFade(entry.anchor)
        entry.sprite.scale.set(
          entry.sprite.userData.base.x * scale * lift,
          entry.sprite.userData.base.y * scale * lift,
          1,
        )
        entry.hit.scale.setScalar(scale)
        entry.sprite.material.opacity = visible * 0.98 * dim
        entry.pin.material.opacity = visible * dim
        entry.sprite.visible = visible > 0.02
        entry.ring.visible = entry.sprite.visible
        entry.pin.visible = entry.sprite.visible
        if (entry.halo) entry.halo.visible = entry.sprite.visible
      })
    }

    if (layers.analytics.visible) {
      analyticsEntries.forEach((entry) => {
        const emphasisKind = emphasis.forDescriptor(entry.descriptor)
        const dim = emphasisKind === "dimmed" ? 0.35 : 1
        const lift = emphasisKind === "selected" ? 1.2 : emphasisKind === "hover" ? 1.12 : 1
        const visible = facingFade(entry.anchor)
        // the label carries the number, and its size carries the magnitude, so a
        // strong reading is legible from further out than a weak one
        const s = scale * (0.78 + entry.mag * 0.44) * lift
        entry.sprite.scale.set(entry.sprite.userData.base.x * s, entry.sprite.userData.base.y * s, 1)
        entry.hit.scale.setScalar(scale)
        entry.sprite.material.opacity = visible * 0.95 * dim
        entry.sprite.visible = visible > 0.02
      })
    }

    if (layers.markers.visible) {
      markerEntries.forEach((entry, i) => {
        const emphasisKind = emphasis.forDescriptor(entry.descriptor)
        const dim = emphasisKind === "dimmed" ? 0.38 : 1
        const lift = emphasisKind === "selected" ? 1.25 : emphasisKind === "hover" ? 1.15 : 1
        const pulse = pulseFor(now, 0.005 * animation, i * 0.61)
        entry.ring.scale.setScalar((1 + pulse * 1.4) * markerScale * lift)
        entry.ring.material.opacity = (1 - pulse) * 0.85 * dim + (emphasisKind === "selected" ? 0.15 : 0)
        const visible = facingFade(entry.anchor)
        entry.sprite.scale.set(
          entry.sprite.userData.base.x * scale * lift,
          entry.sprite.userData.base.y * scale * lift,
          1,
        )
        entry.hit.scale.setScalar(scale)
        entry.sprite.material.opacity = visible * 0.98 * dim
        entry.stem.material.opacity = visible * 0.6 * dim
        entry.pin.material.opacity = visible * dim
        const show = visible > 0.02
        entry.ring.visible = show
        entry.sprite.visible = show
        entry.stem.visible = show
        entry.pin.visible = show
      })
    }
  }

  const api = {
    build() {
      buildCountries()
      buildCenters()
      buildAnalyticsEntries()
      buildCustomMarkers()
      setAnalytics(analytics, metric)
    },

    rebuildCountries() {
      disposeEntries(countryEntries)
      disposeEntries(analyticsEntries)
      buildCountries()
      buildAnalyticsEntries()
      // center beacons resolve their nation for the info card, so a country
      // swap re-points them too
      const placeByCode = new Map(content.countries.map((place) => [place.code, place]))
      for (const entry of centerEntries) {
        entry.descriptor.place = placeByCode.get(entry.descriptor.center.code) ?? null
      }
      setAnalytics(analytics, metric)
    },

    rebuildCenters() {
      disposeEntries(centerEntries)
      buildCenters()
    },

    rebuildCustomMarkers() {
      disposeEntries(markerEntries)
      buildCustomMarkers()
    },

    setTheme,
    setAnalytics,
    update,
  }

  return api
}
