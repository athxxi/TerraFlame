const baseUrl = import.meta.env.VITE_API_URL as string

export class ApiError extends Error {
  readonly status: number

  constructor(detail: string, status: number) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { detail?: string }
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail, res.status)
  }
  return res.json() as Promise<T>
}

export type Granularity = 'day' | 'week' | 'month' | 'year'

export type HealthResponse = {
  ok: boolean
  last_ingest: string | null
  data_from: string
  data_to: string
}

export type AoiStateBody = { state: string }
export type GeoJsonPolygon = {
  type: 'Polygon'
  coordinates: number[][][]
}

export type AoiGeoJsonBody = { geojson: GeoJsonPolygon }
export type AoiPointBody = { lat: number; lon: number; radius_km: number }
export type AoiRequestBody = AoiStateBody | AoiGeoJsonBody | AoiPointBody

export type AoiResponse = {
  aoi_id: string
  cells: number
  area_km2: number
}

export type SeriesPoint = {
  t: string
  n: number
  lo: number
  hi: number
  frp: number
}

export type SeriesResponse = {
  points: SeriesPoint[]
  meta: {
    granularity: Granularity
    data_from: string
    data_to: string
    partial_last: boolean
  }
}

export type AnomalyResponse = {
  granularity: Granularity
  period_start: string
  day: string
  current: number
  median: number
  partial: boolean
  ratio_to_median: number | null
  percentile: number
  rank: number
  n_compared: number
  robust_z: number | null
  same_period_by_year: Record<string, number>
}

export type LivePoint = {
  sensor: 'MODIS' | 'VN20' | 'VN21' | 'VNPP'
  lat: number
  lon: number
  time: string
  frp: number
  conf: string
}

export type LivePointsResponse = {
  too_many: boolean
  points: LivePoint[]
}

export type LiveSummaryResponse = {
  point_count: number
  hours: 24 | 48 | 72
  last_fetch: string | null
}

export type LandcoverMonth = {
  ym: string
  agri: number
  forest: number
  other: number
}

export type LandcoverResponse = {
  months: LandcoverMonth[]
}

export type ProofSeriesRow = {
  month: string
  MODIS: number
  VN20: number
  VN21: number
  VNPP: number
  n_h: number
  n_lo: number
  n_hi: number
}

export type ProofCheck<T = unknown> = {
  value: T
  sentence: string
}

export type ProofResponse = {
  series: ProofSeriesRow[]
  checks: {
    pattern_match: ProofCheck<{ day: number; week: number; month: number }>
    typical_difference: ProofCheck<number>
    busiest_months: ProofCheck<number>
    gap_closed: ProofCheck<[number, number]>
    peak_season: ProofCheck<number>
  }
}

export function getHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>('/health')
}

export function getRegions(): Promise<string[]> {
  return fetchJson<string[]>('/regions')
}

export function postAoi(body: AoiRequestBody): Promise<AoiResponse> {
  return fetchJson<AoiResponse>('/aoi', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getSeries(params: {
  aoi_id: string
  granularity: Granularity
  date_from?: string
  date_to?: string
}): Promise<SeriesResponse> {
  const q = new URLSearchParams({
    aoi_id: params.aoi_id,
    granularity: params.granularity,
  })
  if (params.date_from) q.set('date_from', params.date_from)
  if (params.date_to) q.set('date_to', params.date_to)
  return fetchJson<SeriesResponse>(`/series?${q}`)
}

export function getAnomaly(params: {
  aoi_id: string
  granularity: Granularity
  date?: string
}): Promise<AnomalyResponse> {
  const q = new URLSearchParams({
    aoi_id: params.aoi_id,
    granularity: params.granularity,
  })
  if (params.date) q.set('date', params.date)
  return fetchJson<AnomalyResponse>(`/anomaly?${q}`)
}

export function getLivePoints(params: {
  aoi_id: string
  hours: 24 | 48 | 72
}): Promise<LivePointsResponse> {
  const q = new URLSearchParams({
    aoi_id: params.aoi_id,
    hours: String(params.hours),
  })
  return fetchJson<LivePointsResponse>(`/live/points?${q}`)
}

export function getLiveSummary(params: {
  aoi_id: string
  hours: 24 | 48 | 72
}): Promise<LiveSummaryResponse> {
  const q = new URLSearchParams({
    aoi_id: params.aoi_id,
    hours: String(params.hours),
  })
  return fetchJson<LiveSummaryResponse>(`/live/summary?${q}`)
}

export function getLandcover(aoi_id: string): Promise<LandcoverResponse> {
  const q = new URLSearchParams({ aoi_id })
  return fetchJson<LandcoverResponse>(`/landcover?${q}`)
}

export function getProof(): Promise<ProofResponse> {
  return fetchJson<ProofResponse>('/proof')
}

export function buildExportCsvUrl(params: {
  aoi_id: string
  granularity: Granularity
  date_from?: string
  date_to?: string
  level: 'area' | 'cell' | 'points'
}): string {
  const q = new URLSearchParams({
    aoi_id: params.aoi_id,
    granularity: params.granularity,
    level: params.level,
  })
  if (params.date_from) q.set('date_from', params.date_from)
  if (params.date_to) q.set('date_to', params.date_to)
  return `${baseUrl}/export/csv?${q}`
}