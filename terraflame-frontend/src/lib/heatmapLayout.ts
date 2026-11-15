/** Max cell width (px): fewer columns → larger cap so the chart uses horizontal space. */
export function heatmapCellMaxPx(columnCount: number): number {
  if (columnCount <= 4) return 72
  if (columnCount <= 8) return 48
  if (columnCount <= 14) return 36
  if (columnCount <= 22) return 28
  return 22
}

export function heatmapGridVars(columnCount: number): Record<string, string | number> {
  return {
    '--heatmap-cols': columnCount,
    '--heatmap-cell-max': `${heatmapCellMaxPx(columnCount)}px`,
  }
}