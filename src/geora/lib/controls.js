// pointer, wheel and pinch gestures on the globe canvas
export function bindControls({ scene, audio, onHover, onSelect, onClear }) {
  let dragging = false
  let moved = 0
  let last = { x: 0, y: 0 }
  let pinch = null

  const overChrome = (target) => Boolean(target?.closest?.("[data-ui]"))

  function down(event) {
    if (overChrome(event.target)) return
    dragging = true
    moved = 0
    last = { x: event.clientX, y: event.clientY }
    scene.setDragging(true)
  }

  function move(event) {
    if (overChrome(event.target)) return

    if (!dragging) {
      const marker = scene.pick(event.clientX, event.clientY)
      onHover?.(marker?.place ?? null, event.clientX, event.clientY)
      return
    }

    onHover?.(null)
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

  function up(event) {
    if (!dragging) return
    dragging = false
    scene.setDragging(false)

    if (moved < 6) {
      if (!overChrome(event.target)) {
        const marker = scene.pick(event.clientX, event.clientY)
        if (marker) onSelect?.(marker.place, event.clientX, event.clientY)
        else onClear?.()
      }
      return
    }
    audio.swipeStop()
  }

  function cancel() {
    dragging = false
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
  window.addEventListener("pointerup", up)
  window.addEventListener("pointercancel", cancel)
  window.addEventListener("wheel", wheel, { passive: true })
  window.addEventListener("touchstart", touchStart, { passive: true })
  window.addEventListener("touchmove", touchMove, { passive: true })
  window.addEventListener("touchend", touchEnd, { passive: true })
  window.addEventListener("touchcancel", touchEnd, { passive: true })

  return () => {
    window.removeEventListener("pointerdown", down)
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", up)
    window.removeEventListener("pointercancel", cancel)
    window.removeEventListener("wheel", wheel)
    window.removeEventListener("touchstart", touchStart)
    window.removeEventListener("touchmove", touchMove)
    window.removeEventListener("touchend", touchEnd)
    window.removeEventListener("touchcancel", touchEnd)
  }
}
