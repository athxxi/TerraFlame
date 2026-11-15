import { useMemo } from 'react'
import { useThemeStore } from './themeStore'

export type ChartTheme = {
  tooltipBg: string
  tooltipText: string
  axisLabel: string
  axisLine: string
  gridLine: string
  barPartial: string
  barDim: string
  rangeStroke: string
  medianLine: string
  legendText: string
}

function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export function readChartTheme(): ChartTheme {
  return {
    tooltipBg: cssVar('--ink', '#161921'),
    tooltipText: cssVar('--shell-text', '#f0f0f0'),
    axisLabel: cssVar('--text-muted', 'rgba(22, 25, 33, 0.6)'),
    axisLine: cssVar('--chart-axis-line', 'rgba(22, 25, 33, 0.15)'),
    gridLine: cssVar('--chart-grid-line', 'rgba(22, 25, 33, 0.08)'),
    barPartial: cssVar('--chart-bar-partial', '#fafafa'),
    barDim: cssVar('--chart-bar-dim', 'rgba(22, 25, 33, 0.25)'),
    rangeStroke: cssVar('--text', '#161921'),
    medianLine: cssVar('--chart-median-line', 'rgba(22, 25, 33, 0.45)'),
    legendText: cssVar('--text', '#161921'),
  }
}

export function useChartTheme(): ChartTheme {
  const theme = useThemeStore((s) => s.theme)
  return useMemo(() => readChartTheme(), [theme])
}