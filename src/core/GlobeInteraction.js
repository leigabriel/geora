import * as THREE from "three"
import { greatCircleKm } from "../utils/geo.js"
import { NEAREST_KM, RADIUS } from "./constants.js"
import { track } from "./primitives.js"

// Raycasting: hover resolution, tap resolution and the "which nation is this"
// attribution used when a tap lands on bare sphere.
export function createInteraction(ctx) {
  const { camera, globe, layers, content, pickables, emphasis } = ctx

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const sphereHit = track(
    ctx,
    new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.0005, 48, 32), new THREE.MeshBasicMaterial({ visible: false })),
  )
  globe.add(sphereHit)

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

  function aim(clientX, clientY) {
    const { view } = ctx
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
  // bare sphere
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
  // package has, and the default dataset only holds capitals, so an attribution
  // is accepted as long as the nearest one is plausibly close to the tapped
  // island.
  function locate(lat, lon) {
    const { land } = ctx.sample((lon + 180) / 360, (90 - lat) / 180)
    let place = null
    let distance = Infinity
    for (const candidate of content.countries) {
      const km = greatCircleKm(lat, lon, candidate.lat, candidate.lon)
      if (km < distance) {
        distance = km
        place = candidate
      }
    }
    if (distance > NEAREST_KM) place = null
    return { onLand: land > 0.25, place, distanceKm: distance }
  }

  return {
    updateCamDir,
    facingRaw,
    facingFade,
    pick,
    probe,
    locate,
    setHover: (descriptor) => emphasis.setHovered(descriptor),
    setSelected: (descriptor) => emphasis.setSelected(descriptor),
  }
}
