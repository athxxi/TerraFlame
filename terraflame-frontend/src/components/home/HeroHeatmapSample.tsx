import { heatmapGridVars } from '../../lib/heatmapLayout'
import './HeroHeatmapSample.css'

const COLS = 27
const ROWS = 12

const MONTH_MARKS: Record<number, string> = {
  0: 'Jan',
  3: 'Apr',
  6: 'Jul',
  9: 'Oct',
}

function cellClasses(row: number, col: number): string {
  const isConverted = col >= 12
  const isPartial = row === 11 && col === 26
  const intensity = ((row + 1) * (col + 3)) % 7
  return [
    'hero-sample__cell',
    `hero-sample__cell--${intensity}`,
    isConverted ? 'hero-sample__cell--converted' : '',
    isPartial ? 'hero-sample__cell--partial' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

/** Decorative illustration matching the month heatmap — not live chart data. */
export function HeroHeatmapSample() {
  return (
    <div className="hero-sample panel" aria-hidden>
      <p className="eyebrow eyebrow--muted">Sample · monthly detections 2000 to today</p>

      <div className="hero-sample__chart">
        <div
          className="hero-sample__grid"
          style={{
            ...heatmapGridVars(COLS),
            ['--heatmap-cell-max' as string]: '14px',
          }}
        >
          <div className="hero-sample__corner" />
          {Array.from({ length: COLS }, (_, col) => (
            <span key={`y-${col}`} className="hero-sample__tick hero-sample__tick--year">
              {col === 0 ? '2000' : col === 10 ? '2010' : col === 20 ? '2020' : ''}
            </span>
          ))}
          {Array.from({ length: ROWS }, (_, row) => (
            <div key={`row-${row}`} className="hero-sample__row">
              <span className="hero-sample__tick hero-sample__tick--month">{MONTH_MARKS[row] ?? ''}</span>
              {Array.from({ length: COLS }, (_, col) => (
                <span key={`${row}-${col}`} className={cellClasses(row, col)} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="hero-sample__legend">
        <span>Fewer</span>
        <span className="hero-sample__scale" aria-hidden />
        <span>More</span>
      </div>
    </div>
  )
}