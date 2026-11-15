import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsType } from 'echarts'
import { ApiError, type LandcoverMonth } from '../../api'
import { useLandcover } from '../../hooks/useLandcover'
import './LandcoverCard.css'

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const idx = Number(m) - 1
  return `${names[idx] ?? m} ${y}`
}

function buildChart(chart: EChartsType, months: LandcoverMonth[]) {
  const labels = months.map((m) => monthLabel(m.ym))
  chart.setOption({
    animation: false,
    grid: { left: 48, right: 16, top: 32, bottom: 40 },
    legend: { top: 0, data: ['Agriculture', 'Forest', 'Other'] },
    tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${v}%` },
    xAxis: { type: 'category', data: labels, axisLabel: { hideOverlap: true } },
    yAxis: { type: 'value', name: 'Share of detections (%)', max: 100 },
    series: [
      {
        name: 'Agriculture',
        type: 'bar',
        stack: 'lc',
        data: months.map((m) => m.agri),
        itemStyle: { color: '#7cb342' },
      },
      {
        name: 'Forest',
        type: 'bar',
        stack: 'lc',
        data: months.map((m) => m.forest),
        itemStyle: { color: '#2e7d4f' },
      },
      {
        name: 'Other',
        type: 'bar',
        stack: 'lc',
        data: months.map((m) => m.other),
        itemStyle: { color: '#b0bec5' },
      },
    ],
  })
}

export function LandcoverCard() {
  const landcoverQuery = useLandcover()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  const months = useMemo(
    () => landcoverQuery.data?.months ?? [],
    [landcoverQuery.data?.months],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el || months.length === 0) return
    const chart = echarts.init(el)
    chartRef.current = chart
    buildChart(chart, months)
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
      chartRef.current = null
    }
  }, [months])

  useEffect(() => {
    const chart = chartRef.current
    if (chart && months.length > 0) buildChart(chart, months)
  }, [months])

  if (!landcoverQuery.isLoading && months.length === 0) {
    return null
  }

  return (
    <section className="landcover-card panel" aria-busy={landcoverQuery.isLoading}>
      <header className="landcover-card__header">
        <p className="eyebrow">Land cover mix</p>
        <p className="caption">Share of hotspot detections by land cover class each month.</p>
      </header>

      {landcoverQuery.isLoading ? <p className="caption">Loading land cover…</p> : null}

      {landcoverQuery.isError ? (
        <p className="landcover-card__error" role="alert">
          {landcoverQuery.error instanceof ApiError
            ? landcoverQuery.error.message
            : 'Could not load land cover.'}
        </p>
      ) : null}

      {months.length > 0 ? (
        <div ref={containerRef} className="landcover-card__chart" style={{ height: 280 }} />
      ) : null}
    </section>
  )
}