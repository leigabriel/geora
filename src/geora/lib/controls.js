// Pointer, wheel and pinch gestures on the globe canvas.
//
// Selection is resolved on release, not on press, so a drag never selects. Every
// marker is declared in code, so a release is one of two things: a marker, or the
// bare sphere, which carries no selection and dismisses the open card.
export function bindControls({ scene, audio, onHover, onSelect, onSphere }) {
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
  }

  function move(event) {
    if (overChrome(event.target)) {
      // leaving the globe for the HUD must not leave a tooltip hanging around
      if (!dragging) emitHover(null)
      return
    }
    if (!dragging) {
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

    if (dist > 0.001) {
      scene.drag(dx, dy)
      if (dist > 3) audio.swipe(dist / 32)
    }
  }

  function release(event) {
    if (!dragging) return
    dragging = false
    hovered = null
    scene.setDragging(false)

    if (moved >= 6) {
      audio.swipeStop()
      return
    }

    if (overChrome(event.target)) return
    const hit = scene.probe(event.clientX, event.clientY)
    if (!hit) return
    if (hit.hit === "marker") {
      onSelect?.(hit.descriptor, event.clientX, event.clientY)
      return
    }
    onSphere?.(hit, event.clientX, event.clientY)
  }

  function cancel() {
    dragging = false
    hovered = null
    scene.setDragging(false)
  }

  function wheel(event) {
    if (overChrome(event.target)) return
    scene.zoomBy(event.deltaY * 0.004)
    audio.pip("G6")
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

  window.addEventListener("pointerdown", down)
  window.addEventListener("pointermove", move)
  window.addEventListener("pointerup", release)
  window.addEventListener("pointercancel", cancel)
  window.addEventListener("wheel", wheel, { passive: true })
  window.addEventListener("touchstart", touchStart, { passive: true })
  window.addEventListener("touchmove", touchMove, { passive: true })
  window.addEventListener("touchend", touchEnd, { passive: true })
  window.addEventListener("touchcancel", touchEnd, { passive: true })

  return () => {
    window.removeEventListener("pointerdown", down)
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", release)
    window.removeEventListener("pointercancel", cancel)
    window.removeEventListener("wheel", wheel)
    window.removeEventListener("touchstart", touchStart)
    window.removeEventListener("touchmove", touchMove)
    window.removeEventListener("touchend", touchEnd)
    window.removeEventListener("touchcancel", touchEnd)
  }
}
