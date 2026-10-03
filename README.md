# Geora

A framework-agnostic 3D halftone globe for the web: tens of thousands of
shader-lit points forming a planet you can rotate, zoom and inspect, with a
flag beacon pinned to every nation.

```html
<geora-globe theme="paper" mode="country" auto-rotate></geora-globe>
```

No React, no Tailwind, no build step. Flags ship with the package. Styles are
isolated in the shadow DOM, and `three`, `d3-geo` and `topojson-client` are
bundled, so there are no peer dependencies to install.

## Install

```bash
npm install geora-globe
```

Ships ESM, CJS and TypeScript declarations. The tarball is â‰ˆ 1.8 MB; the ESM
bundle is â‰ˆ 962 kB (â‰ˆ 264 kB gzipped), most of which is Three.js and the
bundled flag artwork.

## Plain HTML

No bundler, no import map:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/geora-globe@0.3.0/+esm"></script>
```

From npm with an import map, when you want the pinned version:

```html
<script type="importmap">
  { "imports": { "geora-globe": "/node_modules/geora-globe/dist/index.js" } }
</script>
<script type="module">
  import "geora-globe"
</script>
```

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="https://cdn.jsdelivr.net/npm/geora-globe@0.3.0/+esm"></script>
    <style>html, body { margin: 0; height: 100% }</style>
  </head>
  <body>
    <geora-globe theme="dark" mode="country" auto-rotate></geora-globe>
  </body>
</html>
```

Importing the package registers `<geora-globe>`. The element fills its parent,
so give it â€” or an ancestor â€” a size. `minimal` renders the globe alone: no
controls, no navigation, no tooltip or card. Drop it, or trim the HUD piece by
piece with `show-*`.

The stylesheet is injected into the shadow root automatically. You only need it
if you want to read or override it:

```js
import "geora-globe/styles.css"
```

## Frameworks

The element is a normal DOM node. There is no framework-specific package and no
wrapper component â€” bind a reference and listen to events.

One thing to know: `geora-ready` is emitted the moment the element connects,
which is *before* React's `useEffect`, Vue's `onMount` and Svelte's `onMount`
run. A `geora-ready` listener attached there still gets called â€” the event is
replayed â€” but `whenReady()` is the race-free way to continue afterwards.

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
  <geora-globe ref="el" theme="dark" mode="country" flag-base="./flags" style="height: 100vh" />
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

## Attributes

Every attribute has a camelCase property (`flag-base` â†’ `flagBase`). Booleans
are value-aware: present means true, `"false"`, `"0"` and `"off"` mean false.

| Attribute | Default | What it does |
| --- | --- | --- |
| `theme` | `paper` | Globe palette; the page background never changes |
| `mode` | `country` | Active layer |
| `modes` | auto | Comma-separated subset to rotate through |
| `auto-rotate` | `true` | Spin the globe |
| `motion` | `auto` | `auto` follows `prefers-reduced-motion` |
| `minimal` | `false` | Hide the built-in HUD â†’ only the globe |
| `show-hud` | `true` | Master switch for the HUD |
| `show-tooltip` | `true` | Hover tooltip |
| `show-info-card` | `true` | Selection card |
| `show-controls` | `true` | Reset and spin buttons |
| `show-navigation` | `true` | Layer stepper |
| `show-settings` | `false` | Settings panel and its toggle |
| `show-markers` | `true` | Beacons, flags and values |
| `show-borders` | `true` | Country outlines |
| `flag-base` | bundled | Your own flags as `${flag-base}/${iso2}.png` |
| `globe-scale` | `0.7` | Globe size multiplier |
| `marker-scale` | `0.75` | Marker size multiplier |
| `detail` | `2` | Dot density, `0`â€“`2` |
| `animation` | `1` | Animation intensity |
| `halftone-density` | `1` | Shader calibration |
| `halftone-scale` | `1` | Shader calibration |
| `contrast` | `1` | Shader calibration |
| `threshold` | `0.4` | Shader calibration |
| `intensity` | `1` | Shader calibration |
| `ambient` | `0.2` | Shader calibration |
| `ocean-opacity` | `1` | Shader calibration |
| `persistence` | `false` | Store preferences in `localStorage` |

## Properties and methods

The element mirrors the engine, so these work on `<geora-globe>` and on a
headless `GeoraGlobe` alike.

```js
globe.theme = 'dark'                      // key or custom colour object
globe.halftone = { density: 0.8 }         // partial merge
globe.data = { countries, centers, markers, landmarks }   // partial ok
globe.setData({ markers: [{ id: 'hq', name: 'HQ', lat: 14.6, lon: 121 }] })

globe.selectCountry('PHL')   // true when found
globe.clearSelection()
globe.selection              // selected public marker, or null
globe.settings               // read-only snapshot of effective settings

globe.flyTo(48.85, 2.35)
globe.rotate(36, 0)
globe.zoom(-0.5)
globe.reset()

globe.start(); globe.stop(); globe.destroy()
```

Readiness, for framework mount hooks:

```js
globe.ready          // boolean
await globe.whenReady()
```

## Events

All bubble and cross shadow boundaries, so listen on the element or any ancestor.

| Event | Detail |
| --- | --- |
| `geora-ready` | `{}` |
| `geora-hover` | `{ marker, x, y }` (`marker: null` when it leaves) |
| `geora-select` | `{ marker, x, y }` |
| `geora-country-select` | `{ country, x, y }` |
| `geora-marker-select` | `{ marker, x, y }` |
| `geora-sphere-select` | `{ lat, lon, onLand, country, distanceKm, x, y }` |
| `geora-clear` | `{}` â€” also fired on mode change |
| `geora-mode-change` | `{ mode, modes }` |
| `geora-theme-change` | `{ theme, key }` â€” `background` is advisory |
| `geora-reset` | `{}` |

