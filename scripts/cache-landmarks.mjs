// Downloads the polaroid layer's photographs: one iconic landmark per nation in
// src/geora/data/countries.js, pulled from the English Wikipedia page for that
// landmark. Run it after changing LANDMARKS below:  npm run landmarks
//
// Each file lands in public/landmarks/<iso2>.jpg. Coordinates come from the same
// page, so a polaroid is pinned exactly where the landmark is. Attribution for
// every file is written to public/landmarks/credits.json — Wikipedia lead images
// are CC BY-SA or public domain, and redistributing them means naming the author.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = 'public/landmarks'
// Wikimedia requires a descriptive agent, and rejects the default undici one.
const UA = 'Geora/1.0 (https://github.com/geora; geora@example.com) node-fetch'
const API = 'https://en.wikipedia.org/w/api.php'
const THUMB = 1200

// One entry per nation. `title` is an English Wikipedia article title; the image
// is that article's lead photograph and the coordinates are the article's
// coordinates.
const LANDMARKS = [
  { iso2: 'jp', title: 'Mount Fuji' },
  { iso2: 'ph', title: 'Mayon' },
  { iso2: 'cn', title: 'Great Wall of China' },
  { iso2: 'in', title: 'Taj Mahal' },
  { iso2: 'kr', title: 'Gyeongbokgung' },
  { iso2: 'id', title: 'Borobudur' },
  { iso2: 'sg', title: 'Marina Bay Sands' },
  { iso2: 'th', title: 'Grand Palace' },
  { iso2: 'vn', title: 'Hạ Long Bay' },
  { iso2: 'my', title: 'Mount Kinabalu' },
  { iso2: 'pk', title: 'Badshahi Mosque' },
  { iso2: 'sa', title: 'Al-Ula' },
  { iso2: 'ae', title: 'Burj Khalifa' },
  { iso2: 'gb', title: 'Tower Bridge' },
  { iso2: 'fr', title: 'Eiffel Tower' },
  { iso2: 'de', title: 'Neuschwanstein Castle' },
  { iso2: 'it', title: 'Colosseum' },
  { iso2: 'es', title: 'Sagrada Família' },
  { iso2: 'gr', title: 'Acropolis of Athens' },
  { iso2: 'se', title: 'Vasa Museum' },
  { iso2: 'no', title: 'Preikestolen' },
  { iso2: 'nl', title: 'Rijksmuseum' },
  { iso2: 'ch', title: 'Matterhorn' },
  { iso2: 'pl', title: 'Wawel Castle' },
  { iso2: 'ua', title: 'Saint Sophia Cathedral, Kyiv' },
  { iso2: 'pt', title: 'Belém Tower' },
  { iso2: 'ie', title: 'Cliffs of Moher' },
  { iso2: 'is', title: 'Gullfoss' },
  { iso2: 'tr', title: 'Hagia Sophia' },
  { iso2: 'us', title: 'Golden Gate Bridge' },
  { iso2: 'ca', title: 'Niagara Falls' },
  { iso2: 'mx', title: 'Chichen Itza' },
  { iso2: 'br', title: 'Christ the Redeemer (statue)' },
  { iso2: 'ar', title: 'Perito Moreno Glacier' },
  { iso2: 'cl', title: 'Torres del Paine National Park' },
  { iso2: 'pe', title: 'Machu Picchu' },
  { iso2: 'co', title: 'Caño Cristales' },
  { iso2: 'cu', title: 'Havana' },
  { iso2: 'cr', title: 'Arenal Volcano' },
  { iso2: 'eg', title: 'Giza pyramid complex' },
  { iso2: 'za', title: 'Table Mountain' },
  { iso2: 'ke', title: 'Mount Kenya' },
  { iso2: 'ng', title: 'Zuma Rock' },
  { iso2: 'ma', title: 'Aït Benhaddou' },
  { iso2: 'et', title: 'Lalibela' },
  { iso2: 'gh', title: 'Cape Coast Castle' },
  { iso2: 'au', title: 'Uluru' },
  { iso2: 'nz', title: 'Milford Sound' },
  { iso2: 'fj', title: 'Mamanuca Islands' },
  { iso2: 'pg', title: 'Owen Stanley Range' },
]

