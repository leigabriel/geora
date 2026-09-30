// AI compute campuses: the metros where large-scale accelerator training and
// inference capacity is actually being built.
//
// This is a curated reference list, not an inventory. `accelerators` and
// `powerMW` are rounded orders of magnitude taken from public announcements and
// press reporting, not audited figures, and they are meant to convey scale rather
// than to be quoted. `tier` distinguishes the largest hubs from the rest, and
// `weight` drives the wide halo on the globe: anything above 1 hosts multiple
// distinct sites inside the same metro.
//
// Swap this array out to drive the layer from your own data; the globe only
// needs id, name, lat, lon, tier and weight.
export const AI_CENTERS = [
  { id: "iad", name: "Northern Virginia", code: "USA", lat: 38.9445, lon: -77.4558, tier: "core", weight: 3, accelerators: "1M+ class", powerMW: 2000, focus: "training" },
  { id: "cmh", name: "Central Ohio", code: "USA", lat: 39.9612, lon: -82.9988, tier: "core", weight: 2, accelerators: "100k class", powerMW: 500, focus: "training" },
  { id: "nwc", name: "Columbia River", code: "USA", lat: 45.5152, lon: -122.6784, tier: "core", weight: 2, accelerators: "100k class", powerMW: 400, focus: "training" },
  { id: "snc", name: "Bay Area", code: "USA", lat: 37.3541, lon: -121.9552, tier: "core", weight: 2, accelerators: "100k class", powerMW: 400, focus: "training + inference" },
  { id: "atl", name: "Georgia", code: "USA", lat: 33.749, lon: -84.388, tier: "edge", weight: 1, accelerators: "10k class", powerMW: 120, focus: "inference" },
  { id: "dfw", name: "Dallas", code: "USA", lat: 32.7767, lon: -96.797, tier: "edge", weight: 1, accelerators: "10k class", powerMW: 90, focus: "inference" },
  { id: "yyz", name: "Canada (Central)", code: "CAN", lat: 43.6532, lon: -79.3832, tier: "core", weight: 3, accelerators: "100k class", powerMW: 450, focus: "training" },
  { id: "yvr", name: "British Columbia", code: "CAN", lat: 49.2827, lon: -123.1207, tier: "edge", weight: 1, accelerators: "10k class", powerMW: 120, focus: "inference" },
  { id: "gru", name: "Sao Paulo", code: "BRA", lat: -23.5505, lon: -46.6333, tier: "core", weight: 2, accelerators: "10k class", powerMW: 120, focus: "inference" },
  { id: "scl", name: "Santiago", code: "CHL", lat: -33.4489, lon: -70.6693, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 20, focus: "inference" },
  { id: "dub", name: "Ireland", code: "IRL", lat: 53.3498, lon: -6.2603, tier: "core", weight: 2, accelerators: "100k class", powerMW: 400, focus: "training" },
  { id: "lon", name: "London", code: "GBR", lat: 51.5074, lon: -0.1278, tier: "core", weight: 3, accelerators: "100k class", powerMW: 400, focus: "training" },
  { id: "par", name: "Paris", code: "FRA", lat: 48.8566, lon: 2.3522, tier: "core", weight: 2, accelerators: "10k class", powerMW: 150, focus: "training" },
  { id: "bru", name: "Belgium", code: "BEL", lat: 50.8503, lon: 4.3517, tier: "core", weight: 2, accelerators: "10k class", powerMW: 150, focus: "training" },
  { id: "ams", name: "Amsterdam", code: "NLD", lat: 52.3676, lon: 4.9041, tier: "core", weight: 3, accelerators: "100k class", powerMW: 400, focus: "training" },
  { id: "fra", name: "Frankfurt", code: "DEU", lat: 50.1109, lon: 8.6821, tier: "core", weight: 3, accelerators: "100k class", powerMW: 500, focus: "training + inference" },
  { id: "zrh", name: "Zurich", code: "CHE", lat: 47.3769, lon: 8.5417, tier: "edge", weight: 2, accelerators: "10k class", powerMW: 90, focus: "research" },
  { id: "muc", name: "Munich", code: "DEU", lat: 48.1351, lon: 11.582, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 25, focus: "research" },
  { id: "mil", name: "Milan", code: "ITA", lat: 45.4642, lon: 9.19, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 20, focus: "inference" },
  { id: "mad", name: "Madrid", code: "ESP", lat: 40.4168, lon: -3.7038, tier: "edge", weight: 2, accelerators: "10k class", powerMW: 80, focus: "inference" },
  { id: "sto", name: "Stockholm", code: "SWE", lat: 59.3293, lon: 18.0686, tier: "core", weight: 2, accelerators: "10k class", powerMW: 120, focus: "research" },
  { id: "osl", name: "Oslo", code: "NOR", lat: 59.9139, lon: 10.7522, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 20, focus: "research" },
  { id: "cph", name: "Copenhagen", code: "DNK", lat: 55.6761, lon: 12.5683, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 20, focus: "research" },
  { id: "waw", name: "Poland", code: "POL", lat: 52.2297, lon: 21.0122, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 30, focus: "inference" },
  { id: "bud", name: "Budapest", code: "HUN", lat: 47.4979, lon: 19.0402, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 20, focus: "inference" },
  { id: "dxb", name: "UAE North", code: "ARE", lat: 25.2667, lon: 55.3167, tier: "edge", weight: 2, accelerators: "10k class", powerMW: 100, focus: "training" },
  { id: "bhr", name: "Bahrain", code: "BHR", lat: 26.0667, lon: 50.5333, tier: "edge", weight: 2, accelerators: "10k class", powerMW: 90, focus: "inference" },
  { id: "cpt", name: "Cape Town", code: "ZAF", lat: -33.9249, lon: 18.4241, tier: "edge", weight: 2, accelerators: "1k class", powerMW: 30, focus: "research" },
  { id: "nbo", name: "Kenya", code: "KEN", lat: -1.3192, lon: 36.9278, tier: "edge", weight: 1, accelerators: "100 class", powerMW: 8, focus: "inference" },
  { id: "nrt", name: "Tokyo", code: "JPN", lat: 35.6762, lon: 139.6503, tier: "core", weight: 3, accelerators: "100k class", powerMW: 400, focus: "training" },
  { id: "osa", name: "Osaka", code: "JPN", lat: 34.6937, lon: 135.5023, tier: "edge", weight: 1, accelerators: "10k class", powerMW: 80, focus: "inference" },
  { id: "icn", name: "Seoul", code: "KOR", lat: 37.5665, lon: 126.978, tier: "core", weight: 2, accelerators: "100k class", powerMW: 350, focus: "training" },
  { id: "sin", name: "Singapore", code: "SGP", lat: 1.3521, lon: 103.8198, tier: "core", weight: 3, accelerators: "100k class", powerMW: 350, focus: "training" },
  { id: "hkg", name: "Hong Kong", code: "HKG", lat: 22.3193, lon: 114.1694, tier: "edge", weight: 2, accelerators: "10k class", powerMW: 80, focus: "inference" },
  { id: "pek", name: "Beijing", code: "CHN", lat: 39.9042, lon: 116.4074, tier: "core", weight: 2, accelerators: "10k class", powerMW: 200, focus: "training" },
  { id: "hgh", name: "Ningxia", code: "CHN", lat: 38.4872, lon: 106.2309, tier: "edge", weight: 1, accelerators: "10k class", powerMW: 200, focus: "training" },
  { id: "bom", name: "Mumbai", code: "IND", lat: 19.076, lon: 72.8777, tier: "core", weight: 3, accelerators: "100k class", powerMW: 300, focus: "training" },
  { id: "hyd", name: "Hyderabad", code: "IND", lat: 17.385, lon: 78.4867, tier: "edge", weight: 2, accelerators: "10k class", powerMW: 120, focus: "inference" },
  { id: "blr", name: "Bangalore", code: "IND", lat: 12.9716, lon: 77.5946, tier: "edge", weight: 1, accelerators: "10k class", powerMW: 80, focus: "inference" },
  { id: "kul", name: "Kuala Lumpur", code: "MYS", lat: 3.139, lon: 101.6869, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 30, focus: "inference" },
  { id: "jkt", name: "Jakarta", code: "IDN", lat: -6.2088, lon: 106.8456, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 25, focus: "inference" },
  { id: "man", name: "Manila", code: "PHL", lat: 14.5995, lon: 120.9842, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 25, focus: "inference" },
  { id: "bkk", name: "Bangkok", code: "THA", lat: 13.7563, lon: 100.5018, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 25, focus: "inference" },
  { id: "syd", name: "Sydney", code: "AUS", lat: -33.8688, lon: 151.2093, tier: "core", weight: 3, accelerators: "100k class", powerMW: 300, focus: "training" },
  { id: "mel", name: "Melbourne", code: "AUS", lat: -37.8136, lon: 144.9631, tier: "edge", weight: 2, accelerators: "10k class", powerMW: 100, focus: "inference" },
  { id: "akl", name: "Auckland", code: "NZL", lat: -36.8485, lon: 174.7633, tier: "edge", weight: 1, accelerators: "1k class", powerMW: 20, focus: "inference" },
]

export const CENTER_TIERS = [
  { key: "all", label: "ALL" },
  { key: "core", label: "CORE" },
  { key: "edge", label: "EDGE" },
]
