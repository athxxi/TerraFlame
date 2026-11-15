import dayjs from 'dayjs'
import type { Granularity } from '../api'

export type CsvExportLevel = 'area' | 'cell' | 'points'

export function cellExportNeedsWarning(
  level: CsvExportLevel,
  areaCells: number | null,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (level !== 'cell') return false
  const days = Math.max(0, dayjs(dateTo).diff(dayjs(dateFrom), 'day'))
  if (areaCells !== null && areaCells > 800) return true
  if (days > 366) return true
  return false
}

export const LEVEL_LABELS: Record<CsvExportLevel, string> = {
  area: 'Area totals',
  cell: 'Per map cell',
  points: 'Raw live detections',
}

export const LEVEL_HELP: Record<CsvExportLevel, string> = {
  area: 'One row per time step at the chosen granularity.',
  cell: 'One row per map cell and day — can be very large.',
  points: 'Raw near-real-time detections in the date range.',
}

export const GRANULARITY_EXPORT = ['day', 'month', 'year'] as const satisfies readonly Granularity[]

export type ExportGranularity = (typeof GRANULARITY_EXPORT)[number]