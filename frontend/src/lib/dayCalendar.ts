import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import type { SeriesPoint } from '../api'

dayjs.extend(isoWeek)

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export type DayCalendarCell = {
  year: number
  isoWeek: number
  weekday: number
  value: number
  frp: number
  lo: number
  hi: number
  t: string
  partial: boolean
}

export function weekdayLabel(index: number): string {
  return WEEKDAY_LABELS[index] ?? ''
}

export function yearsInDaySeries(points: SeriesPoint[]): number[] {
  const set = new Set<number>()
  points.forEach((p) => set.add(dayjs(p.t).year()))
  return [...set].sort((a, b) => a - b)
}

export function buildDayCalendar(
  points: SeriesPoint[],
  year: number,
  partialLast: boolean,
): { maxWeek: number; cells: DayCalendarCell[] } {
  const cells: DayCalendarCell[] = []
  let maxWeek = 1

  points.forEach((p, index) => {
    const d = dayjs(p.t)
    if (d.year() !== year) return
    const isoWeekNum = d.isoWeek()
    const weekday = d.isoWeekday() - 1
    if (isoWeekNum > maxWeek) maxWeek = isoWeekNum
    cells.push({
      year,
      isoWeek: isoWeekNum,
      weekday,
      value: p.n,
      frp: p.frp,
      lo: p.lo,
      hi: p.hi,
      t: p.t,
      partial: partialLast && index === points.length - 1,
    })
  })

  return { maxWeek, cells }
}