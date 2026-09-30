// The Docs entry in the top right: the same material as README.md, trimmed to
// what a developer needs while the globe is on screen, laid out as one
// continuous page. There is no tab strip — the whole document scrolls.
const SECTIONS = [
  {
    id: 'intro',
    title: 'Introduction',
    body: [
      'Geora Globe is a spatial visualization system built around one interactive 3D globe. The planet is drawn as tens of thousands of shader-lit points: land carries the Natural Earth 110m raster, borders glow in the accent colour, and the active selection is pinned on top.',
      'The globe is the interface. Rotate it, zoom it, tap a beacon to inspect it. The HUD stays secondary and can be hidden entirely.',
    ],
  },
  {
    id: 'install',
    title: 'Installation',
    body: ['npm install, then npm run dev. Other scripts: npm run build, npm run preview, npm run lint, npm run assets.'],
  },
  {
    id: 'quickstart',
    title: 'Quick Start',
    body: [
      'The bottom-centre control walks the selections as plain words: previous, active, next. The neighbours name the selection they lead to, so you always know where you are going before you move.',
      'Tap or click any beacon to open its card. Press Escape to dismiss it. Press H to hide the interface, D to open these docs, and the number keys 1 to 6 to jump to a selection.',
    ],
  },
  {
    id: 'config',
    title: 'Globe Configuration',
    body: [
      'All content is declared in src/geora/config.js. The engine in lib/scene.js reads only the fields it needs, so a host replaces an array rather than editing a renderer.',
      'places supplies the geographic anchors every location-based selection is derived from: code, iso2, name, country, region, lat, lon, pop, tz, curr and fact.',
      'The halftone and visual profile controls are plain numbers pushed into the shader, not hard-coded behaviour.',
    ],
  },
  {
    id: 'modes',
    title: 'Selection Modes',
    body: [
      'Six selections ship by default. Each owns one three.js group, so switching swaps the contents of the planet rather than stacking overlays on top of it.',
      'Number keys 1 to 6 jump directly to a selection. Arrowing left or right steps through them in order.',
    ],
  },
  {
    id: 'countries',
    title: 'Countries',
    body: [
      'Every place is a beacon with a flag sprite that fades in on the facing hemisphere. Tap the beacon, not a list: the card is anchored to the marker and the globe eases toward the territory.',
      'When the card closes, the globe returns to the rotation and zoom it had before the first selection.',
    ],
  },
  {
    id: 'stickers',
    title: 'Stickers',
    body: [
        'Pick a glyph from the palette, or add your own image, then tap the globe to pin it exactly where you tapped. A sticker carries a glyph or an image, a name, its coordinates, the country it landed in, a scale and optional metadata.',
      'A sticker stays attached to its coordinates as the planet turns. Arming is cleared when you change selection, so a sticker can never be pinned from another mode. Tap a pinned sticker to inspect it, rescale it, or remove it.',
    ],
  },
  {
    id: 'polaroids',
    title: 'Polaroids',
      body: [
        'Tap an island: Geora records which nation you hit, opens the file picker, and pins the picture exactly where you tapped. The card carries a caption, the country, coordinates and a scale.',
        'A tap on open water is refused rather than guessed at, and cancelling the picker drops the country so the next picture cannot land somewhere you abandoned. Selecting a polaroid focuses the globe on where it is attached.',
      ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    body: [
      'Text-based only. There is no 3D graph: the globe carries a single health beacon per nation whose ring grows with the active metric, and the numbers, labels and ranking live in the toolbar and the card.',
      'The bundled dataset is MODELED, not measured. It is derived from population, timezone and a hash of each ISO code, which makes it stable across reloads and plausible in magnitude, but it is not real traffic. Every surface labels it.',
      'Supply your own buildAnalytics implementation through config to drive the layer from a real backend.',
    ],
  },
  {
    id: 'centers',
    title: 'AI Data Centers',
    body: [
      'AI compute campuses are drawn directly on the globe at their geographic coordinates. Tap one to select it, which identifies its country, zooms to it, and shows the configured information for that site.',
      'Closing the card restores the previous rotation, zoom and globe state. The wide halo marks a metro hosting more than one site.',
      'The bundled list is a curated reference with rounded public figures, not an inventory. Replace config.centers with your own.',
    ],
  },
  {
    id: 'weather',
    title: 'Weather',
    body: [
      'Live readings from open-meteo, refreshed on a configured interval. Nothing is guessed: if a location has no reported value it is simply absent, and if the request fails the layer shows nothing rather than showing something plausible.',
      'Markers are emoji with a white outline and no other decoration. No text, no tinted card, no background wash.',
    ],
  },
  {
    id: 'themes',
    title: 'Themes',
    body: [
      'A theme sets the background, globe, text, markers, HUD chrome and accent colours as one set. Names describe what the screen looks like: Paper White, Ink Black, Amber Screen, Phosphor Green, Blueprint Grid, Dusk Violet.',
    ],
  },
  {
    id: 'profile',
    title: 'Visual Profile',
    body: ['Globe scale, marker scale, detail level, animation intensity and motion sensitivity. Motion sensitivity off freezes spin, pulses and inertia.'],
  },
  {
    id: 'halftone',
    title: 'Halftone Calibration',
    body: ['Density, scale, contrast, threshold and intensity, plus the ambient fill and ocean dot weights. Threshold sharpens the dot edge, contrast pivots the terminator, density thins the cloud evenly.'],
  },
  {
    id: 'audio',
    title: 'Audio',
    body: [
      'Tone.js only, no samples: a speed-sensitive pitched drag ratchet with a release thunk, a select chime, hover blips and UI pips. Enabled by default, muted from Settings, and the preference is persisted.',
    ],
  },
  {
    id: 'api',
    title: 'API Reference',
    body: [
      'createGlobeScene({ container, config }) returns the renderer handle. It is deliberately free of Geora-specific content.',
      'start() begins the loop. setMode(key) swaps layers. setTheme(theme) applies a palette. setHalftone({ density, scale, contrast, threshold, intensity, ocean, ambient }) drives the point shader. setGlobeScale, setMarkerScale, setDetail, setAnimationIntensity and setMotion drive the visual profile.',
      'setAnalytics(analytics, metric), setWeather(byCode), setCenters(filter), setStickers(list) and setPolaroids(list) feed the data layers.',
      'probe(x, y) resolves a tap to a marker or a lat/lon on the sphere. snapshot() and restore(state) bracket a temporary focus so the globe can be handed back exactly as it was.',
      'flyTo(place), reset(), zoomBy(delta), drag(dx, dy), setAutoRotate(on) and dispose() cover navigation and lifecycle.',
    ],
  },
  {
    id: 'examples',
    title: 'Examples',
    body: [
      'Point the globe at your own cities: replace config.places with [{ code, iso2, name, country, lat, lon }] and every location-based selection follows.',
      'Drive analytics from a real backend: return the same shape as buildAnalytics, a byCode map plus totals, and label it however your data deserves.',
      'Add a selection: give it a layer in the engine, add it to config.modes, and it appears in the navigation with no other changes.',
    ],
  },
  {
    id: 'trouble',
    title: 'Troubleshooting',
    body: [
      'Weather shows unavailable: the request failed or the network is blocked. Geora shows nothing rather than inventing readings, which is the intended behaviour.',
      'Analytics numbers look unfamiliar: the bundled dataset is modeled. It is labeled MODELED everywhere it appears.',
      'The globe is blank: WebGL is unavailable in this browser or hardware acceleration is disabled.',
      'Points look wrong: the Natural Earth topology could not be fetched, so the globe fell back to a coarse land outline. Check that dist/assets contains the topology JSON.',
      'A center will not focus: its ISO code is not in config.places, so there is no territory to fly to. The beacon still draws.',
    ],
  },
]

export default function DocsPanel({ open, onClose }) {
  return (
    <>
      <div
        data-ui
        onPointerDown={onClose}
        className={`fixed inset-0 z-[50] bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        data-ui
        data-closed={!open}
        className={`bit-panel slide-right fixed inset-y-0 right-0 z-[60] flex w-[92vw] max-w-[720px] flex-col border-l shadow-2xl sm:w-[min(720px,86vw)] ${
          open ? '' : 'pointer-events-none'
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-(--border-color) p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-(--accent-color)" />
            <span className="truncate text-xs font-bold uppercase tracking-[0.2em]">Geora Globe Documentation</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-sm opacity-70 transition-colors hover:bg-(--border-color) hover:opacity-100"
            title="Close documentation (Esc)"
            aria-label="Close documentation"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </header>

        <div className="custom-scroll font-prose min-h-0 flex-1 select-text overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {SECTIONS.map((section) => (
            <section key={section.id} className="mb-6 last:mb-0">
              <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.18em] text-(--accent-color)">
                {section.title}
              </h2>
              <div className="flex flex-col gap-2.5">
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)} className="text-[12px] leading-relaxed opacity-90">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <p className="mt-4 border-t border-(--border-color) pt-3 text-[10px] opacity-45">
            The same reference lives in README.md at the repository root.
          </p>
        </div>
      </aside>
    </>
  )
}
