import dayjs from 'dayjs'
import { ApiError } from '../../api'
import { useAnomaly } from '../../hooks/useAnomaly'
import { useAppStore } from '../../store'
import { formatInteger } from '../../lib/format'
import {
  anomalyLevelFromPercentile,
  formatRatio,
  levelLabel,
  ordinalRank,
  periodHeadline,
  type AnomalyLevel,
} from '../../lib/anomalyLabels'
import { SamePeriodChart } from './SamePeriodChart'
import './AnomalyPanel.css'

const LEVELS: AnomalyLevel[] = ['much-lower', 'lower', 'typical', 'higher', 'much-higher']

export function AnomalyPanel() {
  const aoiId = useAppStore((s) => s.aoiId)
  const selectedDate = useAppStore((s) => s.selectedDate)
  const query = useAnomaly()

  if (!aoiId) {
    return null
  }

  const referenceLabel = selectedDate
    ? dayjs(selectedDate).format('D MMMM YYYY')
    : 'Latest complete period (from chart click or default)'

  return (
    <section className="anomaly panel" aria-busy={query.isLoading}>
      <header className="anomaly__header">
        <p className="eyebrow">Is this period unusual for this area?</p>
        <p className="anomaly__reference caption" title={referenceLabel}>
          {referenceLabel}
        </p>
      </header>

      {query.isLoading ? <p className="caption">Loading comparison…</p> : null}

      {query.isError ? (
        <p className="anomaly__error" role="alert">
          {query.error instanceof ApiError
            ? query.error.message
            : 'Could not load anomaly comparison.'}
        </p>
      ) : null}

      {query.data ? (
        <AnomalyContent data={query.data} />
      ) : null}
    </section>
  )
}

function AnomalyContent({ data }: { data: import('../../api').AnomalyResponse }) {
  const level = anomalyLevelFromPercentile(data.percentile)
  const ratioText = formatRatio(data.ratio_to_median)
  const headline = periodHeadline(data, ratioText)
  const yearEntries = Object.entries(data.same_period_by_year).sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  )
  const years = yearEntries.map(([y]) => y)
  const values = yearEntries.map(([, v]) => v)
  const highlightYear = dayjs(data.period_start).year().toString()

  return (
    <>
      <div className="anomaly__headline-row">
        <h2 className="anomaly__headline">{headline}</h2>
        <span className={`anomaly__badge anomaly__badge--${level}`}>{levelLabel(level)}</span>
      </div>

      <div className="anomaly__levels" role="presentation">
        {LEVELS.map((l) => (
          <div key={l} className={`anomaly__level anomaly__level--${l}`}>
            <span className={`anomaly__level-bar${l === level ? ' anomaly__level-bar--active' : ''}`} />
            <span className={l === level ? 'anomaly__level-label--active' : 'caption'}>
              {levelLabel(l)}
            </span>
          </div>
        ))}
      </div>

      {data.ratio_to_median === null ? (
        <p className="anomaly__quiet caption">
          The usual value for this period is zero, so there is no meaningful ratio. This often
          happens in quiet areas or outside fire season — use the percentile and year bars below as a
          rough guide.
        </p>
      ) : null}

      <div className="anomaly__metrics">
        <div className="anomaly__ratio">
          <p className="anomaly__ratio-value">{ratioText ?? '—'}</p>
          <p className="caption">usual for this time of year</p>
          <p className="anomaly__current mono">
            {formatInteger(Math.round(data.current))} hotspot detections
          </p>
        </div>

        <div className="anomaly__percentile">
          <p className="anomaly__percentile-text">
            Higher than {Math.round(data.percentile)}% of the same time in earlier years
          </p>
          <div className="anomaly__percentile-track">
            <div
              className="anomaly__percentile-fill"
              style={{ width: `${Math.min(100, Math.max(0, data.percentile))}%` }}
            />
          </div>
          <div className="anomaly__percentile-scale">
            <span>0</span>
            <span>100</span>
          </div>
          <p className="anomaly__rank">{ordinalRank(data.rank, data.n_compared)}</p>
        </div>

        <div className="anomaly__history">
          <SamePeriodChart
            years={years}
            values={values}
            median={data.median}
            highlightYear={highlightYear}
          />
          <p className="caption">
            Same time of year, each year · dashed line = median ({formatInteger(Math.round(data.median))})
          </p>
        </div>
      </div>

      <p className="caption anomaly__footnote">
        Compared with the same dates of earlier years. Single days vary a lot; weekly and monthly
        views are more reliable than daily ones.
      </p>
    </>
  )
}