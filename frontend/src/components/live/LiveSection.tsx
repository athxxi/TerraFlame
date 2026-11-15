import { useState } from 'react'
import { LiveMap } from './LiveMap'
import { LivePanel } from './LivePanel'
import { useAppStore } from '../../store'
import '../chart/TimeControls.css'
import './LiveSection.css'

export function LiveSection() {
  const [hours, setHours] = useState<24 | 48 | 72>(24)
  const aoiId = useAppStore((s) => s.aoiId)
  const showSidePanel = Boolean(aoiId)

  return (
    <section className="live-section">
      <div
        className={`live-section__grid${showSidePanel ? '' : ' live-section__grid--map-only'}`}
      >
        <LiveMap hours={hours} onHoursChange={setHours} />
        {showSidePanel ? <LivePanel hours={hours} /> : null}
      </div>
    </section>
  )
}