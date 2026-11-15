import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsType } from 'echarts'
import { useChartTheme } from '../../lib/chartTheme'

type Props = {
  years: string[]
  values: number[]
  median: number
  highlightYear?: string
  height?: number
}

export function SamePeriodChart({ years, values, median, highlightYear, height = 76 }: Props) {
  const chartTheme = useChartTheme()
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  useEffect(() => {
    const el = ref.current
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

    chart.setOption(
      {
        animation: false,
        grid: { left: 4, right: 4, top: 8, bottom: 4 },
        xAxis: { type: 'category', data: years, show: false },
        yAxis: { type: 'value', show: false },
        series: [
          {
            type: 'bar',
            data: values.map((v, i) => ({
              value: v,
              itemStyle: {
                color: years[i] === highlightYear ? '#ff5a00' : chartTheme.barDim,
                borderRadius: [2, 2, 0, 0],
              },
            })),
            barWidth: '55%',
          },
          {
            type: 'line',
            data: years.map(() => median),
            symbol: 'none',
            lineStyle: { type: 'dashed', color: chartTheme.medianLine, width: 1 },
          },
        ],
      },
      true,
    )
  }, [years, values, median, highlightYear, chartTheme])

  return <div ref={ref} style={{ height, width: '100%' }} aria-hidden />
}