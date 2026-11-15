import type { Feature, FeatureCollection } from 'geojson'
import type { GeoJsonPolygon } from '../api'

type LngLat = [number, number]

export function ringFromVertices(vertices: LngLat[]): number[][] {
  if (vertices.length < 3) return []
  const first = vertices[0]
  const last = vertices[vertices.length - 1]
  const closed =
    first[0] === last[0] && first[1] === last[1] ? vertices : [...vertices, first]
  return closed
}

export function polygonFromVertices(vertices: LngLat[]): GeoJsonPolygon | null {
  const ring = ringFromVertices(vertices)
  if (ring.length < 4) return null
  return { type: 'Polygon', coordinates: [ring] }
}

export function previewGeoJson(
  vertices: LngLat[],
  finished: GeoJsonPolygon | null,
): FeatureCollection {
  const features: Feature[] = []

  if (vertices.length > 0) {
    features.push({
      type: 'Feature',
      properties: { kind: 'verts' },
      geometry: {
        type: 'MultiPoint',
        coordinates: vertices,
      },
    })
  }

  if (vertices.length >= 2) {
    features.push({
      type: 'Feature',
      properties: { kind: 'line' },
      geometry: {
        type: 'LineString',
        coordinates: vertices,
      },
    })
  }

  const draftPoly = polygonFromVertices(vertices)
  const poly = finished ?? draftPoly
  if (poly) {
    features.push({
      type: 'Feature',
      properties: { kind: finished ? 'done' : 'draft' },
      geometry: poly,
    })
  }

  return { type: 'FeatureCollection', features }
}