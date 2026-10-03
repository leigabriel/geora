// The polaroid layer's content: one landmark per nation, pinned at the real
// coordinates of the landmark it shows.
//
// `iso2` joins the landmark to a nation in data/countries.js and `caption` is
// what the polaroid prints under the picture. The coordinates come from the
// same Wikipedia article the photographs came from, so a card lands on the
// landmark itself rather than on its capital.
//
// Provenance: coordinates and captions read off each landmark's Wikipedia
// article; added 2026-10-02. The photographs are CC BY-SA or public domain and
// are credited in the demo's public/landmarks/credits.json.
//
// The photographs themselves are not part of the package: hosts supply image
// URLs through the data API (see joinLandmarks).
import { COUNTRIES_DATA } from './countries.js'

export const LANDMARKS = [
  { iso2: 'jp', caption: 'Mount Fuji', lat: 35.3608, lon: 138.7275 },
  { iso2: 'ph', caption: 'Mayon', lat: 13.2567, lon: 123.685 },
  { iso2: 'cn', caption: 'Great Wall', lat: 40.4314, lon: 116.5644 },
  { iso2: 'in', caption: 'Taj Mahal', lat: 27.175, lon: 78.0419 },
  { iso2: 'kr', caption: 'Gyeongbokgung', lat: 37.5799, lon: 126.9768 },
  { iso2: 'id', caption: 'Borobudur', lat: -7.608, lon: 110.204 },
  { iso2: 'sg', caption: 'Marina Bay Sands', lat: 1.2825, lon: 103.86 },
  { iso2: 'th', caption: 'Grand Palace', lat: 13.7501, lon: 100.492 },
  { iso2: 'vn', caption: 'Ha Long Bay', lat: 20.9, lon: 107.2 },
  { iso2: 'my', caption: 'Mount Kinabalu', lat: 6.075, lon: 116.5586 },
  { iso2: 'pk', caption: 'Badshahi Mosque', lat: 31.5881, lon: 74.3094 },
  { iso2: 'sa', caption: 'Al-Ula', lat: 26.6089, lon: 37.9236 },
  { iso2: 'ae', caption: 'Burj Khalifa', lat: 25.1972, lon: 55.2742 },
  { iso2: 'gb', caption: 'Tower Bridge', lat: 51.5056, lon: -0.0753 },
  { iso2: 'fr', caption: 'Eiffel Tower', lat: 48.8582, lon: 2.2945 },
  { iso2: 'de', caption: 'Neuschwanstein', lat: 47.5575, lon: 10.7494 },
  { iso2: 'it', caption: 'Colosseum', lat: 41.8903, lon: 12.4922 },
  { iso2: 'es', caption: 'Sagrada Familia', lat: 41.4037, lon: 2.1743 },
  { iso2: 'gr', caption: 'Acropolis', lat: 37.9717, lon: 23.7261 },
  { iso2: 'se', caption: 'Vasa Museum', lat: 59.3279, lon: 18.0914 },
  { iso2: 'no', caption: 'Preikestolen', lat: 58.9867, lon: 6.1875 },
  { iso2: 'nl', caption: 'Rijksmuseum', lat: 52.36, lon: 4.8853 },
  { iso2: 'ch', caption: 'Matterhorn', lat: 45.9764, lon: 7.6586 },
  { iso2: 'pl', caption: 'Wawel Castle', lat: 50.0539, lon: 19.9347 },
  { iso2: 'ua', caption: 'Saint Sophia, Kyiv', lat: 50.4528, lon: 30.5144 },
  { iso2: 'pt', caption: 'Belem Tower', lat: 38.6917, lon: -9.2161 },
  { iso2: 'ie', caption: 'Cliffs of Moher', lat: 52.9718, lon: -9.4263 },
  { iso2: 'is', caption: 'Gullfoss', lat: 64.3261, lon: -20.1211 },
  { iso2: 'tr', caption: 'Hagia Sophia', lat: 41.0083, lon: 28.98 },
  { iso2: 'us', caption: 'Golden Gate Bridge', lat: 37.8197, lon: -122.4786 },
  { iso2: 'ca', caption: 'Niagara Falls', lat: 43.0799, lon: -79.0747 },
  { iso2: 'mx', caption: 'Chichen Itza', lat: 20.6831, lon: -88.5686 },
  { iso2: 'br', caption: 'Christ the Redeemer', lat: -22.9519, lon: -43.2106 },
  { iso2: 'ar', caption: 'Perito Moreno', lat: -50.5, lon: -73.1333 },
  { iso2: 'cl', caption: 'Torres del Paine', lat: -51, lon: -73 },
  { iso2: 'pe', caption: 'Machu Picchu', lat: -13.1633, lon: -72.5456 },
  { iso2: 'co', caption: 'Cano Cristales', lat: 2.2642, lon: -73.7944 },
  { iso2: 'cu', caption: 'Havana', lat: 23.1367, lon: -82.3589 },
  { iso2: 'cr', caption: 'Arenal Volcano', lat: 10.4625, lon: -84.7033 },
  { iso2: 'eg', caption: 'Giza', lat: 29.9761, lon: 31.1328 },
  { iso2: 'za', caption: 'Table Mountain', lat: -33.9622, lon: 18.4099 },
  { iso2: 'ke', caption: 'Mount Kenya', lat: -0.1508, lon: 37.3075 },
  { iso2: 'ng', caption: 'Zuma Rock', lat: 9.1303, lon: 7.2339 },
  { iso2: 'ma', caption: 'Ait Benhaddou', lat: 31.0472, lon: -7.1289 },
  { iso2: 'et', caption: 'Lalibela', lat: 12.0317, lon: 39.0411 },
  { iso2: 'gh', caption: 'Cape Coast Castle', lat: 5.1036, lon: -1.2411 },
  { iso2: 'au', caption: 'Uluru', lat: -25.345, lon: 131.0361 },
  { iso2: 'nz', caption: 'Milford Sound', lat: -44.6481, lon: 167.9056 },
  { iso2: 'fj', caption: 'Mamanuca Islands', lat: -17.6667, lon: 177.0833 },
  { iso2: 'pg', caption: 'Owen Stanley Range', lat: -9.3333, lon: 148 },
]

// Joins landmarks to the supplied places, so a polaroid knows which country it
// was filed under without the renderer matching on an id of its own. Nations
// with no landmark are simply absent: nothing is invented to fill the gap.
//
// `imageBase` is optional; when given, every entry gets
// `${imageBase}/${iso2}.jpg` as its image URL. Hosts with their own image
// mapping can set `image` on each entry of setData() instead.
export function joinLandmarks(places, imageBase = '') {
  const byIso2 = new Map(places.map((place) => [place.iso2, place]))
  return LANDMARKS.flatMap((landmark, index) => {
    const place = byIso2.get(landmark.iso2)
    if (!place) return []
    return [
      {
        id: `landmark-${landmark.iso2}`,
        iso2: landmark.iso2,
        image: imageBase ? `${imageBase}/${landmark.iso2}.jpg` : undefined,
        caption: landmark.caption,
        lat: landmark.lat,
        lon: landmark.lon,
        code: place.code,
        country: place.country,
        scale: 1,
        order: index,
      },
    ]
  })
}

// The package's default landmark set: coordinates and captions only, no images.
export const defaultLandmarks = joinLandmarks(COUNTRIES_DATA)

export const LANDMARK_COUNT = LANDMARKS.length
