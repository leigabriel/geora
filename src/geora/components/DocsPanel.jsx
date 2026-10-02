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
    body: [
      'npm install, then npm run dev. Other scripts: npm run build, npm run preview, npm run lint, npm run assets, npm run landmarks.',
      'npm run assets caches the flag PNGs and the font. npm run landmarks downloads the polaroid photographs. Both write into public/ and both are only needed after changing the underlying data files.',
    ],
  },
  {
    id: 'quickstart',
    title: 'Quick Start',
    body: [
      'The bottom-centre control is a bordered box showing the current layer name and its position, for example COUNTRIES 1 / 4. Use the left and right arrows inside it to step through the layers; the globe updates immediately. Keys 1 to 4 jump straight to a layer, and the arrow keys step through them in order.',
      'Tap or click any beacon to open its card. Press Escape to dismiss it. Press H to hide the interface and D to open these docs.',
    ],
  },
  {
    id: 'config',
    title: 'Globe Configuration',
    body: [
      'All content is declared in src/geora/config.js. The engine in lib/scene.js reads only the fields it needs, so a host replaces an array rather than editing a renderer.',
      'places supplies the geographic anchors every location-based layer is derived from: code, iso2, name, country, region, lat, lon, pop, tz, curr and fact.',
      'centers supplies the AI campuses and landmarks the polaroid photographs, while defaultMetric fixes what the analytics layer is scored by. The halftone and visual profile controls are plain numbers pushed into the shader, not hard-coded behaviour.',
    ],
  },
  {
    id: 'modes',
    title: 'Selection Modes',
    body: [
      'Four selections ship by default: countries, polaroids, analytics and AI centers. Each owns one three.js group, so switching swaps the contents of the planet rather than stacking overlays on top of it.',
      'Number keys 1 to 4 jump directly to a selection. The pagination arrows at the bottom centre step through them in order, as do the left and right arrow keys.',
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
    id: 'polaroids',
    title: 'Polaroids',
    body: [
      'One photograph per nation, of that nation best-known landmark, pinned at the real coordinates of the landmark rather than at its capital. The card names the landmark, the nation and the coordinates, and credits the photographer.',
      'The set is declared in data/landmarks.js and downloaded into public/landmarks by scripts/cache-landmarks.mjs, which reads each landmark Wikipedia article for both its lead photograph and its coordinates. Attribution for every file is written to public/landmarks/credits.json, since the images are CC BY-SA or public domain.',
      'There is no upload. Adding a country means adding an entry to landmarks.js and re-running npm run landmarks, so the layer content is versioned with the code rather than living in the browser.',
      'Selecting a polaroid focuses the globe on the landmark, not on the nation it belongs to.',
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    body: [
      'Text-based only. There is no 3D graph: the globe floats the value over each nation, sized by magnitude so a strong reading carries further than a weak one, and the full numbers and ranking live in the card.',
      'Each float is tinted a stable colour derived from the nation code, drawn on a solid black chip. The chip does not follow the theme, deliberately: it reads the same on paper and on a dark globe and never collides with the accent colour the HUD is tuned to. Neighbouring readings stay apart because each nation carries its own hue.',
      'The bundled dataset is MODELED, not measured. It is derived from population, timezone and a hash of each ISO code, which makes it stable across reloads and plausible in magnitude, but it is not real traffic. Every surface labels it.',
      'Supply your own buildAnalytics implementation through config to drive the layer from a real backend. The metric is config.defaultMetric, not a switch in the interface.',
    ],
  },
  {
    id: 'centers',
    title: 'AI Data Centers',
    body: [
      'AI compute campuses are drawn directly on the globe at their geographic coordinates: the site name floats above its pin as a black text chip, the same way analytics floats a value. Tap one to open a card carrying its operator, country, announced capacity, build status and focus.',
      'Every entry is a real site named by its operator. Status separates operating from under construction from announced and not yet built, so the layer distinguishes running capacity from press releases. Capacity is the announced figure in gigawatts, and reads Not disclosed where the operator has published none: it is never estimated.',
      'Closing the card restores the previous rotation, zoom and globe state. The wide halo marks a metro hosting more than one site. Replace config.centers with your own.',
    ],
  },
  {
    id: 'themes',
    title: 'Themes',
    body: [
      'A theme repaints the globe stage and nothing else: the backdrop behind the sphere, the sphere itself, the dot cloud and the beacons pinned to it. Names describe the globe: Paper White, Ink Black, Amber Screen, Phosphor Green, Blueprint Grid, Dusk Violet.',
      'The interface does not follow the theme. Panels, modals, buttons and text keep the fixed Paper White palette — light surfaces, dark text, one blue accent — so a dark globe never drags the HUD into unreadable contrast, and every theme is legible because each one picks a dot colour that reads against its own sphere.',
    ],
  },
  {
    id: 'profile',
    title: 'Visual Profile',
    body: ['Globe scale, marker visibility, detail level, animation intensity and motion sensitivity. Motion sensitivity off freezes spin, pulses and inertia. Globe scale is a size, not a distance: raising it pulls the camera in so the planet really does read bigger. Shipped defaults are Paper White, globe scale 1.00x, marker visibility 0.75x, detail High, animation 1.00x and motion on.'],
  },
  {
    id: 'halftone',
    title: 'Halftone Calibration',
    body: ['Density, dot scale, contrast, threshold and intensity, plus the ambient fill and ocean dot weights. Threshold sharpens the dot edge, contrast pivots the terminator, density thins the cloud evenly. Shipped defaults are density 100%, dot scale 1.00x, contrast 1.00x, threshold 0.400, intensity 1.00x, ambient fill 0.20 and ocean dots 1.00.'],
  },
  {
    id: 'controls',
    title: 'Controls',
    body: [
      'Drag to rotate, scroll or pinch to zoom. Tap a beacon to inspect it. Reset returns to the default view, Spin toggles automatic rotation, and the eye hides the interface without disabling the globe.',
    ],
  },
  {
    id: 'interaction',
    title: 'Interaction',
    body: [
      'Selection resolves on release so a drag never selects by accident. Tapping bare space dismisses the open card and restores the previous globe position. Every marker is declared in code, so a tap on the globe never creates one.',
    ],
  },
  {
    id: 'keyboard',
    title: 'Keyboard Controls',
    body: [
      'Keys 1 to 4 jump directly to a layer. The pagination arrows at the bottom centre, or the left and right arrow keys, step between layers. H hides or shows the interface. D opens these docs. Escape closes the panels, then dismisses the card.',
    ],
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
      'start() begins the loop. setMode(key) swaps layers. setTheme(theme) applies a globe palette to the stage, the sphere, the dots and the beacons. setHalftone({ density, scale, contrast, threshold, intensity, ocean, ambient }) drives the point shader. setGlobeScale, setMarkerScale, setDetail, setAnimationIntensity and setMotion drive the visual profile.',
      'setAnalytics(analytics, metric) and setPolaroids(list) feed the data layers.',
      'probe(x, y) resolves a tap to a marker or a lat/lon on the sphere. snapshot() and restore(state) bracket a temporary focus so the globe can be handed back exactly as it was.',
      'flyTo(place), reset(), zoomBy(delta), drag(dx, dy), setAutoRotate(on) and dispose() cover navigation and lifecycle.',
    ],
  },
  {
    id: 'examples',
    title: 'Examples',
    body: [
      'Point the globe at your own cities: replace config.places with [{ code, iso2, name, country, lat, lon }] and every location-based layer follows.',
      'Ship your own photographs: replace data/landmarks.js, point src at your own images, and drop the credits step.',
      'Drive analytics from a real backend: return the same shape as buildAnalytics, a byCode map plus totals, and label it however your data deserves.',
      'Add a selection: give it a layer in the engine, add it to config.modes, and it appears in the navigation with no other changes.',
    ],
  },
  {
    id: 'trouble',
    title: 'Troubleshooting',
    body: [
      'Analytics numbers look unfamiliar: the bundled dataset is modeled. It is labeled MODELED everywhere it appears.',
      'A polaroid shows a blank paper: the photograph failed to load from public/landmarks. Re-run npm run landmarks.',
      'The globe is blank: WebGL is unavailable in this browser or hardware acceleration is disabled.',
      'Points look wrong: the Natural Earth topology could not be fetched, so the globe fell back to a coarse land outline. Check that dist/assets contains the topology JSON.',
      'A center will not focus: its ISO code is not in config.places, so there is no territory to fly to. The beacon still draws.',
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    body: [
      'Display groups theme, globe scale, marker visibility, detail level and halftone calibration. Interaction groups motion sensitivity and animation intensity. Audio groups interface sounds. Preferences persist locally.',
    ],
  },
  {
    id: 'credits',
    title: 'Credits',
    body: [
      'Geora Globe. Point cloud from Natural Earth 110m, flags from flagcdn, landmark photographs from Wikipedia, audio synthesized with Tone.js. Photographs are CC BY-SA or public domain and credited in public/landmarks/credits.json.',
    ],
  },
]

export default function DocsPanel({ open, onClose }) {
  return (
    <>
      <div
        data-ui
        onPointerDown={onClose}
        className={`fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        data-ui
        data-closed={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Geora documentation"
        className={`bit-panel slide-right fixed inset-y-0 right-0 z-60 flex w-[92vw] max-w-170 flex-col border-l shadow-2xl sm:w-[min(680px,86vw)] ${
          open ? '' : 'pointer-events-none'
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-(--border-color) p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-(--accent-color)" aria-hidden="true" />
            <span className="truncate text-xs font-bold uppercase tracking-[0.2em]">Documentation</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hud-btn min-h-8 min-w-8 shrink-0 p-1.5 text-sm opacity-70"
            title="Close documentation (Esc)"
            aria-label="Close documentation"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
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
