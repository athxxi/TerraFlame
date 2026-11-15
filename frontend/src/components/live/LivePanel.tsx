import dayjs from 'dayjs'
import { ApiError } from '../../api'
import { useLiveDailySeries } from '../../hooks/useLiveDailySeries'
import { useLiveSummary } from '../../hooks/useLiveSummary'
import { useAppStore } from '../../store'
import { formatInteger } from '../../lib/format'
import { heatmapColor } from '../../lib/heatmapColor'
import './LivePanel.css'

type Props = {
  hours: 24 | 48 | 72
}

export function LivePanel({ hours }: Props) {
  const aoiId = useAppStore((s) => s.aoiId)
  const summaryQuery = useLiveSummary(hours)
  const seriesQuery = useLiveDailySeries()

  if (!aoiId) return null

  const points = seriesQuery.data?.points ?? []
  const maxN = points.reduce((m, p) => (p.n > m ? p.n : m), 0)
  const partialLast = seriesQuery.data?.meta.partial_last ?? false

  return (
    <section className="live-panel panel" aria-busy={summaryQuery.isLoading || seriesQuery.isLoading}>
      <p className="eyebrow">Live panel</p>

      {summaryQuery.isError ? (
        <p className="live-panel__error" role="alert">
          {summaryQuery.error instanceof ApiError
            ? summaryQuery.error.message
            : 'Could not load live summary.'}
        </p>
      ) : (
        <p className="live-panel__count">
          <span className="live-panel__count-value">
            {summaryQuery.data ? formatInteger(summaryQuery.data.point_count) : '—'}
          </span>
          <span className="caption">hotspot detections in the last {hours} hours</span>
        </p>
      )}

      {seriesQuery.isError ? (
        <p className="live-panel__error" role="alert">
          {seriesQuery.error instanceof ApiError
            ? seriesQuery.error.message
            : 'Could not load daily counts.'}
        </p>
      ) : null}

      {points.length > 0 ? (
        <div className="live-panel__bars">
          {points.map((p, i) => {
            const isPartial = partialLast && i === points.length - 1
            const label = dayjs(p.t).format('D MMM')
            const height = maxN > 0 ? Math.max(4, (Math.sqrt(p.n) / Math.sqrt(maxN)) * 100) : 4
            return (
              <div key={p.t} className="live-panel__bar-col" title={`${label}: ${Math.round(p.n)} detections`}>
                <div
                  className={['live-panel__bar', isPartial ? 'live-panel__bar--partial' : '']
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    height: `${height}%`,
                    background: heatmapColor(p.n, maxN),
                  }}
                />
                <span className="live-panel__bar-label">{label}</span>
              </div>
            )
          })}
        </div>
      ) : seriesQuery.isLoading ? (
        <p className="caption">Loading daily bars…</p>
      ) : (
        <p className="caption">No daily detections in the last 14 days.</p>
      )}

      <p className="caption live-panel__note">
        Today is partial until satellite passes complete. Counts are hotspot detections, not fires.
      </p>
    </section>
  )
}