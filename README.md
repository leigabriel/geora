# GEORA

A 3D halftone dotted-bit globe. The planet is drawn as tens of thousands of
shader-lit points: land carries the Natural Earth 110m raster, borders glow in
the accent colour, and every sovereign nation is pinned with a beacon and a flag
sprite you can grab, spin, zoom into and read.

The globe is also a display. A pill at the bottom centre carries the running
layer — nations, landmark photographs, modeled traffic telemetry and announced AI
compute campuses. Tap it and the layer list opens above it; pick one and the list
closes. A click outside the dock, or Escape, dismisses it.

Everything ships locally: no CDN, no font host, no flag host. Install once, then
it runs with the network cable pulled. The application makes no network requests
at runtime at all.

## What it does

- **Halftone globe** — 18k/36k point Fibonacci sphere, rasterized from
  `world-atlas` 1:110m country topology into a canvas that feeds the land,
  border and ocean-dot attributes of a custom GLSL point shader.
- **50 sovereign nations** — capital coordinates, population, timezone,
  currency and a one-line fact, rendered as pulsing beacon rings with flag
  sprites that only fade in on the facing hemisphere.
- **50 landmark polaroids** — one photograph per nation, of that nation's best
  known landmark, pinned at the landmark's real coordinates.
- **Four globe layers** — every marker kind lives in its own three.js group, so
  switching selections swaps the planet's contents instead of stacking overlays.
- **Read-only HUD** — the panel above the layer dock reports what the running
  layer holds. Nothing in it is configurable, because everything configurable is
  declared in code.
- **Settings panel** — a slide-in panel for halftone calibration, the visual
  profile, synthesized audio and the six themes.
- **Docs panel** — the full reference, in JetBrains Mono, beside the globe.
- **Synthesized audio** — Tone.js only, no samples: a speed-sensitive pitched
  drag ratchet with a release thunk, a select chime, hover blips and UI pips, all
  behind a persisted mute toggle.
- **Touch and pointer parity** — drag, wheel, pinch, tap-to-inspect, outside
  tap to dismiss, and a HUD that can be hidden entirely.

## Globe layers

Move through the bottom bar, or with the number keys `1`–`4` and the arrow keys.
Each layer has its own beacons and its own info card.

| # | Layer | What it shows | Where the data comes from |
| --- | --- | --- | --- |
| 1 | **Countries** | All 50 sovereign states as flag beacons you tap to inspect | `src/geora/data/countries.js` |
| 2 | **Polaroids** | One landmark photograph per nation, pinned where the landmark stands | Wikipedia, cached into `public/landmarks` |
| 3 | **Analytics** | Traffic, sessions, uptime and latency per nation, floated as values on black chips and ranked in the readout | **modeled** — see below |
| 4 | **AI centers** | Announced AI compute campuses with operator, capacity, build status and focus | `src/geora/data/centers.js` |

### The HUD is a readout, not a control panel

The panel above the layer dock shows what the running layer contains and nothing
else. There are no pickers, steppers, buttons or toggles in it. The metric
analytics is scored by is `config.defaultMetric`, not a switch; the photographs
and campuses come from data files, not from user input. Every marker on the globe
is declared in code, so a tap on the sphere never creates anything — it dismisses
the open card.

This is a deliberate split: `config.js` is the single place a host edits, and the
interface cannot drift away from it.

### Analytics are modeled, not measured

There is no geora backend, so the telemetry is synthesized from each nation's
population, timezone and a hash of its ISO code. It is deterministic across
reloads and plausible in magnitude, but it is **not** real traffic. Every surface
that shows it is labelled `MODELED` so a number can never be mistaken for a
measurement. There are no 3D graphs: each nation carries its active value as white
text on a solid black chip above it, and the readout holds the ranked figures.

### The photographs are real and credited

`src/geora/data/landmarks.js` names one landmark per nation. `npm run landmarks`
reads each landmark's English Wikipedia article for both its lead photograph and
its coordinates, so a polaroid lands on the landmark itself rather than on the
nation's capital.

The images are CC BY-SA or public domain. Attribution for every file — author,
licence and source URL — is written to `public/landmarks/credits.json` by the same
script. Redistribution requires the credit, so do not strip that file.

There is no upload path. Adding a country means adding an entry to
`landmarks.js` and re-running the script, so the layer content is versioned with
the code.

### AI centre data is real, and says what it does not know

`src/geora/data/centers.js` holds campuses announced by their operators, at
coordinates in 39 countries. Three fields carry the honesty:

