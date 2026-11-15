import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsType } from 'echarts'
import dayjs from 'dayjs'
import type { SeriesPoint } from '../../api'
import { formatInteger } from '../../lib/format'
import { formatAxisValue, scaleValue, type ValueScale } from '../../lib/chartScale'
import { useChartTheme } from '../../lib/chartTheme'

type Props = {
  points: SeriesPoint[]
  partialLast: boolean
  scale: ValueScale
  showRangeBand: boolean
  measure: 'detections' | 'frp'
  onSelect: (date: string) => void
  height?: number
}

export function YearBarChart({
  points,
  partialLast,
  scale,
  showRangeBand,
  measure,
  onSelect,
  height = 340,
}: Props) {
  const chartTheme = useChartTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = containerRef.current
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
    if (!chart) return

    const categories = points.map((p) => {
      const year = dayjs(p.t).year()
      if (partialLast && p === points[points.length - 1]) return `${year}\n(so far)`
      return String(year)
    })

    const values = points.map((p) => {
      const raw = measure === 'frp' ? p.frp : p.n
      return scaleValue(raw, scale)
    })

    const rangeData =
      showRangeBand && measure === 'detections'
        ? points.map((p, i) => {
            const lo = scaleValue(p.lo, scale)
            const hi = scaleValue(p.hi, scale)
            const mid = values[i]
            return [mid, lo, hi]
          })
        : []

    const barColors = points.map((_, i) => {
      const isPartial = partialLast && i === points.length - 1
      if (isPartial) return chartTheme.barPartial
      return '#2c728e'
    })

    const series: echarts.SeriesOption[] = [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: barColors[i],
            borderColor: partialLast && i === points.length - 1 ? chartTheme.rangeStroke : undefined,
            borderWidth: partialLast && i === points.length - 1 ? 1.5 : 0,
            borderType: partialLast && i === points.length - 1 ? 'dashed' : 'solid',
            borderRadius: 2,
          },
        })),
        barWidth: 26,
      },
    ]

    if (showRangeBand) {
      series.push({
        type: 'custom',
        renderItem: (params, api) => {
          const idx = params.dataIndex
          const tuple = rangeData[idx]
          if (!tuple) return null
          const [, lo, hi] = tuple
          const center = api.coord([idx, (lo + hi) / 2])
          const high = api.coord([idx, hi])
          const low = api.coord([idx, lo])
          return {
            type: 'line',
            shape: {
              x1: center[0],
              y1: high[1],
              x2: center[0],
              y2: low[1],
            },
            style: {
              stroke: chartTheme.rangeStroke,
              lineWidth: 1.5,
            },
          }
        },
        data: rangeData,
        z: 10,
      })
    }

    chart.setOption(
      {
        animation: false,
        grid: { left: 48, right: 16, top: 24, bottom: 40 },
        tooltip: {
          trigger: 'axis',
          backgroundColor: chartTheme.tooltipBg,
          borderWidth: 0,
          textStyle: { color: chartTheme.tooltipText, fontSize: 12 },
          formatter: (items: unknown) => {
            const item = Array.isArray(items) ? items[0] : items
            if (!item || item.dataIndex === undefined) return ''
            const p = points[item.dataIndex]
            const year = dayjs(p.t).year()
            const raw = measure === 'frp' ? p.frp : p.n
            const partial =
              partialLast && item.dataIndex === points.length - 1 ? ' · so far' : ''
            if (measure === 'frp') {
              return [`<strong>${year}${partial}</strong>`, `Fire power: ${formatInteger(Math.round(raw))}`].join(
                '<br/>',
              )
            }
            return [
              `<strong>${year}${partial}</strong>`,
              `about ${formatInteger(Math.round(raw))} (${formatInteger(Math.round(p.lo))} to ${formatInteger(Math.round(p.hi))})`,
              'VIIRS converted to MODIS-equivalent',
            ].join('<br/>')
          },
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: { fontSize: 10, color: chartTheme.axisLabel, interval: 4 },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: chartTheme.axisLine } },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 10,
            color: chartTheme.axisLabel,
            formatter: (v: number) => formatAxisValue(Number(v), scale),
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
  }, [points, partialLast, scale, showRangeBand, measure, onSelect, chartTheme])

  return <div ref={containerRef} className="chart-canvas" style={{ height }} role="img" aria-label="Year bar chart" />
}