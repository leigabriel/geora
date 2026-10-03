# Geora

A framework-agnostic 3D halftone globe for the web: tens of thousands of
shader-lit points forming a planet you can rotate, zoom and inspect, with a
flag beacon pinned to every nation.

<img src="public/globe.png" alt="The Geora globe with flag beacons pinned to every nation" width="1200" />

`geora-globe` is a **reusable Web Component and headless engine**. It draws a
globe — renderer, camera, layers, markers, interaction — and nothing else. No
React, no Tailwind, no build step: `three`, `d3-geo` and `topojson-client` are
bundled, so there are no peer dependencies to install, and every style lives in
the element's shadow root.

The repository also contains a React **demo application** under `demo/`. That
demo is not published to npm; it is one host building its own interface on top
of the package. See [The package and the demo](#the-package-and-the-demo).

For a task-by-task walkthrough — every attribute, property, method and event,
how to rebuild a tooltip and card, and the 0.3.0 → 0.4.0 migration — see
[HOWTO.md](./HOWTO.md).

---

## Contents

- [How-to guide](./HOWTO.md) — full attribute/event reference and recipes
- [What is Geora?](#what-is-geora)
- [Quick start](#quick-start)
- [`<geora-globe>`](#geora-globe)
- [API](#api)
- [Events](#events)
- [Data](#data)
- [Themes](#themes)
- [Modes](#modes)
- [Customization](#customization)
- [Framework integration](#framework-integration)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [The package and the demo](#the-package-and-the-demo)

## What is Geora?

Geora renders a planet as a halftone point cloud: a world map is rasterised
once, sampled into roughly 65,000 points on a Fibonacci sphere, and drawn
through a shader that answers to a handful of calibration values. Layers —
flag beacons, landmark photographs, modeled telemetry, AI campuses, your own
markers — sit on top of it and are picked with a raycast.

Two entry points, same engine:

| Import | What you get |
| --- | --- |
| `import "geora-globe"` | registers `<geora-globe>`, a custom element |
| `import { GeoraGlobe } from "geora-globe"` | the engine on its own, attached to any container |

Both are the same code. The element adds attributes, lifecycle and
accessibility; the class adds nothing but a constructor.

## Quick start

```bash
npm install geora-globe
```

```html
<geora-globe theme="paper" mode="country" auto-rotate></geora-globe>
```

Importing the package registers the element. It fills its parent, so give it —
or an ancestor — a size. The stylesheet is injected into the shadow root for
you; import it only if you want to read or override it:

```js
import "geora-globe/styles.css"
```

No bundler, no import map:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/geora-globe@0.4.0/+esm"></script>
```

A complete page:

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="https://cdn.jsdelivr.net/npm/geora-globe@0.4.0/+esm"></script>
    <style>html, body { margin: 0; height: 100% }</style>
  </head>
  <body>
    <geora-globe theme="dark" mode="country" auto-rotate></geora-globe>
  </body>
</html>
```

From npm with an import map, when you want the version pinned by your
`package.json`:

```html
<script type="importmap">
  { "imports": { "geora-globe": "/node_modules/geora-globe/dist/index.js" } }
</script>
<script type="module">
  import "geora-globe"
</script>
```

**Published size** — the tarball is 1.9 MB and contains ten
files: `dist/`, `README.md`, `LICENSE` and `package.json`. The ESM bundle is
964 kB (259 kB gzipped), the CJS bundle 784 kB (242 kB gzipped), the
declarations 10 kB and the stylesheet 1.4 kB. Most of the weight is Three.js,
the bundled flag artwork and the world topology.

## `<geora-globe>`

Every attribute has a camelCase property (`flag-base` → `flagBase`) and is
observed after connection, so you can change it at any time. Booleans are
value-aware: present means true, `"false"`, `"0"` and `"off"` mean false.

| Attribute | Default | What it does |
| --- | --- | --- |
| `theme` | `paper` | Globe palette; the page background never changes |
| `mode` | `country` | Active layer |
| `modes` | auto | Comma-separated subset to rotate through |
| `auto-rotate` | `true` | Spin the globe (property: `spinning`) |
| `motion` | `auto` | `auto` follows `prefers-reduced-motion`, `on` / `off` override it |
| `show-markers` | `true` | Beacons, flags and values |
| `show-borders` | `true` | Country outlines |
| `flag-base` | bundled | Your own flags as `${flag-base}/${iso2}.png` |
| `globe-scale` | `0.7` | Globe size multiplier |
| `marker-scale` | `0.75` | Marker size multiplier |
| `detail` | `2` | Point-cloud density, `0`–`2` |
| `animation` | `1` | Animation intensity |
| `halftone-density` | `1` | Shader calibration |
| `halftone-scale` | `1` | Shader calibration |
| `contrast` | `1` | Shader calibration |
| `threshold` | `0.4` | Shader calibration |
| `intensity` | `1` | Shader calibration |
| `ambient` | `0.2` | Shader calibration |
| `ocean-opacity` | `1` | Shader calibration |
| `persistence` | `false` | Store preferences in `localStorage` |

### What the element does not contain

The element renders a canvas and a visually hidden live region. That is the
whole shadow root.

There is **no tooltip, no info card, no control bar, no layer navigation and
no settings panel** — and therefore no `minimal` or `show-*` switch to turn
them off. Those switches existed on earlier builds to trim an interface the
element has since stopped drawing; they are ignored now. Every piece of
interface belongs to the host, built from the [events](#events) and the
[imperative API](#api).

The canvas host is exposed as a shadow part, so a host can style the backdrop
without reaching inside:

```css
geora-globe::part(stage) { background: #0b0d10 }
```

## API

The element mirrors the engine, so these work on `<geora-globe>` and on a
headless `GeoraGlobe` alike.

### Properties

```js
globe.theme = "dark"          // key or a custom colour object
globe.mode = "analytics"
globe.modes = ["country", "centers"]
globe.spinning = false        // alias: autoRotate
globe.motion = false          // true | false | "auto"
globe.detail = 1
globe.globeScale = 0.9
globe.markerScale = 1
globe.animation = 0
globe.showBorders = false
globe.showMarkers = false
globe.halftone = { density: 0.8 }   // partial merge
globe.halftoneDensity = 0.8         // single value, same effect

globe.data = { countries, centers, markers, landmarks }   // partial ok
globe.selection                     // selected public marker, or null
globe.settings                      // read-only snapshot of effective settings
globe.ready                         // boolean
```

### Methods

```js
globe.setData({ markers: [{ id: "hq", name: "HQ", lat: 14.6, lon: 121 }] })
globe.selectCountry("PHL")          // true when found, by alpha-3 or alpha-2
globe.clearSelection()              // true if something was selected

globe.flyTo(48.85, 2.35)
globe.rotate(36, 0)                 // keyboard equivalent of a drag
globe.zoom(-0.5)                    // keyboard equivalent of a wheel
globe.reset()

globe.start()
globe.stop()
globe.destroy()

await globe.whenReady()             // resolves with the globe (or element)
```

## Events

All events bubble and cross shadow boundaries, so listen on the element or any
ancestor. Every one of them is enough to build an interface from — that is the
contract.

| Event | Detail |
| --- | --- |
| `geora-ready` | `{}` |
| `geora-hover` | `{ marker, x, y }` (`marker: null` when it leaves) |
| `geora-select` | `{ marker, x, y }` |
| `geora-country-select` | `{ country, x, y }` |
| `geora-marker-select` | `{ marker, x, y }` |
| `geora-sphere-select` | `{ lat, lon, onLand, country, distanceKm, x, y }` |
| `geora-clear` | `{}` — also fired on mode change |
| `geora-mode-change` | `{ mode, modes }` |
| `geora-theme-change` | `{ theme, key }` — `background` is advisory |
| `geora-reset` | `{}` |

`marker` is plain data, never an engine object:

```js
{ kind: "country",   country }
{ kind: "center",    center, country }
{ kind: "analytics", country, row }
{ kind: "polaroid",  landmark }
{ kind: "marker",    marker }
```

`x` and `y` are client coordinates, so a tooltip can be positioned from the
event alone:

```js
el.addEventListener("geora-hover", ({ detail }) => {
  if (!detail.marker) return hideTooltip()
  showTooltip(detail.marker, detail.x, detail.y)
})
el.addEventListener("geora-select", ({ detail }) => showCard(detail.marker))
el.addEventListener("geora-clear", () => showCard(null))
```

## Data

Everything comes through `data` / `setData()`. Defaults ship with the package
— 50 countries, 73 AI campuses, 50 landmarks — and are entirely optional.

| Collection | Fields |
| --- | --- |
| `countries` | `code` (ISO alpha-3), `iso2`, `country`, `capital`, `lat`, `lon`, `region`, `pop`, `tz`, `curr`, `fact` |
| `centers` | `id`, `name`, `operator`, `code`, `lat`, `lon`, `status`, `powerGW`, `tier`, `focus` |
| `markers` | `id`, `name`, `lat`, `lon`, `type` |
| `landmarks` | `iso2`, `country`, `caption`, `lat`, `lon`, `image` |

`code`, `lat` and `lon` are required on a country. `country` is the nation's
name, `capital` is its capital city — they are separate fields because they
are separate facts.

```js
import { GeoraGlobe } from "geora-globe"

new GeoraGlobe({
  container: document.getElementById("stage"),
  data: {
    countries: [
      { code: "PHL", iso2: "ph", country: "Philippines", capital: "Manila", lat: 14.6, lon: 121.0 },
    ],
    markers: [{ id: "hq", name: "Manila", lat: 14.6, lon: 121.0 }],
  },
})
```

**Provenance.** The datasets are curated reference snapshots, not live feeds:
countries were compiled in September 2026 (`pop` is a rounded magnitude such as
`"125M"`, not an official statistic), the AI campus list was added 30 September
2026 from public operator announcements (`powerGW` is the announced figure only,
never an estimate), and landmark coordinates were added 2 October 2026 from the
matching Wikipedia articles. Each file states this at the top. The globe's
surface geometry is separate: Natural Earth 110m through `world-atlas`.

`analytics` mode visualizes **modeled** telemetry — deterministic values
generated from population, timezone and a hash of the country code. They are
labelled as modeled wherever they are shown, and are for layout and demos, not
analysis.

## Themes

| Theme | Label |
| --- | --- |
| `paper` | PAPER WHITE |
| `dark` | INK BLACK |
| `amber` | AMBER SCREEN |
| `matrix` | PHOSPHOR GREEN |
| `blueprint` | BLUEPRINT GRID |
| `dusk` | DUSK VIOLET |

A theme recolours the globe only; the stage keeps its own background. Custom
themes are plain objects (`{ background, globe, foreground, accent, border }`)
with missing colours falling back:

```js
globe.theme = { background: "#102030", accent: "#c6fe69" }
```

`geora-theme-change` carries the resolved colours, so a host can apply
`background` itself through `--geora-stage-bg` for full-page theming.

## Modes

`modes` narrows what the layer stepper cycles through; an invalid list is
ignored rather than emptied. Supplying markers adds `markers` to the automatic
list, so the layer never appears empty.

```js
el.modes = "country, analytics"     // attribute
globe.modes = ["country", "polaroid"] // property
```

| Mode | Label | Shows |
| --- | --- | --- |
| `country` | COUNTRIES | one flag beacon per nation |
| `polaroid` | POLAROIDS | one landmark photograph per nation |
| `analytics` | ANALYTICS | modeled telemetry, labelled as such |
| `centers` | AI DATA CENTERS | announced AI compute campuses |
| `markers` | MARKERS | markers supplied by the host |

Each mode has a name and a one-line description you can render yourself:

```js
import { modeMeta, MODES } from "geora-globe"

modeMeta("analytics")
// { key, label: "ANALYTICS", icon, hint: "Modeled telemetry per nation" }
```

## Customization

### Halftone calibration

```js
globe.halftone = { density: 1.2, scale: 0.9, contrast: 1.1, threshold: 0.35, intensity: 1, ocean: 0.8, ambient: 0.25 }
```

| Key | Attribute | Effect |
| --- | --- | --- |
| `density` | `halftone-density` | how tightly the dots pack |
| `scale` | `halftone-scale` | dot size |
| `contrast` | `contrast` | edge hardness |
| `threshold` | `threshold` | where a dot appears at all |
| `intensity` | `intensity` | brightness of the lit side |
| `ambient` | `ambient` | light on the dark side |
| `ocean` | `ocean-opacity` | opacity of the water dots |

### Flags

Flags ship with the package, so beacons show real flags with no
configuration. To use your own, point `flag-base` at a directory holding
`${iso2}.png` and `${iso2}@2x.png`:

```html
<geora-globe flag-base="./assets/flags"></geora-globe>
```

Prefer a relative base. It resolves against the page, so it keeps working when
the app is deployed under a sub-path; a leading `/` pins it to the domain root.
Any ISO alpha-2 code without a file falls back to a code chip.

The bundled URLs are also available directly:

```js
import { bundledFlag, bundledFlagCodes } from "geora-globe"

document.querySelector("img").src = bundledFlag("ph", true)
bundledFlagCodes()  // ["ae", "ar", …] — the 50 codes that ship
```

### Landmark photographs

Landmark photographs do not ship with the package — they are 15 MB of imagery.
`polaroid` mode still works without them, drawing a paper card labelled with
the country. To add photos, give each landmark an `image`:

```js
import { joinLandmarks, defaultCountries } from "geora-globe"

new GeoraGlobe({
  container: document.getElementById("stage"),
  mode: "polaroid",
  data: { landmarks: joinLandmarks(defaultCountries, "./assets/landmarks") },
})
```

`joinLandmarks(places, base)` sets `image = ${base}/${iso2}.jpg`; any URL
works, so set `image` per entry instead if your files are named differently. A
photo that fails to load falls back to the placeholder and logs one warning
naming the URL. Photos are drawn into a canvas, so they must be served
CORS-readable — `crossorigin="anonymous"` is requested for you, which means a
cross-origin host has to send `Access-Control-Allow-Origin`.

### Styling

The package emits no global CSS. Custom properties resolve on the host and
inherited into the shadow root:

| Custom property | Use |
| --- | --- |
| `--geora-stage-bg` | Canvas backdrop behind the globe (themes never change it) |
| `--geora-accent` | Focus ring on the globe |

```css
geora-globe { --geora-accent: #c6fe69; --geora-stage-bg: #0b0d10 }
```

### Building your own interface

The package is deliberately headless: a host that wants a tooltip, a card or a
control bar owns the markup, the styles and the accessibility of that
interface, and drives it from the events. The demo application is a full
worked example — tooltip, info card, layer navigation, controls, settings and
docs — in `demo/src/geora/`.

## Framework integration

The element is a normal DOM node. There is no framework-specific package and
no wrapper component — bind a reference and listen to events.

One thing to know: `geora-ready` is emitted the moment the element connects,
which is *before* React's `useEffect`, Vue's `onMounted` and Svelte's
`onMount` run. A `geora-ready` listener attached there still gets called — the
event is replayed — but `whenReady()` is the race-free way to continue
afterwards.

### React

```jsx
import { useEffect, useRef } from "react"
import "geora-globe"

export function Globe() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const onSelect = ({ detail }) => console.log(detail.marker.country?.country)

    el.addEventListener("geora-select", onSelect)
    el.whenReady().then(() => console.log("ready, mode:", el.settings.mode))
    return () => el.removeEventListener("geora-select", onSelect)
  }, [])

  return <geora-globe ref={ref} theme="dark" mode="country" style={{ height: "100vh" }} />
}
```

In JSX, unknown attributes are passed through as attributes, so `flag-base` and
`auto-rotate` work as written. For non-string values use properties:

```jsx
<geora-globe ref={ref} globeScale={0.9} detail={1} />
```

### Vue

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import "geora-globe"

const el = ref(null)
const onSelect = (e) => console.log(e.detail.marker)

onMounted(() => {
  el.value.addEventListener("geora-select", onSelect)
  el.value.whenReady().then(() => console.log("ready"))
})
onBeforeUnmount(() => el.value?.removeEventListener("geora-select", onSelect))
</script>

<template>
  <geora-globe ref="el" theme="dark" mode="country" style="height: 100vh" />
</template>
```

### Svelte

```svelte
<script>
  import { onMount } from "svelte"
  import "geora-globe"

  let el
  const onSelect = (e) => console.log(e.detail.marker)

  onMount(() => {
    el.addEventListener("geora-select", onSelect)
    el.whenReady().then(() => console.log("ready"))
    return () => el.removeEventListener("geora-select", onSelect)
  })
</script>

<geora-globe bind:this={el} theme="dark" mode="country" style="height: 100vh" />
```

### Headless

`GeoraGlobe` is the same engine with no attributes and no element, for hosts
that build their own interface:

```js
import { GeoraGlobe, registerGeoraGlobe } from "geora-globe"

const globe = new GeoraGlobe({
  container: document.getElementById("stage"),
  theme: "dark",
})

registerGeoraGlobe("my-globe")   // <my-globe></my-globe>
```

It imports safely on a server: `registerGeoraGlobe()` is a no-op without a
DOM, and the element simply never upgrades there.

## Performance

- **Bundle.** 964 kB ESM (259 kB gzipped), 784 kB CJS (242 kB gzipped),
  self-contained: `three`, `d3-geo` and `topojson-client` are inlined rather
  than declared, so nothing is fetched or resolved at runtime. The trade-off is
  that a host already shipping Three.js gets a second copy.
- **Density.** `detail` is the main lever, `0`–`2`; it maps to how much of the
  point cloud is drawn. Narrow viewports start with half the points (30,000
  against 65,000) and the pixel ratio is capped at 2× on creation and on every
  resize, so a high-DPI phone does not pay four times the fill rate.
- **Motion vs. rendering.** `animation: 0` scales auto-rotation to a standstill
  and holds the beacon pulse flat, so the globe reads as frozen while staying
  draggable; `motion="off"` goes further and cuts spin, pulses and drag inertia
  at the source. Neither stops the frame loop: it runs on
  `requestAnimationFrame` until `stop()` or disconnect, and re-renders every
  frame regardless of whether anything moved — so a visible globe costs a frame
  even when idle. Call `stop()` when a globe should simply hold an image, and
  `start()` again before interacting with it.
- **Teardown.** `destroy()` cancels the animation frame, removes the window
  and pointer listeners, disconnects the `ResizeObserver`, disposes every
  geometry and material, and releases the WebGL context immediately. That last
  step matters: browsers cap how many contexts may be alive at once, so a page
  that mounts and unmounts the globe repeatedly would otherwise exhaust them
  and start losing the contexts of globes still on screen.
- **Many globes.** Each instance owns its own renderer, scene and loop; there
  is no shared module state beyond the registered element.

Measured against the published tarball (`npm pack`), not the working tree.

## Accessibility

- **Focus.** The element takes `tabindex="0"`, `role="application"` and an
  `aria-label` of "Geora interactive globe" if you do not supply one. Clicking
  the canvas focuses it. The focus ring is drawn in `--geora-accent`.
- **Keyboard**, while focused: arrows rotate, `+` / `=` (or Page Up) zoom in,
  `-` / `_` (or Page Down) zoom out, `Home` resets,
  `1`–`9` jump to a layer, `Escape` clears the selection and returns focus.
  A key is `preventDefault()`ed only when the globe actually acted on it, so
  nothing else scrolls or types underneath it.
- **Announcements.** A polite live region inside the shadow root narrates what
  happened: `"Country: Philippines"`, `"AI data center: …"`, `"Photograph: …"`,
  `"Marker: …"`, `"Layer: POLAROIDS"`, `"Selection cleared"`. It is cleared when
  the element leaves the document.
- **Reduced motion.** `motion="auto"` follows `prefers-reduced-motion`
  throughout — spin, pulses and inertia all stop — and the preference is
  listened to, so flipping the OS setting takes effect live. `on` / `off`
  override it either way.
- **Pointer and touch.** The stage is `touch-action: none`, so a drag rotates
  the globe instead of scrolling the page; `pointerdown`, `pointermove`,
  `pointerup`, `pointercancel` and the touch events drive one path.
- **Meaningful text.** Selecting anywhere on the sphere emits
  `geora-sphere-select` with the nearest country, the distance and whether the
  point is on land, so a host can describe an empty ocean as precisely as a
  capital.

What the package does *not* do: it has no visible text of its own to give
contrast ratios or touch targets to. Those belong to the host's interface, and
are the host's to get right.

## The package and the demo

| | Published (`geora-globe`) | Demo (`demo/`) |
| --- | --- | --- |
| Contents | `dist/`, `README.md`, `LICENSE` | React app: tooltip, info card, nav, controls, settings, docs, photos, audio |
| Depends on | nothing | React, Tailwind, Vite |
| Installs from npm | yes | no |
| Contains UI | no — a canvas and a live region | yes |

The demo is the reference implementation of the interface the package declines
to ship. Run it with `npm run dev`; build it with `npm run build:demo`. It is
excluded from the tarball, as are `src/`, `test/` and `plan.md`.

## Exports

```js
import {
  GeoraGlobe, GeoraGlobeElement, registerGeoraGlobe,
  THEMES, THEME_KEYS, DEFAULT_THEME, nextTheme, themeHex,
  MODES, MODE_KEYS, modeMeta,
  defaultCountries, defaultCenters, CENTER_STATUSES,
  defaultLandmarks, joinLandmarks,
  METRICS, metricMeta,
  bundledFlag, bundledFlagCodes,
  DEFAULT_HALFTONE, DEFAULT_PROFILE,
} from "geora-globe"
```

Types ship as `dist/index.d.ts` and are wired to the `types` condition.

## Credits

Natural Earth via [world-atlas](https://github.com/topojson/world-atlas), flags
via [flagcdn](https://flagcdn.com), landmark photographs from Wikipedia (CC
BY-SA or public domain) and used in the demo only.

## License

MIT © Lei Gabriel
