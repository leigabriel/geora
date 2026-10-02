// The Docs entry in the top right: the package reference as a scannable sheet —
// install steps and attribute / API / event / data / theme tables instead of
// prose, so a developer can find one line while the globe is on screen. It
// follows README.md and documents only the public geora-globe API.
const README_URL = 'https://raw.githubusercontent.com/leigabriel/geora/master/README.md'
const VERSION = '0.2.0'
const CDN = `https://cdn.jsdelivr.net/npm/geora-globe@${VERSION}/+esm`

const SECTIONS = [
  {
    id: 'start',
    title: 'Get started',
    note: 'geora-globe is a framework-agnostic Three.js halftone globe: one custom element, one JavaScript class. No React, no Tailwind, no build step.',
    steps: [
      'npm install geora-globe  (pnpm add / yarn add work too)',
      "import 'geora-globe' — the import registers <geora-globe>",
      'Give it a size: the element fills its parent, so set width and height on it or on an ancestor',
      '<geora-globe theme="paper" mode="country" auto-rotate minimal></geora-globe>',
      'globe.addEventListener("geora-select", ({ detail }) => …) to build your own UI',
    ],
    cdn: `No bundler? <script type="module" src="${CDN}"></script>`,
  },
  {
    id: 'attributes',
    title: 'Attributes',
    note: 'Every attribute has a same-named camelCase property (flag-base → flagBase). Booleans are value-aware: present means true, "false", "0" and "off" mean false. Also halftone-scale, contrast, intensity, ambient and ocean-opacity.',
    head: ['Attribute', 'Default', 'What it does'],
    rows: [
      ['theme', 'paper', 'Globe palette: sphere, dots, borders, beacons. Page background never changes'],
      ['mode', 'country', 'Active layer: country, polaroid, analytics, centers, markers'],
      ['modes', 'auto', 'Comma-separated subset; auto = every layer that has data'],
      ['auto-rotate', 'true', 'Spin the globe (alias of the spinning property)'],
      ['motion', 'auto', 'auto follows prefers-reduced-motion; on / off override it'],
      ['minimal', 'false', 'Hide the built-in HUD, so only the globe shows'],
      ['show-hud', 'true', 'Master switch for the built-in HUD'],
      ['show-tooltip', 'true', 'Hover tooltip'],
      ['show-info-card', 'true', 'Selection card'],
      ['show-controls', 'true', 'Reset / Spin buttons'],
      ['show-navigation', 'true', 'Layer navigation'],
      ['show-settings', 'false', 'Settings toggle and panel'],
      ['show-markers', 'true', 'Beacons, flags and values'],
      ['show-borders', 'true', 'Country outlines'],
      ['flag-base', '""', 'Flags as ${flag-base}/${iso2}.png (+ @2x). Empty = code chips, no requests'],
      ['globe-scale', '0.7', 'Globe size multiplier'],
      ['marker-scale', '0.75', 'Beacon size multiplier'],
      ['detail', '2', 'Dot density: 0 low, 1 medium, 2 high'],
      ['animation', '1', 'Animation intensity multiplier (0 – 2.5)'],
      ['halftone-density', '1.0', 'Dot cloud density'],
      ['threshold', '0.4', 'Dot edge threshold'],
      ['persistence', 'false', 'Store preferences in localStorage (geora-globe:prefs:v1)'],
    ],
  },
  {
    id: 'api',
    title: 'Properties and methods',
    head: ['Member', 'Notes'],
    rows: [
      ['theme', 'Built-in key or a custom colour object'],
      ['mode / modes', 'Switch layer (clears the selection) / restrict the rotation'],
      ['spinning / motion / detail / animation', 'Booleans and 0 – 2 numbers, as in the table above'],
      ['globeScale / markerScale', 'Size multipliers, applied live'],
      ['halftone', 'Partial object merge: { density, threshold, contrast, … }'],
      ['data', 'globe.data = { countries, centers, markers, landmarks } — partial is fine'],
      ['setData(next)', 'Merge any subset; omitted collections keep their contents'],
      ['selectCountry(code)', 'true when found; accepts ISO alpha-3 or alpha-2'],
      ['clearSelection()', 'true when something was selected'],
      ['selection', 'The selected public marker, or null'],
      ['settings', 'Read-only snapshot of the effective settings'],
      ['flyTo(lat, lon)', 'Camera to a point'],
      ['rotate(dx, dy) / zoom(delta)', 'Keyboard-accessible drag and wheel'],
      ['reset()', 'Default camera, clears the selection'],
      ['start() / stop() / destroy()', 'Loop control and full teardown'],
      ['registerGeoraGlobe(tag)', 'Define an alias tag; GeoraGlobe is the headless class'],
    ],
  },
  {
    id: 'events',
    title: 'Events',
    note: 'Every event bubbles and crosses shadow boundaries, so listening on the element or any ancestor works.',
    head: ['Event', 'Detail', 'Fires when'],
    rows: [
      ['geora-ready', '{}', 'The render loop started'],
      ['geora-hover', '{ marker, x, y }', 'The hovered marker changed (marker: null when it leaves)'],
      ['geora-select', '{ marker, x, y }', 'A marker was selected (x, y null if programmatic)'],
      ['geora-country-select', '{ country, x, y }', 'A country beacon was selected'],
      ['geora-marker-select', '{ marker, x, y }', 'A host-supplied marker was selected'],
      ['geora-sphere-select', '{ lat, lon, onLand, country, distanceKm, x, y }', 'A tap on the bare sphere'],
      ['geora-clear', '{}', 'The selection closed (also on mode change)'],
      ['geora-mode-change', '{ mode, modes }', 'The active layer or the mode list changed'],
      ['geora-theme-change', '{ theme, key }', 'The theme changed (background is advisory)'],
      ['geora-reset', '{}', 'reset() ran'],
    ],
  },
  {
    id: 'data',
    title: 'Data',
    note: 'Defaults ship with the package: 50 countries, 73 AI campuses, 50 landmarks — every collection is optional and fully replaceable. Analytics values are MODELED (population + timezone + a hash of the country code): stable and plausible, never measured.',
    head: ['Collection', 'Fields', 'Notes'],
    rows: [
      ['countries', 'code (ISO alpha-3), iso2, country, name, lat, lon, region, pop, tz, curr, fact', 'code, lat and lon are required'],
      ['centers', 'id, name, operator, code, lat, lon, status, powerGW, tier, focus', 'powerGW is the announced figure, never estimated'],
      ['markers', 'id, name, lat, lon, type', 'Supplying any marker adds the markers layer'],
      ['landmarks', 'iso2, country, caption, lat, lon, image', 'image is any URL; joinLandmarks(places, base) builds base/${iso2}.jpg'],
    ],
  },
  {
    id: 'images',
    title: 'Flags and photographs',
    note: 'The package ships no images, so nothing is requested until you point it at your own files — offline-safe out of the box, and a missing file never breaks a beacon.',
    head: ['Asset', 'Pattern'],
    rows: [
      ['Flags', 'flag-base="/flags" requests /flags/ph.png and /flags/ph@2x.png'],
      ['Polaroids', 'landmark.image = "landmarks/jp.jpg" — any URL you like'],
      ['No flag file', 'The beacon falls back to an ISO code chip'],
      ['joinLandmarks(places, base)', 'Builds landmark entries with image URLs from your countries'],
    ],
  },
  {
    id: 'themes',
    title: 'Themes',
    note: 'A theme recolours the globe — sphere, dots, borders, beacons — and never the page background: the stage stays on its default paper white, so the overall look remains paper whichever theme is active. A custom theme is a plain object { background, globe, foreground, accent, border } with missing colours falling back; background is advisory, so apply it yourself through --geora-stage-bg if you want full-page theming.',
    head: ['Key', 'Label', 'Globe'],
    rows: [
      ['paper', 'PAPER WHITE', 'Light sphere, ink dots, blue accents'],
      ['dark', 'INK BLACK', 'Ink sphere, white dots, mint accents'],
      ['amber', 'AMBER SCREEN', 'Dark amber sphere, gold dots'],
      ['matrix', 'PHOSPHOR GREEN', 'Near-black sphere, phosphor dots'],
      ['blueprint', 'BLUEPRINT GRID', 'Deep blue sphere, pale blue dots'],
      ['dusk', 'DUSK VIOLET', 'Violet-black sphere, lilac dots'],
    ],
  },
  {
    id: 'modes',
    title: 'Modes',
    head: ['Key', 'Label', 'Shows'],
    rows: [
      ['country', 'COUNTRIES', 'One beacon + flag per nation'],
      ['polaroid', 'POLAROIDS', 'One photograph per landmark, pinned where it stands'],
      ['analytics', 'ANALYTICS', 'Modeled telemetry per nation (labelled MODELED)'],
      ['centers', 'AI DATA CENTERS', 'Announced AI compute campuses'],
      ['markers', 'MARKERS', 'Host-supplied markers — only present once you supply data'],
    ],
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Applies while the globe has focus; arrows, + and -, Home, digits and Escape are captured and prevent default.',
    head: ['Key', 'Action'],
    rows: [
      ['← → ↑ ↓', 'Rotate'],
      ['+ / -', 'Zoom'],
      ['Home', 'Reset the view'],
      ['1 – 9', 'Jump to a layer'],
      ['Escape', 'Close settings, then clear the selection'],
      ['Tab', 'Leave the globe for the next control'],
    ],
  },
  {
    id: 'styling',
    title: 'Styling',
    note: 'Styles live in the shadow DOM: the package emits no global CSS, no Tailwind is required, and page styles cannot leak in.',
    head: ['Custom property', 'Use'],
    rows: [
      ['--geora-stage-bg', 'Page backdrop behind the globe (themes never change it)'],
      ['--geora-accent', 'Accent colour used by the built-in HUD'],
      ['--geora-panel / --geora-panel-border', 'Panel surface and border'],
      ['--geora-text / --geora-text-dim', 'HUD text colours'],
      ['--geora-font', 'HUD type stack'],
      ['--geora-shadow / --geora-radius', 'Panel shadow and corner radius'],
    ],
  },
  {
    id: 'frameworks',
    title: 'Frameworks',
    note: 'There is no framework-specific package — the element is a normal DOM node in all of them.',
    head: ['Framework', 'Usage'],
    rows: [
      ['Plain HTML', `<script type="module" src="${CDN}"></script>`],
      ['React', '<geora-globe ref={ref} theme="matrix" /> — add listeners in useEffect'],
      ['Vue', '<geora-globe ref="globe" mode="polaroid" /> — onMounted / onBeforeUnmount'],
      ['Svelte', '<geora-globe bind:this={globe} mode="analytics" /> — onMount / onDestroy'],
      ['Headless JS', 'new GeoraGlobe({ container, theme, data }) — no attributes, no HUD'],
    ],
  },
  {
    id: 'demo',
    title: 'This demo',
    note: 'Sound is Tone.js only, no samples: a speed-sensitive drag ratchet, a select chime, hover blips and UI pips, all started on your first gesture and behind a persisted mute toggle.',
    head: ['Key', 'Action'],
    rows: [
      ['H', 'Hide the whole interface without disabling the globe'],
      ['D', 'Open this reference'],
      ['1 – 4', 'Jump to a layer'],
      ['← →', 'Step through layers from the navigation'],
      ['Click a beacon', 'Open its card; Escape or a tap on bare space dismisses it'],
    ],
  },
  {
    id: 'credits',
    title: 'Credits and contact',
    body: [
      'geora-globe, MIT licensed. Point cloud from Natural Earth 110m via world-atlas, flags from flagcdn, landmark photographs from Wikipedia (CC BY-SA or public domain, credited in public/landmarks/credits.json), interface set in Geist Pixel and JetBrains Mono (SIL OFL), audio synthesized with Tone.js in this demo.',
    ],
    links: [
      { label: 'github.com/leigabriel/geora', href: 'https://github.com/leigabriel/geora' },
      { label: 'instagram.com/leimxnsquare', href: 'https://instagram.com/leimxnsquare' },
      { label: 'malibiranleigabriel@gmail.com', href: 'mailto:malibiranleigabriel@gmail.com' },
    ],
  },
]

