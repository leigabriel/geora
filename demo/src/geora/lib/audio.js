import * as Tone from "tone"

// Synthesized sfx. Browsers only allow audio after a user gesture, so nothing
// is built or scheduled until the first real interaction: the context is created
// lazily on that gesture and resumed again whenever it is suspended. Triggers
// made while audio is still off are dropped rather than queued, so the first
// tap never dumps a burst of stacked notes the moment sound switches on.
export function createAudio() {
  let master = null
  let swipe = null
  let chime = null
  let ui = null
  let enabled = false
  let gesturesBound = false
  let lastSwipe = 0
  let lastBlip = 0
  let lastHover = 0
  let lastAt = 0

  const isRunning = () => {
    try {
      return Tone.getContext().state === "running"
    } catch {
      return false
    }
  }

  // every trigger goes through here: builds nothing, resumes nothing, and drops
  // the note unless audio is on and the context is actually running
  const ready = (node) => Boolean(enabled && node && isRunning())

  function build() {
    if (master) return true
    try {
      master = new Tone.Gain(1).toDestination()

      // swipe: a pitched ratchet, louder and brighter the faster you drag
      swipe = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.001, decay: 0.055, sustain: 0, release: 0.02 },
      }).connect(master)
      swipe.volume.value = -26

      chime = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.004, decay: 0.3, sustain: 0.03, release: 0.4 },
      }).connect(master)
      chime.volume.value = -7

      ui = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.002, decay: 0.07, sustain: 0, release: 0.05 },
      }).connect(master)
      ui.volume.value = -10
      return true
    } catch {
      master = null
      return false
    }
  }

  // the one place audio is allowed to start: inside a real gesture handler
  function onGesture() {
    if (!enabled || !build()) return
    // Tone.start() resolves a promise in the browser, but returns nothing in
    // environments without a real audio device
    const started = Tone.start()
    if (started && typeof started.catch === "function") started.catch(() => {})
  }

  function bindGestures() {
    if (gesturesBound) return
    gesturesBound = true
    const options = { capture: true, passive: true }
    for (const type of ["pointerdown", "touchstart", "keydown", "wheel"]) {
      window.addEventListener(type, onGesture, options)
    }
    // a backgrounded tab can suspend the context again
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) onGesture()
    })
  }

  function setEnabled(value) {
    enabled = Boolean(value)
    if (!enabled) return false
    bindGestures()
    onGesture()
    return true
  }

  // Tone throws if two notes are scheduled at the same context time, which
  // happens easily when a hover blip and a ui pip land in the same tick. Every
  // trigger goes through here so start times are always strictly increasing.
  function at(offset = 0) {
    const now = Tone.now()
    const base = now > lastAt ? now : lastAt
    lastAt = base + 0.004
    return base + offset
  }

  // speed is the drag velocity, roughly 0 to 1
  function swipeSound(speed = 0) {
    if (!ready(swipe)) return
    const now = performance.now()
    const level = Math.min(1, Math.max(0, speed))
    if (now - lastSwipe < 130 - level * 70) return
    lastSwipe = now
    swipe.volume.rampTo(-32 + level * 14, 0.02)
    swipe.triggerAttackRelease(420 + level * level * 900, "64n", at())
  }

  // low thunk when the drag is released
  function swipeStop() {
    if (!ready(swipe)) return
    swipe.volume.rampTo(-28, 0.02)
    swipe.triggerAttackRelease(190, "16n", at())
  }

  function selectChime() {
    if (!ready(chime)) return
    const start = at()
    chime.triggerAttackRelease(["E5", "B5"], "16n", start)
    chime.triggerAttackRelease(["G#5", "E6"], "16n", start + 0.08)
  }

  function hoverBlip() {
    if (!ready(ui)) return
    const now = performance.now()
    if (now - lastHover < 90) return
    lastHover = now
    ui.triggerAttackRelease("C6", "64n", at())
  }

  function closeBlip() {
    if (!ready(ui)) return
    ui.triggerAttackRelease("A4", "32n", at())
  }

  function pip(note = "C6") {
    if (!ready(ui)) return
    const now = performance.now()
    if (now - lastBlip < 60) return
    lastBlip = now
    ui.triggerAttackRelease(note, "32n", at())
  }

  function dispose() {
    try {
      swipe?.dispose()
      chime?.dispose()
      ui?.dispose()
      master?.dispose()
    } catch {
      // nothing to release
    }
    master = null
    swipe = null
    chime = null
    ui = null
  }

  return { setEnabled, isEnabled: () => enabled, swipe: swipeSound, swipeStop, selectChime, hoverBlip, closeBlip, pip, dispose }
}