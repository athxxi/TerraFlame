import { scaleValue, type ValueScale } from './chartScale'

/** Viridis sequential scale; normalization follows chart scale (sqrt or linear). */
export function heatmapColor(
  value: number,
  maxPositive: number,
  scale: ValueScale = 'sqrt',
): string {
  if (value <= 0) return 'var(--heatmap-zero, #e8e8ec)'
  const v = scaleValue(value, scale)
  const max = scaleValue(maxPositive, scale)
  const t = max > 0 ? v / max : 0
  const stops = [
    { p: 0, c: [68, 1, 84] },
    { p: 0.35, c: [59, 82, 139] },
    { p: 0.65, c: [33, 145, 140] },
    { p: 1, c: [253, 231, 37] },
  ]
  let lower = stops[0]
  let upper = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].p && t <= stops[i + 1].p) {
      lower = stops[i]
      upper = stops[i + 1]
      break
    }
  }
  const local = upper.p === lower.p ? 1 : (t - lower.p) / (upper.p - lower.p)
  const rgb = lower.c.map((v, i) => Math.round(v + (upper.c[i] - v) * local))
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
}