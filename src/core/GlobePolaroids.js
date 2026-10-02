import * as THREE from "three"
import { latLonToVector3, randomPoint } from "../utils/geo.js"
import { drawCover } from "../utils/canvas.js"
import { makeHit, dropEntry, track } from "./primitives.js"

const POLAROID_W = 192
const POLAROID_H = 244

// a photo is labelled by the country it landed in, never by its file name: the
// picture is the content, the place is the metadata worth reading from orbit
function polaroidLabel(photo) {
  return photo.country || "PINNED"
}

function drawPolaroidCard(ctx, img, label) {
  ctx.fillStyle = "#f6f5f2"
  ctx.fillRect(0, 0, POLAROID_W, POLAROID_H)
  ctx.fillStyle = "#1b1b1f"
  ctx.fillRect(9, 9, POLAROID_W - 18, POLAROID_W - 18)
  if (img) drawCover(ctx, img, 9, 9, POLAROID_W - 18, POLAROID_W - 18)
  else {
    ctx.fillStyle = "#3c4353"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = '28px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillText("...", POLAROID_W / 2, POLAROID_W / 2)
  }
  ctx.fillStyle = "#1b1b1f"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  // long country names shrink rather than spill past the paper border
  let size = 20
  ctx.font = `bold ${size}px "JetBrains Mono", ui-monospace, monospace`
  while (ctx.measureText(label).width > POLAROID_W - 28 && size > 11) {
    size -= 1
    ctx.font = `bold ${size}px "JetBrains Mono", ui-monospace, monospace`
  }
  ctx.fillText(label, POLAROID_W / 2, POLAROID_H - 28)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.25)"
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, POLAROID_W - 2, POLAROID_H - 2)
}

// The landmark photo layer: one tilted paper card per landmark, pinned at its
// real coordinates, rising and fading with the globe's rotation.
export function createPolaroids(ctx) {
  const { layers, prefs, emphasis, facingFade, radius } = ctx
  const entries = new Map()

  function createPolaroid(photo, id) {
    const group = new THREE.Group()
    // a photo belongs to a place: fall back to a random point only when the
    // caller could not resolve coordinates
    const anchor = Number.isFinite(photo.lat) && Number.isFinite(photo.lon)
      ? latLonToVector3(photo.lat, photo.lon, radius * 1.075)
      : randomPoint(radius * 1.075)
    const normal = anchor.clone().normalize()

    const canvas = document.createElement("canvas")
    canvas.width = POLAROID_W
    canvas.height = POLAROID_H
    const cardCtx = canvas.getContext("2d")

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearMipmapLinearFilter
    const material = track(
      ctx,
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    )
    const mesh = track(ctx, new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.267), material))
    mesh.position.copy(anchor)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
    // tilt each card so the scatter reads as pinned photos, not billboards
    mesh.rotateY((Math.random() - 0.5) * 0.5)
    mesh.rotateX((Math.random() - 0.5) * 0.5)

    const stem = track(
      ctx,
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([normal.clone().multiplyScalar(radius * 1.004), anchor]),
        new THREE.LineBasicMaterial({ color: 0x9aa0ad, transparent: true, opacity: 0.55 }),
      ),
    )
    const hit = makeHit(ctx, anchor, 0.09)

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
      ctx: cardCtx,
      texture,
      img: null,
      label: null,
      descriptor: { kind: "polaroid", photo },
    }
    entries.set(id, entry)
    ctx.pickables.push(entry)
    applyPolaroid(entry, photo)

    const src = photo.image ?? photo.src
    if (src) {
      const img = new Image()
      entry.img = img
      img.onload = () => paintPolaroid(entry)
      img.crossOrigin = "anonymous"
      img.src = src
    }

    return entry
  }

  function paintPolaroid(entry) {
    drawPolaroidCard(entry.ctx, entry.img, polaroidLabel(entry.descriptor.photo))
    entry.texture.needsUpdate = true
  }

  function applyPolaroid(entry, photo) {
    entry.scale = Number.isFinite(photo.scale) ? photo.scale : 1
    entry.descriptor.photo = photo
    // the paper is redrawn only when its country label actually changes
    const label = polaroidLabel(photo)
    if (entry.label === label) return
    entry.label = label
    paintPolaroid(entry)
  }

  function setPolaroids(list) {
    const seen = new Set()
    for (const photo of list) {
      const id = photo.id ?? photo.caption ?? String(seen.size)
      seen.add(id)
      const existing = entries.get(id)
      if (existing) applyPolaroid(existing, photo)
      else createPolaroid(photo, id)
    }
    for (const [id, entry] of [...entries]) {
      if (seen.has(id)) continue
      entries.delete(id)
      dropEntry(ctx, entry)
    }
  }

  function update(now, scale) {
    if (!layers.polaroid.visible || entries.size === 0) return
    let i = 0
    entries.forEach((entry) => {
      const emphasisKind = emphasis.forDescriptor(entry.descriptor)
      const dim = emphasisKind === "dimmed" ? 0.45 : 1
      const visible = facingFade(entry.anchor)
      const bob = prefs.motion ? 1 + Math.sin(now * 0.0014 * prefs.animation + i * 1.7) * 0.018 : 1
      // the plane is already built at card size, so the scale here is only
      // the marker profile times the user's per-card scale
      const s = scale * entry.scale * (emphasisKind === "selected" ? 1.2 : 1)
      entry.mesh.position.copy(entry.anchor).multiplyScalar(bob)
      entry.mesh.scale.set(s, s, 1)
      entry.mesh.material.opacity = visible * 0.97 * dim
      entry.stem.material.opacity = visible * 0.5 * dim
      entry.hit.scale.setScalar(s)
      const show = visible > 0.02
      entry.mesh.visible = show
      entry.stem.visible = show
      i += 1
    })
  }

  return { setPolaroids, update }
}
