import type { LivePoint } from '../api'

export const LIVE_MAP_SENSOR_LEGEND: readonly {
  key: LivePoint['sensor']
  label: string
  rgb: readonly [number, number, number]
}[] = [
  { key: 'MODIS', label: 'MODIS (Terra, Aqua)', rgb: [59, 82, 139] },
  { key: 'VNPP', label: 'VIIRS Suomi NPP', rgb: [107, 114, 128] },
  { key: 'VN20', label: 'VIIRS NOAA-20', rgb: [255, 90, 0] },
  { key: 'VN21', label: 'VIIRS NOAA-21', rgb: [194, 65, 12] },
]

const SENSOR_RGB = Object.fromEntries(
  LIVE_MAP_SENSOR_LEGEND.map((e) => [e.key, [...e.rgb] as [number, number, number]]),
) as Record<LivePoint['sensor'], [number, number, number]>

export function sensorColor(sensor: LivePoint['sensor']): [number, number, number, number] {
  const [r, g, b] = SENSOR_RGB[sensor] ?? [44, 114, 142]
  return [r, g, b, 210]
}

export function frpRadius(frp: number): number {
  const base = Math.sqrt(Math.max(0, frp)) * 1200
  return Math.min(25000, Math.max(2500, base))
}

export type Bounds = [[number, number], [number, number]]

export function boundsFromPoints(points: LivePoint[]): Bounds | null {
  if (points.length === 0) return null
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity
  for (const p of points) {
    if (p.lon < minLon) minLon = p.lon
    if (p.lon > maxLon) maxLon = p.lon
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
  }
  if (!Number.isFinite(minLon)) return null
  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ]
}

export const INDIA_CENTER: [number, number] = [82.5, 22.5]
export const INDIA_DEFAULT_ZOOM = 4.2