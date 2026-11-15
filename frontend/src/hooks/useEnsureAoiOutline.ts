import { useEffect } from 'react'
import { WHOLE_INDIA_API, WHOLE_INDIA_LABEL } from '../components/area/AreaPicker'
import { geometryForState } from '../lib/stateBoundaries'
import { useAppStore } from '../store'

/** Backfill outline when an area was chosen before boundaries loaded (or after refresh). */
export function useEnsureAoiOutline() {
  const aoiId = useAppStore((s) => s.aoiId)
  const aoiOutline = useAppStore((s) => s.aoiOutline)
  const areaLabel = useAppStore((s) => s.areaLabel)
  const setAoiOutline = useAppStore((s) => s.setAoiOutline)

  useEffect(() => {
    if (!aoiId || aoiOutline || !areaLabel) return
    if (areaLabel === 'Drawn area' || areaLabel.includes('km radius')) return

    const state =
      areaLabel === WHOLE_INDIA_LABEL ? WHOLE_INDIA_API : areaLabel

    let cancelled = false
    void geometryForState(state)
      .then((geometry) => {
        if (!cancelled && geometry) setAoiOutline(geometry)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [aoiId, aoiOutline, areaLabel, setAoiOutline])
}