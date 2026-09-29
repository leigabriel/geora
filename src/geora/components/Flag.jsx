import { useState } from 'react'
import { flagUrl } from '../lib/assets.js'

export default function Flag({ place, className = 'w-4 h-3' }) {
  const [broken, setBroken] = useState(false)

  if (broken) return <span className="leading-none text-[13px]">{place.flag}</span>

  return (
    <img
      src={flagUrl(place.iso2)}
      alt={place.country}
      loading="lazy"
      decoding="async"
      draggable="false"
      onError={() => setBroken(true)}
      className={`flag-img ${className}`}
    />
  )
}
