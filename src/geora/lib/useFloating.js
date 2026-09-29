import { useLayoutEffect, useState } from 'react'

// keeps a floating panel inside the viewport, anchored to a screen point
export default function useFloating(ref, x, y, { offsetX = 0, offsetY = 0, margin = 10, placeAbove = true } = {}) {
  const [style, setStyle] = useState({ left: 0, top: 0, visibility: 'hidden' })

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || x == null) return

    const place = () => {
      const w = element.offsetWidth
      const h = element.offsetHeight
      let left = x + offsetX
      let top = placeAbove ? y + offsetY - h : y + offsetY

      if (placeAbove && top < margin) top = y + offsetY
      left = Math.min(Math.max(left, margin), Math.max(margin, window.innerWidth - w - margin))
      top = Math.min(Math.max(top, margin), Math.max(margin, window.innerHeight - h - margin))

      setStyle({ left: `${Math.round(left)}px`, top: `${Math.round(top)}px`, visibility: 'visible' })
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [ref, x, y, offsetX, offsetY, margin, placeAbove])

  return style
}
