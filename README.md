# GEORA

A 3D halftone dotted-bit globe. The planet is drawn as tens of thousands of
shader-lit points: land carries the Natural Earth 110m raster, borders glow in
the accent colour, and every sovereign nation is pinned with a beacon and a flag
sprite you can grab, spin, zoom into and read.

Everything ships locally: no CDN, no font host, no flag host. Install once, then
it runs with the network cable pulled.

## What it does

- **Halftone globe** — 18k/36k point Fibonacci sphere, rasterized from
  `world-atlas` 1:110m country topology into a canvas that feeds the land,
  border and ocean-dot attributes of a custom GLSL point shader.
- **50 sovereign nations** — capital coordinates, population, timezone,
  currency and a one-line fact, rendered as pulsing beacon rings with flag
  sprites that only fade in on the facing hemisphere.
- **Atlas panel** — a slide-in panel with continent filters, halftone
  calibration sliders, visual profiles, layer toggles and a nation picker.
- **Four visual profiles** — paper, B&W, amber and cyber, each repainting the
  shader, the beacons and the whole CSS token set.
- **Synthesized audio** — Tone.js only, no samples: a speed-sensitive pitched
  drag ratchet with a release thunk, a select chime, hover blips and UI pips, all
  behind the mute toggle.
- **Touch and pointer parity** — drag, wheel, pinch, tap-to-inspect, outside
  tap to dismiss the atlas, and a HUD that can be hidden entirely.

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
| JetBrains Mono, latin subset | `public/fonts/jetbrains-mono-latin.woff2` | Google Fonts |
| Globe favicon | `public/favicon.svg` | generated |

`npm run assets` re-downloads the flag PNGs and the font. Run it after editing
the nation list in `src/geora/data/countries.js`; it only needs a network
connection for that one step. Emoji flags fall back to the platform emoji font,
so a missing PNG degrades to the unicode flag instead of a broken image.

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
public/                   favicon, flags, font
src/geora/
  Geora.jsx        app shell, state, wiring
  geora.css        theme variables, font face and base styles
  data/countries.js  nation data
  lib/scene.js     three.js scene, map, markers, zoom and render loop
  lib/controls.js  drag, wheel, pinch and raycast input
  lib/audio.js     tone.js sfx
  lib/themes.js    visual profiles
  lib/assets.js    local asset urls
  lib/useFloating.js  viewport aware panel positioning
  components/      top bar, atlas panel, bottom bar, country card,
                   beacon tooltip, HUD toggle
```

## Controls

| Action | Input |
| --- | --- |
| Rotate | drag or swipe |
| Zoom | wheel or pinch |
| Inspect | click or tap a beacon, or pick a nation from the atlas |
| Close the card or the atlas | `Escape`, or tap outside the atlas |
| Hide interface | eye button or `H` |
| Reset view | bottom bar reset |

## Credits

Natural Earth data via [world-atlas](https://github.com/topojson/world-atlas)
(public domain). Flags served by [flagcdn](https://flagcdn.com).
JetBrains Mono is licensed under the SIL Open Font License, Font Awesome Free
under CC BY 4.0 / SIL OFL 1.1 / MIT, and three.js, Tone.js, d3-geo and
topojson-client are MIT or ISC licensed.
