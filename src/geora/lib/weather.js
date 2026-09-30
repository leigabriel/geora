// Live conditions from open-meteo: no key, CORS open, free for non-commercial use.
//
// This module never invents a reading. If a location has no reported value it is
// simply absent from the result, and if the whole request fails the caller is
// told so and shows nothing at all rather than showing something plausible.
const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const CHUNK = 25
const CURRENT_FIELDS = 'temperature_2m,weather_code,wind_speed_10m'

export async function loadLiveWeather(places, signal) {
  const byCode = {}
  for (let i = 0; i < places.length; i += CHUNK) {
    const slice = places.slice(i, i + CHUNK)
    const lat = slice.map((place) => place.lat.toFixed(4)).join(',')
    const lon = slice.map((place) => place.lon.toFixed(4)).join(',')
    const url = `${ENDPOINT}?latitude=${lat}&longitude=${lon}&current=${CURRENT_FIELDS}&timezone=UTC`

    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`open-meteo ${res.status}`)
    const body = await res.json()
    const rows = Array.isArray(body) ? body : [body]

    slice.forEach((place, index) => {
      const current = rows[index]?.current
      if (!current) return
      if (current.temperature_2m == null && current.weather_code == null) return
      byCode[place.code] = {
        code: place.code,
        temp: current.temperature_2m == null ? null : Math.round(current.temperature_2m * 10) / 10,
        wind: current.wind_speed_10m == null ? null : Math.round(current.wind_speed_10m),
        wmo: current.weather_code ?? null,
        source: 'live',
      }
    })
  }

  if (Object.keys(byCode).length === 0) throw new Error('open-meteo returned no rows')
  return byCode
}

export function toFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32)
}

export function formatTemp(row, units) {
  if (!row || row.temp == null) return null
  return units === 'f' ? toFahrenheit(row.temp) : Math.round(row.temp)
}
