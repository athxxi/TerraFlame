import { useMemo } from 'react'
import dayjs from 'dayjs'
import type { SeriesPoint } from '../../api'
import { formatInteger } from '../../lib/format'
import { heatmapColor } from '../../lib/heatmapColor'
import type { ValueScale } from '../../lib/chartScale'
import { valueForMeasure, type ChartMeasure } from '../../lib/chartMeasure'
import { heatmapGridVars } from '../../lib/heatmapLayout'
import { buildWeekHeatmap } from '../../lib/weekHeatmap'
import { useAppStore } from '../../store'
import './MonthHeatmapChart.css'

type Props = {
  points: SeriesPoint[]
  partialLast: boolean
  scale: ValueScale
  measure: ChartMeasure
  onSelect: (date: string) => void
}

const MAX_WEEKS = 53

export function WeekHeatmapChart({ points, partialLast, scale, measure, onSelect }: Props) {
  const selectedDate = useAppStore((s) => s.selectedDate)

  const { years, cells } = useMemo(
    () => buildWeekHeatmap(points, partialLast),
    [points, partialLast],
  )

  const maxValue = useMemo(
    () => cells.reduce((m, c) => Math.max(m, valueForMeasure(c, measure)), 0),
    [cells, measure],
  )

  const cellMap = useMemo(() => {
    const map = new Map<string, (typeof cells)[number]>()
    cells.forEach((c) => map.set(`${c.isoYear}-${c.isoWeek}`, c))
    return map
  }, [cells])

  return (
    <div className="month-heatmap week-heatmap" role="img" aria-label="Week heatmap by ISO year">
      <div
        className="month-heatmap__grid week-heatmap__grid"
        style={{
          ...heatmapGridVars(years.length),
          gridTemplateRows: `auto repeat(${MAX_WEEKS}, minmax(6px, 10px))`,
        }}
      >
        <div className="month-heatmap__corner" />
        {years.map((year) => (
          <span key={year} className="month-heatmap__year">
            {year}
          </span>
        ))}
        {Array.from({ length: MAX_WEEKS }, (_, wi) => {
          const weekNum = wi + 1
          return (
            <div key={weekNum} className="month-heatmap__row">
              <span className="month-heatmap__month">{weekNum % 4 === 1 ? `W${weekNum}` : ''}</span>
              {years.map((year) => {
                const cell = cellMap.get(`${year}-${weekNum}`)
                if (!cell) {
                  return (
                    <span
                      key={`${year}-${weekNum}`}
                      className="month-heatmap__cell month-heatmap__cell--empty"
                    />
                  )
                }
                const selected = selectedDate === cell.t
                const measureVal = valueForMeasure(cell, measure)
                const title =
                  measure === 'frp'
                    ? `ISO week ${weekNum}, ${year}: fire power ${formatInteger(Math.round(measureVal))}${cell.partial ? ' · so far' : ''} · from ${dayjs(cell.t).format('D MMM YYYY')}`
                    : `ISO week ${weekNum}, ${year}: ${formatInteger(Math.round(measureVal))} (${formatInteger(Math.round(cell.lo))}–${formatInteger(Math.round(cell.hi))})${cell.partial ? ' · so far' : ''} · from ${dayjs(cell.t).format('D MMM YYYY')}`
                return (
                  <button
                    key={`${year}-${weekNum}`}
                    type="button"
                    className={[
                      'month-heatmap__cell',
                      cell.partial ? 'month-heatmap__cell--partial' : '',
                      selected ? 'month-heatmap__cell--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ background: heatmapColor(measureVal, maxValue, scale) }}
                    title={title}
                    aria-label={title}
                    onClick={() => onSelect(cell.t)}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="month-heatmap__legend caption">
        <span className="month-heatmap__swatch month-heatmap__swatch--zero" />{' '}
        {measure === 'frp' ? 'No fire power' : 'Zero detections'}
        <span className="month-heatmap__scale" />
        Higher ({scale === 'sqrt' ? 'square-root' : 'linear'}, viridis)
        <span className="month-heatmap__swatch month-heatmap__swatch--partial" /> Newest period, so far
      </div>
    </div>
  )
}