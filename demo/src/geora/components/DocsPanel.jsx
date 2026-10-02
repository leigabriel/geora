// The Docs entry in the top right: the package reference, trimmed to what a
// developer needs while the globe is on screen, laid out as one continuous
// page. There is no tab strip — the whole document scrolls. The material
// follows README.md and documents only the public geora-globe API.
const SECTIONS = [
  {
    id: 'intro',
    title: 'Documentation',
    body: [
      'Geora is a spatial visualization interface built around one interactive halftone globe — rotate it, zoom it, tap the beacons pinned to every nation. Its engine ships independently as geora-globe: a framework-agnostic Three.js point-cloud planet presented as a custom element and as a JavaScript class.',
      'Setup: npm install geora-globe, import it once — the import registers <geora-globe> — and drop the tag into any page. No React, no Tailwind, no build step required.',
      'How it works: the element fills its parent and mounts the renderer inside its shadow root. Configuration flows in through attributes, properties and data; interactions flow out as bubbling geora-* CustomEvents with plain JSON payloads. A theme recolours the stage, a mode swaps which layer is on screen.',
      'Styles live in the component shadow DOM, so nothing leaks: the package emits no global CSS and page styles cannot reach in. The only runtime dependencies are three, d3-geo and topojson-client.',
      'This demo consumes the package exactly like an external consumer: it imports the geora-globe specifier and never reaches into the package source.',
    ],
  },
  {
    id: 'quickstart',
    title: 'Quick Start',
    body: [
      'In HTML: <geora-globe theme="dark" mode="country" auto-rotate></geora-globe>. The element fills its parent, so give it or an ancestor a size. Import the module from your bundler, or from a CDN with the +esm suffix.',
      'Listen for events to build your own interface: geora-select fires when a beacon is tapped, geora-hover when the pointer enters one, geora-clear when the selection closes. Every event is a bubbling CustomEvent, so listening on the element or on any ancestor works.',
      'Keys 1 to 9 jump to a layer when the globe has focus, arrows rotate, plus and minus zoom, Home resets, Escape clears. This demo adds H to hide the interface and D to open these docs.',
    ],
  },
  {
    id: 'attributes',
    title: 'API Reference — Attributes',
    body: [
      'Every attribute has a same-named camelCase property (flag-base becomes flagBase). Attributes are declarative; writing a property after mount applies immediately. Booleans are value-aware: present means true, "false", "0" and "off" mean false.',
      'Core: theme, mode, modes (comma-separated subset), auto-rotate (alias of spinning), motion (auto / on / off), flag-base, persistence (localStorage under geora-globe:prefs:v1).',
      'HUD: minimal hides the whole built-in interface; show-hud is the master switch; show-tooltip, show-info-card, show-controls, show-navigation and show-settings trim it further; show-borders and show-markers trim the globe.',
      'Visual: globe-scale (default 0.7), marker-scale (0.75), detail (0 low, 1 medium, 2 high), animation (1), and the halftone set: halftone-density, halftone-scale, contrast, threshold, intensity, ambient, ocean-opacity.',
    ],
  },
  {
    id: 'api',
    title: 'API Reference — Properties and Methods',
    body: [
      'Configuration properties: theme (key or colour object), mode, modes, spinning / autoRotate, motion, detail, globeScale, markerScale, animation, halftone (partial object merges), flagBase, minimal, persistence, and one show* boolean per HUD piece. settings is a read-only snapshot; selection is the current public marker or null.',
      'Data: assign globe.data = { countries, centers, markers, landmarks } or call setData() with any subset — omitted collections keep their contents. Supplying markers adds the markers layer to the rotation; removing them drops it.',
      'Selection and camera: selectCountry(code), clearSelection(), flyTo(lat, lon), rotate(dx, dy), zoom(delta), reset() (clears the selection and returns the default view).',
      'Lifecycle: start(), stop(), destroy(). The loop starts on connect, pauses on disconnect, and destroy() releases every GPU resource. The headless class is GeoraGlobe — same surface, no attributes, no built-in HUD. registerGeoraGlobe("my-globe") defines an alias tag.',
    ],
  },
  {
    id: 'events',
    title: 'Events',
    body: [
      'geora-ready {} — the render loop started. geora-hover { marker, x, y } — the hovered marker changed; marker is null when the pointer leaves. geora-select { marker, x, y } — a marker was selected; x and y are null for programmatic selection.',
      'geora-country-select and geora-marker-select carry the same payload for those kinds. geora-sphere-select { lat, lon, onLand, country, distanceKm, x, y } reports a tap on the bare sphere. geora-clear {} fires when the selection closes, including when a mode change clears it.',
      'geora-mode-change { mode, modes } reports the active layer and the available list. geora-theme-change { theme, key } carries the public colour object (key is null for custom themes). geora-reset {} fires after reset().',
    ],
  },
  {
    id: 'schema',
    title: 'Data Schema',
    body: [
      'Country: { code, iso2, country, name, lat, lon, region, pop, tz, curr, fact }. code (ISO alpha-3) is the join key; lat and lon are required. Center: { id, name, operator, code, lat, lon, status, powerGW, tier, focus }. Marker: { id, name, lat, lon, type }. Landmark: { iso2, country, caption, lat, lon, image }.',
      'The package ships 50 countries, 73 announced AI campuses and 50 landmark entries as defaults — all optional, all replaced through data. Analytics rows are modeled from population, timezone and a hash of the country code: stable, plausible, labelled as modeled, never measured.',
      'Images are URLs you supply. joinLandmarks(places, imageBase) builds landmark entries as image = imageBase/iso2.jpg; flag-base does the same for flags as base/iso2.png with an @2x variant. With flag-base empty the default, nothing is requested and markers fall back to code chips.',
    ],
  },
  {
    id: 'themes',
    title: 'Themes',
    body: [
      'Six built-ins: paper (PAPER WHITE), dark (INK BLACK), amber (AMBER SCREEN), matrix (PHOSPHOR GREEN), blueprint (BLUEPRINT GRID) and dusk (DUSK VIOLET). Set the theme attribute or assign the theme property.',
      'A theme repaints the globe stage only — backdrop, sphere, dots and beacons. The component HUD and your page chrome keep their own palette, so a dark globe never drags the interface into unreadable contrast.',
      'A custom theme is a plain object — { label, background, globe, foreground, accent, border } in #rrggbb, #rgb or 0xRRGGBB — assigned to the theme property. Missing colours fall back, so a partial theme stays legible. THEMES, THEME_KEYS, nextTheme() and themeHex() are exported for your own picker.',
    ],
  },
  {
    id: 'modes',
    title: 'Modes',
    body: [
      'Five layers: country (beacons per nation), polaroid (photographs pinned at landmarks), analytics (modeled telemetry), centers (announced AI campuses) and markers (host-supplied). Each owns its own three.js group, so switching swaps the planet contents instead of stacking overlays.',
      'The rotation auto-limits to layers that have data — markers only appears once you supply marker data. Restrict further with modes="country, centers" or the modes property. Number keys, the navigation arrows and geora-mode-change all walk the same list.',
    ],
  },
  {
    id: 'customization',
    title: 'Customization',
    body: [
      'Own the interface: set minimal (or show-hud false) to hide the built-in tooltip, card, controls, navigation and settings, then build your own from the events. This demo does exactly that — React components around one <geora-globe minimal>.',
      'Restyle through custom properties on the element: --geora-font, --geora-panel, --geora-panel-border, --geora-text, --geora-text-dim, --geora-accent, --geora-shadow, --geora-radius and --geora-stage-bg. The same sheet is exported as geora-globe/styles.css for reference.',
      'Persistence: the persistence attribute stores theme, mode, spinning, motion, HUD switches and the visual profile under geora-globe:prefs:v1, and restores them over the shipped defaults. Without it, the package never touches localStorage.',
    ],
  },
  {
    id: 'examples',
    title: 'Examples',
    body: [
      'React: render <geora-globe ref={ref} theme="matrix" /> and add listeners in useEffect, removing them in the cleanup. Vue: bind a template ref and listen in onMounted / onBeforeUnmount. Svelte: bind:this and onMount / onDestroy. There is no framework-specific package — the element is a normal DOM node.',
      'Headless: new GeoraGlobe({ container, theme, mode, data }) gives the same properties, methods and events with no attributes and no built-in HUD — for applications that own every pixel.',
      'Custom data end to end: pass { countries, centers, markers, landmarks } through data or setData(), set flag-base for sprites, and listen for geora-select to render your own card. A centre without a matching country code still draws, it simply has no territory to fly to.',
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    body: [
      'detail is the main lever: 0 draws the fewest points, 2 the densest — ship 0 or 1 on constrained devices. animation scales every pulse and bob and can be 0 for a static-but-interactive globe. Globe scale is a size, not a distance: raising it pulls the camera in.',
      'motion="off" (or the OS reduced-motion setting under motion="auto") freezes auto-rotation, pulses and drag inertia in one switch. stop() pauses the loop, destroy() releases it, and the renderer pauses whenever the element leaves the DOM.',
    ],
  },
  {
    id: 'a11y',
    title: 'Accessibility',
    body: [
      'The element is focusable, carries role="application" with an aria-label you can override, and announces every selection through a polite live region — including selections made through your own interface.',
      'With focus on the globe: arrows rotate, plus and minus zoom, Home resets, 1 to 9 jump to a mode, Escape closes settings and then clears the selection, Tab moves on. Outside the globe, drag, wheel and tap work with pointer and touch.',
      'Reduced motion follows prefers-reduced-motion by default and is overridable per instance with motion="on" or "off". Cursors reflect the gesture: grab at rest, grabbing while dragging, pointer over a beacon.',
    ],
  },
  {
    id: 'demo',
    title: 'This Demo',
    body: [
      'The bottom-centre control shows the running layer and its position, for example COUNTRIES 1 / 4; its arrows step through the layers, keys 1 to 4 jump directly. Tap a beacon to open its card, Escape or a tap on bare space to dismiss it — the globe returns to the rotation and zoom it had before the selection.',
      'Settings carries theme, globe scale, marker visibility, detail, halftone calibration, motion sensitivity, animation and the synthesized audio. The eye button or H hides the whole interface without disabling the globe; D reopens these docs.',
      'Sound is Tone.js only, no samples: a speed-sensitive drag ratchet with a release thunk, a select chime, hover blips and UI pips, behind a persisted mute toggle. It lives in the demo, not in the package.',
    ],
  },
  {
    id: 'credits',
    title: 'Credits',
    body: [
      'geora-globe, MIT licensed. Point cloud from Natural Earth 110m via world-atlas, flags from flagcdn, landmark photographs from Wikipedia (CC BY-SA or public domain, credited in public/landmarks/credits.json), interface set in Geist Pixel and JetBrains Mono (SIL OFL), audio synthesized with Tone.js in this demo.',
      {
        parts: [
          'Source code: ',
          { label: 'github.com/leigabriel/geora', href: 'https://github.com/leigabriel/geora' },
        ],
      },
      {
        parts: [
          'Instagram: ',
          { label: '@leimxnsquare', href: 'https://instagram.com/leimxnsquare' },
          ' · Email: ',
          { label: 'malibiranleigabriel@gmail.com', href: 'mailto:malibiranleigabriel@gmail.com' },
        ],
      },
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
                {section.body.map((paragraph, index) => (
                  <p key={index} className="text-[12px] leading-relaxed opacity-90">
                    {typeof paragraph === 'string'
                      ? paragraph
                      : paragraph.parts.map((part, partIndex) =>
                          typeof part === 'string' ? (
                            part
                          ) : (
                            <a
                              key={partIndex}
                              href={part.href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-(--accent-color) underline underline-offset-2 hover:opacity-80"
                            >
                              {part.label ?? part.href}
                            </a>
                          ),
                        )}
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
