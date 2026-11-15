import type { Geometry } from 'geojson'
import type { SelectAoiInput } from '../hooks/useSelectAoi'
import { circlePolygon } from './pointRadiusPolygon'
import { geometryForState } from './stateBoundaries'

export async function resolveAoiOutline(input: SelectAoiInput): Promise<Geometry | null> {
  if (input.kind === 'geojson') return input.geojson
  if (input.kind === 'point') {
    return circlePolygon(input.lon, input.lat, input.radius_km)
  }
  if (input.kind === 'state') {
    return geometryForState(input.state)
  }
  return null
}