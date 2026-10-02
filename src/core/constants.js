import * as THREE from "three"

export const RADIUS = 2.1
export const FOV = 45
export const MAP_W = 2048
export const MAP_H = 1024
export const MIN_RATIO = 0.62
export const MAX_RATIO = 1.7
export const FOCUS_RATIO = 0.8
// how much of the shorter viewport axis the globe is allowed to fill when idle
// 1.42 keeps the globe dominant with intentional breathing room: large enough
// to lead, small enough that the HUD never has to fight it.
export const GLOBE_FILL = 1.42
export const Y_AXIS = new THREE.Vector3(0, 1, 0)
export const HOME_QUATERNION = () =>
  new THREE.Quaternion().setFromEuler(new THREE.Euler(0.18, -1.2, 0, "YXZ"))

// how far from the nearest seat of government a tap may sit and still be
// credited to it. The dataset holds one point per nation, so the middle of a
// large country is thousands of kilometres from its own capital; the land test
// from the raster map is what stops an ocean click being blamed on someone.
export const NEAREST_KM = 4000

export const FALLBACK_LAND = [
  [[-168, 65], [-140, 70], [-100, 70], [-60, 55], [-75, 35], [-80, 25], [-97, 26], [-105, 20], [-120, 35], [-130, 54]],
  [[-77, 8], [-52, 5], [-35, -5], [-39, -14], [-53, -33], [-66, -54], [-75, -50], [-81, -5]],
  [[10, 54], [30, 60], [70, 70], [120, 72], [170, 66], [140, 50], [120, 30], [105, 10], [80, 13], [60, 22], [35, 33], [10, 37], [0, 45]],
  [[-10, 30], [10, 37], [32, 31], [43, 12], [51, 11], [38, -15], [26, -34], [15, -28], [9, 4], [-17, 14]],
  [[114, -22], [136, -12], [153, -28], [140, -38], [118, -35]],
]
