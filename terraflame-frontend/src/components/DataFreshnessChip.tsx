import dayjs from 'dayjs'
import type { HealthResponse } from '../api'
import statusDot from '../assets/icons/status-dot.svg'
import './DataFreshnessChip.css'

type Props = {
  health: HealthResponse | undefined
  loading: boolean
  error: boolean
}

function formatChipLabel(health: HealthResponse): string {
  if (health.last_ingest === null) {
    return 'Live updates pending'
  }
  const updatedAt = dayjs(health.last_ingest).format('D MMM YYYY, HH:mm Z')
  return `Updated ${updatedAt}`
}

function chipTone(health: HealthResponse | undefined): 'success' | 'warning' | 'danger' {
  if (!health || health.last_ingest === null) return 'warning'
  const hoursAgo = dayjs().diff(dayjs(health.last_ingest), 'hour')
  if (hoursAgo <= 6) return 'success'
  if (hoursAgo <= 48) return 'warning'
  return 'danger'
}

export function DataFreshnessChip({ health, loading, error }: Props) {
  if (error) {
    return (
      <span className="freshness-chip freshness-chip--danger" role="status">
        <span className="freshness-chip__dot" aria-hidden />
        Could not reach the API. Is the backend running?
      </span>
    )
  }

  if (loading || !health) {
    return (
      <span className="freshness-chip freshness-chip--neutral" role="status">
        <span className="freshness-chip__dot freshness-chip__dot--pulse" aria-hidden />
        Loading data status…
      </span>
    )
  }

  const tone = chipTone(health)
  const label = formatChipLabel(health)

  return (
    <span className={`freshness-chip freshness-chip--${tone}`} role="status">
      <img src={statusDot} alt="" className="freshness-chip__icon" width={8} height={8} />
      {label}
    </span>
  )
}