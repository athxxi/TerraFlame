import { useMemo } from 'react'
import dayjs from 'dayjs'
import type { SeriesPoint } from '../../api'
import { formatInteger } from '../../lib/format'
import { heatmapGridVars } from '../../lib/heatmapLayout'
import { buildMonthHeatmap, monthLabel } from '../../lib/monthHeatmap'
import { heatmapColor } from '../../lib/heatmapColor'
import type { ValueScale } from '../../lib/chartScale'
import { valueForMeasure, type ChartMeasure } from '../../lib/chartMeasure'
import { useAppStore } from '../../store'
import './MonthHeatmapChart.css'

type Props = {
  points: SeriesPoint[]
  partialLast: boolean
  scale: ValueScale
  measure: ChartMeasure
  onSelect: (date: string) => void
}

export function MonthHeatmapChart({ points, partialLast, scale, measure, onSelect }: Props) {
  const selectedDate = useAppStore((s) => s.selectedDate)

  const { years, cells } = useMemo(
    () => buildMonthHeatmap(points, partialLast),
    [points, partialLast],
  )

  const maxValue = useMemo(
    () => cells.reduce((m, c) => Math.max(m, valueForMeasure(c, measure)), 0),
    [cells, measure],
  )

  const cellMap = useMemo(() => {
    const map = new Map<string, (typeof cells)[number]>()
    cells.forEach((c) => map.set(`${c.year}-${c.month}`, c))
    return map
  }, [cells])

  return (
    <div className="month-heatmap" role="img" aria-label="Month heatmap by year">
      <div className="month-heatmap__grid" style={heatmapGridVars(years.length)}>
        <div className="month-heatmap__corner" />
        {years.map((year) => (
          <span key={year} className="month-heatmap__year">
            {year % 10 === 0 || year === years[years.length - 1] ? year : ''}
          </span>
        ))}
        {Array.from({ length: 12 }, (_, month) => (
          <div key={month} className="month-heatmap__row">
            <span className="month-heatmap__month">{month % 3 === 0 ? monthLabel(month) : ''}</span>
            {years.map((year) => {
              const cell = cellMap.get(`${year}-${month}`)
              if (!cell) {
                return <span key={`${year}-${month}`} className="month-heatmap__cell month-heatmap__cell--empty" />
              }
              const selected = selectedDate === cell.t
              const measureVal = valueForMeasure(cell, measure)
              const title =
                measure === 'frp'
                  ? `${dayjs(cell.t).format('MMMM YYYY')}: fire power ${formatInteger(Math.round(measureVal))}${cell.partial ? ' · so far' : ''}`
                  : `${dayjs(cell.t).format('MMMM YYYY')}: ${formatInteger(Math.round(measureVal))} (${formatInteger(Math.round(cell.lo))}–${formatInteger(Math.round(cell.hi))})${cell.partial ? ' · so far' : ''}`
              return (
                <button
                  key={`${year}-${month}`}
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
        ))}
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