/* global THREE, Tone, d3, topojson */

export function initGeora() {
    const georaLifecycle = new AbortController();
    const domSignal = georaLifecycle.signal;
    let georaCancelled = false;
    let georaRafId = 0;
    /* 50 Real Verified Sovereign Nations Database with Verified Real World Coordinates */
    const COUNTRIES_DATA = [
      // Asia
      { flag: "🇯🇵", iso2: "jp", name: "Tokyo", country: "Japan", code: "JPN", continent: "asia", region: "East Asia", lat: 35.6762, lon: 139.6503, pop: "125M", tz: "UTC+9", curr: "JPY", fact: "Archipelago of 6,852 islands along the Pacific Ring of Fire." },
      { flag: "🇵🇭", iso2: "ph", name: "Manila", country: "Philippines", code: "PHL", continent: "asia", region: "Southeast Asia", lat: 14.5995, lon: 120.9842, pop: "115M", tz: "UTC+8", curr: "PHP", fact: "Archipelago of 7,641 islands situated in the Coral Triangle." },
      { flag: "🇨🇳", iso2: "cn", name: "Beijing", country: "China", code: "CHN", continent: "asia", region: "East Asia", lat: 39.9042, lon: 116.4074, pop: "1.41B", tz: "UTC+8", curr: "CNY", fact: "Spans 5 geographic time zones standardized to Beijing time." },
      { flag: "🇮🇳", iso2: "in", name: "New Delhi", country: "India", code: "IND", continent: "asia", region: "South Asia", lat: 28.6139, lon: 77.2090, pop: "1.43B", tz: "UTC+5:30", curr: "INR", fact: "Subcontinent bordered by the Himalayas and Indian Ocean." },
      { flag: "🇰🇷", iso2: "kr", name: "Seoul", country: "South Korea", code: "KOR", continent: "asia", region: "East Asia", lat: 37.5665, lon: 126.9780, pop: "52M", tz: "UTC+9", curr: "KRW", fact: "Peninsular territory flanked by Yellow Sea and Sea of Japan." },
      { flag: "🇮🇩", iso2: "id", name: "Jakarta", country: "Indonesia", code: "IDN", continent: "asia", region: "Southeast Asia", lat: -6.2088, lon: 106.8456, pop: "278M", tz: "UTC+7", curr: "IDR", fact: "World's largest archipelagic state with over 17,000 islands." },
      { flag: "🇸🇬", iso2: "sg", name: "Singapore", country: "Singapore", code: "SGP", continent: "asia", region: "Southeast Asia", lat: 1.3521, lon: 103.8198, pop: "5.9M", tz: "UTC+8", curr: "SGD", fact: "Equatorial island city-state at the southern tip of Malay Peninsula." },
      { flag: "🇹🇭", iso2: "th", name: "Bangkok", country: "Thailand", code: "THA", continent: "asia", region: "Southeast Asia", lat: 13.7563, lon: 100.5018, pop: "72M", tz: "UTC+7", curr: "THB", fact: "Heart of mainland Southeast Asia centered on the Chao Phraya basin." },
      { flag: "🇻🇳", iso2: "vn", name: "Hanoi", country: "Vietnam", code: "VNM", continent: "asia", region: "Southeast Asia", lat: 21.0285, lon: 105.8542, pop: "98M", tz: "UTC+7", curr: "VND", fact: "Over 3,260 km of coastline bordering the South China Sea." },
      { flag: "🇲🇾", iso2: "my", name: "Kuala Lumpur", country: "Malaysia", code: "MYS", continent: "asia", region: "Southeast Asia", lat: 3.1390, lon: 101.6869, pop: "34M", tz: "UTC+8", curr: "MYR", fact: "Megadiverse nation divided into Peninsular and Bornean regions." },
      { flag: "🇵🇰", iso2: "pk", name: "Islamabad", country: "Pakistan", code: "PAK", continent: "asia", region: "South Asia", lat: 33.6844, lon: 73.0479, pop: "240M", tz: "UTC+5", curr: "PKR", fact: "Encompasses K2 and the vast Indus River delta to the Arabian Sea." },
      { flag: "🇸🇦", iso2: "sa", name: "Riyadh", country: "Saudi Arabia", code: "SAU", continent: "asia", region: "Middle East", lat: 24.7136, lon: 46.6753, pop: "36M", tz: "UTC+3", curr: "SAR", fact: "Occupies the majority of the Arabian Peninsula." },
      { flag: "🇦🇪", iso2: "ae", name: "Abu Dhabi", country: "United Arab Emirates", code: "ARE", continent: "asia", region: "Middle East", lat: 24.4539, lon: 54.3773, pop: "10M", tz: "UTC+4", curr: "AED", fact: "Coastline along the Persian Gulf and Gulf of Oman." },

      // Europe
      { flag: "🇬🇧", iso2: "gb", name: "London", country: "United Kingdom", code: "GBR", continent: "europe", region: "Western Europe", lat: 51.5074, lon: -0.1278, pop: "67M", tz: "UTC+0", curr: "GBP", fact: "Greenwich Observatory anchors the Prime Meridian (0° Longitude)." },
      { flag: "🇫🇷", iso2: "fr", name: "Paris", country: "France", code: "FRA", continent: "europe", region: "Western Europe", lat: 48.8566, lon: 2.3522, pop: "68M", tz: "UTC+1", curr: "EUR", fact: "Hexagonal territory extending from Atlantic to Mediterranean." },
      { flag: "🇩🇪", iso2: "de", name: "Berlin", country: "Germany", code: "DEU", continent: "europe", region: "Central Europe", lat: 52.5200, lon: 13.4050, pop: "84M", tz: "UTC+1", curr: "EUR", fact: "Traversed by major waterways connecting North and Baltic Seas." },
      { flag: "🇮🇹", iso2: "it", name: "Rome", country: "Italy", code: "ITA", continent: "europe", region: "Southern Europe", lat: 41.9028, lon: 12.4964, pop: "59M", tz: "UTC+1", curr: "EUR", fact: "Distinctive boot-shaped Mediterranean peninsula." },
      { flag: "🇪🇸", iso2: "es", name: "Madrid", country: "Spain", code: "ESP", continent: "europe", region: "Southern Europe", lat: 40.4168, lon: -3.7038, pop: "48M", tz: "UTC+1", curr: "EUR", fact: "Occupies 85% of the Iberian Peninsula." },
      { flag: "🇬🇷", iso2: "gr", name: "Athens", country: "Greece", code: "GRC", continent: "europe", region: "Southern Europe", lat: 37.9838, lon: 23.7275, pop: "10.4M", tz: "UTC+2", curr: "EUR", fact: "Southern Balkan peninsula with thousands of Aegean islands." },
      { flag: "🇸🇪", iso2: "se", name: "Stockholm", country: "Sweden", code: "SWE", continent: "europe", region: "Northern Europe", lat: 59.3293, lon: 18.0686, pop: "10.5M", tz: "UTC+1", curr: "SEK", fact: "Scandinavian nation with over 267,000 documented islands." },
      { flag: "🇳🇴", iso2: "no", name: "Oslo", country: "Norway", code: "NOR", continent: "europe", region: "Northern Europe", lat: 59.9139, lon: 10.7522, pop: "5.5M", tz: "UTC+1", curr: "NOK", fact: "Fjord-carved coastline extending above the Arctic Circle." },
      { flag: "🇳🇱", iso2: "nl", name: "Amsterdam", country: "Netherlands", code: "NLD", continent: "europe", region: "Western Europe", lat: 52.3676, lon: 4.9041, pop: "17.8M", tz: "UTC+1", curr: "EUR", fact: "Over 26% of land territory lies below mean sea level." },
      { flag: "🇨🇭", iso2: "ch", name: "Bern", country: "Switzerland", code: "CHE", continent: "europe", region: "Central Europe", lat: 46.9480, lon: 7.4474, pop: "8.8M", tz: "UTC+1", curr: "CHF", fact: "Alpine confederation containing headwaters of Rhine and Rhône." },
      { flag: "🇵🇱", iso2: "pl", name: "Warsaw", country: "Poland", code: "POL", continent: "europe", region: "Central Europe", lat: 52.2297, lon: 21.0122, pop: "38M", tz: "UTC+1", curr: "PLN", fact: "Extends from Baltic Sea shore across the Northern European plain." },
      { flag: "🇺🇦", iso2: "ua", name: "Kyiv", country: "Ukraine", code: "UKR", continent: "europe", region: "Eastern Europe", lat: 50.4501, lon: 30.5234, pop: "38M", tz: "UTC+2", curr: "UAH", fact: "Largest sovereign country located entirely within European continent." },
      { flag: "🇵🇹", iso2: "pt", name: "Lisbon", country: "Portugal", code: "PRT", continent: "europe", region: "Southern Europe", lat: 38.7223, lon: -9.1393, pop: "10.3M", tz: "UTC+0", curr: "EUR", fact: "Features Cabo da Roca, westernmost point of continental Europe." },
      { flag: "🇮🇪", iso2: "ie", name: "Dublin", country: "Ireland", code: "IRL", continent: "europe", region: "Northern Europe", lat: 53.3498, lon: -6.2603, pop: "5.1M", tz: "UTC+0", curr: "EUR", fact: "North Atlantic island warmed by the North Atlantic Drift." },
      { flag: "🇮🇸", iso2: "is", name: "Reykjavik", country: "Iceland", code: "ISL", continent: "europe", region: "Northern Europe", lat: 64.1466, lon: -21.9426, pop: "390K", tz: "UTC+0", curr: "ISK", fact: "Volcanic plateau situated atop the divergent Mid-Atlantic Ridge." },
      { flag: "🇹🇷", iso2: "tr", name: "Ankara", country: "Turkey", code: "TUR", continent: "europe", region: "Transcontinental", lat: 39.9334, lon: 32.8597, pop: "85M", tz: "UTC+3", curr: "TRY", fact: "Transcontinental bridge between Southeastern Europe and Anatolian Asia." },

      // Americas
      { flag: "🇺🇸", iso2: "us", name: "Washington, D.C.", country: "United States", code: "USA", continent: "americas", region: "North America", lat: 38.9072, lon: -77.0369, pop: "335M", tz: "UTC-5", curr: "USD", fact: "Spans 4 continental time zones with coastlines on three oceans." },
      { flag: "🇨🇦", iso2: "ca", name: "Ottawa", country: "Canada", code: "CAN", continent: "americas", region: "North America", lat: 45.4215, lon: -75.6972, pop: "40M", tz: "UTC-5", curr: "CAD", fact: "Possesses the world's longest coastline at 202,080 kilometers." },
      { flag: "🇲🇽", iso2: "mx", name: "Mexico City", country: "Mexico", code: "MEX", continent: "americas", region: "North America", lat: 19.4326, lon: -99.1332, pop: "128M", tz: "UTC-6", curr: "MXN", fact: "High-altitude capital built on the historic Texcoco lakebed basin." },
      { flag: "🇧🇷", iso2: "br", name: "Brasília", country: "Brazil", code: "BRA", continent: "americas", region: "South America", lat: -15.7975, lon: -47.8919, pop: "215M", tz: "UTC-3", curr: "BRL", fact: "Encompasses 60% of Amazon rainforest and borders 10 nations." },
      { flag: "🇦🇷", iso2: "ar", name: "Buenos Aires", country: "Argentina", code: "ARG", continent: "americas", region: "South America", lat: -34.6037, lon: -58.3816, pop: "46M", tz: "UTC-3", curr: "ARS", fact: "Extends from subtropical north across Pampas to windswept Patagonia." },
      { flag: "🇨🇱", iso2: "cl", name: "Santiago", country: "Chile", code: "CHL", continent: "americas", region: "South America", lat: -33.4489, lon: -70.6693, pop: "19.5M", tz: "UTC-3", curr: "CLP", fact: "World's longest north-south sovereign nation, spanning 4,300 km." },
      { flag: "🇵🇪", iso2: "pe", name: "Lima", country: "Peru", code: "PER", continent: "americas", region: "South America", lat: -12.0464, lon: -77.0428, pop: "34M", tz: "UTC-5", curr: "PEN", fact: "Ancient Andean cradle and headwaters of the Amazon River basin." },
      { flag: "🇨🇴", iso2: "co", name: "Bogotá", country: "Colombia", code: "COL", continent: "americas", region: "South America", lat: 4.7110, lon: -74.0721, pop: "52M", tz: "UTC-5", curr: "COP", fact: "Only South American nation with coasts on both Pacific and Caribbean." },
      { flag: "🇨🇺", iso2: "cu", name: "Havana", country: "Cuba", code: "CUB", continent: "americas", region: "Caribbean", lat: 23.1136, lon: -82.3666, pop: "11M", tz: "UTC-5", curr: "CUP", fact: "Largest single island nation situated in the Caribbean Sea." },
      { flag: "🇨🇷", iso2: "cr", name: "San José", country: "Costa Rica", code: "CRI", continent: "americas", region: "Central America", lat: 9.9281, lon: -84.0907, pop: "5.2M", tz: "UTC-6", curr: "CRC", fact: "Central American isthmus harboring over 5% of world biodiversity." },

      // Africa
      { flag: "🇪🇬", iso2: "eg", name: "Cairo", country: "Egypt", code: "EGY", continent: "africa", region: "North Africa", lat: 30.0444, lon: 31.2357, pop: "110M", tz: "UTC+2", curr: "EGP", fact: "Nile River valley civilization bridging Northeast Africa and Sinai." },
      { flag: "🇿🇦", iso2: "za", name: "Pretoria", country: "South Africa", code: "ZAF", continent: "africa", region: "Southern Africa", lat: -25.7479, lon: 28.2293, pop: "60M", tz: "UTC+2", curr: "ZAR", fact: "Southernmost sovereign nation on African continent, bordering two oceans." },
      { flag: "🇰🇪", iso2: "ke", name: "Nairobi", country: "Kenya", code: "KEN", continent: "africa", region: "East Africa", lat: -1.2921, lon: 36.8219, pop: "54M", tz: "UTC+3", curr: "KES", fact: "Bisected directly by Equator and traversed by the Great Rift Valley." },
      { flag: "🇳🇬", iso2: "ng", name: "Abuja", country: "Nigeria", code: "NGA", continent: "africa", region: "West Africa", lat: 9.0765, lon: 7.3986, pop: "220M", tz: "UTC+1", curr: "NGN", fact: "Most populous African nation, located along the Gulf of Guinea." },
      { flag: "🇲🇦", iso2: "ma", name: "Rabat", country: "Morocco", code: "MAR", continent: "africa", region: "North Africa", lat: 34.0209, lon: -6.8416, pop: "37M", tz: "UTC+1", curr: "MAD", fact: "Controls southern flank of the Strait of Gibraltar opposite Spain." },
      { flag: "🇪🇹", iso2: "et", name: "Addis Ababa", country: "Ethiopia", code: "ETH", continent: "africa", region: "East Africa", lat: 9.0320, lon: 38.7469, pop: "123M", tz: "UTC+3", curr: "ETB", fact: "Oldest sovereign African state, situated on the Ethiopian Plateau." },
      { flag: "🇬🇭", iso2: "gh", name: "Accra", country: "Ghana", code: "GHA", continent: "africa", region: "West Africa", lat: 5.6037, lon: -0.1870, pop: "33M", tz: "UTC+0", curr: "GHS", fact: "Closest land sovereign territory to Equator and Prime Meridian junction." },

      // Oceania
      { flag: "🇦🇺", iso2: "au", name: "Canberra", country: "Australia", code: "AUS", continent: "oceania", region: "Australasia", lat: -35.2809, lon: 149.1300, pop: "26M", tz: "UTC+10", curr: "AUD", fact: "World's only nation governing an entire continental landmass." },
      { flag: "🇳🇿", iso2: "nz", name: "Wellington", country: "New Zealand", code: "NZL", continent: "oceania", region: "Polynesia", lat: -41.2865, lon: 174.7762, pop: "5.1M", tz: "UTC+12", curr: "NZD", fact: "South Pacific island nation featuring Southern Alps and geothermal belts." },
      { flag: "🇫🇯", iso2: "fj", name: "Suva", country: "Fiji", code: "FJI", continent: "oceania", region: "Melanesia", lat: -18.1416, lon: 178.4419, pop: "930K", tz: "UTC+12", curr: "FJD", fact: "Archipelago of over 330 volcanic islands in the tropical South Pacific." },
      { flag: "🇵🇬", iso2: "pg", name: "Port Moresby", country: "Papua New Guinea", code: "PNG", continent: "oceania", region: "Melanesia", lat: -9.4438, lon: 147.1803, pop: "10M", tz: "UTC+10", curr: "PGK", fact: "One of the most culturally diverse nations with over 800 languages." }
    ];

    /* Helper: Returns universal HTML for crisp flag images with emoji fallback */
    function getFlagHtml(place, sizeClasses = "w-4 h-3") {
      return `<img src="https://flagcdn.com/w40/${place.iso2}.png" alt="${place.country}" class="flag-img ${sizeClasses} rounded-[2px] inline-block align-middle border border-black/10" loading="lazy" onerror="this.outerHTML='<span class=\\'text-sm\\'>${place.flag}</span>'">`;
    }

    const config = {
      dotCount: 36000,
      globeRadius: 2.10,
      dotSizeScale: 1.1,
      ambientLight: 0.76,
      oceanOpacity: 0.38,
      autoRotateSpeed: 1.0,
      isAutoRotating: true,
      audioEnabled: false,
      theme: 'paper',
      showBorders: true,
      showCities: true,
      showScanlines: true,
      showAtmosphere: true
    };

    let wasAutoRotatingBeforeModal = false;
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5.25;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const container = document.getElementById('canvas-container');
    container.appendChild(renderer.domElement);

    // Main globe group rotated via Quaternion Trackball
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const MAP_W = 2048;
    const MAP_H = 1024;
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = MAP_W;
    mapCanvas.height = MAP_H;
    const mapCtx = mapCanvas.getContext('2d', { willReadFrequently: true });

    mapCtx.fillStyle = '#000000';
    mapCtx.fillRect(0, 0, MAP_W, MAP_H);

    const d3Projection = d3.geoEquirectangular()
      .scale(MAP_W / (2 * Math.PI))
      .translate([MAP_W / 2, MAP_H / 2]);
    const d3Path = d3.geoPath(d3Projection, mapCtx);

    let mapImageData = mapCtx.getImageData(0, 0, MAP_W, MAP_H).data;

    function sampleGlobePoint(u, v) {
      const x = Math.min(MAP_W - 1, Math.max(0, Math.floor(u * (MAP_W - 1))));
      const y = Math.min(MAP_H - 1, Math.max(0, Math.floor(v * (MAP_H - 1))));
      const idx = (y * MAP_W + x) * 4;
      return {
        land: mapImageData[idx] / 255.0,
        border: mapImageData[idx + 1] / 255.0
      };
    }

    const count = config.dotCount;
    const positions = new Float32Array(count * 3);
    const landValues = new Float32Array(count);
    const borderValues = new Float32Array(count);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;

      const x = Math.sin(theta) * radiusAtY;
      const z = Math.cos(theta) * radiusAtY;

      positions[i * 3] = x * config.globeRadius;
      positions[i * 3 + 1] = y * config.globeRadius;
      positions[i * 3 + 2] = z * config.globeRadius;

      const lambda = Math.atan2(x, z);
      const u = (lambda / (2 * Math.PI)) + 0.5;
      const v = 0.5 - (Math.asin(y) / Math.PI);

      const sampled = sampleGlobePoint(u, v);
      landValues[i] = sampled.land;
      borderValues[i] = sampled.border;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const landAttr = new THREE.BufferAttribute(landValues, 1);
    const borderAttr = new THREE.BufferAttribute(borderValues, 1);
    pointsGeometry.setAttribute('aLand', landAttr);
    pointsGeometry.setAttribute('aBorder', borderAttr);

    const halftoneVertexShader = `
      attribute float aLand;
      attribute float aBorder;
      varying float vLand;
      varying float vBorder;
      varying float vLighting;

      uniform float uDotScale;
      uniform float uAmbient;
      uniform float uShowBorders;

      void main() {
        vLand = aLand;
        vBorder = aBorder * uShowBorders;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        vec3 norm = normalize(mat3(modelMatrix) * position);

        // Multi-directional fill lighting ensures soft halftone illumination without harsh threshold clipping
        float diffFront = max(dot(norm, normalize(vec3(2.5, 3.0, 4.0))), 0.0);
        float diffBack = max(dot(norm, normalize(vec3(-2.0, -1.8, -3.5))), 0.0) * 0.45;
        
        vLighting = uAmbient + (diffFront + diffBack) * (1.0 - uAmbient);

        float baseSize = mix(2.2, 5.2, aLand);
        if (vBorder > 0.3) {
          baseSize += 1.4;
        }

        float distFactor = 320.0 / -mvPosition.z;
        gl_PointSize = baseSize * uDotScale * (0.85 + 0.28 * vLighting) * distFactor * 0.016;
      }
    `;

    const halftoneFragmentShader = `
      precision mediump float;
      varying float vLand;
      varying float vBorder;
      varying float vLighting;

      uniform vec3 uColor;
      uniform vec3 uBorderColor;
      uniform float uOceanOpacity;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;

        float delta = fwidth(dist);
        float alpha = 1.0 - smoothstep(0.44 - delta, 0.5, dist);

        vec3 toneColor = uColor;
        if (vBorder > 0.3) {
          toneColor = uBorderColor;
        }

        float dotAlpha = mix(uOceanOpacity, 0.98, vLand);
        if (vBorder > 0.3) dotAlpha = 1.0;

        dotAlpha *= (0.75 + 0.25 * vLighting);
        gl_FragColor = vec4(toneColor, alpha * dotAlpha);
      }
    `;

    // Defaulting uniforms to Paper theme colors
    const halftoneUniforms = {
      uDotScale: { value: 1.1 },
      uAmbient: { value: 0.76 },
      uOceanOpacity: { value: 0.38 },
      uShowBorders: { value: 1.0 },
      uColor: { value: new THREE.Color(0x121316) },
      uBorderColor: { value: new THREE.Color(0x1a56db) }
    };

    const halftoneMaterial = new THREE.ShaderMaterial({
      vertexShader: halftoneVertexShader,
      fragmentShader: halftoneFragmentShader,
      uniforms: halftoneUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const halftonePointsMesh = new THREE.Points(pointsGeometry, halftoneMaterial);
    globeGroup.add(halftonePointsMesh);

    // Inner Core Sphere to occlude backside dots
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xf6f6f2 });
    const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(config.globeRadius * 0.985, 48, 48), coreMat);
    globeGroup.add(coreSphere);

    // Atmospheric Fresnel Halo
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNorm;
        void main() {
          vNorm = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNorm;
        uniform vec3 uColor;
        void main() {
          float intensity = pow(0.7 - dot(vNorm, vec3(0.0, 0.0, 1.0)), 2.6);
          gl_FragColor = vec4(uColor, intensity * 0.55);
        }
      `,
      uniforms: { uColor: { value: new THREE.Color(0x1a56db) } },
      blending: THREE.NormalBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmoMesh = new THREE.Mesh(new THREE.SphereGeometry(config.globeRadius * 1.12, 48, 48), atmoMat);
    scene.add(atmoMesh);

    function refreshHalftonePointsFromCanvas() {
      mapImageData = mapCtx.getImageData(0, 0, MAP_W, MAP_H).data;
      const lArr = landAttr.array;
      const bArr = borderAttr.array;
      const pos = pointsGeometry.attributes.position.array;

      for (let i = 0; i < count; i++) {
        const x = pos[i * 3];
        const y = pos[i * 3 + 1];
        const z = pos[i * 3 + 2];

        const lambda = Math.atan2(x, z);
        const u = (lambda / (2 * Math.PI)) + 0.5;
        const v = 0.5 - (Math.asin(y / config.globeRadius) / Math.PI);

        const sampled = sampleGlobePoint(u, v);
        lArr[i] = sampled.land;
        bArr[i] = sampled.border;
      }
      landAttr.needsUpdate = true;
      borderAttr.needsUpdate = true;
    }

    async function loadNaturalEarthCartography() {
      const sourceBadge = document.getElementById('carto-source-indicator');
      const urls = [
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
        'https://unpkg.com/world-atlas@2.0.2/countries-110m.json'
      ];

      let topology = null;
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            topology = await res.json();
            break;
          }
        } catch (e) {
          console.warn(`Attempting fallback cartography mirror...`);
        }
      }

      if (topology && window.topojson) {
        mapCtx.fillStyle = '#000000';
        mapCtx.fillRect(0, 0, MAP_W, MAP_H);

        const land = topojson.feature(topology, topology.objects.land);
        const countries = topojson.mesh(topology, topology.objects.countries, (a, b) => a !== b);

        // Landmass rasterization (white channel = 255)
        mapCtx.fillStyle = '#ffffff';
        mapCtx.beginPath();
        d3Path(land);
        mapCtx.fill();

        // International sovereign borders (green channel = 255)
        mapCtx.strokeStyle = '#00ff88';
        mapCtx.lineWidth = 1.4;
        mapCtx.beginPath();
        d3Path(countries);
        mapCtx.stroke();

        refreshHalftonePointsFromCanvas();
        if (sourceBadge) {
          sourceBadge.innerHTML = `<i class="fa-solid fa-check text-[var(--accent-color)]"></i> 1:110M VERIFIED`;
        }
      } else {
        renderFallbackWorld();
        refreshHalftonePointsFromCanvas();
      }
    }

    function renderFallbackWorld() {
      mapCtx.fillStyle = '#000000';
      mapCtx.fillRect(0, 0, MAP_W, MAP_H);
      mapCtx.fillStyle = '#ffffff';

      const continents = [
        [[-168, 65], [-140, 70], [-100, 70], [-60, 55], [-75, 35], [-80, 25], [-97, 26], [-105, 20], [-120, 35], [-130, 54], [-168, 65]],
        [[-77, 8], [-52, 5], [-35, -5], [-39, -14], [-53, -33], [-66, -54], [-75, -50], [-81, -5], [-77, 8]],
        [[10, 54], [30, 60], [70, 70], [120, 72], [170, 66], [140, 50], [120, 30], [105, 10], [80, 13], [60, 22], [35, 33], [10, 37], [0, 45], [10, 54]],
        [[-10, 30], [10, 37], [32, 31], [43, 12], [51, 11], [38, -15], [26, -34], [15, -28], [9, 4], [-17, 14], [-10, 30]],
        [[114, -22], [136, -12], [153, -28], [140, -38], [118, -35], [114, -22]]
      ];

      continents.forEach(poly => {
        mapCtx.beginPath();
        poly.forEach(([lon, lat], i) => {
          const [px, py] = d3Projection([lon, lat]);
          if (i === 0) mapCtx.moveTo(px, py);
          else mapCtx.lineTo(px, py);
        });
        mapCtx.closePath();
        mapCtx.fill();
      });
    }

    const placesGroup = new THREE.Group();
    placesGroup.renderOrder = 3;
    globeGroup.add(placesGroup);

    function latLonToVector3(lat, lon, radius) {
      const phi = lat * (Math.PI / 180);
      const lambda = lon * (Math.PI / 180);
      const x = radius * Math.cos(phi) * Math.sin(lambda);
      const y = radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.cos(lambda);
      return new THREE.Vector3(x, y, z);
    }

    function drawRoundedRectPath(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    function createFlagSprite(place) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#1e293b';
      drawRoundedRectPath(ctx, 4, 4, 120, 88, 10);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(place.code.substring(0, 2), 64, 48);

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;

      const flagImg = new Image();
      flagImg.crossOrigin = 'anonymous';
      flagImg.onload = () => {
        ctx.clearRect(0, 0, 128, 96);
        
        ctx.save();
        drawRoundedRectPath(ctx, 4, 4, 120, 88, 10);
        ctx.clip();
        ctx.drawImage(flagImg, 4, 4, 120, 88);
        ctx.restore();

        // Crisp white border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        drawRoundedRectPath(ctx, 4, 4, 120, 88, 10);
        ctx.stroke();

        // Subtle dark outline for high contrast
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1.5;
        drawRoundedRectPath(ctx, 4, 4, 120, 88, 10);
        ctx.stroke();

        texture.needsUpdate = true;
      };
      flagImg.src = `https://flagcdn.com/w160/${place.iso2}.png`;

      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        opacity: 0.98
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.18, 0.135, 1.0);
      return sprite;
    }

    const countryMarkers = [];
    const hitMeshes = [];

    COUNTRIES_DATA.forEach(place => {
      const surfacePos = latLonToVector3(place.lat, place.lon, config.globeRadius * 1.002);
      const flagPos = latLonToVector3(place.lat, place.lon, config.globeRadius * 1.028);

      // 1. Precise Surface Target Reticle Ring
      const ringGeom = new THREE.RingGeometry(0.018, 0.034, 24);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: 0x1a56db, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.85 
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(surfacePos);
      ringMesh.lookAt(surfacePos.clone().multiplyScalar(2));
      placesGroup.add(ringMesh);

      // 2. Surface Focal Center Pinpoint Dot (Anchors beacon to exact land)
      const pinGeom = new THREE.SphereGeometry(0.012, 12, 12);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x1a56db });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.copy(surfacePos);
      placesGroup.add(pinMesh);

      // 3. Luminous 3D Beacon Stem (Eliminates perspective parallax)
      const stemPoints = [surfacePos, flagPos];
      const stemGeom = new THREE.BufferGeometry().setFromPoints(stemPoints);
      const stemMat = new THREE.LineBasicMaterial({ 
        color: 0x1a56db, 
        transparent: true, 
        opacity: 0.75,
        linewidth: 2 
      });
      const stemLine = new THREE.Line(stemGeom, stemMat);
      placesGroup.add(stemLine);

      // 4. Grounded 3D Flag Sprite
      const flagSprite = createFlagSprite(place);
      flagSprite.position.copy(flagPos);
      placesGroup.add(flagSprite);

      // 5. Raycast hit sphere aligned directly to the flag
      const hitGeom = new THREE.SphereGeometry(0.10, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.position.copy(flagPos);
      placesGroup.add(hitMesh);

      const markerObj = {
        ...place,
        ring: ringMesh,
        pin: pinMesh,
        stem: stemLine,
        flagSprite: flagSprite,
        hit: hitMesh,
        worldPos: surfacePos
      };

      countryMarkers.push(markerObj);
      hitMeshes.push(hitMesh);
    });

    let audioInitialized = false;
    let tickNoise = null;
    let tickFilter = null;
    let chimeSynth = null;
    let uiSynth = null;

    function initAudio() {
      if (audioInitialized) return;
      try {
        Tone.start();

        // 1. Tactile rotary encoder click for trackball swipe
        tickFilter = new Tone.Filter({ frequency: 2400, type: 'bandpass', Q: 4 }).toDestination();
        tickNoise = new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.012, sustain: 0 }
        }).connect(tickFilter);
        tickNoise.volume.value = -24;

        // 2. Crystal polyphonic chime for country selection
        chimeSynth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.22, sustain: 0.02, release: 0.3 }
        }).toDestination();
        chimeSynth.volume.value = -18;

        // 3. Subtle micro-pip for UI buttons
        uiSynth = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.002, decay: 0.04, sustain: 0, release: 0.03 }
        }).toDestination();
        uiSynth.volume.value = -22;

        audioInitialized = true;
      } catch (err) {}
    }

    let lastTickTime = 0;
    function playRotaryTick() {
      if (!config.audioEnabled || !tickNoise) return;
      const now = performance.now();
      if (now - lastTickTime < 65) return;
      lastTickTime = now;
      try {
        tickNoise.triggerAttackRelease("64n");
      } catch (e) {}
    }

    function playCountryChime() {
      if (!config.audioEnabled || !chimeSynth) return;
      try {
        const now = Tone.now();
        chimeSynth.triggerAttackRelease(["E5", "B5"], "16n", now);
        chimeSynth.triggerAttackRelease(["G#5", "E6"], "16n", now + 0.07);
      } catch (e) {}
    }

    function playHoverSFX() {
      if (!config.audioEnabled || !uiSynth) return;
      try {
        uiSynth.triggerAttackRelease("C6", "64n");
      } catch (e) {}
    }

    function playDismissSFX() {
      if (!config.audioEnabled || !uiSynth) return;
      try {
        uiSynth.triggerAttackRelease("A4", "32n");
      } catch (e) {}
    }

    function playBitChirp(note = "C6") {
      if (!config.audioEnabled || !uiSynth) return;
      try {
        uiSynth.triggerAttackRelease(note, "32n");
      } catch (e) {}
    }

    let isDragging = false;
    let dragDistanceMoved = 0;
    let pointerDownStartPos = { x: 0, y: 0 };
    let prevPointerPos = { x: 0, y: 0 };
    let angularVelocityAxis = new THREE.Vector3(0, 1, 0);
    let angularVelocitySpeed = 0.0018;
    let pinchDistStart = null;
    let targetCameraZ = camera.position.z;
    let tutorialDismissed = false;
    let targetQuaternion = null;
    let isCardPinned = false;
    let activePinnedCountry = null;
    let activeHoveredMarker = null;

    const tutorialOverlay = document.getElementById('gesture-tutorial');
    const hoverTooltip = document.getElementById('beacon-hover-tooltip');
    const tooltipFlag = document.getElementById('tooltip-flag');
    const tooltipCountry = document.getElementById('tooltip-country');
    const tooltipCode = document.getElementById('tooltip-code');
    const tooltipCapital = document.getElementById('tooltip-capital');

    function dismissTutorial() {
      if (tutorialDismissed) return;
      tutorialDismissed = true;
      tutorialOverlay.classList.remove('opacity-100');
      tutorialOverlay.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => { tutorialOverlay.style.display = 'none'; }, 400);
    }

    document.getElementById('btn-dismiss-tutorial')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissTutorial();
    }, { signal: domSignal });

    function showTutorial() {
      tutorialDismissed = false;
      tutorialOverlay.style.display = 'flex';
      requestAnimationFrame(() => {
        tutorialOverlay.classList.remove('opacity-0');
        tutorialOverlay.classList.add('opacity-100');
      });
    }

    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('aside, header, footer, button, input, #country-tag-cloud, #search-results-dropdown, #country-card')) return;
      dismissTutorial();
      initAudio();
      isDragging = true;
      dragDistanceMoved = 0;
      pointerDownStartPos = { x: e.clientX, y: e.clientY };
      prevPointerPos = { x: e.clientX, y: e.clientY };
      angularVelocitySpeed = 0;
    }, { signal: domSignal });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) {
        checkCountryHover(e.clientX, e.clientY);
        return;
      }
      hideHoverTooltip();

      const deltaX = e.clientX - prevPointerPos.x;
      const deltaY = e.clientY - prevPointerPos.y;
      const dist = Math.hypot(deltaX, deltaY);
      dragDistanceMoved += dist;

      if (dist > 0.001) {
        const sensitivity = 0.0038;
        const rotAxis = new THREE.Vector3(deltaY / dist, deltaX / dist, 0);
        const angle = dist * sensitivity;
        const deltaQ = new THREE.Quaternion().setFromAxisAngle(rotAxis, angle);
        
        globeGroup.quaternion.premultiply(deltaQ);

        angularVelocityAxis.copy(rotAxis);
        angularVelocitySpeed = Math.min(0.045, angle * 0.45);

        if (dist > 3) playRotaryTick();
      }

      prevPointerPos = { x: e.clientX, y: e.clientY };
    }, { signal: domSignal });

    window.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;

      if (dragDistanceMoved < 6 && !e.target.closest('aside, header, footer, button, input, #country-card')) {
        const hitPlace = testBeaconIntersection(e.clientX, e.clientY);
        if (hitPlace) {
          pinAndDisplayCountry(hitPlace, e.clientX, e.clientY);
        } else if (isCardPinned) {
          closeCountryCard();
        }
      }
    }, { signal: domSignal });

    window.addEventListener('pointercancel', () => { isDragging = false; }, { signal: domSignal });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isCardPinned) {
        closeCountryCard();
      }
    }, { signal: domSignal });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        pinchDistStart = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true, signal: domSignal });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && pinchDistStart !== null) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = pinchDistStart - currentDist;
        targetCameraZ = Math.max(3.2, Math.min(7.5, targetCameraZ + diff * 0.01));
        pinchDistStart = currentDist;
      }
    }, { passive: true, signal: domSignal });

    window.addEventListener('touchend', () => { pinchDistStart = null; }, { signal: domSignal });

    window.addEventListener('wheel', (e) => {
      if (e.target.closest('#controls-drawer, #country-tag-cloud, #search-results-dropdown, #country-card')) return;
      targetCameraZ = Math.max(3.2, Math.min(7.8, targetCameraZ + e.deltaY * 0.003));
      playBitChirp("G6");
    }, { passive: true, signal: domSignal });

    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();
    const countryCard = document.getElementById('country-card');
    const cardFlag = document.getElementById('card-flag');
    const cardCode = document.getElementById('card-code');
    const cardCountry = document.getElementById('card-country');
    const cardCapital = document.getElementById('card-capital');
    const cardContinent = document.getElementById('card-continent');
    const cardCoords = document.getElementById('card-coords');
    const cardPop = document.getElementById('card-pop');
    const cardTz = document.getElementById('card-tz');
    const cardCurr = document.getElementById('card-curr');
    const cardRegion = document.getElementById('card-region');
    const cardFact = document.getElementById('card-fact');
    const cardCloseBtn = document.getElementById('card-close-btn');
    const cardCenterBtn = document.getElementById('card-center-btn');
    const activeBadge = document.getElementById('active-country-badge');

    function testBeaconIntersection(clientX, clientY) {
      mouseVector.x = (clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouseVector, camera);
      const hits = raycaster.intersectObjects(hitMeshes);
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        const marker = countryMarkers.find(c => c.hit === hitObj);
        if (marker) {
          const worldPos = marker.worldPos.clone().applyQuaternion(globeGroup.quaternion);
          const camDir = camera.position.clone().normalize();
          if (worldPos.normalize().dot(camDir) > 0.05) {
            return marker;
          }
        }
      }
      return null;
    }

    function showHoverTooltip(place, clientX, clientY) {
      tooltipFlag.innerHTML = getFlagHtml(place, "w-6 h-4");
      tooltipCountry.textContent = place.country;
      tooltipCode.textContent = place.code;
      tooltipCapital.textContent = `${place.name} • Click to inspect`;

      const tipW = 180;
      let left = clientX + 14;
      let top = clientY - 38;

      if (left + tipW > window.innerWidth - 12) left = clientX - tipW - 14;
      if (top < 12) top = clientY + 16;

      hoverTooltip.style.left = `${left}px`;
      hoverTooltip.style.top = `${top}px`;
      hoverTooltip.classList.remove('hidden');
      requestAnimationFrame(() => {
        hoverTooltip.classList.remove('opacity-0');
        hoverTooltip.classList.add('opacity-100');
      });
    }

    function hideHoverTooltip() {
      activeHoveredMarker = null;
      hoverTooltip.classList.remove('opacity-100');
      hoverTooltip.classList.add('opacity-0');
      setTimeout(() => {
        if (!activeHoveredMarker) hoverTooltip.classList.add('hidden');
      }, 150);
    }

    function checkCountryHover(clientX, clientY) {
      if (isCardPinned) {
        hideHoverTooltip();
        return;
      }

      const place = testBeaconIntersection(clientX, clientY);
      if (place) {
        if (activeHoveredMarker !== place) {
          activeHoveredMarker = place;
          showHoverTooltip(place, clientX, clientY);
          playHoverSFX();
        } else {
          hoverTooltip.style.left = `${clientX + 14}px`;
          hoverTooltip.style.top = `${clientY - 38}px`;
        }
      } else {
        if (activeHoveredMarker) {
          hideHoverTooltip();
        }
      }
    }

    function updateSpinButtonState(isSpinning) {
      const pauseIcon = document.getElementById('pause-icon');
      const pauseText = document.getElementById('pause-text');
      if (!pauseIcon || !pauseText) return;
      if (isSpinning) {
        pauseIcon.className = "fa-solid fa-pause text-xs";
        pauseText.textContent = "SPIN";
      } else {
        pauseIcon.className = "fa-solid fa-play text-xs";
        pauseText.textContent = "PAUSED";
      }
    }

    function renderCardData(place) {
      activePinnedCountry = place;
      cardFlag.innerHTML = getFlagHtml(place, "w-9 h-6 rounded shadow-md");
      cardCode.textContent = place.code;
      cardCountry.textContent = place.country;
      cardCapital.innerHTML = `<i class="fa-solid fa-location-dot text-[var(--accent-color)] text-[9px]"></i><span>${place.name} • Official Capital</span>`;
      cardContinent.textContent = place.region || place.continent;
      cardCoords.textContent = `LAT ${place.lat >= 0 ? '+' : ''}${place.lat.toFixed(2)}° • LON ${place.lon >= 0 ? '+' : ''}${place.lon.toFixed(2)}°`;
      cardPop.textContent = place.pop;
      cardTz.textContent = place.tz;
      cardCurr.textContent = place.curr;
      cardRegion.textContent = place.region;
      cardFact.textContent = place.fact;

      activeBadge.innerHTML = `<span class="flex items-center gap-1">${getFlagHtml(place, "w-4 h-3 rounded-[2px]")} <span>${place.code}</span></span>`;
    }

    function positionCardAt(clientX, clientY) {
      countryCard.classList.remove('hidden');
      requestAnimationFrame(() => {
        const cardW = 290;
        const cardH = 240;
        let left = clientX - cardW / 2;
        let top = clientY - cardH - 18;

        if (left < 14) left = 14;
        if (left + cardW > window.innerWidth - 14) left = window.innerWidth - cardW - 14;
        if (top < 70) top = clientY + 24;

        countryCard.style.left = `${left}px`;
        countryCard.style.top = `${top}px`;
        countryCard.classList.remove('opacity-0', 'scale-95');
        countryCard.classList.add('opacity-100', 'scale-100');
      });
    }

    function pinAndDisplayCountry(place, clientX, clientY) {
      hideHoverTooltip();
      
      // Auto-pause rotation when opening modal
      if (config.isAutoRotating) {
        wasAutoRotatingBeforeModal = true;
        config.isAutoRotating = false;
        updateSpinButtonState(false);
      }
      angularVelocitySpeed = 0;

      isCardPinned = true;
      renderCardData(place);
      positionCardAt(clientX || window.innerWidth / 2, clientY || window.innerHeight / 2);
      playCountryChime();
    }

    function closeCountryCard() {
      if (!isCardPinned) return;
      isCardPinned = false;
      activePinnedCountry = null;

      countryCard.classList.remove('opacity-100', 'scale-100');
      countryCard.classList.add('opacity-0', 'scale-95');
      setTimeout(() => {
        if (!isCardPinned) countryCard.classList.add('hidden');
      }, 200);

      // Auto-resume rotation when closing modal
      if (wasAutoRotatingBeforeModal) {
        config.isAutoRotating = true;
        wasAutoRotatingBeforeModal = false;
        angularVelocitySpeed = 0.0018;
        updateSpinButtonState(true);
      }

      playDismissSFX();
    }

    cardCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeCountryCard();
    }, { signal: domSignal });

    cardCenterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activePinnedCountry) {
        flyToCountry(activePinnedCountry);
      }
    }, { signal: domSignal });

    function flyToCoordinates(lat, lon, label = "SITE") {
      dismissTutorial();
      initAudio();
      
      const latRad = lat * (Math.PI / 180);
      const lonRad = lon * (Math.PI / 180);
      
      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -lonRad);
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), latRad);
      targetQuaternion = qX.multiply(qY);
      
      angularVelocitySpeed = 0;
      targetCameraZ = 4.3;
    }

    function flyToCountry(place) {
      flyToCoordinates(place.lat, place.lon, place.code);
      pinAndDisplayCountry(place, window.innerWidth / 2, window.innerHeight * 0.38);
    }

    const tagCloud = document.getElementById('country-tag-cloud');
    const continentCounter = document.getElementById('continent-counter');

    function populateCountryTags(filterContinent = "all") {
      tagCloud.innerHTML = "";
      let visibleCount = 0;
      COUNTRIES_DATA.forEach(place => {
        if (filterContinent !== "all" && place.continent !== filterContinent) return;
        visibleCount++;
        const btn = document.createElement('button');
        btn.className = "px-2 py-1 rounded-lg bg-[var(--border-color)] hover:bg-[var(--accent-color)] hover:text-white transition-colors text-left flex items-center gap-1.5 whitespace-nowrap active:scale-95";
        btn.innerHTML = `<span class="flex items-center">${getFlagHtml(place, "w-4 h-3")}</span><span class="font-bold">${place.country}</span><span class="opacity-50 text-[8px] font-mono">${place.code}</span>`;
        btn.addEventListener('click', () => {
          flyToCountry(place);
          searchInput.value = place.country;
        }, { signal: domSignal });
        tagCloud.appendChild(btn);
      });
      continentCounter.textContent = `${visibleCount} PLACES`;
    }
    populateCountryTags("all");

    document.querySelectorAll('.continent-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.continent-btn').forEach(b => {
          b.className = "continent-btn py-1.5 rounded bg-[var(--border-color)] hover:bg-[var(--dim-color)] transition-all text-center";
        });
        e.currentTarget.className = "continent-btn py-1.5 rounded bg-[var(--fg-color)] text-[var(--bg-color)] font-bold transition-all text-center";
        const cont = e.currentTarget.getAttribute('data-continent');
        populateCountryTags(cont);
        playBitChirp("A6");
      }, { signal: domSignal });
    });

    const searchInput = document.getElementById('search-country-input');
    const searchDropdown = document.getElementById('search-results-dropdown');
    const searchClear = document.getElementById('search-clear-btn');

    function filterCountries(query) {
      const q = query.trim().toLowerCase();
      if (!q) {
        searchDropdown.classList.add('hidden');
        searchClear.classList.add('hidden');
        return;
      }
      searchClear.classList.remove('hidden');

      const matches = COUNTRIES_DATA.filter(c => 
        c.country.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
      );

      searchDropdown.innerHTML = "";
      if (matches.length === 0) {
        searchDropdown.innerHTML = `<div class="p-2.5 opacity-60 text-center font-mono text-[10px]">No matching country found</div>`;
      } else {
        matches.slice(0, 8).forEach(place => {
          const item = document.createElement('div');
          item.className = "p-2 hover:bg-[var(--border-color)] cursor-pointer flex items-center justify-between border-b border-[var(--border-color)]/50 last:border-none transition-colors";
          item.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="flex items-center">${getFlagHtml(place, "w-4 h-3")}</span>
              <span class="font-bold text-[11px]">${place.country}</span>
              <span class="opacity-60 text-[10px]">• ${place.name}</span>
            </div>
            <span class="px-1 py-0.5 rounded bg-[var(--border-color)] text-[var(--accent-color)] text-[8px] font-mono font-bold">${place.code}</span>
          `;
          item.addEventListener('click', () => {
            flyToCountry(place);
            searchInput.value = place.country;
            searchDropdown.classList.add('hidden');
          }, { signal: domSignal });
          searchDropdown.appendChild(item);
        });
      }
      searchDropdown.classList.remove('hidden');
    }

    searchInput.addEventListener('input', (e) => filterCountries(e.target.value), { signal: domSignal });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim().toLowerCase();
        const topMatch = COUNTRIES_DATA.find(c => 
          c.country.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
        );
        if (topMatch) {
          flyToCountry(topMatch);
          searchInput.value = topMatch.country;
          searchDropdown.classList.add('hidden');
        }
      } else if (e.key === 'Escape') {
        searchDropdown.classList.add('hidden');
        searchInput.blur();
      }
    }, { signal: domSignal });

    searchClear.addEventListener('click', () => {
      searchInput.value = "";
      searchDropdown.classList.add('hidden');
      searchClear.classList.add('hidden');
      searchInput.focus();
    }, { signal: domSignal });

    const THEMES = {
      paper: { bg: 0xf6f6f2, fg: 0x121316, border: 0x1a56db, scan: 0.16, css: '' },
      bw: { bg: 0x07080a, fg: 0xffffff, border: 0x00ffaa, scan: 0.70, css: 'theme-bw' },
      amber: { bg: 0x0d0900, fg: 0xffb700, border: 0xffe066, scan: 0.65, css: 'theme-amber' },
      matrix: { bg: 0x020a04, fg: 0x00ff66, border: 0x88ffbb, scan: 0.65, css: 'theme-matrix' }
    };

    const currentThemeLabel = document.getElementById('current-theme-label');
    const themeKeys = ['paper', 'bw', 'amber', 'matrix'];
    let themeIndex = 0;

    function applyTheme(key) {
      config.theme = key;
      const t = THEMES[key] || THEMES.paper;
      themeIndex = themeKeys.indexOf(key);

      document.body.className = `w-screen h-screen m-0 p-0 overflow-hidden relative select-none ${t.css}`;
      currentThemeLabel.textContent = key.toUpperCase();

      halftoneUniforms.uColor.value.setHex(t.fg);
      halftoneUniforms.uBorderColor.value.setHex(t.border);
      coreMat.color.setHex(t.bg);
      atmoMat.uniforms.uColor.value.setHex(t.border);

      countryMarkers.forEach(c => {
        c.ring.material.color.setHex(t.border);
        c.pin.material.color.setHex(t.border);
        c.stem.material.color.setHex(t.border);
      });

      document.getElementById('scanline-overlay').style.opacity = t.scan;
      playBitChirp("A6");
    }

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        applyTheme(e.currentTarget.getAttribute('data-theme'));
      }, { signal: domSignal });
    });

    document.getElementById('btn-cycle-theme').addEventListener('click', () => {
      themeIndex = (themeIndex + 1) % themeKeys.length;
      applyTheme(themeKeys[themeIndex]);
    }, { signal: domSignal });

    const ambientSlider = document.getElementById('slider-ambient');
    const ambientVal = document.getElementById('ambient-val');
    ambientSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      halftoneUniforms.uAmbient.value = v;
      ambientVal.textContent = v.toFixed(2);
    }, { signal: domSignal });

    const oceanSlider = document.getElementById('slider-ocean');
    const oceanVal = document.getElementById('ocean-val');
    oceanSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      halftoneUniforms.uOceanOpacity.value = v;
      oceanVal.textContent = v.toFixed(2);
    }, { signal: domSignal });

    const dotSizeSlider = document.getElementById('slider-dot-size');
    const dotSizeVal = document.getElementById('dot-size-val');
    dotSizeSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      halftoneUniforms.uDotScale.value = v;
      dotSizeVal.textContent = `${v.toFixed(1)}x`;
    }, { signal: domSignal });

    document.getElementById('toggle-borders').addEventListener('change', (e) => {
      halftoneUniforms.uShowBorders.value = e.target.checked ? 1.0 : 0.0;
    }, { signal: domSignal });

    document.getElementById('toggle-cities').addEventListener('change', (e) => {
      placesGroup.visible = e.target.checked;
    }, { signal: domSignal });

    document.getElementById('toggle-scanlines').addEventListener('change', (e) => {
      document.getElementById('scanline-overlay').style.display = e.target.checked ? 'block' : 'none';
    }, { signal: domSignal });

    document.getElementById('toggle-atmosphere').addEventListener('change', (e) => {
      atmoMesh.visible = e.target.checked;
    }, { signal: domSignal });

    const soundBtn = document.getElementById('btn-toggle-sound');
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    soundBtn.addEventListener('click', () => {
      initAudio();
      config.audioEnabled = !config.audioEnabled;
      if (config.audioEnabled) {
        soundIcon.className = "fa-solid fa-volume-high text-xs text-[var(--accent-color)]";
        soundText.textContent = "Audio";
        playBitChirp("E6");
      } else {
        soundIcon.className = "fa-solid fa-volume-xmark text-xs";
        soundText.textContent = "Mute";
      }
    }, { signal: domSignal });

    const drawer = document.getElementById('controls-drawer');
    function toggleDrawer(open) {
      if (open === undefined) {
        drawer.classList.toggle('translate-x-full');
      } else if (open) {
        drawer.classList.remove('translate-x-full');
      } else {
        drawer.classList.add('translate-x-full');
      }
      playBitChirp("F6");
    }

    document.getElementById('btn-toggle-settings').addEventListener('click', () => toggleDrawer(), { signal: domSignal });
    document.getElementById('btn-close-settings').addEventListener('click', () => toggleDrawer(false), { signal: domSignal });

    document.getElementById('btn-show-tutorial').addEventListener('click', () => {
      showTutorial();
      playBitChirp("C6");
    }, { signal: domSignal });

    document.getElementById('btn-reset-view').addEventListener('click', () => {
      targetQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.18, -1.2, 0, 'YXZ'));
      angularVelocitySpeed = 0.0018;
      angularVelocityAxis.set(0, 1, 0);
      targetCameraZ = 5.25;
      activeBadge.innerHTML = `<span>🌐</span> <span>GEORA GLOBAL</span>`;
      closeCountryCard();
      playBitChirp("C6");
    }, { signal: domSignal });

    const pauseBtn = document.getElementById('btn-pause-spin');
    const pauseIcon = document.getElementById('pause-icon');
    const pauseText = document.getElementById('pause-text');
    pauseBtn.addEventListener('click', () => {
      config.isAutoRotating = !config.isAutoRotating;
      wasAutoRotatingBeforeModal = false;
      if (config.isAutoRotating) {
        pauseIcon.className = "fa-solid fa-pause text-xs";
        pauseText.textContent = "SPIN";
        angularVelocitySpeed = 0.0018;
      } else {
        pauseIcon.className = "fa-solid fa-play text-xs";
        pauseText.textContent = "PAUSED";
        angularVelocitySpeed = 0;
        targetQuaternion = null;
      }
      playDismissSFX();
    }, { signal: domSignal });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, { signal: domSignal });

    const coordsDisplay = document.getElementById('coords-display');
    const fpsDisplay = document.getElementById('fps-display');
    let frameCounter = 0;
    let fpsTimer = performance.now();
    const frontVector = new THREE.Vector3(0, 0, 1);

    function updateCoordinateReadout() {
      const localFront = frontVector.clone().applyQuaternion(globeGroup.quaternion.clone().invert());
      const latDeg = Math.asin(Math.max(-1, Math.min(1, localFront.y))) * (180 / Math.PI);
      const lonDeg = Math.atan2(localFront.x, localFront.z) * (180 / Math.PI);

      coordsDisplay.textContent = `LAT ${latDeg >= 0 ? '+' : ''}${latDeg.toFixed(2)}° • LON ${lonDeg >= 0 ? '+' : ''}${lonDeg.toFixed(2)}°`;
    }

    function animate(currentTime) {
      if (georaCancelled) return;
      georaRafId = requestAnimationFrame(animate);

      frameCounter++;
      if (currentTime - fpsTimer >= 1000) {
        fpsDisplay.textContent = `${frameCounter} FPS`;
        frameCounter = 0;
        fpsTimer = currentTime;
      }

      camera.position.z += (targetCameraZ - camera.position.z) * 0.08;

      if (targetQuaternion) {
        globeGroup.quaternion.slerp(targetQuaternion, 0.08);
        if (globeGroup.quaternion.angleTo(targetQuaternion) < 0.002) {
          globeGroup.quaternion.copy(targetQuaternion);
          targetQuaternion = null;
        }
      } else if (!isDragging) {
        if (angularVelocitySpeed > 0.00005) {
          const stepQ = new THREE.Quaternion().setFromAxisAngle(angularVelocityAxis, angularVelocitySpeed);
          globeGroup.quaternion.premultiply(stepQ);
          angularVelocitySpeed *= 0.94;
        } else if (config.isAutoRotating) {
          const spinQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.0016 * config.autoRotateSpeed);
          globeGroup.quaternion.premultiply(spinQ);
        }
      }

      // Animate Beacon Radar Rings & Occlude Backside Flags Smoothly
      const camNorm = camera.position.clone().normalize();
      countryMarkers.forEach((item, idx) => {
        const pulse = (Math.sin(currentTime * 0.004 + idx * 0.5) + 1.0) * 0.5;
        item.ring.scale.setScalar(1.0 + pulse * 1.5);
        item.ring.material.opacity = (1.0 - pulse) * 0.85;

        // Calculate horizon facing angle to fade out flags rotating behind the Earth
        if (item.flagSprite) {
          const rotatedPos = item.worldPos.clone().applyQuaternion(globeGroup.quaternion);
          const dot = rotatedPos.normalize().dot(camNorm);
          const visibility = Math.max(0, Math.min(1, (dot - 0.05) * 3.8));
          item.flagSprite.material.opacity = visibility * 0.98;
          item.flagSprite.visible = visibility > 0.02;
          if (item.stem) item.stem.visible = visibility > 0.02;
          if (item.pin) item.pin.visible = visibility > 0.02;
        }
      });

      updateCoordinateReadout();
      renderer.render(scene, camera);
    }

    function bootGeora() {
      applyTheme('paper');
      globeGroup.quaternion.setFromEuler(new THREE.Euler(0.18, -1.2, 0, 'YXZ'));
      loadNaturalEarthCartography();
      animate(performance.now());
    }

    if (document.readyState === 'complete') {
      bootGeora();
    } else {
      window.addEventListener('load', bootGeora, { signal: domSignal });
    }

    return function cleanupGeora() {
      georaLifecycle.abort();
      georaCancelled = true;
      window.cancelAnimationFrame(georaRafId);
      try {
        if (tickNoise) tickNoise.dispose();
        if (chimeSynth) chimeSynth.dispose();
        if (uiSynth) uiSynth.dispose();
        if (tickFilter) tickFilter.dispose();
      } catch (e) {}
      renderer.dispose();
      const canvasEl = renderer.domElement;
      if (canvasEl && canvasEl.parentNode) canvasEl.parentNode.removeChild(canvasEl);
    };
}
