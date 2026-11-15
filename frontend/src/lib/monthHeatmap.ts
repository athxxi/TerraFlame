import dayjs from 'dayjs'
import type { SeriesPoint } from '../api'
import { heatmapColor } from './heatmapColor'

export { heatmapColor }

export type MonthHeatmapCell = {
  year: number
  month: number
  value: number
  frp: number
  lo: number
  hi: number
  t: string
  partial: boolean
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export function monthLabel(monthIndex: number): string {
  return MONTH_LABELS[monthIndex] ?? ''
}

export function buildMonthHeatmap(
  points: SeriesPoint[],
  partialLast: boolean,
): { years: number[]; cells: MonthHeatmapCell[] } {
  const cells: MonthHeatmapCell[] = []
  const yearSet = new Set<number>()

  points.forEach((p, index) => {
    const d = dayjs(p.t)
    const year = d.year()
    const month = d.month()
    yearSet.add(year)
    cells.push({
      year,
      month,
      value: p.n,
      frp: p.frp,
      lo: p.lo,
      hi: p.hi,
      t: p.t,
      partial: partialLast && index === points.length - 1,
    })
  })

  const years = [...yearSet].sort((a, b) => a - b)
  return { years, cells }
}