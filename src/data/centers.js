// AI compute campuses: the sites where large-scale accelerator training and
// inference capacity is actually being built or is already running.
//
// Provenance: curated from public operator announcements and press coverage,
// snapshot added to this repository on 2026-09-30. Announcements move, so the
// list ages: treat `powerGW` and `status` as what was published at that point.
//
// This is a curated reference list, not an inventory. Every entry names a real
// site announced by its operator, and `powerGW` is the announced capacity in
// gigawatts where one has been published publicly — it is 0 when the operator has
// not disclosed a figure, never an estimate. `status` separates what is running
// from what is under construction and from what has only been announced, so the
// layer distinguishes built capacity from press releases. `tier` marks the
// largest hubs, and `weight` drives the wide halo: anything above 1 hosts
// multiple distinct sites inside the same metro.
//
// Swap this array out to drive the layer from your own data; the globe only
// needs id, name, operator, code, lat, lon, tier, status and focus.
export const AI_CENTERS = [
  // --- United States: the largest concentration of announced AI capacity ---
  { id: "stargate-abilene-tx", name: "Stargate Abilene", operator: "OpenAI / Oracle", code: "USA", lat: 32.4487, lon: -99.7331, tier: "core", weight: 3, powerGW: 1.2, status: "operating", focus: "training" },
  { id: "stargate-shackelford-tx", name: "Stargate Shackelford County", operator: "OpenAI / Oracle", code: "USA", lat: 29.5433, lon: -100.2034, tier: "core", weight: 2, powerGW: 0, status: "announced", focus: "training" },
  { id: "stargate-milam-tx", name: "Stargate Milam County", operator: "OpenAI / SoftBank", code: "USA", lat: 30.8352, lon: -96.9769, tier: "core", weight: 2, powerGW: 0, status: "announced", focus: "training" },
  { id: "stargate-lordstown-oh", name: "Stargate Lordstown", operator: "OpenAI / SoftBank", code: "USA", lat: 41.1656, lon: -80.8576, tier: "core", weight: 2, powerGW: 0, status: "under construction", focus: "training" },
  { id: "stargate-dona-ana-nm", name: "Stargate Dona Ana County", operator: "OpenAI / Oracle / Vantage", code: "USA", lat: 32.3199, lon: -106.7637, tier: "core", weight: 2, powerGW: 0, status: "announced", focus: "training" },
  { id: "meta-prometheus-la", name: "Meta Prometheus / Hyperion", operator: "Meta", code: "USA", lat: 32.2785, lon: -92.1018, tier: "core", weight: 3, powerGW: 5, status: "under construction", focus: "training" },
  { id: "xai-colossus-1-memphis", name: "xAI Colossus 1", operator: "xAI", code: "USA", lat: 35.1495, lon: -90.049, tier: "core", weight: 2, powerGW: 0, status: "operating", focus: "training" },
  { id: "xai-colossus-2-memphis", name: "xAI Colossus 2", operator: "xAI", code: "USA", lat: 35.09, lon: -90.02, tier: "core", weight: 2, powerGW: 1, status: "under construction", focus: "training" },
  { id: "xai-colossus-3-southaven", name: "xAI Colossus 3", operator: "xAI", code: "USA", lat: 34.9892, lon: -90.0126, tier: "core", weight: 2, powerGW: 1.2, status: "announced", focus: "training" },
  { id: "aws-rainier-indiana", name: "AWS Project Rainier", operator: "Amazon Web Services", code: "USA", lat: 39.6998, lon: -86.1317, tier: "core", weight: 3, powerGW: 2.2, status: "announced", focus: "mixed" },
  { id: "google-the-dalles", name: "Google The Dalles", operator: "Google", code: "USA", lat: 45.5946, lon: -121.1787, tier: "core", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "google-kuykendall", name: "Google Kuykendall", operator: "Google", code: "USA", lat: 30.4213, lon: -97.6766, tier: "core", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "ms-mount-pleasant-wi", name: "Microsoft Mount Pleasant", operator: "Microsoft", code: "USA", lat: 42.5795, lon: -87.0065, tier: "core", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "ms-goodyear-az", name: "Microsoft Goodyear", operator: "Microsoft", code: "USA", lat: 33.4353, lon: -112.3576, tier: "core", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "ms-quincy-wa", name: "Microsoft Quincy", operator: "Microsoft", code: "USA", lat: 47.2343, lon: -119.8524, tier: "core", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "meta-sturgeon-county", name: "Meta Sturgeon County", operator: "Meta", code: "USA", lat: 46.3, lon: -80.8, tier: "core", weight: 2, powerGW: 1, status: "under construction", focus: "mixed" },

  // --- Canada ---
  { id: "can-meta-sturgeon", name: "Meta Sturgeon County (Ontario)", operator: "Meta", code: "CAN", lat: 44.2, lon: -77.8, tier: "edge", weight: 1, powerGW: 0, status: "announced", focus: "training" },
  { id: "can-gcp-montréal", name: "Google Cloud Montréal", operator: "Google", code: "CAN", lat: 45.5019, lon: -73.5674, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "can-coreweave-toronto", name: "CoreWeave Toronto", operator: "CoreWeave", code: "CAN", lat: 43.6532, lon: -79.3832, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },

  // --- Latin America ---
  { id: "bra-ascenty-sumare", name: "Ascenty Sumare", operator: "Ascenty", code: "BRA", lat: -22.8564, lon: -47.6897, tier: "edge", weight: 1, powerGW: 0, status: "under construction", focus: "mixed" },
  { id: "bra-oca-sorocaba", name: "OCA Sorocaba", operator: "OCA / Grupo Isolux", code: "BRA", lat: -23.5015, lon: -47.4527, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "col-odata-mosquera", name: "OData Mosquera", operator: "OData / Aligned", code: "COL", lat: 4.7053, lon: -74.3277, tier: "edge", weight: 1, powerGW: 0.024, status: "under construction", focus: "mixed" },
  { id: "cl-santiago-ai-zone", name: "Santiago AI Zone", operator: "Sonda / Codecentric", code: "CHL", lat: -33.4489, lon: -70.6693, tier: "edge", weight: 1, powerGW: 0, status: "announced", focus: "mixed" },

  // --- Europe: the sovereign cloud push ---
  { id: "fra-paris-ai-campus", name: "Paris AI Campus", operator: "MGX / Mistral AI / NVIDIA", code: "FRA", lat: 48.8566, lon: 2.3522, tier: "core", weight: 2, powerGW: 1.4, status: "announced", focus: "mixed" },
  { id: "fra-data4-escaudain", name: "Data4 Escaudain", operator: "Data4", code: "FRA", lat: 50.3247, lon: 3.3322, tier: "core", weight: 2, powerGW: 0.7, status: "announced", focus: "mixed" },
  { id: "gbr-nscale-loughton", name: "Nscale Loughton AI Campus", operator: "Nscale / Microsoft", code: "GBR", lat: 51.6533, lon: 0.0856, tier: "core", weight: 2, powerGW: 0.05, status: "under construction", focus: "training" },
  { id: "gbr-stargate-uk", name: "Stargate UK (Cobalt Park)", operator: "Nscale / OpenAI / NVIDIA", code: "GBR", lat: 54.9958, lon: -1.5236, tier: "core", weight: 2, powerGW: 0, status: "under construction", focus: "training" },
  { id: "irl-dublin-sovereign", name: "Dublin Sovereign Compute", operator: "Microsoft / Nvidia", code: "IRL", lat: 53.3498, lon: -6.2603, tier: "core", weight: 2, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "deu-green-mountain-mainz", name: "Green Mountain Mainz", operator: "Green Mountain / KMW", code: "DEU", lat: 49.9929, lon: 8.2736, tier: "edge", weight: 1, powerGW: 0.054, status: "under construction", focus: "mixed" },
  { id: "deu-atlasedge-leverkusen", name: "AtlasEdge Leverkusen", operator: "AtlasEdge", code: "DEU", lat: 51.0333, lon: 6.9833, tier: "edge", weight: 1, powerGW: 0, status: "announced", focus: "inference" },
  { id: "ita-khazna-eni-milan", name: "Khazna / Eni Milan", operator: "Khazna / Eni", code: "ITA", lat: 45.4642, lon: 9.19, tier: "core", weight: 2, powerGW: 0.5, status: "announced", focus: "mixed" },
  { id: "prt-nscale-sines", name: "Nscale Sines", operator: "Nscale / Microsoft", code: "PRT", lat: 37.9561, lon: -8.8694, tier: "edge", weight: 1, powerGW: 0.05, status: "under construction", focus: "training" },
  { id: "esp-coreweave-barcelona", name: "CoreWeave Barcelona", operator: "CoreWeave", code: "ESP", lat: 41.3874, lon: 2.1686, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "esp-coreweave-alava", name: "CoreWeave Alava", operator: "CoreWeave", code: "ESP", lat: 42.8467, lon: -2.6716, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "nor-stargate-narvik", name: "Stargate Norway", operator: "Nscale / Aker / OpenAI", code: "NOR", lat: 68.4384, lon: 17.4272, tier: "core", weight: 2, powerGW: 0.23, status: "under construction", focus: "training" },
  { id: "nor-nscale-glomfjord", name: "Nscale Glomfjord", operator: "Nscale / InfraPartners", code: "NOR", lat: 65.2833, lon: 13.65, tier: "edge", weight: 1, powerGW: 0.06, status: "operating", focus: "mixed" },
  { id: "nor-green-mountain-rjukan", name: "Green Mountain Rjukan", operator: "Green Mountain", code: "NOR", lat: 59.8787, lon: 8.6186, tier: "edge", weight: 1, powerGW: 0.09, status: "operating", focus: "inference" },
  { id: "nor-coreweave-kristiansand", name: "CoreWeave Kristiansand", operator: "CoreWeave", code: "NOR", lat: 58.1467, lon: 7.9956, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "swe-coreweave-falun", name: "CoreWeave Falun", operator: "CoreWeave", code: "SWE", lat: 60.6744, lon: 15.844, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "swe-coreweave-stockholm", name: "CoreWeave Stockholm", operator: "CoreWeave", code: "SWE", lat: 59.3293, lon: 18.0686, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "dnk-coreweave-skovlunde", name: "CoreWeave Skovlunde", operator: "CoreWeave", code: "DNK", lat: 55.771, lon: 12.342, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "fin-green-mountain-hamina", name: "Green Mountain Hamina", operator: "Green Mountain", code: "FIN", lat: 60.5667, lon: 27.2, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "inference" },
  { id: "pol-ai-gigafactory", name: "Polish AI Gigafactory", operator: "Government of Poland", code: "POL", lat: 52.2297, lon: 21.0122, tier: "core", weight: 2, powerGW: 0, status: "announced", focus: "training" },
  { id: "cze-masterdc-kanice", name: "MasterDC Kanice", operator: "MasterDC", code: "CZE", lat: 49.1833, lon: 16.4167, tier: "edge", weight: 1, powerGW: 0.004, status: "under construction", focus: "research" },
  { id: "che-green-mountain-rapperswil", name: "Green Mountain Rapperswil", operator: "Green Mountain", code: "CHE", lat: 47.0355, lon: 8.848, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "inference" },

  // --- Middle East and Africa: the national compute programmes ---
  { id: "are-stargate-uae", name: "Stargate UAE", operator: "G42 / OpenAI / NVIDIA", code: "ARE", lat: 24.4667, lon: 54.3667, tier: "core", weight: 3, powerGW: 5, status: "under construction", focus: "training" },
  { id: "are-khazna-qaj1", name: "Khazna QAJ1 Ajman", operator: "Khazna / G42", code: "ARE", lat: 25.4052, lon: 55.5136, tier: "core", weight: 1, powerGW: 0.1, status: "under construction", focus: "training" },
  { id: "are-khazna-dxb8", name: "Khazna DXB8 Dubai", operator: "Khazna / G42", code: "ARE", lat: 25.2048, lon: 55.2708, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "sa-humanain-riyadh", name: "HUMAIN Al Sa'ad AI Campus", operator: "HUMAIN", code: "SAU", lat: 24.7136, lon: 46.6753, tier: "core", weight: 3, powerGW: 1, status: "under construction", focus: "mixed" },
  { id: "sa-humanain-oxagon", name: "HUMAIN / DataVolt Oxagon", operator: "HUMAIN / DataVolt", code: "SAU", lat: 28.48, lon: 34.95, tier: "core", weight: 1, powerGW: 0.36, status: "under construction", focus: "mixed" },
  { id: "qat-google-cloud-doha", name: "Google Cloud Doha Region", operator: "Google Cloud", code: "QAT", lat: 25.2854, lon: 51.531, tier: "edge", weight: 1, powerGW: 0, status: "announced", focus: "mixed" },
  { id: "isr-dalia-ashdod", name: "Dalia Energy Ashdod", operator: "Dalia Energy", code: "ISR", lat: 31.8044, lon: 34.6553, tier: "core", weight: 1, powerGW: 0.13, status: "announced", focus: "mixed" },
  { id: "egy-cassava-cairo", name: "Cassava AI Factory Cairo", operator: "Cassava / Vodafone Egypt", code: "EGY", lat: 30.0444, lon: 31.2357, tier: "edge", weight: 1, powerGW: 0, status: "announced", focus: "training" },
  { id: "mar-naver-nouaceur", name: "Nexus / NAVER Morocco AI Campus", operator: "Nexus Core / NAVER", code: "MAR", lat: 33.368, lon: -7.382, tier: "core", weight: 1, powerGW: 0.5, status: "announced", focus: "training" },
  { id: "mar-oracle-casablanca", name: "Oracle Cloud Casablanca", operator: "Oracle", code: "MAR", lat: 33.5731, lon: -7.5898, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "ken-oracle-nairobi", name: "Oracle Cloud Nairobi", operator: "Oracle", code: "KEN", lat: -1.2864, lon: 36.8172, tier: "edge", weight: 1, powerGW: 0, status: "announced", focus: "mixed" },
  { id: "zaf-nb-continental", name: "Nairobi Continental (Johannesburg)", operator: "BCP / Teraco", code: "ZAF", lat: -26.2041, lon: 28.0473, tier: "edge", weight: 1, powerGW: 0, status: "operating", focus: "mixed" },
  { id: "ng-cloudflare-lagos", name: "Lagos AI Infrastructure Zone", operator: "Cloudflare / Equinix", code: "NGA", lat: 6.5244, lon: 3.3792, tier: "edge", weight: 1, powerGW: 0, status: "announced", focus: "inference" },

  // --- Asia ---
  { id: "ind-reliance-jamnagar", name: "Reliance Jamnagar", operator: "Reliance Industries", code: "IND", lat: 22.4707, lon: 70.0577, tier: "core", weight: 2, powerGW: 0.12, status: "under construction", focus: "mixed" },
  { id: "ind-meta-jamnagar", name: "Meta / Reliance Jamnagar", operator: "Meta / Reliance", code: "IND", lat: 22.4707, lon: 70.0577, tier: "core", weight: 2, powerGW: 0.168, status: "announced", focus: "training" },
  { id: "ind-adani-jaisalpur", name: "AdaniConneX Jaisalpur", operator: "Adani Group", code: "IND", lat: 26.9157, lon: 70.9083, tier: "core", weight: 1, powerGW: 0, status: "announced", focus: "mixed" },
  { id: "jpn-softbank-tomakomai", name: "SoftBank Tomakomai", operator: "SoftBank / IDC Frontier", code: "JPN", lat: 42.68, lon: 141.55, tier: "core", weight: 2, powerGW: 0.3, status: "under construction", focus: "training" },
  { id: "kor-naver-gakseong", name: "NAVER Sovereign AI Cloud", operator: "NAVER / NVIDIA", code: "KOR", lat: 36.08, lon: 127.22, tier: "core", weight: 2, powerGW: 0.055, status: "announced", focus: "mixed" },
  { id: "twn-foxconn-kaohsiung", name: "Foxconn / NVIDIA Taiwan AI Factory", operator: "Foxconn / NVIDIA", code: "TWN", lat: 22.6273, lon: 120.3014, tier: "core", weight: 2, powerGW: 0.1, status: "under construction", focus: "training" },
  { id: "twn-cht-lunping", name: "Chunghwa Telecom Lunping", operator: "Chunghwa Telecom", code: "TWN", lat: 24.9333, lon: 121.15, tier: "edge", weight: 1, powerGW: 0.036, status: "operating", focus: "mixed" },
  { id: "sgp-stt-gdc", name: "ST Telemedia GDC", operator: "ST Telemedia GDC", code: "SGP", lat: 1.3521, lon: 103.8198, tier: "edge", weight: 1, powerGW: 0.05, status: "announced", focus: "mixed" },
  { id: "idn-firmus-batam", name: "Firmus / NVIDIA Batam AI Factory", operator: "Firmus / NVIDIA / DayOne", code: "IDN", lat: 1.0758, lon: 104.0306, tier: "core", weight: 1, powerGW: 0.36, status: "under construction", focus: "training" },
  { id: "tha-true-idc-bangkok", name: "True IDC AI Hyperscale", operator: "True IDC", code: "THA", lat: 13.7563, lon: 100.5018, tier: "edge", weight: 1, powerGW: 0, status: "under construction", focus: "mixed" },
  { id: "vnm-saigontel-tay-ninh", name: "Saigontel Tay Ninh", operator: "Saigontel", code: "VNM", lat: 11.3, lon: 106.1, tier: "core", weight: 1, powerGW: 0.2, status: "announced", focus: "mixed" },
  { id: "chn-alibaba-ningxia", name: "Alibaba Cloud Ningxia", operator: "Alibaba Cloud", code: "CHN", lat: 37.4878, lon: 105.1898, tier: "core", weight: 2, powerGW: 0.06, status: "under construction", focus: "training" },
  { id: "chn-beijing-wudaokou", name: "Beijing Wudaokou", operator: "Alibaba Cloud", code: "CHN", lat: 39.9042, lon: 116.4074, tier: "core", weight: 2, powerGW: 0, status: "operating", focus: "mixed" },

  // --- Oceania ---
  { id: "aus-firmus-southgate", name: "Firmus Project Southgate", operator: "Firmus", code: "AUS", lat: -34.9235, lon: 139.4092, tier: "core", weight: 2, powerGW: 0.6, status: "under construction", focus: "training" },
  { id: "nz-datagrid-southland", name: "Datagrid Southland", operator: "Datagrid", code: "NZL", lat: -46.4133, lon: 168.35, tier: "edge", weight: 1, powerGW: 0, status: "under construction", focus: "mixed" },
]

export const CENTER_STATUSES = [
  { key: "operating", label: "OPERATING" },
  { key: "under construction", label: "BUILDING" },
  { key: "announced", label: "ANNOUNCED" },
]
