import type { GeoJsonPolygon } from '../api'

/** Rough circle in WGS84 — matches backend buffer (radius_km / 111°). */
export function circlePolygon(
  lon: number,
  lat: number,
  radiusKm: number,
  steps = 72,
): GeoJsonPolygon {
  const ring: number[][] = []
  const latRad = (lat * Math.PI) / 180
  const kmPerDegLat = 111.32
  const kmPerDegLon = Math.max(kmPerDegLat * Math.cos(latRad), 0.01)

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    const dx = (radiusKm * Math.cos(angle)) / kmPerDegLon
    const dy = (radiusKm * Math.sin(angle)) / kmPerDegLat
    ring.push([lon + dx, lat + dy])
  }

  return { type: 'Polygon', coordinates: [ring] }
}