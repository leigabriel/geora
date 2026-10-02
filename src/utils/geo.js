import * as THREE from "three"

export function latLonToVector3(lat, lon, radius) {
  const phi = (lat * Math.PI) / 180
  const lambda = (lon * Math.PI) / 180
  return new THREE.Vector3(
    radius * Math.cos(phi) * Math.sin(lambda),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.cos(lambda),
  )
}

export function greatCircleKm(latA, lonA, latB, lonB) {
  const toRad = Math.PI / 180
  const dLat = (latB - latA) * toRad
  const dLon = (lonB - lonA) * toRad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA * toRad) * Math.cos(latB * toRad) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// uniform-ish point on the whole sphere
export function randomPoint(radius = 1) {
  const z = Math.random() * 2 - 1
  const angle = Math.random() * Math.PI * 2
  const ring = Math.sqrt(Math.max(0, 1 - z * z))
  return new THREE.Vector3(ring * Math.cos(angle), z, ring * Math.sin(angle)).multiplyScalar(radius)
}

// stable per-point value in [0,1) so lowering the density thins the cloud
// evenly instead of shaving off a latitude band
export function scatterValue(index) {
  const raw = Math.sin(index * 12.9898 + 78.233) * 43758.5453
  return raw - Math.floor(raw)
}
