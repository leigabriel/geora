// Pointer, wheel and pinch gestures on the globe surface.
//
// Listeners are bound to the supplied root (the component's own stage), not to
// the window, so an embedded globe never steals interaction from the page
// around it. Selection is resolved on release, not on press, so a drag never
// selects. Every marker is declared in code, so a release is one of two
// things: a marker, or the bare sphere, which carries no selection and clears
// the open one.
export function bindControls({ root, scene, onHover, onSelect, onSphere }) {
  let dragging = false
  let moved = 0
  let last = { x: 0, y: 0 }
  let pinch = null
  // hovering is emitted on change only: the tooltip follows the beacon, not
  // the pointer, so a move across the same marker costs one render, not one
  // per pixel
  let hovered

  const overChrome = (target) => Boolean(target?.closest?.("[data-ui]"))

  function emitHover(descriptor, x, y) {
    if (descriptor === hovered) return
    hovered = descriptor
    onHover?.(descriptor, x, y)
  }

  function down(event) {
    if (overChrome(event.target)) return
    dragging = true
    moved = 0
    last = { x: event.clientX, y: event.clientY }
    scene.setDragging(true)
    root.setPointerCapture?.(event.pointerId)
  }

  function move(event) {
    if (!dragging) {
      if (overChrome(event.target)) {
        // leaving the globe for the chrome must not leave a tooltip hanging
        emitHover(null)
        return
      }
      const descriptor = scene.pick(event.clientX, event.clientY)
      emitHover(descriptor, event.clientX, event.clientY)
      return
    }

    emitHover(null)
    const dx = event.clientX - last.x
    const dy = event.clientY - last.y
    const dist = Math.hypot(dx, dy)
    last = { x: event.clientX, y: event.clientY }
    moved += dist

    if (dist > 0.001) scene.drag(dx, dy)
  }

  function release(event) {
    if (!dragging) return
    dragging = false
    hovered = null
    scene.setDragging(false)
    root.releasePointerCapture?.(event.pointerId)

    if (moved >= 6) return

    if (overChrome(event.target)) return
    const hit = scene.probe(event.clientX, event.clientY)
    if (!hit) return
    if (hit.hit === "marker") {
      onSelect?.(hit.descriptor, event.clientX, event.clientY)
      return
    }
    onSphere?.(hit, event.clientX, event.clientY)
  }

  function cancel(event) {
    if (!dragging) return
    dragging = false
    hovered = null
    scene.setDragging(false)
    root.releasePointerCapture?.(event.pointerId)
  }

  function leave() {
    if (!dragging) emitHover(null)
  }

  function wheel(event) {
    if (overChrome(event.target)) return
    // the globe owns the wheel while the pointer is over it, so an embedded
    // globe never scrolls the host page instead of zooming
    event.preventDefault()
    scene.zoomBy(event.deltaY * 0.004)
  }

  function touchStart(event) {
    if (event.touches.length !== 2) return
    pinch = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY,
    )
  }

  function touchMove(event) {
    if (event.touches.length !== 2 || pinch === null) return
    const spread = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY,
    )
    scene.zoomBy((pinch - spread) * 0.012)
    pinch = spread
  }

  function touchEnd() {
    pinch = null
  }

  root.addEventListener("pointerdown", down)
  root.addEventListener("pointermove", move)
  root.addEventListener("pointerup", release)
  root.addEventListener("pointercancel", cancel)
  root.addEventListener("pointerleave", leave)
  root.addEventListener("wheel", wheel, { passive: false })
  root.addEventListener("touchstart", touchStart, { passive: true })
  root.addEventListener("touchmove", touchMove, { passive: true })
  root.addEventListener("touchend", touchEnd, { passive: true })
  root.addEventListener("touchcancel", touchEnd, { passive: true })

  return () => {
    root.removeEventListener("pointerdown", down)
    root.removeEventListener("pointermove", move)
    root.removeEventListener("pointerup", release)
    root.removeEventListener("pointercancel", cancel)
    root.removeEventListener("pointerleave", leave)
    root.removeEventListener("wheel", wheel)
    root.removeEventListener("touchstart", touchStart)
    root.removeEventListener("touchmove", touchMove)
    root.removeEventListener("touchend", touchEnd)
    root.removeEventListener("touchcancel", touchEnd)
  }
}
