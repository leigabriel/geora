// local asset urls, so nothing is fetched from a cdn at runtime
const base = import.meta.env.BASE_URL

export const flagUrl = (iso2, retina = false) => `${base}flags/${iso2}${retina ? '@2x' : ''}.png`
