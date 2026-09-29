import * as Tone from "tone"

// synthesized sfx, started on first user gesture
export function createAudio() {
  let master = null
  let swipe = null
  let chime = null
  let ui = null
  let enabled = false
  let lastSwipe = 0
  let lastBlip = 0
  let lastHover = 0

  function init() {
    if (master) return
    try {
      Tone.start()
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
    } catch {
      master = null
    }
  }

  function setEnabled(value) {
    if (value) init()
    enabled = Boolean(value && master)
    return enabled
  }

  // speed is the drag velocity, roughly 0 to 1
  function swipeSound(speed = 0) {
    if (!enabled || !swipe) return
    const now = performance.now()
    const level = Math.min(1, Math.max(0, speed))
    if (now - lastSwipe < 130 - level * 70) return
    lastSwipe = now
    swipe.volume.rampTo(-32 + level * 14, 0.02)
    swipe.triggerAttackRelease(420 + level * level * 900, "64n")
  }

  // low thunk when the drag is released
  function swipeStop() {
    if (!enabled || !swipe) return
    swipe.volume.rampTo(-28, 0.02)
    swipe.triggerAttackRelease(190, "16n")
  }

  function selectChime() {
    if (!enabled || !chime) return
    const now = Tone.now()
    chime.triggerAttackRelease(["E5", "B5"], "16n", now)
    chime.triggerAttackRelease(["G#5", "E6"], "16n", now + 0.08)
  }

  function hoverBlip() {
    if (!enabled || !ui) return
    const now = performance.now()
    if (now - lastHover < 90) return
    lastHover = now
    ui.triggerAttackRelease("C6", "64n")
  }

  function closeBlip() {
    if (!enabled || !ui) return
    ui.triggerAttackRelease("A4", "32n")
  }

  function pip(note = "C6") {
    if (!enabled || !ui) return
    const now = performance.now()
    if (now - lastBlip < 60) return
    lastBlip = now
    ui.triggerAttackRelease(note, "32n")
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
