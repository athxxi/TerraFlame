import { AreaPicker } from '../components/area/AreaPicker'
import { MainChart } from '../components/chart/MainChart'
import { AnomalyPanel } from '../components/anomaly/AnomalyPanel'
import { LiveSection } from '../components/live/LiveSection'
import { LandcoverCard } from '../components/landcover/LandcoverCard'
import { ExplorerAreaSummary } from '../components/explorer/ExplorerAreaSummary'
import { useAppStore } from '../store'
import './ExplorerPage.css'
import '../components/chart/TimeControls.css'

export function ExplorerPage() {
  const mode = useAppStore((s) => s.explorerDataMode)
  const setMode = useAppStore((s) => s.setExplorerDataMode)
  const aoiId = useAppStore((s) => s.aoiId)
  const areaTab = useAppStore((s) => s.areaPickerTab)
  const mapDrawing = areaTab === 'draw' || areaTab === 'point'
  const workspaceLocked = !aoiId && !mapDrawing

  const mapTools = areaTab === 'draw' || areaTab === 'point'
  const workspaceTitle = mode === 'historical' ? 'Detection history' : 'Live map'
  const workspaceLead =
    mode === 'historical'
      ? 'Counts of satellite hotspot detections by year, month, week, or day.'
      : 'Detections from the last 24–72 hours for your chosen area.'

  const viewNote = mapTools
    ? 'Draw and point work on the live map below. Use State to open long-term charts.'
    : mode === 'historical'
      ? 'Harmonized counts from 2000 — year, month, week, or day.'
      : 'Hotspot map and totals for the last 24–72 hours.'

  return (
    <div className="explorer-page">
      <div className="content-page__surface explorer-page__shell">
        <div className="explorer">
      <section className="explorer-command panel" aria-label="Explorer controls">
        <header className="explorer-command__head">
          <p className="eyebrow">Explorer</p>
          <h1 className="title-sm">Choose an area and view</h1>
          <p className="caption explorer-command__lede">
            Pick a state, or switch to Draw or Point and shape the area on the live map.
          </p>
        </header>

        <div className="explorer-command__stack">
          <div className="explorer-command__block">
            <p className="eyebrow" id="explorer-area-label">
              Define area
            </p>
            <AreaPicker variant="explorer" aria-labelledby="explorer-area-label" />
          </div>

          <div className="explorer-command__meta">
            <div className="explorer-command__status" aria-live="polite">
              <p className="eyebrow">Selected area</p>
              <ExplorerAreaSummary />
            </div>

            <div className="explorer-command__view">
              <p className="eyebrow" id="explorer-view-label">
                Data view
              </p>
              <div
                className="segmented explorer-command__mode"
                role="group"
                aria-labelledby="explorer-view-label"
              >
                <button
                  type="button"
                  className={`segmented__btn${mode === 'historical' ? ' segmented__btn--active' : ''}`}
                  disabled={mapTools}
                  title={mapTools ? 'Switch to State to use historical charts' : undefined}
                  onClick={() => setMode('historical')}
                >
                  Historical
                </button>
                <button
                  type="button"
                  className={`segmented__btn${mode === 'live' ? ' segmented__btn--active' : ''}`}
                  onClick={() => setMode('live')}
                >
                  Live
                </button>
              </div>
              <p className="caption explorer-command__view-note">{viewNote}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="explorer-workspace" aria-labelledby="explorer-workspace-title">
        <header className="explorer-workspace__head">
          <h2 id="explorer-workspace-title">{workspaceTitle}</h2>
          <p className="caption">{workspaceLead}</p>
        </header>

        {workspaceLocked ? (
          <div className="explorer-workspace__empty panel">
            <p className="explorer-workspace__empty-title">No area selected yet</p>
            <p className="caption">
              Choose a state above, or switch to <strong>Live</strong> and use <strong>Draw</strong> or{' '}
              <strong>Point</strong> on the map.
            </p>
          </div>
        ) : null}

        <div className={`explorer-workspace__body${workspaceLocked ? ' explorer-workspace__body--dimmed' : ''}`}>
          {mode === 'historical' ? (
            <>
              <MainChart />
              <AnomalyPanel />
              <LandcoverCard />
            </>
          ) : (
            <LiveSection />
          )}
        </div>
      </main>
        </div>
      </div>
    </div>
  )
}