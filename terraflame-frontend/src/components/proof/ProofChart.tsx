import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsType } from 'echarts'
import dayjs from 'dayjs'
import type { ProofSeriesRow } from '../../api'
import { useChartTheme } from '../../lib/chartTheme'

type Props = {
  series: ProofSeriesRow[]
  height?: number
}

export function ProofChart({ series, height = 360 }: Props) {
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
    if (!chart || series.length === 0) return

    const months = series.map((r) => dayjs(r.month).format('MMM YYYY'))
    const modis = series.map((r) => r.MODIS ?? null)
    const vnpp = series.map((r) => r.VNPP ?? null)
    const converted = series.map((r) => r.n_h ?? null)
    const nLo = series.map((r) => r.n_lo ?? 0)
    const bandTop = series.map((r, i) => Math.max(0, (r.n_hi ?? 0) - nLo[i]))

    chart.setOption({
      animation: false,
      grid: { left: 56, right: 24, top: 48, bottom: 72 },
      legend: {
        top: 4,
        textStyle: { color: chartTheme.legendText },
        data: ['MODIS (raw)', 'VIIRS S-NPP (raw)', 'Converted (n_h)', 'Converted range'],
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: chartTheme.tooltipBg,
        borderWidth: 0,
        textStyle: { color: chartTheme.tooltipText, fontSize: 12 },
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: {
          hideOverlap: true,
          interval: Math.floor(months.length / 12),
          color: chartTheme.axisLabel,
        },
        axisLine: { lineStyle: { color: chartTheme.axisLine } },
      },
      yAxis: {
        type: 'value',
        name: 'Hotspot detections',
        nameGap: 36,
        nameTextStyle: { color: chartTheme.axisLabel },
        axisLabel: { color: chartTheme.axisLabel },
        splitLine: { lineStyle: { color: chartTheme.gridLine } },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'slider', height: 22, bottom: 8, xAxisIndex: 0 },
      ],
      series: [
        {
          name: 'Converted range',
          type: 'line',
          data: nLo,
          lineStyle: { opacity: 0 },
          stack: 'band',
          symbol: 'none',
          silent: true,
          showInLegend: false,
          z: 1,
        },
        {
          name: 'Converted range',
          type: 'line',
          data: bandTop,
          lineStyle: { opacity: 0 },
          areaStyle: { color: 'rgba(44, 114, 142, 0.22)' },
          stack: 'band',
          symbol: 'none',
          silent: true,
          z: 1,
        },
        {
          name: 'MODIS (raw)',
          type: 'line',
          data: modis,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#2c728e' },
          z: 3,
        },
        {
          name: 'VIIRS S-NPP (raw)',
          type: 'line',
          data: vnpp,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#6b7280' },
          z: 3,
        },
        {
          name: 'Converted (n_h)',
          type: 'line',
          data: converted,
          showSymbol: false,
          lineStyle: { width: 2.5, color: '#ff5a00' },
          z: 4,
        },
      ],
    })
  }, [series, chartTheme])

  return <div ref={containerRef} className="proof-chart" style={{ height }} role="img" aria-label="Proof time series chart" />
}