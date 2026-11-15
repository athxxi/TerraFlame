import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import type { SeriesPoint } from '../api'

dayjs.extend(isoWeek)

export type WeekHeatmapCell = {
  isoYear: number
  isoWeek: number
  value: number
  frp: number
  lo: number
  hi: number
  t: string
  partial: boolean
}

export function buildWeekHeatmap(
  points: SeriesPoint[],
  partialLast: boolean,
): { years: number[]; cells: WeekHeatmapCell[] } {
  const cells: WeekHeatmapCell[] = []
  const yearSet = new Set<number>()

  points.forEach((p, index) => {
    const d = dayjs(p.t)
    const isoYear = d.isoWeekYear()
    const isoWeekNum = d.isoWeek()
    yearSet.add(isoYear)
    cells.push({
      isoYear,
      isoWeek: isoWeekNum,
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