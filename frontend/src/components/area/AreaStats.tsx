import { CELL_AREA_KM2, useAppStore } from '../../store'
import { formatInteger, formatKm2 } from '../../lib/format'
import './AreaStats.css'

type Props = {
  className?: string
}

export function AreaStats({ className = '' }: Props) {
  const aoiId = useAppStore((s) => s.aoiId)
  const areaLabel = useAppStore((s) => s.areaLabel)
  const areaCells = useAppStore((s) => s.areaCells)
  const areaKm2 = useAppStore((s) => s.areaKm2)

  if (!aoiId || areaCells === null || areaKm2 === null) {
    return null
  }

  const smallCellNote = areaKm2 < CELL_AREA_KM2

  return (
    <div className={`area-stats ${className}`.trim()} aria-live="polite">
      <p className="area-stats__primary">
        <strong>{areaLabel ?? 'Selected area'}</strong>
        <span className="area-stats__sep" aria-hidden>
          ·
        </span>
        {formatInteger(areaCells)} cells
        <span className="area-stats__sep" aria-hidden>
          ·
        </span>
        {formatKm2(areaKm2)}
      </p>
      <p className="area-stats__meta caption">
        Area id <code className="area-stats__code">{aoiId}</code>
      </p>
      {smallCellNote ? (
        <p className="area-stats__note caption">
          This area is smaller than one map cell (~{CELL_AREA_KM2} km²); it still covers one whole
          cell in the data.
        </p>
      ) : null}
    </div>
  )
}