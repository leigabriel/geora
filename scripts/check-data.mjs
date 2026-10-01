import { readFileSync } from 'node:fs'

const centers = readFileSync('src/geora/data/centers.js', 'utf8')
const countries = readFileSync('src/geora/data/countries.js', 'utf8')
const landmarks = readFileSync('src/geora/data/landmarks.js', 'utf8')

const codes = [...centers.matchAll(/code: "([A-Z]{3})"/g)].map((m) => m[1])
const ids = [...centers.matchAll(/id: "([^"]+)"/g)].map((m) => m[1])

const byIso = {}
for (const m of countries.matchAll(/iso2: "([a-z]{2})".*?code: "([A-Z]{3})"/g)) byIso[m[2]] = m[1]
const countryIso = [...countries.matchAll(/iso2: "([a-z]{2})"/g)].map((m) => m[1])

const lmIso = [...landmarks.matchAll(/iso2: '([a-z]{2})'/g)].map((m) => m[1])

console.log('centers           :', codes.length)
console.log('unique center ids :', new Set(ids).size)
console.log('countries         :', countryIso.length)
console.log('landmarks         :', lmIso.length)
console.log('landmark countries with no entry :', countryIso.filter((c) => !lmIso.includes(c)).join(',') || 'none')
console.log('landmarks with no country        :', lmIso.filter((c) => !countryIso.includes(c)).join(',') || 'none')
console.log('duplicate landmarks              :', lmIso.filter((c, i) => lmIso.indexOf(c) !== i).join(',') || 'none')
console.log('center codes missing from places :', [...new Set(codes.filter((c) => !byIso[c]))].join(',') || 'none')

const gw = [...centers.matchAll(/powerGW: ([0-9.]+)/g)].map((m) => Number(m[1]))
console.log('sites with a published GW :', gw.length, '| total GW', gw.reduce((a, b) => a + b, 0).toFixed(2))
const st = {}
for (const m of centers.matchAll(/status: "([^"]+)"/g)) st[m[1]] = (st[m[1]] ?? 0) + 1
console.log('status :', JSON.stringify(st))
const tiers = {}
for (const m of centers.matchAll(/tier: "([^"]+)"/g)) tiers[m[1]] = (tiers[m[1]] ?? 0) + 1
console.log('tier   :', JSON.stringify(tiers))
const countriesCovered = new Set(codes)
console.log('countries with a center  :', countriesCovered.size, 'of', countryIso.length)
