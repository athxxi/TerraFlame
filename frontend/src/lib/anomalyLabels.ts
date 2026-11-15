import dayjs from 'dayjs'
import type { AnomalyResponse } from '../api'

export type AnomalyLevel = 'much-lower' | 'lower' | 'typical' | 'higher' | 'much-higher'

const LEVEL_LABEL: Record<AnomalyLevel, string> = {
  'much-lower': 'Much lower',
  lower: 'Lower',
  typical: 'Typical',
  higher: 'Higher',
  'much-higher': 'Much higher',
}

export function anomalyLevelFromPercentile(percentile: number): AnomalyLevel {
  if (percentile >= 90) return 'much-higher'
  if (percentile >= 70) return 'higher'
  if (percentile <= 10) return 'much-lower'
  if (percentile <= 30) return 'lower'
  return 'typical'
}

export function levelLabel(level: AnomalyLevel): string {
  return LEVEL_LABEL[level]
}

export function periodHeadline(data: AnomalyResponse, ratioText: string | null): string {
  const name = periodLabel(data)
  if (!ratioText) {
    return `${name} has very little hotspot activity compared with history`
  }
  return `${name} is ${ratioText} the usual for this time of year`
}

export function periodLabel(data: AnomalyResponse): string {
  const start = dayjs(data.period_start)
  const partialSuffix = data.partial ? ' so far' : ''

  switch (data.granularity) {
    case 'month':
      return `${start.format('MMMM')}${partialSuffix}`
    case 'week':
      return `Week of ${start.format('D MMM YYYY')}${partialSuffix}`
    case 'year':
      return `${start.year()}${partialSuffix}`
    case 'day':
      return `${start.format('D MMMM YYYY')}${partialSuffix}`
    default:
      return `${start.format('D MMM YYYY')}${partialSuffix}`
  }
}

export function formatRatio(ratio: number | null): string | null {
  if (ratio === null) return null
  if (ratio < 0.05) return null
  return `${ratio.toFixed(1)}×`
}

export function ordinalRank(rank: number, nCompared: number): string {
  const suffix =
    rank % 10 === 1 && rank % 100 !== 11
      ? 'st'
      : rank % 10 === 2 && rank % 100 !== 12
        ? 'nd'
        : rank % 10 === 3 && rank % 100 !== 13
          ? 'rd'
          : 'th'
  return `${rank}${suffix} highest of ${nCompared} years`
}