Markers are plain data:

```js
{ kind: 'country', country }
{ kind: 'center', center, country }
{ kind: 'analytics', country, row }
{ kind: 'polaroid', landmark }
{ kind: 'marker', marker }
```

## Data

Everything comes through `data` / `setData()`. Defaults ship with the package â€”
50 countries, 73 AI centres, 50 landmarks â€” and are entirely optional.

| Collection | Fields |
| --- | --- |
| `countries` | `code` (ISO alpha-3), `iso2`, `country`, `name`, `lat`, `lon`, `region`, `pop`, `tz`, `curr`, `fact` |
| `centers` | `id`, `name`, `operator`, `code`, `lat`, `lon`, `status`, `powerGW`, `tier`, `focus` |
| `markers` | `id`, `name`, `lat`, `lon`, `type` |
| `landmarks` | `iso2`, `country`, `caption`, `lat`, `lon`, `image` |

`code`, `lat` and `lon` are required on a country.

```js
import { GeoraGlobe, defaultCountries } from 'geora-globe'

new GeoraGlobe({
  container: document.getElementById('stage'),
  data: {
    countries: [
      { code: 'PHL', iso2: 'ph', country: 'Philippines', lat: 12.87, lon: 121.77 },
    ],
    markers: [{ id: 'hq', name: 'Manila', lat: 14.6, lon: 121.0 }],
  },
})
```

## Assets

**Flags** are bundled, so beacons show real flags with no configuration. To use
your own, point `flag-base` at a directory holding `${iso2}.png` and
`${iso2}@2x.png`:

```html
<geora-globe flag-base="./assets/flags"></geora-globe>
```

Prefer a relative base. It resolves against the page, so it keeps working when
the app is deployed under a sub-path; a leading `/` pins it to the domain root.

Any ISO alpha-2 code without a file falls back to a code chip. The bundled URLs
are also available directly, which is useful when you want a flag outside the
globe:

```js
import { bundledFlag, bundledFlagCodes } from 'geora-globe'

document.querySelector('img').src = bundledFlag('ph', true)
bundledFlagCodes()  // ['ae', 'ar', …] — the 50 codes that ship
```

**Landmark photographs** do not ship with the package — they are 15 MB of
imagery. The `polaroid` mode still works without them, drawing a paper card
labelled with the country. To add photos, give each landmark an `image`:

```js
import { joinLandmarks } from 'geora-globe'

new GeoraGlobe({
  container: document.getElementById('stage'),
  mode: 'polaroid',
  data: { landmarks: joinLandmarks(defaultCountries, './assets/landmarks') },
})
```

`joinLandmarks(places, base)` sets `image = ${base}/${iso2}.jpg`; any URL works,
so set `image` per entry instead if your files are named differently. A photo
that fails to load falls back to the card placeholder and logs one warning
naming the URL. Photos are drawn into a canvas, so they must be served
CORS-readable — `crossorigin="anonymous"` is requested for you, which means a
cross-origin host has to send `Access-Control-Allow-Origin`.

## Themes and modes

| Theme | Label | | Mode | Shows |
| --- | --- | --- | --- | --- |
| `paper` | PAPER WHITE | | `country` | beacon + flag per nation |
| `dark` | INK BLACK | | `polaroid` | one photograph per landmark |
| `amber` | AMBER SCREEN | | `analytics` | modeled telemetry (labelled) |
| `matrix` | PHOSPHOR GREEN | | `centers` | announced AI centres |
| `blueprint` | BLUEPRINT GRID | | `markers` | host markers (needs data) |
| `dusk` | DUSK VIOLET | | | |

`analytics` mode visualizes **modeled** telemetry â€” deterministic values
generated from each country's coordinates and population, not measurements.
They are for demos and layout, not analysis.

A theme recolours the globe only; the stage stays on its default paper white.
Custom themes are plain objects (`{ background, globe, foreground, accent,
border }`) with missing colours falling back. Apply `background` yourself
through `--geora-stage-bg` if you want full-page theming.

## Headless

`GeoraGlobe` is the same engine with no attributes and no built-in HUD, for
hosts that build their own interface:

```js
import { GeoraGlobe, registerGeoraGlobe } from 'geora-globe'

const globe = new GeoraGlobe({
  container: document.getElementById('stage'),
  theme: 'dark',
})

registerGeoraGlobe('my-globe')   // <my-globe></my-globe>
```

It imports safely on a server: `registerGeoraGlobe()` is a no-op without a DOM,
and the element simply never upgrades there.

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
} from 'geora-globe'
```

## Performance, accessibility, styling

- `detail` is the main lever (`0`â€“`2`). `animation: 0` keeps it static but
  interactive; `motion="off"` freezes spin, pulses and inertia.
- The renderer pauses on disconnect and releases everything on `destroy()`.
- Focusable, `role="application"`, polite live region, and full keyboard
  control: arrows rotate, `+`/`-` zoom, `Home` resets, `1`â€“`9` jump to a layer,
  `Escape` clears.
- Custom properties: `--geora-stage-bg`, `--geora-accent`, `--geora-panel`,
  `--geora-panel-border`, `--geora-text`, `--geora-text-dim`, `--geora-font`,
  `--geora-shadow`, `--geora-radius`.

## Credits

Natural Earth via [world-atlas](https://github.com/topojson/world-atlas), flags
via [flagcdn](https://flagcdn.com), landmark photographs from Wikipedia (CC
BY-SA or public domain) and used in the demo only.

## License

MIT Â© Lei Gabriel