function toMarkdown() {
  const lines = [`# geora-globe ${VERSION} — reference`, '', 'Generated from the in-app documentation panel.', '']
  for (const section of SECTIONS) {
    lines.push(`## ${section.title}`, '')
    if (section.note) lines.push(section.note, '')
    if (section.steps) section.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`)), lines.push('')
    if (section.cdn) lines.push(section.cdn, '')
    if (section.head) {
      lines.push(`| ${section.head.join(' | ')} |`, `| ${section.head.map(() => '---').join(' | ')} |`)
      for (const row of section.rows) lines.push(`| ${row.join(' | ')} |`)
      lines.push('')
    }
    if (section.body) lines.push(...section.body, '')
    if (section.links) lines.push(section.links.map((l) => `[${l.label}](${l.href})`).join(' · '), '')
  }
  return lines.join('\n')
}

function save(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

async function downloadReadme() {
  try {
    const res = await fetch(README_URL)
    if (!res.ok) throw new Error(String(res.status))
    save(await res.blob(), 'geora-globe-README.md')
  } catch {
    window.open(README_URL, '_blank', 'noopener')
  }
}

function downloadDocs() {
  save(new Blob([toMarkdown()], { type: 'text/markdown' }), 'geora-globe-docs.md')
}

const rowLabel = 'border-b border-(--border-color)/60 py-1.5 pr-2 align-top font-bold whitespace-nowrap'
const rowCell = 'border-b border-(--border-color)/60 py-1.5 pr-2 align-top'

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
        className={`bit-panel slide-right fixed inset-y-0 right-0 z-60 flex w-[94vw] max-w-260 flex-col border-l shadow-2xl sm:w-[min(960px,92vw)] ${
          open ? '' : 'pointer-events-none'
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-(--border-color) p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-(--accent-color)" aria-hidden="true" />
            <span className="truncate text-xs font-bold uppercase tracking-[0.2em]">Documentation</span>
            <span className="shrink-0 text-[10px] opacity-50">v{VERSION}</span>
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

              {section.note && <p className="mb-2 text-[11px] leading-relaxed opacity-75">{section.note}</p>}

              {section.steps && (
                <ol className="mb-2 flex flex-col gap-1.5">
                  {section.steps.map((step, index) => (
                    <li key={index} className="flex gap-2 text-[11px] leading-relaxed">
                      <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center bg-(--accent-color) text-[9px] font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="opacity-90">{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {section.cdn && <p className="mb-2 text-[11px] leading-relaxed opacity-75">{section.cdn}</p>}

              {section.head && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-104 border-collapse text-[11px]">
                    <thead>
                      <tr>
                        {section.head.map((cell) => (
                          <th
                            key={cell}
                            scope="col"
                            className="border-b border-(--border-color) py-1 pr-3 text-left text-[9px] font-bold uppercase tracking-[0.16em] opacity-55"
                          >
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-(--accent-subtle)">
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className={cellIndex === 0 ? rowLabel : rowCell}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.body?.map((paragraph, index) => (
                <p key={index} className="mb-1.5 text-[11px] leading-relaxed opacity-90">
                  {paragraph}
                </p>
              ))}

              {section.links && (
                <p className="text-[11px]">
                  {section.links.map((link, index) => (
                    <span key={link.href}>
                      {index > 0 && <span className="px-1.5 opacity-50">·</span>}
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-(--accent-color) underline underline-offset-2 hover:opacity-80"
                      >
                        {link.label}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </section>
          ))}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-(--border-color) p-3 sm:px-5">
          <button type="button" onClick={downloadReadme} className="hud-btn px-2.5 text-[10px]" title={README_URL}>
            <i className="fa-solid fa-download" aria-hidden="true" /> README.md
          </button>
          <button type="button" onClick={downloadDocs} className="hud-btn px-2.5 text-[10px]" title="This panel as Markdown">
            <i className="fa-solid fa-download" aria-hidden="true" /> Docs (.md)
          </button>
          <span className="ml-auto text-[10px] opacity-45">geora-globe {VERSION} · MIT</span>
        </footer>
      </aside>
    </>
  )
}