function clean(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

// The API only emits a scaled thumbnail when the original is wider than the
// requested size; below that it hands back the original on upload.wikimedia.org,
// which refuses direct file fetches. So walk sizes down until one is produced.
const SIZES = [THUMB, 1024, 800, 640, 480, 320, 240]

async function pageFor(title, size) {
  const url =
    `${API}?action=query&format=json&redirects=1&prop=pageimages|coordinates` +
    `&piprop=thumbnail|name&pithumbsize=${size}&titles=${encodeURIComponent(title)}`
  const pages = Object.values((await getJSON(url)).query?.pages ?? {})
  const page = pages[0]
  if (!page || page.missing !== undefined) throw new Error(`no article for ${title}`)
  return page
}

async function describe({ iso2, title }) {
  let page = null
  let source = null
  for (const size of SIZES) {
    page = await pageFor(title, size)
    const candidate = page.thumbnail?.source
    if (candidate && candidate.includes('//thumb.')) {
      source = candidate
      break
    }
  }
  if (!source) throw new Error(`no scaled lead image on ${title}`)

  const { lat, lon } = page.coordinates?.[0] ?? {}
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error(`no coordinates for ${title}`)

  // the lead file name on Commons carries the attribution metadata
  const info = await getJSON(
    `${API}?action=query&format=json&prop=imageinfo&iiprop=extmetadata` +
      `&iiextmetadatafilter=Artist|LicenseShortName&titles=${encodeURIComponent(`File:${page.pageimage}`)}`,
  )
  const infoPages = info?.query?.pages ?? {}
  const infoPage = Object.values(infoPages)[0]
  const meta = infoPage?.imageinfo?.[0]?.extmetadata ?? {}

  return {
    iso2,
    title,
    lat,
    lon,
    source,
    artist: clean(meta.Artist?.value) || 'Unknown',
    license: clean(meta.LicenseShortName?.value) || 'see Commons',
  }
}

async function save(url, target) {
  let last = new Error('no attempt made')
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt) await new Promise((wait) => setTimeout(wait, 1200))
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!res.ok) throw new Error(String(res.status))
      const body = Buffer.from(await res.arrayBuffer())
      if (body.byteLength < 4096) throw new Error('suspiciously small image')
      await writeFile(target, body)
      return body.byteLength
    } catch (error) {
      last = error
    }
  }
  throw new Error(`${last.message} ${url}`)
}

await mkdir(path.join(root, OUT), { recursive: true })

const credits = []
const manifest = []
const failed = []
let bytes = 0

for (const landmark of LANDMARKS) {
  try {
    const described = await describe(landmark)
    const name = `${landmark.iso2}.jpg`
    // one file per second keeps the script under Wikimedia's robot policy
    bytes += await save(described.source, path.join(root, OUT, name))
    await new Promise((wait) => setTimeout(wait, 1000))
    credits.push({
      iso2: described.iso2,
      file: `${OUT}/${name}`,
      title: described.title,
      source: described.source,
      artist: described.artist,
      license: described.license,
    })
    manifest.push({
      iso2: described.iso2,
      title: described.title,
      lat: Number(described.lat.toFixed(4)),
      lon: Number(described.lon.toFixed(4)),
    })
    console.log(`ok    ${name.padEnd(10)} ${described.title} — ${described.artist} (${described.license})`)
  } catch (error) {
    failed.push(`${landmark.iso2} ${landmark.title}: ${error.message}`)
    console.log(`FAIL  ${landmark.iso2} ${landmark.title}: ${error.message}`)
  }
}

await writeFile(path.join(root, OUT, 'credits.json'), `${JSON.stringify(credits, null, 2)}\n`)

console.log(`\nlandmarks ${manifest.length}/${LANDMARKS.length} downloaded ${(bytes / 1024 / 1024).toFixed(1)} MB`)
if (failed.length) {
  console.log(`failed ${failed.length}:`)
  for (const line of failed) console.log(`  ${line}`)
}
console.log('manifest:')
console.log(JSON.stringify(manifest))
