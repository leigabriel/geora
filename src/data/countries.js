// 50 sovereign nations, each pinned at the coordinates of its capital city.
//
// Provenance: a curated reference snapshot assembled for this package
// (September 2026, see git history). `lat`/`lon` are city-level coordinates;
// `pop` is a rounded magnitude string ("125M"), not an official statistic;
// `region`, `tz`, `curr` and `fact` are display annotations. Treat the row as
// illustrative, not authoritative — replace the array through `setData()` when
// you need current figures.
//
// The globe's point geometry is separate and comes from Natural Earth 110m
// via world-atlas (credited in the README).
export const COUNTRIES_DATA = [
    { flag: "🇯🇵", iso2: "jp", capital: "Tokyo", country: "Japan", code: "JPN", continent: "asia", region: "East Asia", lat: 35.6762, lon: 139.6503, pop: "125M", tz: "UTC+9", curr: "JPY", fact: "Archipelago of 6,852 islands along the Pacific Ring of Fire." },
    { flag: "🇵🇭", iso2: "ph", capital: "Manila", country: "Philippines", code: "PHL", continent: "asia", region: "Southeast Asia", lat: 14.5995, lon: 120.9842, pop: "115M", tz: "UTC+8", curr: "PHP", fact: "Archipelago of 7,641 islands situated in the Coral Triangle." },
    { flag: "🇨🇳", iso2: "cn", capital: "Beijing", country: "China", code: "CHN", continent: "asia", region: "East Asia", lat: 39.9042, lon: 116.4074, pop: "1.41B", tz: "UTC+8", curr: "CNY", fact: "Spans 5 geographic time zones standardized to Beijing time." },
    { flag: "🇮🇳", iso2: "in", capital: "New Delhi", country: "India", code: "IND", continent: "asia", region: "South Asia", lat: 28.6139, lon: 77.2090, pop: "1.43B", tz: "UTC+5:30", curr: "INR", fact: "Subcontinent bordered by the Himalayas and Indian Ocean." },
    { flag: "🇰🇷", iso2: "kr", capital: "Seoul", country: "South Korea", code: "KOR", continent: "asia", region: "East Asia", lat: 37.5665, lon: 126.9780, pop: "52M", tz: "UTC+9", curr: "KRW", fact: "Peninsular territory flanked by Yellow Sea and Sea of Japan." },
    { flag: "🇮🇩", iso2: "id", capital: "Jakarta", country: "Indonesia", code: "IDN", continent: "asia", region: "Southeast Asia", lat: -6.2088, lon: 106.8456, pop: "278M", tz: "UTC+7", curr: "IDR", fact: "World's largest archipelagic state with over 17,000 islands." },
    { flag: "🇸🇬", iso2: "sg", capital: "Singapore", country: "Singapore", code: "SGP", continent: "asia", region: "Southeast Asia", lat: 1.3521, lon: 103.8198, pop: "5.9M", tz: "UTC+8", curr: "SGD", fact: "Equatorial island city-state at the southern tip of Malay Peninsula." },
    { flag: "🇹🇭", iso2: "th", capital: "Bangkok", country: "Thailand", code: "THA", continent: "asia", region: "Southeast Asia", lat: 13.7563, lon: 100.5018, pop: "72M", tz: "UTC+7", curr: "THB", fact: "Heart of mainland Southeast Asia centered on the Chao Phraya basin." },
    { flag: "🇻🇳", iso2: "vn", capital: "Hanoi", country: "Vietnam", code: "VNM", continent: "asia", region: "Southeast Asia", lat: 21.0285, lon: 105.8542, pop: "98M", tz: "UTC+7", curr: "VND", fact: "Over 3,260 km of coastline bordering the South China Sea." },
    { flag: "🇲🇾", iso2: "my", capital: "Kuala Lumpur", country: "Malaysia", code: "MYS", continent: "asia", region: "Southeast Asia", lat: 3.1390, lon: 101.6869, pop: "34M", tz: "UTC+8", curr: "MYR", fact: "Megadiverse nation divided into Peninsular and Bornean regions." },
    { flag: "🇵🇰", iso2: "pk", capital: "Islamabad", country: "Pakistan", code: "PAK", continent: "asia", region: "South Asia", lat: 33.6844, lon: 73.0479, pop: "240M", tz: "UTC+5", curr: "PKR", fact: "Encompasses K2 and the vast Indus River delta to the Arabian Sea." },
    { flag: "🇸🇦", iso2: "sa", capital: "Riyadh", country: "Saudi Arabia", code: "SAU", continent: "asia", region: "Middle East", lat: 24.7136, lon: 46.6753, pop: "36M", tz: "UTC+3", curr: "SAR", fact: "Occupies the majority of the Arabian Peninsula." },
    { flag: "🇦🇪", iso2: "ae", capital: "Abu Dhabi", country: "United Arab Emirates", code: "ARE", continent: "asia", region: "Middle East", lat: 24.4539, lon: 54.3773, pop: "10M", tz: "UTC+4", curr: "AED", fact: "Coastline along the Persian Gulf and Gulf of Oman." },

    { flag: "🇬🇧", iso2: "gb", capital: "London", country: "United Kingdom", code: "GBR", continent: "europe", region: "Western Europe", lat: 51.5074, lon: -0.1278, pop: "67M", tz: "UTC+0", curr: "GBP", fact: "Greenwich Observatory anchors the Prime Meridian (0° Longitude)." },
    { flag: "🇫🇷", iso2: "fr", capital: "Paris", country: "France", code: "FRA", continent: "europe", region: "Western Europe", lat: 48.8566, lon: 2.3522, pop: "68M", tz: "UTC+1", curr: "EUR", fact: "Hexagonal territory extending from Atlantic to Mediterranean." },
    { flag: "🇩🇪", iso2: "de", capital: "Berlin", country: "Germany", code: "DEU", continent: "europe", region: "Central Europe", lat: 52.5200, lon: 13.4050, pop: "84M", tz: "UTC+1", curr: "EUR", fact: "Traversed by major waterways connecting North and Baltic Seas." },
    { flag: "🇮🇹", iso2: "it", capital: "Rome", country: "Italy", code: "ITA", continent: "europe", region: "Southern Europe", lat: 41.9028, lon: 12.4964, pop: "59M", tz: "UTC+1", curr: "EUR", fact: "Distinctive boot-shaped Mediterranean peninsula." },
    { flag: "🇪🇸", iso2: "es", capital: "Madrid", country: "Spain", code: "ESP", continent: "europe", region: "Southern Europe", lat: 40.4168, lon: -3.7038, pop: "48M", tz: "UTC+1", curr: "EUR", fact: "Occupies 85% of the Iberian Peninsula." },
    { flag: "🇬🇷", iso2: "gr", capital: "Athens", country: "Greece", code: "GRC", continent: "europe", region: "Southern Europe", lat: 37.9838, lon: 23.7275, pop: "10.4M", tz: "UTC+2", curr: "EUR", fact: "Southern Balkan peninsula with thousands of Aegean islands." },
    { flag: "🇸🇪", iso2: "se", capital: "Stockholm", country: "Sweden", code: "SWE", continent: "europe", region: "Northern Europe", lat: 59.3293, lon: 18.0686, pop: "10.5M", tz: "UTC+1", curr: "SEK", fact: "Scandinavian nation with over 267,000 documented islands." },
    { flag: "🇳🇴", iso2: "no", capital: "Oslo", country: "Norway", code: "NOR", continent: "europe", region: "Northern Europe", lat: 59.9139, lon: 10.7522, pop: "5.5M", tz: "UTC+1", curr: "NOK", fact: "Fjord-carved coastline extending above the Arctic Circle." },
    { flag: "🇳🇱", iso2: "nl", capital: "Amsterdam", country: "Netherlands", code: "NLD", continent: "europe", region: "Western Europe", lat: 52.3676, lon: 4.9041, pop: "17.8M", tz: "UTC+1", curr: "EUR", fact: "Over 26% of land territory lies below mean sea level." },
    { flag: "🇨🇭", iso2: "ch", capital: "Bern", country: "Switzerland", code: "CHE", continent: "europe", region: "Central Europe", lat: 46.9480, lon: 7.4474, pop: "8.8M", tz: "UTC+1", curr: "CHF", fact: "Alpine confederation containing headwaters of Rhine and Rhône." },
    { flag: "🇵🇱", iso2: "pl", capital: "Warsaw", country: "Poland", code: "POL", continent: "europe", region: "Central Europe", lat: 52.2297, lon: 21.0122, pop: "38M", tz: "UTC+1", curr: "PLN", fact: "Extends from Baltic Sea shore across the Northern European plain." },
    { flag: "🇺🇦", iso2: "ua", capital: "Kyiv", country: "Ukraine", code: "UKR", continent: "europe", region: "Eastern Europe", lat: 50.4501, lon: 30.5234, pop: "38M", tz: "UTC+2", curr: "UAH", fact: "Largest sovereign country located entirely within European continent." },
    { flag: "🇵🇹", iso2: "pt", capital: "Lisbon", country: "Portugal", code: "PRT", continent: "europe", region: "Southern Europe", lat: 38.7223, lon: -9.1393, pop: "10.3M", tz: "UTC+0", curr: "EUR", fact: "Features Cabo da Roca, westernmost point of continental Europe." },
    { flag: "🇮🇪", iso2: "ie", capital: "Dublin", country: "Ireland", code: "IRL", continent: "europe", region: "Northern Europe", lat: 53.3498, lon: -6.2603, pop: "5.1M", tz: "UTC+0", curr: "EUR", fact: "North Atlantic island warmed by the North Atlantic Drift." },
    { flag: "🇮🇸", iso2: "is", capital: "Reykjavik", country: "Iceland", code: "ISL", continent: "europe", region: "Northern Europe", lat: 64.1466, lon: -21.9426, pop: "390K", tz: "UTC+0", curr: "ISK", fact: "Volcanic plateau situated atop the divergent Mid-Atlantic Ridge." },
    { flag: "🇹🇷", iso2: "tr", capital: "Ankara", country: "Turkey", code: "TUR", continent: "europe", region: "Transcontinental", lat: 39.9334, lon: 32.8597, pop: "85M", tz: "UTC+3", curr: "TRY", fact: "Transcontinental bridge between Southeastern Europe and Anatolian Asia." },

    { flag: "🇺🇸", iso2: "us", capital: "Washington, D.C.", country: "United States", code: "USA", continent: "americas", region: "North America", lat: 38.9072, lon: -77.0369, pop: "335M", tz: "UTC-5", curr: "USD", fact: "Spans 4 continental time zones with coastlines on three oceans." },
    { flag: "🇨🇦", iso2: "ca", capital: "Ottawa", country: "Canada", code: "CAN", continent: "americas", region: "North America", lat: 45.4215, lon: -75.6972, pop: "40M", tz: "UTC-5", curr: "CAD", fact: "Possesses the world's longest coastline at 202,080 kilometers." },
    { flag: "🇲🇽", iso2: "mx", capital: "Mexico City", country: "Mexico", code: "MEX", continent: "americas", region: "North America", lat: 19.4326, lon: -99.1332, pop: "128M", tz: "UTC-6", curr: "MXN", fact: "High-altitude capital built on the historic Texcoco lakebed basin." },
    { flag: "🇧🇷", iso2: "br", capital: "Brasilia", country: "Brazil", code: "BRA", continent: "americas", region: "South America", lat: -15.7975, lon: -47.8919, pop: "215M", tz: "UTC-3", curr: "BRL", fact: "Encompasses 60% of Amazon rainforest and borders 10 nations." },
    { flag: "🇦🇷", iso2: "ar", capital: "Buenos Aires", country: "Argentina", code: "ARG", continent: "americas", region: "South America", lat: -34.6037, lon: -58.3816, pop: "46M", tz: "UTC-3", curr: "ARS", fact: "Extends from subtropical north across Pampas to windswept Patagonia." },
    { flag: "🇨🇱", iso2: "cl", capital: "Santiago", country: "Chile", code: "CHL", continent: "americas", region: "South America", lat: -33.4489, lon: -70.6693, pop: "19.5M", tz: "UTC-3", curr: "CLP", fact: "World's longest north-south sovereign nation, spanning 4,300 km." },
    { flag: "🇵🇪", iso2: "pe", capital: "Lima", country: "Peru", code: "PER", continent: "americas", region: "South America", lat: -12.0464, lon: -77.0428, pop: "34M", tz: "UTC-5", curr: "PEN", fact: "Ancient Andean cradle and headwaters of the Amazon River basin." },
    { flag: "🇨🇴", iso2: "co", capital: "Bogota", country: "Colombia", code: "COL", continent: "americas", region: "South America", lat: 4.7110, lon: -74.0721, pop: "52M", tz: "UTC-5", curr: "COP", fact: "Only South American nation with coasts on both Pacific and Caribbean." },
    { flag: "🇨🇺", iso2: "cu", capital: "Havana", country: "Cuba", code: "CUB", continent: "americas", region: "Caribbean", lat: 23.1136, lon: -82.3666, pop: "11M", tz: "UTC-5", curr: "CUP", fact: "Largest single island nation situated in the Caribbean Sea." },
    { flag: "🇨🇷", iso2: "cr", capital: "San Jose", country: "Costa Rica", code: "CRI", continent: "americas", region: "Central America", lat: 9.9281, lon: -84.0907, pop: "5.2M", tz: "UTC-6", curr: "CRC", fact: "Central American isthmus harboring over 5% of world biodiversity." },

    { flag: "🇪🇬", iso2: "eg", capital: "Cairo", country: "Egypt", code: "EGY", continent: "africa", region: "North Africa", lat: 30.0444, lon: 31.2357, pop: "110M", tz: "UTC+2", curr: "EGP", fact: "Nile River valley civilization bridging Northeast Africa and Sinai." },
    { flag: "🇿🇦", iso2: "za", capital: "Pretoria", country: "South Africa", code: "ZAF", continent: "africa", region: "Southern Africa", lat: -25.7479, lon: 28.2293, pop: "60M", tz: "UTC+2", curr: "ZAR", fact: "Southernmost sovereign nation on African continent, bordering two oceans." },
    { flag: "🇰🇪", iso2: "ke", capital: "Nairobi", country: "Kenya", code: "KEN", continent: "africa", region: "East Africa", lat: -1.2921, lon: 36.8219, pop: "54M", tz: "UTC+3", curr: "KES", fact: "Bisected directly by Equator and traversed by the Great Rift Valley." },
    { flag: "🇳🇬", iso2: "ng", capital: "Abuja", country: "Nigeria", code: "NGA", continent: "africa", region: "West Africa", lat: 9.0765, lon: 7.3986, pop: "220M", tz: "UTC+1", curr: "NGN", fact: "Most populous African nation, located along the Gulf of Guinea." },
    { flag: "🇲🇦", iso2: "ma", capital: "Rabat", country: "Morocco", code: "MAR", continent: "africa", region: "North Africa", lat: 34.0209, lon: -6.8416, pop: "37M", tz: "UTC+1", curr: "MAD", fact: "Controls southern flank of the Strait of Gibraltar opposite Spain." },
    { flag: "🇪🇹", iso2: "et", capital: "Addis Ababa", country: "Ethiopia", code: "ETH", continent: "africa", region: "East Africa", lat: 9.0320, lon: 38.7469, pop: "123M", tz: "UTC+3", curr: "ETB", fact: "Oldest sovereign African state, situated on the Ethiopian Plateau." },
    { flag: "🇬🇭", iso2: "gh", capital: "Accra", country: "Ghana", code: "GHA", continent: "africa", region: "West Africa", lat: 5.6037, lon: -0.1870, pop: "33M", tz: "UTC+0", curr: "GHS", fact: "Closest land sovereign territory to Equator and Prime Meridian junction." },

    { flag: "🇦🇺", iso2: "au", capital: "Canberra", country: "Australia", code: "AUS", continent: "oceania", region: "Australasia", lat: -35.2809, lon: 149.1300, pop: "26M", tz: "UTC+10", curr: "AUD", fact: "World's only nation governing an entire continental landmass." },
    { flag: "🇳🇿", iso2: "nz", capital: "Wellington", country: "New Zealand", code: "NZL", continent: "oceania", region: "Polynesia", lat: -41.2865, lon: 174.7762, pop: "5.1M", tz: "UTC+12", curr: "NZD", fact: "South Pacific island nation featuring Southern Alps and geothermal belts." },
    { flag: "🇫🇯", iso2: "fj", capital: "Suva", country: "Fiji", code: "FJI", continent: "oceania", region: "Melanesia", lat: -18.1416, lon: 178.4419, pop: "930K", tz: "UTC+12", curr: "FJD", fact: "Archipelago of over 330 volcanic islands in the tropical South Pacific." },
    { flag: "🇵🇬", iso2: "pg", capital: "Port Moresby", country: "Papua New Guinea", code: "PNG", continent: "oceania", region: "Melanesia", lat: -9.4438, lon: 147.1803, pop: "10M", tz: "UTC+10", curr: "PGK", fact: "One of the most culturally diverse nations with over 800 languages." },
]

export const CONTINENTS = [
    { key: "all", label: "ALL" },
    { key: "asia", label: "ASIA" },
    { key: "europe", label: "EUR" },
    { key: "americas", label: "AMER" },
    { key: "africa", label: "AFR" },
    { key: "oceania", label: "OCN" },
]
