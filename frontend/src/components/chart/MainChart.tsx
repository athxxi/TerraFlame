import { useState } from 'react'
import { CsvExportDialog } from '../export/CsvExportDialog'
import { Button } from '../ui/Button'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api'
import { useSeries } from '../../hooks/useSeries'
import { useAppStore } from '../../store'
import { TimeControls } from './TimeControls'
import { YearBarChart } from './YearBarChart'
import { MonthHeatmapChart } from './MonthHeatmapChart'
import { WeekHeatmapChart } from './WeekHeatmapChart'
import { DayViewChart } from './DayViewChart'
import type { ValueScale } from '../../lib/chartScale'
import './MainChart.css'
import './TimeControls.css'

export function MainChart() {
  const aoiId = useAppStore((s) => s.aoiId)
  const granularity = useAppStore((s) => s.granularity)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)

  const seriesQuery = useSeries()
  const [scale, setScale] = useState<ValueScale>('sqrt')
  const [measure, setMeasure] = useState<'detections' | 'frp'>('detections')
  const [exportOpen, setExportOpen] = useState(false)
  const showRangeBand = true

  if (!aoiId) {
    return (
      <div className="main-chart panel">
        <p className="caption">Choose an area to load hotspot detection history.</p>
      </div>
    )
  }

  const headerLabel =
    granularity === 'year'
      ? 'Main chart · year view'
      : granularity === 'month'
        ? 'Main chart · month view'
        : granularity === 'week'
          ? 'Main chart · week view'
          : 'Main chart · day view'

  return (
    <div className="main-chart">
      <TimeControls />

      <section className="main-chart__card panel" aria-busy={seriesQuery.isLoading}>
        <header className="main-chart__header main-chart__header--row">
          <p className="eyebrow">{headerLabel}</p>
          <Button type="button" variant="secondary" onClick={() => setExportOpen(true)}>
            Download CSV
          </Button>
        </header>

        <div className="main-chart__toggles">
          <div className="main-chart__toggle-group">
            <span className="time-controls__eyebrow">Measure</span>
            <div className="segmented" role="group" aria-label="Measure">
              <button
                type="button"
                className={`segmented__btn${measure === 'detections' ? ' segmented__btn--active' : ''}`}
                onClick={() => setMeasure('detections')}
              >
                Detections
              </button>
              <button
                type="button"
                className={`segmented__btn${measure === 'frp' ? ' segmented__btn--active' : ''}`}
                onClick={() => setMeasure('frp')}
              >
                Fire power
              </button>
            </div>
          </div>
          <div className="main-chart__toggle-group">
            <span className="time-controls__eyebrow">Scale</span>
            <div className="segmented" role="group" aria-label="Value scale">
              <button
                type="button"
                className={`segmented__btn${scale === 'sqrt' ? ' segmented__btn--active' : ''}`}
                onClick={() => setScale('sqrt')}
              >
                Square-root
              </button>
              <button
                type="button"
                className={`segmented__btn${scale === 'linear' ? ' segmented__btn--active' : ''}`}
                onClick={() => setScale('linear')}
              >
                Linear
              </button>
            </div>
          </div>
        </div>

        {seriesQuery.isLoading ? <p className="main-chart__status">Loading chart…</p> : null}

        {seriesQuery.isError ? (
          <p className="main-chart__error" role="alert">
            {seriesQuery.error instanceof ApiError
              ? seriesQuery.error.message
              : 'Could not load series data.'}
          </p>
        ) : null}

        {seriesQuery.data && seriesQuery.data.points.length === 0 && !seriesQuery.isLoading ? (
          <p className="main-chart__status">No hotspot detections in this range.</p>
        ) : null}

        {granularity === 'day' && !seriesQuery.isLoading && !seriesQuery.isError ? (
          <p className="main-chart__day-note caption" role="note">
            Daily detections are noisy. Week and month views are usually easier to read.
          </p>
        ) : null}

        {seriesQuery.data && seriesQuery.data.points.length > 0 ? (
          <>
            {granularity === 'year' ? (
              <YearBarChart
                points={seriesQuery.data.points}
                partialLast={seriesQuery.data.meta.partial_last}
                scale={scale}
                showRangeBand={showRangeBand}
                measure={measure}
                onSelect={setSelectedDate}
              />
            ) : null}
            {granularity === 'month' ? (
              <MonthHeatmapChart
                points={seriesQuery.data.points}
                partialLast={seriesQuery.data.meta.partial_last}
                scale={scale}
                measure={measure}
                onSelect={setSelectedDate}
              />
            ) : null}
            {granularity === 'week' ? (
              <WeekHeatmapChart
                points={seriesQuery.data.points}
                partialLast={seriesQuery.data.meta.partial_last}
                scale={scale}
                measure={measure}
                onSelect={setSelectedDate}
              />
            ) : null}
            {granularity === 'day' ? (
              <DayViewChart
                points={seriesQuery.data.points}
                partialLast={seriesQuery.data.meta.partial_last}
                scale={scale}
                measure={measure}
                showRangeBand={showRangeBand}
                onSelect={setSelectedDate}
              />
            ) : null}
          </>
        ) : null}

        <CsvExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />

        <footer className="main-chart__footer caption">
          <span>The newest days are updated every 3 hours from live data.</span>
          <Link to="/proof" className="text-link text-link--small">
            How do we know the sensors agree?
          </Link>
        </footer>
      </section>
    </div>
  )
}