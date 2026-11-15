import { useEffect } from 'react'
import dayjs from 'dayjs'
import type { Granularity } from '../../api'
import { useHealth } from '../../hooks/useHealth'
import { useAppStore } from '../../store'
import './TimeControls.css'

/** Week view is not exposed in the UI; API still supports `week` for export. */
export const TIME_VIEW_GRANULARITIES = ['day', 'month', 'year'] as const satisfies readonly Granularity[]

type TimeViewGranularity = (typeof TIME_VIEW_GRANULARITIES)[number]

const GRANULARITY_LABEL: Record<TimeViewGranularity, string> = {
  day: 'Day',
  month: 'Month',
  year: 'Year',
}

type PresetId = 'all' | '10y' | '5y' | '12m' | '90d'

export function TimeControls() {
  const granularity = useAppStore((s) => s.granularity)
  const dateFrom = useAppStore((s) => s.dateFrom)
  const dateTo = useAppStore((s) => s.dateTo)
  const setGranularity = useAppStore((s) => s.setGranularity)
  const setDateRange = useAppStore((s) => s.setDateRange)

  useEffect(() => {
    if (granularity === 'week') setGranularity('month')
  }, [granularity, setGranularity])

  const healthQuery = useHealth()
  const dataFrom = healthQuery.data?.data_from ?? '2000-11-01'
  const dataTo = healthQuery.data?.data_to ?? dayjs().format('YYYY-MM-DD')

  function applyPreset(id: PresetId) {
    const end = dayjs(dataTo)
    let start = dayjs(dataFrom)
    switch (id) {
      case 'all':
        start = dayjs(dataFrom)
        break
      case '10y':
        start = end.subtract(10, 'year')
        break
      case '5y':
        start = end.subtract(5, 'year')
        break
      case '12m':
        start = end.subtract(12, 'month')
        break
      case '90d':
        start = end.subtract(90, 'day')
        break
    }
    if (start.isBefore(dayjs(dataFrom))) start = dayjs(dataFrom)
    setDateRange(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'))
  }

  function onGranularityChange(next: TimeViewGranularity) {
    setGranularity(next)
    if (next === 'day') {
      const end = dayjs(dataTo)
      const start = end.subtract(12, 'month')
      setDateRange(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'))
    }
  }

  const activePreset = detectPreset(dateFrom, dateTo, dataFrom, dataTo)

  return (
    <div className="time-controls panel">
      <div className="time-controls__row">
        <div className="time-controls__group">
          <span className="time-controls__eyebrow">Time view</span>
          <div className="segmented" role="group" aria-label="Granularity">
            {TIME_VIEW_GRANULARITIES.map((g) => (
              <button
                key={g}
                type="button"
                className={`segmented__btn${granularity === g ? ' segmented__btn--active' : ''}`}
                onClick={() => onGranularityChange(g)}
              >
                {GRANULARITY_LABEL[g]}
              </button>
            ))}
          </div>
        </div>

        <div className="time-controls__group">
          <span className="time-controls__eyebrow">Date range</span>
          <div className="time-controls__dates">
            <input
              type="date"
              className="time-controls__date"
              value={dateFrom}
              min={dataFrom}
              max={dateTo}
              onChange={(e) => setDateRange(e.target.value, dateTo)}
              aria-label="Range start"
            />
            <span className="caption">to</span>
            <input
              type="date"
              className="time-controls__date"
              value={dateTo}
              min={dateFrom}
              max={dataTo}
              onChange={(e) => setDateRange(dateFrom, e.target.value)}
              aria-label="Range end"
            />
          </div>
        </div>
      </div>

      <div className="time-controls__presets" role="group" aria-label="Range presets">
        {(
          [
            ['all', 'All years'],
            ['10y', 'Last 10 years'],
            ['5y', 'Last 5 years'],
            ['12m', 'Last 12 months'],
            ['90d', 'Last 90 days'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`preset-chip${activePreset === id ? ' preset-chip--active' : ''}`}
            onClick={() => applyPreset(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {granularity === 'day' ? (
        <p className="time-controls__note caption">
          Day view is noisier than month or year. Range is capped at about 12 months for the day view.
        </p>
      ) : null}
    </div>
  )
}

function detectPreset(
  dateFrom: string,
  dateTo: string,
  dataFrom: string,
  dataTo: string,
): PresetId | null {
  const end = dayjs(dateTo)
  const start = dayjs(dateFrom)
  const allStart = dayjs(dataFrom)
  const apiEnd = dayjs(dataTo)
  if (start.isSame(allStart, 'day') && end.isSame(apiEnd, 'day')) return 'all'
  if (start.isSame(end.subtract(10, 'year'), 'day')) return '10y'
  if (start.isSame(end.subtract(5, 'year'), 'day')) return '5y'
  if (start.isSame(end.subtract(12, 'month'), 'day')) return '12m'
  if (start.isSame(end.subtract(90, 'day'), 'day')) return '90d'
  return null
}
