import type { Geometry } from 'geojson'
import * as maplibregl from 'maplibre-gl'

function extendCoords(coords: unknown, extend: (lng: number, lat: number) => void) {
  if (!Array.isArray(coords)) return
  if (typeof coords[0] === 'number') {
    extend(coords[0], coords[1])
    return
  }
  for (const part of coords) extendCoords(part, extend)
}

function coordsForGeometry(geometry: Geometry): unknown {
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.map((g) => coordsForGeometry(g))
  }
  return geometry.coordinates
}

export function boundsFromGeometry(geometry: Geometry | null): maplibregl.LngLatBounds | null {
  if (!geometry) return null
  const bounds = new maplibregl.LngLatBounds()
  let n = 0
  const extend = (lng: number, lat: number) => {
    bounds.extend([lng, lat])
    n += 1
  }
  extendCoords(coordsForGeometry(geometry), extend)
  return n > 0 ? bounds : null
}