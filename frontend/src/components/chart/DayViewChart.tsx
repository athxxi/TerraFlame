import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import type { EChartsType } from 'echarts'
import dayjs from 'dayjs'
import type { SeriesPoint } from '../../api'
import { formatInteger } from '../../lib/format'
import { heatmapColor } from '../../lib/heatmapColor'
import { heatmapGridVars } from '../../lib/heatmapLayout'
import { buildDayCalendar, weekdayLabel, yearsInDaySeries } from '../../lib/dayCalendar'
import { formatAxisValue, scaleValue, type ValueScale } from '../../lib/chartScale'
import { valueForMeasure, type ChartMeasure } from '../../lib/chartMeasure'
import { useChartTheme } from '../../lib/chartTheme'
import { useAppStore } from '../../store'
import './MonthHeatmapChart.css'
import './DayViewChart.css'
import './TimeControls.css'

type Props = {
  points: SeriesPoint[]
  partialLast: boolean
  scale: ValueScale
  measure: ChartMeasure
  showRangeBand: boolean
  onSelect: (date: string) => void
}

export function DayViewChart({
  points,
  partialLast,
  scale,
  measure,
  showRangeBand,
  onSelect,
}: Props) {
  const chartTheme = useChartTheme()
  const selectedDate = useAppStore((s) => s.selectedDate)
  const years = useMemo(() => yearsInDaySeries(points), [points])
  const latestYear = years[years.length - 1] ?? dayjs().year()
  const [calendarYear, setCalendarYear] = useState(latestYear)
  const activeYear = years.includes(calendarYear) ? calendarYear : latestYear

  const { maxWeek, cells } = useMemo(
    () => buildDayCalendar(points, activeYear, partialLast),
    [points, activeYear, partialLast],
  )

  const maxValue = useMemo(
    () => cells.reduce((m, c) => Math.max(m, valueForMeasure(c, measure)), 0),
    [cells, measure],
  )

  const cellMap = useMemo(() => {
    const map = new Map<string, (typeof cells)[number]>()
    cells.forEach((c) => map.set(`${c.isoWeek}-${c.weekday}`, c))
    return map
  }, [cells])

  const lineRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = lineRef.current
    if (!el) return
    const chart = echarts.init(el)
    chartRef.current = chart
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || points.length === 0) return

    const labels = points.map((p) => dayjs(p.t).format('YYYY-MM-DD'))
    const values = points.map((p) => scaleValue(measure === 'frp' ? p.frp : p.n, scale))
    const series: echarts.SeriesOption[] = [
      {
        type: 'line',
        data: values,
        showSymbol: false,
        lineStyle: { color: '#2c728e', width: 1.5 },
        areaStyle: { opacity: showRangeBand ? 0.06 : 0.08, color: '#2c728e' },
      },
    ]

    chart.setOption(
      {
        animation: false,
        grid: { left: 48, right: 16, top: 16, bottom: 64 },
        tooltip: {
          trigger: 'axis',
          backgroundColor: chartTheme.tooltipBg,
          textStyle: { color: chartTheme.tooltipText, fontSize: 12 },
          formatter: (raw: unknown) => {
            const items = Array.isArray(raw) ? raw : [raw]
            const item = items[0] as { dataIndex?: number }
            if (item?.dataIndex === undefined) return ''
            const p = points[item.dataIndex]
            const partial = partialLast && item.dataIndex === points.length - 1 ? ' · so far' : ''
            if (measure === 'frp') {
              return `${p.t}${partial}<br/>Fire power: ${formatInteger(Math.round(p.frp))}`
            }
            return `${p.t}${partial}<br/>${formatInteger(Math.round(p.n))} (${formatInteger(Math.round(p.lo))}–${formatInteger(Math.round(p.hi))})`
          },
        },
        dataZoom: [
          { type: 'inside', start: 0, end: 100 },
          { type: 'slider', height: 22, bottom: 8, start: 0, end: 100 },
        ],
        xAxis: {
          type: 'category',
          data: labels,
          axisLabel: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 10,
            color: chartTheme.axisLabel,
            formatter: (v: number) => formatAxisValue(v, scale),
          },
          splitLine: { lineStyle: { color: chartTheme.gridLine } },
        },
        series,
      },
      true,
    )

    chart.off('click')
    chart.on('click', (params) => {
      if (params.dataIndex === undefined || params.dataIndex < 0) return
      const p = points[params.dataIndex]
      if (p) onSelect(p.t)
    })
  }, [points, partialLast, scale, measure, showRangeBand, onSelect, chartTheme])

  return (
    <div className="day-view">
      <div className="day-view__calendar-head">
        <span className="time-controls__eyebrow">Calendar year</span>
        <select
          className="day-view__year-select"
          value={activeYear}
          onChange={(e) => setCalendarYear(Number(e.target.value))}
          aria-label="Calendar year"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="month-heatmap day-calendar" role="img" aria-label="Day calendar heatmap">
        <div
          className="month-heatmap__grid day-calendar__grid"
          style={heatmapGridVars(maxWeek)}
        >
          <div className="month-heatmap__corner" />
          {Array.from({ length: maxWeek }, (_, i) => (
            <span key={i} className="month-heatmap__year">
              {(i + 1) % 5 === 1 ? i + 1 : ''}
            </span>
          ))}
          {Array.from({ length: 7 }, (_, weekday) => (
            <div key={weekday} className="month-heatmap__row">
              <span className="month-heatmap__month">{weekdayLabel(weekday)}</span>
              {Array.from({ length: maxWeek }, (_, wi) => {
                const isoWeek = wi + 1
                const cell = cellMap.get(`${isoWeek}-${weekday}`)
                if (!cell) {
                  return (
                    <span
                      key={`${isoWeek}-${weekday}`}
                      className="month-heatmap__cell month-heatmap__cell--empty"
                    />
                  )
                }
                const selected = selectedDate === cell.t
                const measureVal = valueForMeasure(cell, measure)
                const title =
                  measure === 'frp'
                    ? `${cell.t}: fire power ${formatInteger(Math.round(measureVal))}${cell.partial ? ' · so far' : ''}`
                    : `${cell.t}: ${formatInteger(Math.round(measureVal))}${cell.partial ? ' · so far' : ''}`
                return (
                  <button
                    key={`${isoWeek}-${weekday}`}
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
      </div>

      <p className="caption day-view__brush-hint">
        Drag the brush under the line chart to zoom the day series. The day view is noisier than week
        or month.
      </p>

      <div ref={lineRef} className="day-view__line chart-canvas" style={{ height: 220 }} aria-label="Daily line chart" />
    </div>
  )
}