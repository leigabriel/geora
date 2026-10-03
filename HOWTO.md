# How to use geora-globe

A hands-on guide to every attribute, property, method and event in
[`geora-globe`](https://www.npmjs.com/package/geora-globe), plus the parts that
trip people up. For the API summary and design rationale, see
[README.md](./README.md).

**Contents**

- [What you get](#what-you-get)
- [Install and load](#install-and-load)
- [Sixty-second start](#sixty-second-start)
- [Attribute reference](#attribute-reference)
- [How attribute values are parsed](#how-attribute-values-are-parsed)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Build your own tooltip and card](#build-your-own-tooltip-and-card)
- [Data](#data)
- [Themes](#themes)
- [Modes](#modes)
- [Styling](#styling)
- [Framework integration](#framework-integration)
- [Headless](#headless)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [Migrating from 0.3.0](#migrating-from-030)
- [Troubleshooting](#troubleshooting)
- [Exports](#exports)
- [Working on the repo](#working-on-the-repo)

## What you get

`geora-globe` is a **halftone globe**: a world map rasterised once, sampled into
roughly 65,000 points on a Fibonacci sphere, drawn through a shader you can
calibrate, with layers on top — flag beacons, landmark photographs, modeled
telemetry, AI campuses and your own markers.

Two entry points, one engine:

| You import | You get |
| --- | --- |
| `import 'geora-globe'` | registers `<geora-globe>`, a custom element |
| `import { GeoraGlobe } from 'geora-globe'` | the engine alone, attached to any container |

**What it deliberately does not ship:** tooltips, info cards, control bars,
layer navigation, settings panels, headers. As of **0.4.0** those were removed
from the package and live in the React demo instead. The element's entire
shadow root is a canvas plus a visually hidden live region:

```html
<div class="stage" part="stage">
  <div class="sr" role="status" data-live></div>
</div>
```

That is the deal: **the events are the contract, not the pixels.** Every
interface you want is built by you from `geora-hover`, `geora-select` and
friends. There is a complete worked example in
[Build your own tooltip and card](#build-your-own-tooltip-and-card), and a
fuller one in [`demo/src/geora/`](./demo/src/geora/).

Three.js, `d3-geo` and `topojson-client` are bundled, so there are no peer
dependencies to install.

## Install and load

**npm, with a bundler**

```bash
npm install geora-globe
```

```js
import 'geora-globe' // registers <geora-globe>
```

**Plain HTML, no bundler, no import map**

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/geora-globe@0.4.0/+esm"></script>
```

**Plain HTML with an import map**, when you want your lockfile to pick the
version:

```html
<script type="importmap">
  { "imports": { "geora-globe": "/node_modules/geora-globe/dist/index.js" } }
</script>
<script type="module">
  import 'geora-globe'
</script>
```

**Register a different tag name** if `<geora-globe>` collides with something:

```js
import { registerGeoraGlobe } from 'geora-globe'

registerGeoraGlobe('my-globe') // <my-globe></my-globe>
```

Importing is SSR-safe: `registerGeoraGlobe()` is a no-op without a DOM and the
element simply never upgrades on the server.

**Styles** are injected into the shadow root automatically. Import them
explicitly only if you want to read or override them:

```js
import 'geora-globe/styles.css'
```

## Sixty-second start

```html
<geora-globe theme="paper" mode="country" auto-rotate></geora-globe>
```

That is the whole markup. It renders the default dataset: 50 countries with
flag beacons, 73 AI campuses and 50 landmarks.

**Give it a size.** The element is `display: block; width: 100%; height: 100%`,
so it fills its parent. If the parent has no height, you get nothing:

```css
geora-globe { height: 100vh; }        /* or any explicit size */
```

Add a listener and you have a working app:

```js
const el = document.querySelector('geora-globe')

el.addEventListener('geora-select', ({ detail }) => {
  console.log(detail.marker.kind, detail.marker)
})
```

## Attribute reference

Every attribute has a camelCase property with the same meaning. Both are live:
change either at any time and the other side follows. See
[Properties](#properties) for the values that have no attribute.

### Layer and content

| Attribute | Property | Type | Default | What it does |
| --- | --- | --- | --- | --- |
| `theme` | `theme` | key or colour object | `paper` | Globe palette. A built-in key or `{ background, globe, foreground, accent, border }`; missing colours fall back. Never repaints your page. |
| `mode` | `mode` | mode key | `country` | Active layer: `country`, `polaroid`, `analytics`, `centers` or `markers`. |
| `modes` | `modes` | comma-separated keys | *(auto)* | Narrows what `mode` may be set to and what the host cycles through. Blank or absent = every mode the data supports. Invalid keys are ignored, never emptied. |
| `flag-base` | `flagBase` | string | *(bundled)* | Base path for **your** flags, resolved as `${flagBase}/${iso2}.png` plus an optional `@2x` variant. Leave unset to use the flags in the package. |

### Visibility

| Attribute | Property | Type | Default | What it does |
| --- | --- | --- | --- | --- |
| `show-markers` | `showMarkers` | boolean | `true` | Beacons, flags, photographs, values and host markers. `false` keeps the globe and hides every layer. |
| `show-borders` | `showBorders` | boolean | `true` | Country outlines in the dot cloud. |

### Motion

| Attribute | Property | Type | Default | What it does |
| --- | --- | --- | --- | --- |
| `auto-rotate` | `spinning` (alias `autoRotate`) | boolean | `true` | Spin the globe on its own. Dragging always works regardless. |
| `motion` | `motion` | `auto` \| boolean | `auto` | `auto` follows `prefers-reduced-motion` and keeps following it live; `on`/`true` forces animation on, `off`/`false` freezes spin, pulses and drag inertia. |

Note that `auto-rotate` and `motion` are different dials. With
`motion="auto"` on a system that asks for reduced motion, the globe stays still
even if `auto-rotate` is on — that is the preference being respected, not a
broken switch.

### Size and density

| Attribute | Property | Type | Default | What it does |
| --- | --- | --- | --- | --- |
| `globe-scale` | `globeScale` | number | `0.7` | Globe size multiplier inside the stage. Below ~1 leaves room for your own UI. |
| `marker-scale` | `markerScale` | number | `0.75` | Beacon / marker size multiplier. |
| `detail` | `detail` | `0` \| `1` \| `2` | `2` | Point-cloud density. The shader discards points above `density × detail`, so `0` drops roughly 30%, `2` keeps everything. **This is the main performance lever.** |
| `animation` | `animation` | number | `1` | Speed multiplier for auto-rotation and the beacon pulse. `0` = visually frozen but still fully draggable. |

### Halftone shader

All seven are numbers, and each is also a key in the `halftone` object
(`ocean-opacity` maps to `ocean` there).

| Attribute | Property | `halftone` key | Default | What it does |
| --- | --- | --- | --- | --- |
| `halftone-density` | `halftoneDensity` | `density` | `1.0` | How tightly the dots pack. Higher = more dots, busier. |
| `halftone-scale` | `halftoneScale` | `scale` | `1.0` | Size of an individual dot. |
| `contrast` | `contrast` | `contrast` | `1.0` | Edge hardness — how abruptly a dot turns on. |
| `threshold` | `threshold` | `threshold` | `0.4` | Where a dot appears at all. Raise it to thin the map out. |
| `intensity` | `intensity` | `intensity` | `1.0` | Brightness of the lit side. |
| `ambient` | `ambient` | `ambient` | `0.2` | Light reaching the dark side. `0` gives a hard terminator. |
| `ocean-opacity` | `oceanOpacity` | `ocean` | `1.0` | Opacity of water dots. `0` gives a clean silhouette. |

You can set all seven at once, which is nicer than seven attributes:

```html
<geora-globe halftone-density="1.2" threshold="0.35"></geora-globe>
```

```js
el.halftone = { density: 1.2, threshold: 0.35 } // partial merge, no clobbering
```

### Behaviour

| Attribute | Property | Type | Default | What it does |
| --- | --- | --- | --- | --- |
| `persistence` | `persistence` | boolean | `false` | Remember theme, motion and profile in `localStorage` under `geora-globe:prefs:v1`. Opt-in: nothing is stored until you set it. |

### Everything in one example

```html
<geora-globe
  theme="dark"
  mode="country"
  modes="country, analytics, centers"
  auto-rotate="true"
  motion="auto"
  show-borders="true"
  show-markers="true"
  globe-scale="0.85"
  marker-scale="1"
  detail="2"
  animation="1"
  halftone-density="1.1"
  halftone-scale="1"
  contrast="1.1"
  threshold="0.35"
  intensity="1.05"
  ambient="0.25"
  ocean-opacity="0.9"
></geora-globe>
```

## How attribute values are parsed

**Booleans are value-aware**, so you can write any of these:

```html
<geora-globe auto-rotate></geora-globe>        <!-- present, empty  -> true  -->
<geora-globe auto-rotate="true"></geora-globe>  <!--                -> true  -->
<geora-globe auto-rotate="false"></geora-globe> <!-- "false"        -> false -->
<geora-globe auto-rotate="off"></geora-globe>   <!-- "off"          -> false -->
<geora-globe auto-rotate="0"></geora-globe>     <!-- "0"            -> false -->
```

`"false"`, `"0"` and `"off"` are falsy; everything else — including an empty
value — is truthy. Trimming and case-folding happen first, so `" OFF"` works.

**`motion`** takes `auto`, or a boolean in the same value-aware form:

```html
<geora-globe motion="auto"></geora-globe>  <!-- follow the OS setting   -->
<geora-globe motion="on"></geora-globe>    <!-- force animation on      -->
<geora-globe motion="off"></geora-globe>   <!-- force animation off     -->
```

**`modes`** is a comma-separated list:

```html
<geora-globe modes="country, analytics"></geora-globe>
```

```js
el.modes = ['country', 'analytics'] // property form takes an array
```

**Numbers** fall back to the default when they cannot be parsed, so a typo
degrades instead of producing `NaN` geometry:

```html
<geora-globe detail="banana"></geora-globe> <!-- detail = 2 (default) -->
```

**Precedence.** Attributes are the declarative input, so a changed attribute
supersedes a property you wrote earlier. The order that actually holds:

1. Attributes present at first connection build the initial options.
2. Properties written **before** connection are remembered and replayed on top.
3. After that, last write wins, whichever form it used.

## Properties

Everything an attribute can set, plus a few that cannot:

| Property | Type | Notes |
| --- | --- | --- |
| `theme` | `string \| object` | Built-in key or a partial colour object. |
| `mode` | `ModeKey` | Setting a mode outside `modes` is ignored. |
| `modes` | `ModeKey[] \| null` | `null` restores the automatic list. |
| `spinning` / `autoRotate` | `boolean` | Two names, one setting. |
| `motion` | `boolean \| 'auto'` | `'auto'` is the preference; the getter reports it as configured. |
| `data` | `GlobeData \| null` | **Property only — there is no `data` attribute.** |
| `showBorders`, `showMarkers` | `boolean` | |
| `flagBase` | `string` | |
| `globeScale`, `markerScale`, `detail`, `animation` | `number` | |
| `halftone` | `Halftone` | Set it for a partial merge of all seven values. |
| `halftoneDensity`, `halftoneScale`, `contrast`, `threshold`, `intensity`, `ambient`, `oceanOpacity` | `number` | Individual halftone values. |
| `persistence` | `boolean` | |
| `selection` | `PublicMarker \| null` | Read-only. What is selected right now. |
| `settings` | `GlobeSettings` | Read-only snapshot of everything in effect. **Best debugging tool in the package.** |
| `ready` | `boolean` | `true` once `start()` has run and `geora-ready` fired. |

```js
el.settings
// { theme: 'dark', mode: 'country', spinning: true, motion: 'auto',
//   showBorders: true, showMarkers: true, persistence: false, flagBase: '',
//   globeScale: 0.7, markerScale: 0.75, detail: 2, animation: 1,
//   halftone: { density: 1, scale: 1, contrast: 1, threshold: 0.4,
//               intensity: 1, ambient: 0.2, ocean: 1 } }
```

The headless `GeoraGlobe` adds one more: `analytics`, the computed telemetry
table for the current dataset.

## Methods

| Method | Returns | What it does |
| --- | --- | --- |
| `whenReady()` | `Promise<this>` | Resolves once the globe is running. **The race-free way in a framework mount hook.** |
| `start()` | `void` | Starts the render loop and emits `geora-ready`. Automatic on connect. |
| `stop()` | `void` | Cancels the render loop. The image freezes; interaction needs `start()` again. |
| `destroy()` | `void` | Full teardown. Releases the WebGL context. See [Performance](#performance). |
| `reset()` | `void` | Back to the default globe state, and emits `geora-reset`. |
| `clearSelection()` | `boolean` | Clears the selection. `true` if something was selected. Emits `geora-clear`. |
| `selectCountry(code)` | `boolean` | Selects by ISO alpha-3 (`"PHL"`) or alpha-2 (`"ph"`), case-insensitive. Switches to `country` mode if needed; `false` if that mode is not in `modes` or the code is unknown. |
| `flyTo(lat, lon)` | `void` | Eases the camera to a coordinate. |
| `rotate(dx, dy)` | `void` | Keyboard-equivalent of a drag, in degrees. |
| `zoom(delta)` | `void` | Negative zooms **in**, positive zooms out. `zoom(-0.5)` is one step in. |
| `setData(next)` | `GlobeData` | Merges the collections you pass and returns the result. |

`data` is a merge, not a replace, so you can add one collection without losing
the defaults:

```js
el.setData({ markers: [{ id: 'hq', name: 'HQ', lat: 14.6, lon: 121.0 }] })
// countries, centers and landmarks are untouched
```

## Events

All ten are `CustomEvent`s that bubble and cross the shadow boundary, so listen
on the element or any ancestor. `detail` is plain data — never an engine
object.

| Event | Detail |
| --- | --- |
| `geora-ready` | `{}` |
| `geora-hover` | `{ marker, x, y }` — `marker` is `null` when the pointer leaves |
| `geora-select` | `{ marker, x, y }` |
| `geora-country-select` | `{ country, x, y }` |
| `geora-marker-select` | `{ marker, x, y }` |
| `geora-sphere-select` | `{ lat, lon, onLand, country, distanceKm, x, y }` |
| `geora-clear` | `{}` — also fired on a mode change |
| `geora-mode-change` | `{ mode, modes }` |
| `geora-theme-change` | `{ theme, key }` — `background` is advisory; the package does not repaint your page |
| `geora-reset` | `{}` |

`x` / `y` are client coordinates, so a tooltip needs no layout maths:

```js
el.addEventListener('geora-hover', ({ detail }) => {
  tip.style.transform = `translate(${detail.x + 14}px, ${detail.y + 14}px)`
})
```

### Marker payloads

`marker.kind` tells you which shape you got:

```ts
{ kind: 'country',   country }
{ kind: 'center',    center, country }
{ kind: 'analytics', country, row }
{ kind: 'polaroid',  landmark }
{ kind: 'marker',    marker }
```

The useful fields per kind:

| Kind | Read these |
| --- | --- |
| `country` | `country.country`, `country.capital`, `country.code`, `country.iso2`, `country.region`, `country.pop`, `country.tz`, `country.curr`, `country.fact` |
| `center` | `center.name`, `center.operator`, `center.status`, `center.powerGW`, `center.tier`, `center.focus`, `country?.country` |
| `analytics` | `country.country`, `row` (see [modeled telemetry](#analytics-values-are-modeled-not-measured)) |
| `polaroid` | `landmark.caption`, `landmark.country`, `landmark.image` |
| `marker` | `marker.name`, `marker.type`, `marker.id` |

`geora-sphere-select` is what makes empty ocean describable: it carries the
nearest country, the distance in km, and whether the point was on land at all.

## Build your own tooltip and card

This is the part people miss. The package fires everything you need; here is a
complete vanilla version — a cursor tooltip and a selection card — in about 40
lines.

```html
<geora-globe id="globe" theme="dark" mode="country"></geora-globe>
<div id="tip" hidden></div>
<section id="card" hidden aria-live="polite">
  <h2 id="card-title"></h2>
  <p id="card-sub"></p>
  <button id="card-close" type="button">close</button>
</section>

<script type="module">
  const el = document.getElementById('globe')
  const tip = document.getElementById('tip')
  const card = document.getElementById('card')

  const describe = (marker) => {
    switch (marker?.kind) {
      case 'country': {
        const c = marker.country
        return [c.country, `Capital: ${c.capital ?? '—'}`]
      }
      case 'center': {
        const c = marker.center
        return [c.name, `${c.operator} · ${c.status}`]
      }
      case 'analytics': {
        const c = marker.country
        return [`${c.country} · modeled`, `traffic ${marker.row.traffic} · uptime ${marker.row.uptime}%`]
      }
      case 'polaroid': {
        const l = marker.landmark
        return [l.caption, l.country]
      }
      case 'marker':
        return [marker.marker.name, marker.marker.type]
      default:
        return ['Selection', '']
    }
  }

  el.addEventListener('geora-hover', ({ detail }) => {
    if (!detail.marker) return void (tip.hidden = true)
    tip.textContent = describe(detail.marker)[0]
    tip.style.transform = `translate(${detail.x + 14}px, ${detail.y + 14}px)`
    tip.hidden = false
  })

  el.addEventListener('geora-select', ({ detail }) => {
    if (!detail.marker) return void (card.hidden = true)
    const [title, sub] = describe(detail.marker)
    document.getElementById('card-title').textContent = title
    document.getElementById('card-sub').textContent = sub
    card.hidden = false
  })

  // clearSelection() emits geora-clear, so one handler closes everything
  el.addEventListener('geora-clear', () => {
    card.hidden = true
    tip.hidden = true
  })

  document.getElementById('card-close').addEventListener('click', () => el.clearSelection())
  window.addEventListener('keydown', (e) => e.key === 'Escape' && el.clearSelection())
</script>
```

Notes worth copying:

- **Drive your UI from `detail`, never from the shadow root.** The card, the
  tooltip and any controls belong to your document, with your styles.
- **Give the card `role="dialog"` and move focus into it** if it is modal, and
  return focus to the trigger on close. The element handles `Escape` itself and
  will clear the selection for you.
- **Label `analytics` as modeled** wherever you surface it.
- React users: `demo/src/geora/components/InfoCard.jsx` and `BeaconTooltip.jsx`
  are complete versions of the above.

## Data

Everything arrives through `data` / `setData()`. The defaults ship with the
package and every collection is replaceable.

| Collection | Default | Fields |
| --- | --- | --- |
| `countries` | 50 | `code` (ISO alpha-3), `iso2` (alpha-2), `country`, `capital`, `lat`, `lon`, `region`, `continent`, `pop`, `tz`, `curr`, `fact` |
| `centers` | 73 | `id`, `name`, `operator`, `code`, `lat`, `lon`, `status`, `powerGW`, `tier`, `focus` |
| `markers` | none | `id`, `name`, `lat`, `lon`, `type` |
| `landmarks` | 50 | `iso2`, `country`, `caption`, `lat`, `lon`, `image` |

`code`, `lat` and `lon` are the only required fields on a country.

**`country` and `capital` are separate because they are separate facts.**
`country: "Philippines"`, `capital: "Manila"`. In 0.3.0 and earlier the capital
lived in a field called `name`, which collided confusingly with every other
`name` in the API — it is now `capital` on country rows only (markers and
centers keep `name`, because that really is their name).

```js
el.data = {
  countries: [
    { code: 'PHL', iso2: 'ph', country: 'Philippines', capital: 'Manila',
      lat: 14.6, lon: 121.0, region: 'Southeast Asia' },
  ],
  markers: [
    { id: 'hq', name: 'Manila HQ', type: 'office', lat: 14.5995, lon: 120.9842 },
  ],
}
```

### Replacing one collection

`setData()` merges, so you can override just what you care about:

```js
import { defaultCountries } from 'geora-globe'

el.setData({
  countries: [
    ...defaultCountries.filter((c) => ['PHL', 'JPN', 'IDN'].includes(c.code)),
    { code: 'XXX', country: 'My Territory', capital: 'Somewhere', lat: 0, lon: 0 },
  ],
})
```

Because `modes` is derived from what the data supports, dropping countries also
removes the empty layers — supply `markers` and the `markers` mode appears.

### Landmark photographs

Photographs are **not** in the package (they are ~15 MB of imagery). The
`polaroid` mode still works without them and draws a paper card labelled with
the country. To add images, set `image` on each landmark:

```js
import { joinLandmarks, defaultCountries } from 'geora-globe'

el.data = { landmarks: joinLandmarks(defaultCountries, '/assets/landmarks') }
// → image: "/assets/landmarks/ph.jpg"
```

Any URL works, so set `image` per entry if your filenames differ. A photo that
fails to load falls back to the placeholder and logs one warning naming the URL.
Photographs are drawn into a canvas, so **they must be CORS-readable** — the
loader requests `crossorigin="anonymous"`, which means a cross-origin host has
to send `Access-Control-Allow-Origin`.

### Flags

Flags ship with the package, so beacons show real flags with no configuration.
Any alpha-2 code without a file falls back to a code chip.

```js
import { bundledFlag, bundledFlagCodes } from 'geora-globe'

document.querySelector('img').src = bundledFlag('ph', true) // retina
bundledFlagCodes() // the 50 codes that ship
```

To use your own set, point `flag-base` at a directory holding `${iso2}.png` and
`${iso2}@2x.png`:

```html
<geora-globe flag-base="./assets/flags"></geora-globe>
```

Prefer a **relative** base. It resolves against the page, so it keeps working
under a sub-path deploy; a leading `/` pins it to the domain root.

### Provenance

The datasets are curated reference snapshots, not live feeds:

| Dataset | Compiled | Source |
| --- | --- | --- |
| Countries | September 2026 | Curated; `pop` is a rounded magnitude such as `"125M"`, not an official statistic |
| AI campuses | 30 September 2026 | Public operator announcements; `powerGW` is the announced figure only, never an estimate |
| Landmark coordinates | 2 October 2026 | The matching Wikipedia article for each landmark |

Surface geometry is separate: Natural Earth 110m via `world-atlas`. Each source
file states its date at the top.

### `analytics` values are modeled, not measured

`analytics` mode visualizes **synthesized** telemetry — deterministic values
generated from population, timezone and a hash of the country code. They are
stable and plausible, never observed. Label them as modeled anywhere you show
them, and do not use them for analysis.

```js
import { METRICS, metricMeta } from 'geora-globe'

metricMeta('traffic') // { key, label, unit, decimals, higherIsBetter, floor, cap }
```

## Themes

| Key | Label |
| --- | --- |
| `paper` | PAPER WHITE |
| `dark` | INK BLACK |
| `amber` | AMBER SCREEN |
| `matrix` | PHOSPHOR GREEN |
| `blueprint` | BLUEPRINT GRID |
| `dusk` | DUSK VIOLET |

```js
import { THEMES, THEME_KEYS, DEFAULT_THEME, nextTheme, themeHex } from 'geora-globe'

THEME_KEYS        // ['paper', 'dark', 'amber', 'matrix', 'blueprint', 'dusk']
nextTheme('paper') // 'dark' — cycles, handy for a single "change theme" button
```

Custom themes are plain objects; anything you leave out falls back:

```js
el.theme = { background: '#102030', accent: '#c6fe69' }
```

**A theme recolours the globe only.** To make the whole page follow, apply the
resolved background yourself — `geora-theme-change` gives it to you:

```js
el.addEventListener('geora-theme-change', ({ detail }) => {
  if (typeof detail.theme === 'object' && detail.theme.background) {
    document.body.style.backgroundColor = detail.theme.background
  }
})
```

## Modes

| Key | Label | Shows |
| --- | --- | --- |
| `country` | COUNTRIES | One flag beacon per nation |
| `polaroid` | POLAROIDS | One landmark photograph per nation |
| `analytics` | ANALYTICS | Modeled telemetry, labelled as such |
| `centers` | AI DATA CENTERS | Announced AI compute campuses |
| `markers` | MARKERS | Markers supplied by the host |

`modes` narrows what you may switch to, and `1`–`9` jump straight to a layer
while the element has focus. Setting a mode outside `modes` is ignored, and an
invalid list is ignored rather than emptied.

Each mode ships a name and a one-line description, so you can label a switcher
without hardcoding anything:

```js
import { modeMeta, MODES, MODE_KEYS } from 'geora-globe'

modeMeta('analytics')
// { key: 'analytics', label: 'ANALYTICS', icon: 'fa-chart-column',
//   hint: 'Modeled telemetry per nation' }
```

## Styling

The package emits no global CSS. Two custom properties resolve on the host and
are inherited into the shadow root:

| Custom property | Default | Use |
| --- | --- | --- |
| `--geora-stage-bg` | `#ffffff` | Canvas backdrop behind the globe |
| `--geora-accent` | `#1a56db` | Focus ring |

```css
geora-globe {
  --geora-stage-bg: #0b0d10;
  --geora-accent: #c6fe69;
}
```

The canvas host is exposed as a shadow part, so you can style it without
reaching inside:

```css
geora-globe::part(stage) { background: #0b0d10; }
```

## Framework integration

The element is an ordinary DOM node. There is no wrapper package — bind a
reference and listen to events.

**The one thing to know:** `geora-ready` fires from `connectedCallback`, which
is *before* React's `useEffect`, Vue's `onMounted` and Svelte's `onMount` run.
A `geora-ready` listener attached there is still delivered — the element
replays it — but **`whenReady()` is the race-free way to continue afterwards.**

### React

```jsx
import { useEffect, useRef, useState } from 'react'
import 'geora-globe'

// the same `describe(marker)` helper from the vanilla example above
const describe = (marker) =>
  marker?.kind === 'country'
    ? `${marker.country.country} — ${marker.country.capital ?? '—'}`
    : marker?.kind === 'polaroid'
      ? `${marker.landmark.caption} — ${marker.landmark.country}`
      : marker?.kind === 'center'
        ? `${marker.center.name} — ${marker.center.status}`
        : ''

export function Globe() {
  const ref = useRef(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const el = ref.current
    const onSelect = ({ detail }) => setSelected(detail.marker)
    const onClear = () => setSelected(null)

    el.addEventListener('geora-select', onSelect)
    el.addEventListener('geora-clear', onClear)
    el.whenReady().then(() => console.log('mode:', el.settings.mode))

    return () => {
      el.removeEventListener('geora-select', onSelect)
      el.removeEventListener('geora-clear', onClear)
    }
  }, [])

  return (
    <>
      <geora-globe ref={ref} theme="dark" mode="country" style={{ height: '100vh' }} />
      {selected && <aside aria-live="polite">{describe(selected)}</aside>}
    </>
  )
}
```

In JSX, unknown attributes pass through as attributes, so `flag-base` and
`auto-rotate` work as written. For non-string values use properties:

```jsx
<geora-globe ref={ref} globeScale={0.9} detail={1} />
```

### Vue

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import 'geora-globe'

const el = ref(null)
const onSelect = (e) => console.log(e.detail.marker)

onMounted(() => {
  el.value.addEventListener('geora-select', onSelect)
  el.value.whenReady().then(() => console.log('ready'))
})
onBeforeUnmount(() => el.value?.removeEventListener('geora-select', onSelect))
</script>

<template>
  <geora-globe ref="el" theme="dark" mode="country" style="height: 100vh" />
</template>
```

### Svelte

```svelte
<script>
  import { onMount } from 'svelte'
  import 'geora-globe'

  let el
  const onSelect = (e) => console.log(e.detail.marker)

  onMount(() => {
    el.addEventListener('geora-select', onSelect)
    el.whenReady().then(() => console.log('ready'))
    return () => el.removeEventListener('geora-select', onSelect)
  })
</script>

<geora-globe bind:this={el} theme="dark" mode="country" style="height: 100vh" />
```

### Conditional rendering

If your framework mounts the element late, drive `ready` into state rather than
guessing:

```jsx
const [ready, setReady] = useState(false)
useEffect(() => {
  ref.current.whenReady().then(() => setReady(true))
}, [])
```

## Headless

`GeoraGlobe` is the same engine with no element and no attributes, for hosts
that want full control of their own markup:

```js
import { GeoraGlobe } from 'geora-globe'

const globe = new GeoraGlobe({
  container: document.getElementById('stage'), // must be sized
  theme: 'dark',
  mode: 'country',
  data: { markers: [{ id: 'hq', name: 'HQ', lat: 14.6, lon: 121.0 }] },
})

globe.addEventListener('geora-select', ({ detail }) => render(detail.marker))
globe.whenReady().then(() => console.log(globe.settings))
globe.destroy() // releases the WebGL context
```

Options mirror the element's defaults: `container`, `eventTarget`, `data`,
`theme`, `mode`, `modes`, `spinning`, `motion`, `showBorders`, `showMarkers`,
`persistence`, `flagBase`, `globeScale`, `markerScale`, `detail`, `animation`,
`halftone`.

## Performance

- **Bundle:** 964 kB ESM (259 kB gzipped), 784 kB CJS (242 kB gzipped), fully
  self-contained. The trade-off is that a host already shipping Three.js ends up
  with a second copy.
- **Density is your main lever.** `detail` is `0`–`2`. On a weak device, drop
  to `1` first; it removes roughly a third of the drawn points for almost no
  visual loss.
- **Narrow viewports get half the point cloud** automatically — 30,000 points
  instead of 65,000 below 640 px — and the device pixel ratio is capped at 2×
  on creation and on every resize, so a high-DPI phone does not pay four times
  the fill rate.
- **Motion is not rendering.** `animation: 0` freezes visible motion but the
  loop still redraws; `motion="off"` cuts spin, pulses and inertia at the
  source. Neither stops the frame loop — that takes `stop()`.
- **Teardown is complete.** `destroy()` (or removing the element) cancels the
  animation frame, removes the window and pointer listeners, disconnects the
  `ResizeObserver`, disposes every geometry and material, **and releases the
  WebGL context immediately**. That last step matters: browsers cap how many
  contexts may be alive at once (Chrome allows about sixteen), so a page that
  mounts and unmounts the globe repeatedly would otherwise exhaust them and
  start losing the contexts of globes still on screen.
- **Many globes are fine.** Each instance owns its own renderer, scene and loop;
  there is no shared module state beyond the registered element.

## Accessibility

The package handles the parts that belong to a canvas; the rest belongs to your
interface.

**Provided:**

- `tabindex="0"`, `role="application"` and `aria-label="Geora interactive
  globe"` unless you supply your own label. Clicking the canvas focuses it.
- The focus ring is drawn in `--geora-accent`.
- **Keyboard**, while focused:

  | Key | Action |
  | --- | --- |
  | Arrows | Rotate |
  | `+` / `=` / Page Up | Zoom in |
  | `-` / `_` / Page Down | Zoom out |
  | `Home` | Reset |
  | `1`–`9` | Jump to a layer |
  | `Escape` | Clear the selection, keep focus |

  A key is `preventDefault()`ed only when the globe actually acted on it, so
  nothing else scrolls or types underneath.

- A polite live region narrates selections: `"Country: Philippines"`,
  `"AI data center: …"`, `"Photograph: …"`, `"Marker: …"`,
  `"Layer: POLAROIDS"`, `"Selection cleared"`. It is cleared when the element
  leaves the document.
- `motion="auto"` follows `prefers-reduced-motion` for the whole session, and
  the preference is listened to, so changing it at the OS level takes effect
  live.
- The stage is `touch-action: none`, so a drag rotates the globe instead of
  scrolling the page. Pointer and touch events drive one code path.

**Your job:**

- Contrast and text alternatives for anything you draw over the canvas. A WebGL
  canvas has no accessible text of its own.
- Touch targets for your controls — 44 px is the comfortable minimum.
- Focus management for modal UI. If your card is a dialog, move focus into it,
  keep `Tab` inside it, and restore focus to the trigger on close.
- Meaningful labels for geographic selections. `geora-sphere-select` gives you
  the nearest country and the distance so you can describe open water as
  precisely as a capital city.

## Migrating from 0.3.0

0.4.0 removes the interface from the package. Two breaking changes:

**1. The HUD is gone.** These attributes and options no longer exist and are
ignored:

`show-hud` · `show-tooltip` · `show-info-card` · `show-controls` ·
`show-navigation` · `show-settings` · `minimal`

Build what you need from the events — start with
[Build your own tooltip and card](#build-your-own-tooltip-and-card), or lift
`InfoCard.jsx` and `BeaconTooltip.jsx` out of `demo/`. Everything else, every
event and every method, is unchanged.

**2. `name` became `capital` on country rows.** Anywhere you read a capital
city off a country:

```js
// 0.3.0
place.name // "Manila"
// 0.4.0
place.capital
```

This is a deliberate fix: `name` on a country row collided with `name` on
markers and centers, which meant something else. Markers and centers keep
`name` — that is genuinely their name.

## Troubleshooting

**Blank page, nothing renders.** Almost always the CDN import failed. Open the
console; check the version exists (`https://cdn.jsdelivr.net/npm/geora-globe`).
For local work, `npm run build` and point at `./dist/index.js`.

**Element is there but has no size.** It is `width: 100%; height: 100%`. Give
it or an ancestor an explicit height.

**Canvas is blank but events fire.** A WebGL context problem. Check the console
for context-loss warnings, and whether too many contexts are already alive.

**No tooltip or card on click.** Expected on 0.4.0 — the package draws none. See
[Build your own tooltip and card](#build-your-own-tooltip-and-card).

**An attribute seems ignored.** Check three things: it must be one of the 20
above; numbers fall back to the default if unparseable; and a property written
*before* connection is replayed over the attributes, so set attributes in markup
or properties after mount, not both.

**Mode will not change.** It is probably not in `modes`. `modes` is an
allow-list, and setting a mode outside it is ignored by design.

**`selectCountry()` returns `false`.** The code was not found, or `country` is
not in `modes`.

**Landmark images do not appear.** They are not shipped. Set `image` per
landmark, and serve them CORS-readable — the loader requests
`crossorigin="anonymous"`.

**Flags are code chips, not flags.** That alpha-2 code has no bundled flag, or
`flag-base` does not resolve. Codes are looked up as `${flag-base}/${iso2}.png`.

**Globe spins under reduced motion.** You set `spinning` directly while
`motion` is `"auto"`. Move spin under your own control, or set `motion="on"`
explicitly to override the OS preference.

## Exports

22 named exports:

```js
import {
  // engine + element
  GeoraGlobe, GeoraGlobeElement, registerGeoraGlobe,
  // defaults
  DEFAULT_HALFTONE, DEFAULT_PROFILE,
  // themes
  THEMES, THEME_KEYS, DEFAULT_THEME, nextTheme, themeHex,
  // modes
  MODES, MODE_KEYS, modeMeta,
  // data
  defaultCountries, defaultCenters, CENTER_STATUSES,
  defaultLandmarks, joinLandmarks,
  // analytics
  METRICS, metricMeta,
  // assets
  bundledFlag, bundledFlagCodes,
} from 'geora-globe'
```

Types ship as `dist/index.d.ts` and are wired to the `types` condition.

## Working on the repo

```bash
npm install
npm run dev          # the React demo in demo/
npm test             # vitest, 111 tests
npm run lint
npm run build        # the library -> dist/
npm run build:demo   # the demo   -> demo-dist/
npm run assets       # refresh cached flag artwork
npm run landmarks    # refresh cached landmark photos
```

**Layout**

| Path | What it is |
| --- | --- |
| `src/GeoraGlobeElement.js` | the custom element — attributes, lifecycle, accessibility |
| `src/core/GeoraGlobe.js` | the engine — data, selection, events, no DOM |
| `src/core/GlobeScene.js` | scene, camera, layers, interaction, teardown |
| `src/core/GlobeRenderer.js` | WebGL context and the point cloud |
| `src/shaders/` | the vertex and fragment shaders |
| `src/themes/`, `src/data/`, `src/analytics/` | palettes, datasets, modeled telemetry |
| `src/styles.css` | shadow-root CSS: stage, focus ring, live region |
| `demo/` | the React reference app — **not published** |
| `test/` | vitest suites, including `lifecycle.test.js` for mount cycles and teardown |

Tests stub the scene, so they run without WebGL. `test.html` is a
gitignored manual harness that loads the published build and drives every
attribute.