import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { GeoJsonPolygon } from '../api'

export function featureToAoiPolygon(feature: Feature): GeoJsonPolygon | null {
  const geom = feature.geometry
  if (geom.type === 'Polygon') {
    return { type: 'Polygon', coordinates: (geom as Polygon).coordinates }
  }
  if (geom.type === 'MultiPolygon') {
    const first = (geom as MultiPolygon).coordinates[0]
    if (!first) return null
    return { type: 'Polygon', coordinates: first }
  }
  return null
}

export function ringsFromDrawFeatures(features: Feature[]): GeoJsonPolygon | null {
  for (const feature of features) {
    const polygon = featureToAoiPolygon(feature)
    if (polygon) return polygon
  }
  return null
}