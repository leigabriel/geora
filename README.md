# GEORA

A 3D halftone dotted-bit globe. The planet is drawn as tens of thousands of
shader-lit points: land carries the Natural Earth 110m raster, borders glow in
the accent colour, and every sovereign nation is pinned with a beacon and a flag
sprite you can grab, spin, zoom into and read.

The globe is also a display. A bottom bar switches the planet between six layers —
nations, your own stickers and photos, modeled traffic telemetry, AI data centres
and live weather — and it reads previous / active / next instead of asking you to
pick from a modal.

Everything ships locally: no CDN, no font host, no flag host. Install once, then
it runs with the network cable pulled. Weather is the one exception, and it never
invents a reading when the request fails.

## What it does

- **Halftone globe** — 18k/36k point Fibonacci sphere, rasterized from
  `world-atlas` 1:110m country topology into a canvas that feeds the land,
  border and ocean-dot attributes of a custom GLSL point shader.
- **50 sovereign nations** — capital coordinates, population, timezone,
  currency and a one-line fact, rendered as pulsing beacon rings with flag
  sprites that only fade in on the facing hemisphere.
- **Six globe layers** — every marker kind lives in its own three.js group, so
  switching selections swaps the planet's contents instead of stacking overlays.
- **Settings panel** — a slide-in panel for halftone calibration, the visual
  profile, synthesized audio and the six themes.
- **Docs panel** — the full reference, in JetBrains Mono, beside the globe.
- **Synthesized audio** — Tone.js only, no samples: a speed-sensitive pitched
  drag ratchet with a release thunk, a select chime, hover blips and UI pips, all
  behind a persisted mute toggle.
- **Touch and pointer parity** — drag, wheel, pinch, tap-to-inspect, outside
  tap to dismiss, and a HUD that can be hidden entirely.

## Globe layers

Move through the bottom bar, or with the number keys `1`–`6` and the arrow keys.
Each layer has its own beacons, its own toolbar and its own info card.

| # | Layer | What it shows | Where the data comes from |
| --- | --- | --- | --- |
| 1 | **Countries** | All 50 sovereign states as flag beacons you tap to inspect | `src/geora/data/countries.js` |
| 2 | **Stickers** | Arm an emoji, then tap the globe to pin it anywhere. Tap a pinned sticker to remove it | local, in-memory |
| 3 | **Polaroids** | Add your own pictures; each is pinned where you drop it and rendered as a card on a stem | local, in-memory |
| 4 | **Analytics** | Traffic, sessions, uptime and latency per nation, as a ranked read-out | **modeled** — see below |
| 5 | **AI centers** | Public cloud regions with tier, scale, power and focus, filterable by core / edge | `src/geora/data/centers.js` |
| 6 | **Weather** | Current conditions per nation, emoji markers only, °C or °F | live API only |

### Analytics are modeled, not measured

There is no geora backend, so the telemetry is synthesized from each nation's
population, timezone and a hash of its ISO code. It is deterministic across
reloads and plausible in magnitude, but it is **not** real traffic. Every surface
that shows it is labelled `MODELED` so a number can never be mistaken for a
measurement. There are no 3D graphs: the layer is a ranked text read-out.

### Weather is the only networked feature

`src/geora/lib/weather.js` batches the 50 capitals into
[Open-Meteo](https://open-meteo.com) requests and reports which source produced
the readings. If the request fails the layer says so — it never falls back to
fabricated conditions. Markers are the WMO glyph and nothing else, outlined in
white so they read against any theme. The rest of the app never touches the
network after the build.

### AI centre data

`src/geora/data/centers.js` is a hand-curated list of well-known public cloud
regions with approximate coordinates, a tier, a rounded scale class and a power
figure. It is a reference list, not an audited inventory, and every card says so.
A centre is anchored to its territory, so selecting one frames the right patch of
the globe and the card carries that country's flag.

## Run

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`, `npm run assets`.

## Offline assets

The dev and production bundles are self-contained, with these files cached in
`public/` (also present in `dist/` after a build):

| Asset | Path | Source |
| --- | --- | --- |
| Country flags, 1x and 2x | `public/flags/{iso2}.png`, `{iso2}@2x.png` | flagcdn.com |
| Departure Mono | `public/fonts/departure-mono.woff2` | Grid Noise |
| JetBrains Mono, latin subset | `public/fonts/jetbrains-mono-latin.woff2` | Google Fonts |
| Globe favicon | `public/favicon.svg` | generated |

The interface is set in Departure Mono; the documentation panel is set in
JetBrains Mono. `npm run assets` re-downloads the flag PNGs and the fonts. Run it
after editing the nation list in `src/geora/data/countries.js`; it only needs a
network connection for that one step. Emoji flags fall back to the platform emoji
font, so a missing PNG degrades to the unicode flag instead of a broken image.

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
scripts/cache-assets.mjs  one-off asset downloader
public/                   favicon, flags, fonts
src/geora/
  Geora.jsx        app shell, state, selection wiring, persistence
  config.js        single source of truth: places, layers, themes, defaults
  geora.css        theme variables, font faces and base styles
  data/countries.js  nation data
  data/centers.js     AI cloud regions
  data/stickers.js    sticker palette
  data/weather.js     WMO code table
  lib/scene.js     three.js scene, map, layers, raycast, render loop
  lib/controls.js  drag, wheel, pinch and raycast input
  lib/audio.js     tone.js sfx
  lib/themes.js    themes
  lib/modes.js     globe layer registry
  lib/analytics.js modeled telemetry
  lib/weather.js   open-meteo client
  lib/rand.js      seeded rng and id helpers
  lib/assets.js    local asset urls
  lib/useFloating.js  viewport aware panel positioning
  components/      top bar, selection nav, action bar, info card, beacon
                   tooltip, settings panel, docs panel, HUD toggle
```

## Interface

| Corner | Control |
| --- | --- |
| Top left | Geora Globe wordmark |
| Top right | docs, settings |
| Bottom left | the active layer's toolbar |
| Bottom right | eye — hide the whole interface |
| Bottom center | previous / active / next layer bar |

## Controls

| Action | Input |
| --- | --- |
| Rotate | drag or swipe |
| Zoom | wheel or pinch |
| Inspect | click or tap a beacon |
| Pin a sticker or photo | arm it in the toolbar, then tap the globe |
| Move between layers | the bottom bar, `1`–`6`, or `←` / `→` |
| Open the panels | docs and settings buttons, or `D` |
| Close a card or a panel | `Escape`, or tap outside |
| Hide the interface | eye button or `H` |

## Credits

Natural Earth data via [world-atlas](https://github.com/topojson/world-atlas)
(public domain). Weather readings from [Open-Meteo](https://open-meteo.com).
Flags served by [flagcdn](https://flagcdn.com). Departure Mono and JetBrains Mono
are licensed under the SIL Open Font License, Font Awesome Free under
CC BY 4.0 / SIL OFL 1.1 / MIT, and three.js, Tone.js, d3-geo and topojson-client
are MIT or ISC licensed.
