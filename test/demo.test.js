import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, createElement } from "react"
import { createRoot } from "react-dom/client"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// The demo renders <geora-globe>, which owns a scene: replace the scene with a
// recording stub so the test runs without WebGL, and stub the synthesizer so
// it runs without an audio stack.
vi.mock("../src/core/GlobeScene.js", async () => {
  const { makeScene } = await import("./helpers.js")
  const scenes = []
  return {
    __scenes: scenes,
    createGlobeScene(args) {
      const scene = makeScene()
      scene.args = args
      scenes.push(scene)
      return scene
    },
  }
})

vi.mock("tone", () => {
  class Node {
    constructor() {
      this.volume = { value: 0, rampTo() {} }
    }
    toDestination() {
      return this
    }
    connect() {
      return this
    }
    triggerAttackRelease() {}
    dispose() {}
  }
  return { start() {}, now: () => 0, Gain: Node, Synth: Node, PolySynth: Node }
})

import { __scenes } from "../src/core/GlobeScene.js"
import { defaultCountries } from "geora-globe"
import Geora from "../demo/src/geora/Geora.jsx"

const PREFS = "geora:prefs:v3"

function seedPrefs() {
  localStorage.setItem(
    PREFS,
    JSON.stringify({
      theme: "dark",
      halftone: { threshold: 0.42 },
      profile: { globeScale: 0.9, motion: false },
      sound: true,
    }),
  )
}

let container
let root

function globe() {
  return container.querySelector("geora-globe")
}

beforeEach(() => {
  __scenes.length = 0
  localStorage.clear()
  seedPrefs()
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(createElement(Geora))
  })
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  localStorage.clear()
})

describe("demo consuming geora-globe", () => {
  it("mounts one configured element", () => {
    const el = globe()
    expect(el).not.toBeNull()
    expect(__scenes).toHaveLength(1)
    expect(el.minimal).toBe(true)
    expect(el.flagBase).toBe("flags")
    // persisted demo preferences reach the element
    expect(el.theme).toBe("dark")
    expect(el.globeScale).toBe(0.9)
    expect(el.threshold).toBe(0.42)
    expect(el.motion).toBe(false)
    // landmark data joins with the demo photo directory
    expect(el.data.landmarks.length).toBeGreaterThan(40)
    expect(el.data.landmarks[0].image).toMatch(/^landmarks\//)
    // no marker data: the marker layer stays out of the rotation
    expect(el.modes).toEqual(["country", "polaroid", "analytics", "centers"])
  })

  it("renders the demo HUD around the element", () => {
    expect(container.querySelector('[aria-label="Globe layers navigation"]')).not.toBeNull()
    expect(container.querySelector('[aria-label="Reset globe view"]')).not.toBeNull()
    expect(container.querySelector('[aria-label="Hide interface"]')).not.toBeNull()
    expect(container.querySelector('[aria-label="Open documentation"]')).not.toBeNull()
  })

  it("opens and closes the demo info card from package events", () => {
    const el = globe()
    const country = defaultCountries[0]

    act(() => {
      el.dispatchEvent(new CustomEvent("geora-select", {
        detail: { marker: { kind: "country", country }, x: 12, y: 34 },
      }))
    })
    const card = container.querySelector("[data-info-card]")
    expect(card).not.toBeNull()
    expect(card.textContent).toContain(country.country)

    act(() => {
      el.dispatchEvent(new CustomEvent("geora-clear", { detail: {} }))
    })
    expect(container.querySelector("[data-info-card]")).toBeNull()
  })

  it("steps modes from the demo navigation", () => {
    const el = globe()
    const nav = container.querySelector('[aria-label="Globe layers navigation"]')
    act(() => {
      nav.querySelector('[aria-label="Next layer"]').click()
    })
    expect(el.mode).toBe("polaroid")
    expect(nav.textContent).toContain("POLAROIDS")
  })

  it("hides and restores the HUD from the eye button and the H key", () => {
    act(() => {
      container.querySelector('[aria-label="Hide interface"]').click()
    })
    expect(container.querySelector('[aria-label="Open documentation"]')).toBeNull()
    expect(container.querySelector('[aria-label="Globe layers navigation"]')).toBeNull()
    expect(container.querySelector('[aria-label="Show interface"]')).not.toBeNull()

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "h", bubbles: true, cancelable: true }))
    })
    expect(container.querySelector('[aria-label="Globe layers navigation"]')).not.toBeNull()
  })
})
