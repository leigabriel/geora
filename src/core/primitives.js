import * as THREE from "three"

// Small factory helpers shared by every marker layer. Each takes the scene
// context so disposables and the pick list stay owned by the scene that
// created them.

export function track(ctx, object) {
  ctx.disposables.push(object)
  return object
}

export function makeHit(ctx, anchor, radius = 0.1) {
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false }),
  )
  hit.position.copy(anchor)
  hit.userData.baseRadius = radius
  return track(ctx, hit)
}

export function makeRing(ctx, anchor, inner, outer, hex) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 24),
    new THREE.MeshBasicMaterial({ color: hex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
  )
  ring.position.copy(anchor)
  ring.lookAt(anchor.clone().multiplyScalar(2))
  return track(ctx, ring)
}

export function makeStem(ctx, from, to, hex) {
  return track(
    ctx,
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([from, to]),
      new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: 0.75 }),
    ),
  )
}

export function makePin(ctx, anchor, hex) {
  const pin = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 12, 12),
    new THREE.MeshBasicMaterial({ color: hex, transparent: true }),
  )
  pin.position.copy(anchor)
  return track(ctx, pin)
}

export function createSprite(ctx, canvas, sx, sy) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearMipmapLinearFilter
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
  sprite.scale.set(sx, sy, 1)
  sprite.userData.base = new THREE.Vector2(sx, sy)
  return track(ctx, sprite)
}

// Removes a marker group from the scene, the pick list and the dispose list,
// releasing its geometry, materials and textures. Without forgetting the
// tracked references a dropped marker would keep its decoded bitmap alive for
// the lifetime of the page.
export function dropEntry(ctx, entry) {
  entry.group.parent?.remove(entry.group)
  const index = ctx.pickables.indexOf(entry)
  if (index >= 0) ctx.pickables.splice(index, 1)

  const owned = []
  entry.group.traverse((node) => {
    owned.push(node)
    node.geometry?.dispose()
    const material = node.material
    if (!material) return
    material.map?.dispose()
    material.dispose()
  })

  for (let i = ctx.disposables.length - 1; i >= 0; i -= 1) {
    if (owned.includes(ctx.disposables[i])) ctx.disposables.splice(i, 1)
  }
}
