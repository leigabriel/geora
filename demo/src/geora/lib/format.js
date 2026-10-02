export const formatCoord = (value) => `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)}°`