- `status` separates `operating` from `under construction` from `announced`, so
  running capacity is never confused with a press release. The readout tallies
  all three.
- `powerGW` is the operator's announced capacity, and reads `Not disclosed` in the
  card when none has been published. **It is never estimated.** 24 of the 73 sites
  have a published figure; 23.9 GW announced in total.
- `operator` names who runs the site, so a campus is attributable.

Every entry is a real, publicly announced site. The list is curated, not an
inventory: absence means not listed, not non-existent.

## Run

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`,
`npm run assets`, `npm run landmarks`.

## Offline assets

The dev and production bundles are self-contained, with these files cached in
`public/` (also present in `dist/` after a build):

| Asset | Path | Source |
| --- | --- | --- |
| Country flags, 1x and 2x | `public/flags/{iso2}.png`, `{iso2}@2x.png` | flagcdn.com |
| Landmark photographs | `public/landmarks/{iso2}.jpg` | Wikipedia |
| Photograph credits | `public/landmarks/credits.json` | generated |
| Departure Mono | `public/fonts/departure-mono.woff2` | Grid Noise |
| JetBrains Mono, latin subset | `public/fonts/jetbrains-mono-latin.woff2` | Google Fonts |
| Globe favicon | `public/favicon.svg` | generated |

`npm run assets` re-downloads the flag PNGs and the fonts — run it after editing
the nation list. `npm run landmarks` re-downloads the photographs — run it after
editing `landmarks.js`. Both need a network connection for that one step, and both
respect Wikimedia's robot policy by downloading at one file per second. Emoji
flags fall back to the platform emoji font, so a missing PNG degrades to the
unicode flag instead of a broken image.

## Stack

- three.js — globe point cloud, halftone shader, beacon markers, render loop
- Tone.js — synthesized sfx
- d3-geo + topojson-client — Natural Earth 1:110m rasterization
- world-atlas — country topology, bundled and fetched from the build output
- Font Awesome Free — interface icons, bundled woff2
- React 19 + Vite 8 — app shell and build
- Tailwind CSS v4 — styling, defined in `src/geora/geora.css`

## Structure

```
scripts/cache-assets.mjs     flags and fonts
scripts/cache-landmarks.mjs  photographs and their credits
scripts/check-data.mjs       integrity check across the data files
public/                      favicon, flags, fonts, landmarks
src/geora/
  Geora.jsx        app shell, state, layer wiring, persistence
  config.js        single source of truth: places, layers, themes, defaults
  geora.css        theme variables, font faces and base styles
  data/countries.js  nation data
  data/centers.js     AI compute campuses
  data/landmarks.js   landmark photographs, one per nation
  lib/scene.js     three.js scene, map, layers, raycast, render loop
  lib/controls.js  drag, wheel, pinch and raycast input
  lib/audio.js     tone.js sfx
  lib/themes.js    themes
  lib/modes.js     globe layer registry
  lib/analytics.js modeled telemetry
  lib/rand.js      seeded rng and id helpers
  lib/assets.js    local asset urls
  lib/useFloating.js  viewport aware panel positioning
  components/      top bar, selection nav, action bar, info card, beacon
                   tooltip, settings panel, docs panel, HUD toggle, ui
```

## Interface

| Corner | Control |
| --- | --- |
| Top left | Geora Globe wordmark |
| Top right | docs, settings |
| Bottom centre | the running layer's readout, above the layer console |
| Bottom right | eye — hide the whole interface |
| Bottom centre | layer console — numbered cells switch layers, the readout opens the full list |

## Controls

| Action | Input |
| --- | --- |
| Rotate | drag or swipe |
| Zoom | wheel or pinch |
| Inspect | click or tap a beacon |
| Move between layers | the bottom bar, `1`–`4`, or `←` / `→` |
| Open the panels | docs and settings buttons, or `D` |
| Close a card or a panel | `Escape`, or tap outside |
| Hide the interface | eye button or `H` |

## Credits

Natural Earth data via [world-atlas](https://github.com/topojson/world-atlas)
(public domain). Landmark photographs from Wikipedia, each CC BY-SA or public
domain, credited by author and source in `public/landmarks/credits.json`. Flags
served by [flagcdn](https://flagcdn.com). Departure Mono and JetBrains Mono are
licensed under the SIL Open Font License, Font Awesome Free under
CC BY 4.0 / SIL OFL 1.1 / MIT, and three.js, Tone.js, d3-geo and topojson-client
are MIT or ISC licensed.
