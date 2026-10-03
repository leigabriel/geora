import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

// Keyboard ownership for a side panel: focus moves in when it opens, Tab stays
// inside it while it is open, and focus goes back to whatever opened it when
// it closes. Without this `aria-modal` is a claim only a mouse can honour —
// Tab walks out of the panel into the page behind, and closing it drops focus
// on <body>, from which a keyboard user has to tab all the way back.
export default function useDialogFocus(open, panelRef) {
  const opener = useRef(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!open || !panel) return undefined

    // captured before focus moves: the trigger is still the active element
    opener.current = document.activeElement

    // `offsetParent` cannot be trusted here — the panel itself is `position:
    // fixed`, which nulls it — so visibility is read off the two things that
    // actually hide content in these panels
    const items = () =>
      [...panel.querySelectorAll(FOCUSABLE)].filter(
        (node) => !node.hidden && !node.closest('details:not([open])'),
      )

    const enter = items()[0]
    if (enter) {
      enter.focus({ preventScroll: true })
    } else {
      // nothing focusable inside: the panel itself becomes the stop, so a
      // keyboard user is not parked on the page behind it
      if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1')
      panel.focus({ preventScroll: true })
    }

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const nodes = items()
      if (nodes.length === 0) return
      const head = nodes[0]
      const tail = nodes[nodes.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === head || !panel.contains(active))) {
        event.preventDefault()
        tail.focus({ preventScroll: true })
      } else if (!event.shiftKey && (active === tail || !panel.contains(active))) {
        event.preventDefault()
        head.focus({ preventScroll: true })
      }
    }

    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      const target = opener.current
      opener.current = null
      if (target?.isConnected) target.focus({ preventScroll: true })
    }
  }, [open, panelRef])
}
