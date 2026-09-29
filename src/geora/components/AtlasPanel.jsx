import { useMemo, useState } from 'react'
import { CONTINENTS, COUNTRIES_DATA } from '../data/countries.js'
import { THEMES } from '../lib/themes.js'
import Flag from './Flag.jsx'

function Slider({ id, label, value, min, max, step, display, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[12px]">
        <span>{label}</span>
        <span className="font-mono text-[var(--accent-color)]">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

export default function AtlasPanel({ open, themeKey, sliders, layers, onClose, onTheme, onSliders, onLayers, onPickPlace }) {
  const [continent, setContinent] = useState('all')
  const places = useMemo(
    () => (continent === 'all' ? COUNTRIES_DATA : COUNTRIES_DATA.filter((p) => p.continent === continent)),
    [continent],
  )

  return (
    <>
      <div
        data-ui
        onPointerDown={onClose}
        className={`fixed inset-0 z-30 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        data-ui
        className={`bit-panel fixed inset-y-0 right-0 z-40 flex w-[92vw] max-w-[560px] flex-col gap-4 overflow-y-auto border-l p-4 shadow-2xl transition-transform duration-300 sm:w-[560px] sm:max-w-[min(560px,80vw)] sm:p-5 ${
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-color)] animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider">Atlas &amp; Calibration</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-sm opacity-70 transition-colors hover:bg-[var(--border-color)] hover:opacity-100"
            title="Close panel"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[12px] font-semibold">
            <span className="uppercase tracking-wider opacity-80">50 Sovereign Nations</span>
            <span className="font-mono text-[11px] opacity-60">{places.length} PLACES</span>
          </div>

          <div className="grid grid-cols-3 gap-1 font-mono text-[11px] sm:grid-cols-6">
            {CONTINENTS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setContinent(item.key)}
                className={`rounded py-1.5 transition-colors ${
                  continent === item.key
                    ? 'bg-[var(--fg-color)] font-bold text-[var(--bg-color)]'
                    : 'bg-[var(--border-color)] hover:bg-[var(--dim-color)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="custom-scroll flex max-h-[clamp(12rem,34vh,24rem)] flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-[var(--border-color)] p-2">
            {places.map((place) => (
              <button
                key={place.code}
                type="button"
                onClick={() => onPickPlace(place)}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--border-color)] px-2 py-1 text-left text-[12px] whitespace-nowrap transition-colors hover:bg-[var(--accent-color)] hover:text-white"
              >
                <Flag place={place} />
                <span className="font-bold">{place.country}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-[var(--border-color)] pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider opacity-80">Halftone Calibration</span>
            <span className="font-mono text-[11px] font-bold text-[var(--accent-color)]">1:110M</span>
          </div>

          <Slider
            id="slider-ambient"
            label="Ambient fill light"
            min={0.5}
            max={0.95}
            step={0.02}
            value={sliders.ambient}
            display={sliders.ambient.toFixed(2)}
            onChange={(ambient) => onSliders({ ...sliders, ambient })}
          />
          <Slider
            id="slider-ocean"
            label="Ocean dot matrix"
            min={0.15}
            max={0.75}
            step={0.03}
            value={sliders.ocean}
            display={sliders.ocean.toFixed(2)}
            onChange={(ocean) => onSliders({ ...sliders, ocean })}
          />
          <Slider
            id="slider-dot-size"
            label="Dot scale factor"
            min={0.6}
            max={2}
            step={0.1}
            value={sliders.dot}
            display={`${sliders.dot.toFixed(1)}x`}
            onChange={(dot) => onSliders({ ...sliders, dot })}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--border-color)] pt-3">
          <span className="text-[12px] font-semibold uppercase tracking-wider opacity-80">Visual Profile</span>
          <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px] font-bold">
            {Object.entries(THEMES).map(([key, theme]) => (
              <button
                key={key}
                type="button"
                onClick={() => onTheme(key)}
                className={`rounded border py-2 transition-colors ${
                  key === themeKey ? 'border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-[var(--border-color)] opacity-75 hover:opacity-100'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-[var(--border-color)] pt-3 text-[12px] sm:grid-cols-3">
          {[
            ['borders', 'Country borders'],
            ['cities', 'City beacons'],
            ['scanlines', 'Scanlines'],
          ].map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={(e) => onLayers({ ...layers, [key]: e.target.checked })}
                className="h-4 w-4 accent-[var(--accent-color)]"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </aside>
    </>
  )
}
