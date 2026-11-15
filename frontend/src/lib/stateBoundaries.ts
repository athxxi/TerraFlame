import type { Feature, FeatureCollection, Geometry } from 'geojson'

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'TerraFlameV1/1.0 (India fire calendar; localhost dev)'

const geometryCache = new Map<string, Geometry | null>()
let lastNominatimMs = 0

/** Nominatim asks for at most one request per second. */
async function waitNominatimSlot() {
  const now = Date.now()
  const wait = Math.max(0, 1100 - (now - lastNominatimMs))
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  lastNominatimMs = Date.now()
}

async function nominatimGeoJson(
  params: Record<string, string>,
): Promise<FeatureCollection> {
  await waitNominatimSlot()
  const url = new URL(NOMINATIM_SEARCH)
  url.searchParams.set('format', 'geojson')
  url.searchParams.set('polygon_geojson', '1')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  })
  if (!res.ok) throw new Error('Could not load boundary from OpenStreetMap.')
  return (await res.json()) as FeatureCollection
}

function isAreaGeometry(geometry: Geometry | null | undefined): geometry is Exclude<
  Geometry,
  { type: 'Point' } | { type: 'MultiPoint' } | { type: 'LineString' } | { type: 'MultiLineString' }
> {
  if (!geometry) return false
  return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon'
}

function pickBoundaryFeature(features: Feature[], expectedName: string): Geometry | null {
  const norm = expectedName.toLowerCase().trim()
  const ranked = features
    .map((feature, index) => ({ feature, index }))
    .filter(({ feature }) => isAreaGeometry(feature.geometry))

  const exact = ranked.find(
    ({ feature }) =>
      typeof feature.properties?.name === 'string' &&
      feature.properties.name.toLowerCase().trim() === norm,
  )
  if (exact?.feature.geometry) return exact.feature.geometry

  const admin = ranked.find(
    ({ feature }) =>
      feature.properties?.category === 'boundary' &&
      feature.properties?.type === 'administrative',
  )
  if (admin?.feature.geometry) return admin.feature.geometry

  return ranked[0]?.feature.geometry ?? null
}

export async function geometryForState(state: string): Promise<Geometry | null> {
  const cacheKey = state === 'India' ? 'osm:country:India' : `osm:state:${state}`
  if (geometryCache.has(cacheKey)) return geometryCache.get(cacheKey) ?? null

  try {
    const collection =
      state === 'India'
        ? await nominatimGeoJson({
            q: 'India',
            countrycodes: 'in',
            limit: '1',
            featureType: 'country',
          })
        : await nominatimGeoJson({
            q: state,
            countrycodes: 'in',
            limit: '5',
            featureType: 'state',
          })

    const geometry = pickBoundaryFeature(collection.features, state === 'India' ? 'India' : state)
    geometryCache.set(cacheKey, geometry)
    return geometry
  } catch {
    geometryCache.set(cacheKey, null)
    return null
  }
}