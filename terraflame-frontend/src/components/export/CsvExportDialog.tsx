import { useId, useState } from 'react'
import dayjs from 'dayjs'
import { buildExportCsvUrl } from '../../api'
import { useHealth } from '../../hooks/useHealth'
import { useAppStore } from '../../store'
import {
  cellExportNeedsWarning,
  GRANULARITY_EXPORT,
  type ExportGranularity,
  LEVEL_HELP,
  LEVEL_LABELS,
  type CsvExportLevel,
} from '../../lib/csvExportWarning'
import { Button } from '../ui/Button'
import './CsvExportDialog.css'

type Props = {
  open: boolean
  onClose: () => void
}

const GRAN_LABEL: Record<ExportGranularity, string> = {
  day: 'Day',
  month: 'Month',
  year: 'Year',
}

export function CsvExportDialog({ open, onClose }: Props) {
  if (!open) return null
  return <CsvExportDialogBody onClose={onClose} />
}

function CsvExportDialogBody({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const aoiId = useAppStore((s) => s.aoiId)
  const areaCells = useAppStore((s) => s.areaCells)
  const storeGranularity = useAppStore((s) => s.granularity)
  const storeDateFrom = useAppStore((s) => s.dateFrom)
  const storeDateTo = useAppStore((s) => s.dateTo)

  const healthQuery = useHealth()
  const dataFrom = healthQuery.data?.data_from ?? '2000-11-01'
  const dataTo = healthQuery.data?.data_to ?? dayjs().format('YYYY-MM-DD')

  const [granularity, setGranularity] = useState<ExportGranularity>(() =>
    storeGranularity === 'week' ? 'month' : storeGranularity,
  )
  const [level, setLevel] = useState<CsvExportLevel>('area')
  const [dateFrom, setDateFrom] = useState(storeDateFrom)
  const [dateTo, setDateTo] = useState(storeDateTo)
  const [confirmLarge, setConfirmLarge] = useState(false)

  const needsWarning = cellExportNeedsWarning(level, areaCells, dateFrom, dateTo)
  const canDownload = Boolean(aoiId) && (!needsWarning || confirmLarge)

  function handleDownload() {
    if (!aoiId || !canDownload) return
    const url = buildExportCsvUrl({
      aoi_id: aoiId,
      granularity,
      date_from: dateFrom,
      date_to: dateTo,
      level,
    })
    window.location.assign(url)
    onClose()
  }

  return (
    <div className="csv-export-backdrop" role="presentation" onClick={onClose}>
      <dialog
        open
        className="csv-export-dialog panel"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onCancel={(e) => {
          e.preventDefault()
          onClose()
        }}
      >
        <header className="csv-export-dialog__header">
          <h2 id={titleId}>Download CSV</h2>
          <button type="button" className="csv-export-dialog__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {!aoiId ? (
          <p className="caption">Choose an area before downloading.</p>
        ) : (
          <>
            <label className="csv-export-field">
              <span className="caption">Time step</span>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as ExportGranularity)}
                disabled={level === 'points'}
              >
                {GRANULARITY_EXPORT.map((g) => (
                  <option key={g} value={g}>
                    {GRAN_LABEL[g]}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="csv-export-levels">
              <legend className="caption">What to export</legend>
              {(['area', 'cell', 'points'] as const).map((lv) => (
                <label key={lv} className="csv-export-level">
                  <input
                    type="radio"
                    name="export-level"
                    checked={level === lv}
                    onChange={() => {
                      setLevel(lv)
                      setConfirmLarge(false)
                    }}
                  />
                  <span>
                    <strong>{LEVEL_LABELS[lv]}</strong>
                    <span className="caption csv-export-level__help">{LEVEL_HELP[lv]}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="csv-export-dates">
              <label className="csv-export-field">
                <span className="caption">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  min={dataFrom}
                  max={dateTo}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </label>
              <label className="csv-export-field">
                <span className="caption">To</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  max={dataTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </label>
            </div>

            {needsWarning ? (
              <div className="csv-export-warn" role="alert">
                <p>
                  Per-cell exports for large areas or long ranges can reach millions of rows and take
                  a long time. Consider a smaller area, a shorter range, or area-level export.
                </p>
                <label className="csv-export-confirm">
                  <input
                    type="checkbox"
                    checked={confirmLarge}
                    onChange={(e) => setConfirmLarge(e.target.checked)}
                  />
                  I understand — download per-cell data anyway
                </label>
              </div>
            ) : null}

            <footer className="csv-export-dialog__actions">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" variant="primary" disabled={!canDownload} onClick={handleDownload}>
                Download CSV
              </Button>
            </footer>
          </>
        )}
      </dialog>
    </div>
  )
}