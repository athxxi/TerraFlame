export type ChartMeasure = 'detections' | 'frp'

type MeasurePoint = { frp: number; n?: number; value?: number }

export function valueForMeasure(point: MeasurePoint, measure: ChartMeasure): number {
  const n = point.n ?? point.value ?? 0
  return measure === 'frp' ? point.frp : n
}