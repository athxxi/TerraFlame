import { CELL_AREA_KM2, useAppStore } from '../../store'
import { formatInteger, formatKm2 } from '../../lib/format'
import './ExplorerAreaSummary.css'

export function ExplorerAreaSummary() {
  const aoiId = useAppStore((s) => s.aoiId)
  const areaLabel = useAppStore((s) => s.areaLabel)
  const areaCells = useAppStore((s) => s.areaCells)
  const areaKm2 = useAppStore((s) => s.areaKm2)
  const mode = useAppStore((s) => s.explorerDataMode)
  const areaTab = useAppStore((s) => s.areaPickerTab)

  if (!aoiId || areaCells === null || areaKm2 === null) {
    return (
      <div className="explorer-summary explorer-summary--empty">
        <p className="explorer-summary__hint">
          No area yet — select a <strong>state</strong>, or use <strong>Draw</strong> / <strong>Point</strong>{' '}
          then confirm on the map.
        </p>
      </div>
    )
  }

  const smallCell = areaKm2 < CELL_AREA_KM2

  return (
    <div className="explorer-summary">
      <div className="explorer-summary__chip" aria-live="polite">
        <span className="explorer-summary__name">{areaLabel ?? 'Selected area'}</span>
        <span className="explorer-summary__meta">
          {formatInteger(areaCells)} cells · {formatKm2(areaKm2)}
        </span>
      </div>
      <p className="explorer-summary__next caption">
        {mode === 'historical'
          ? 'Use the chart below to move through time. Click a period for anomaly detail.'
          : areaTab === 'draw' || areaTab === 'point'
            ? 'Set corners or a centre on the map, then confirm with Use this area.'
            : 'Hotspot detections update every few hours; the newest day is always incomplete.'}
      </p>
      {smallCell ? (
        <p className="explorer-summary__note caption">
          Smaller than one map cell (~{CELL_AREA_KM2} km²) — data still uses one whole cell.
        </p>
      ) : null}
    </div>
  )
}