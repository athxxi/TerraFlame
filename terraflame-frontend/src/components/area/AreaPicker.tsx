import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api'
import { useRegions } from '../../hooks/useRegions'
import { useSelectAoi } from '../../hooks/useSelectAoi'
import { useAppStore, type AreaPickerTab } from '../../store'
import { Button } from '../ui/Button'
import { AreaStats } from './AreaStats'
import './AreaPicker.css'

export const WHOLE_INDIA_LABEL = 'Whole India'
export const WHOLE_INDIA_API = 'India'

type Props = {
  variant?: 'card' | 'inline' | 'explorer'
  className?: string
  'aria-labelledby'?: string
}

const AREA_TAB_ORDER: AreaPickerTab[] = ['india', 'state', 'draw', 'point']

const TAB_LABELS: Record<AreaPickerTab, string> = {
  india: 'Whole India',
  state: 'State',
  draw: 'Draw',
  point: 'Point',
}

export function AreaPicker({ variant = 'card', className = '', 'aria-labelledby': labelledBy }: Props) {
  const tab = useAppStore((s) => s.areaPickerTab)
  const setAreaPickerTab = useAppStore((s) => s.setAreaPickerTab)
  const setExplorerDataMode = useAppStore((s) => s.setExplorerDataMode)
  const explorerDataMode = useAppStore((s) => s.explorerDataMode)
  const drawnPolygon = useAppStore((s) => s.drawnPolygon)
  const pickedPoint = useAppStore((s) => s.pickedPoint)
  const pointRadiusKm = useAppStore((s) => s.pointRadiusKm)
  const setPointRadiusKm = useAppStore((s) => s.setPointRadiusKm)
  const areaLabel = useAppStore((s) => s.areaLabel)

  const navigate = useNavigate()
  const regionsQuery = useRegions()
  const selectAoi = useSelectAoi()

  const sortedRegions = useMemo(() => {
    const list = regionsQuery.data ?? []
    return [...list].sort((a, b) => a.localeCompare(b))
  }, [regionsQuery.data])

  const stateSelectValue = areaLabel && sortedRegions.includes(areaLabel) ? areaLabel : ''

  const errorMessage =
    selectAoi.error instanceof ApiError
      ? selectAoi.error.message
      : selectAoi.error
        ? 'Could not set this area.'
        : null

  function applyState(value: string) {
    if (!value) return
    setAreaPickerTab('state')
    selectAoi.mutate({ kind: 'state', label: value, state: value })
  }

  function applyWholeIndia() {
    setAreaPickerTab('india')
    if (areaLabel === WHOLE_INDIA_LABEL || selectAoi.isPending) return
    selectAoi.mutate({ kind: 'state', label: WHOLE_INDIA_LABEL, state: WHOLE_INDIA_API })
  }

  function handleAreaTab(key: AreaPickerTab) {
    if (key === 'india') {
      applyWholeIndia()
      return
    }
    setAreaPickerTab(key)
    if (key === 'draw' || key === 'point') setExplorerDataMode('live')
  }

  function commitSelection() {
    if (tab === 'draw' && drawnPolygon) {
      selectAoi.mutate({ kind: 'geojson', label: 'Drawn area', geojson: drawnPolygon })
      return
    }
    if (tab === 'point' && pickedPoint && pointRadiusKm > 0) {
      const label = `${pointRadiusKm} km radius`
      selectAoi.mutate({
        kind: 'point',
        label,
        lat: pickedPoint.lat,
        lon: pickedPoint.lon,
        radius_km: pointRadiusKm,
      })
    }
  }

  const needsConfirm = tab === 'draw' || tab === 'point'
  const canSubmit =
    !selectAoi.isPending &&
    ((tab === 'draw' && Boolean(drawnPolygon)) ||
      (tab === 'point' && Boolean(pickedPoint) && pointRadiusKm > 0))

  const areaTabs = (
    <div className="area-picker__tabs" role="tablist" aria-labelledby="area-picker-label">
      {AREA_TAB_ORDER.map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={tab === key}
          className={`area-picker__tab area-picker__tab--${key}${tab === key ? ' area-picker__tab--active' : ''}`}
          onClick={() => handleAreaTab(key)}
        >
          {TAB_LABELS[key]}
        </button>
      ))}
    </div>
  )

  const explorerBody = (
    <>
      <div className="area-picker__toolbar area-picker__toolbar--explorer">
        {areaTabs}

        <div className="area-picker__controls" role="tabpanel">
          {tab === 'india' ? (
            <p className="caption area-picker__india-note">National totals and maps for all of India.</p>
          ) : null}
          {tab === 'state' ? (
            <label className="area-picker__state-select">
              <span className="visually-hidden">Choose a state</span>
              <select
                disabled={regionsQuery.isLoading || selectAoi.isPending}
                value={stateSelectValue}
                onChange={(e) => applyState(e.target.value)}
              >
                <option value="" disabled>
                  {regionsQuery.isLoading ? 'Loading…' : 'Choose a state…'}
                </option>
                {sortedRegions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {tab === 'draw' ? <DrawControls mapMode={explorerDataMode} /> : null}
          {tab === 'point' ? (
            <PointControls pickedPoint={pickedPoint} pointRadiusKm={pointRadiusKm} onRadiusChange={setPointRadiusKm} />
          ) : null}
        </div>

        {needsConfirm ? (
          <Button
            variant="primary"
            className="area-picker__submit area-picker__submit--toolbar"
            disabled={!canSubmit}
            onClick={commitSelection}
          >
            {selectAoi.isPending ? 'Setting…' : 'Use this area'}
          </Button>
        ) : null}
      </div>

      {regionsQuery.isError && (tab === 'state' || tab === 'india') ? (
        <p className="area-picker__error" role="alert">
          {regionsQuery.error instanceof Error ? regionsQuery.error.message : 'Could not load state list.'}
        </p>
      ) : null}
      {selectAoi.isPending && (tab === 'state' || tab === 'india') ? (
        <p className="area-picker__pending caption">Updating area…</p>
      ) : null}
      {errorMessage ? (
        <p className="area-picker__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </>
  )

  if (variant === 'explorer') {
    return (
      <div
        className={`area-picker area-picker--explorer ${className}`.trim()}
        role="group"
        aria-labelledby={labelledBy ?? 'area-picker-label'}
      >
        <span className="visually-hidden" id="area-picker-label">
          Choose area
        </span>
        {explorerBody}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`area-picker area-picker--inline ${className}`.trim()}>
        <span className="visually-hidden" id="area-picker-label">
          Choose area
        </span>
        <div className="area-picker-inline__row">
          {areaTabs}
          <label className="area-picker-inline__label">
            <span className="visually-hidden">Choose a state</span>
            <select
              className="area-picker-inline__select"
              disabled={regionsQuery.isLoading || selectAoi.isPending || tab !== 'state'}
              value={stateSelectValue}
              onChange={(e) => applyState(e.target.value)}
            >
              <option value="" disabled>
                {regionsQuery.isLoading ? 'Loading states…' : 'Choose a state'}
              </option>
              {sortedRegions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="secondary"
            onClick={() => {
              setAreaPickerTab('draw')
              navigate('/explorer')
            }}
          >
            Draw on Map
          </Button>
        </div>
        {regionsQuery.isError ? (
          <p className="area-picker__error" role="alert">
            {regionsQuery.error instanceof Error
              ? regionsQuery.error.message
              : 'Could not load state list.'}
          </p>
        ) : null}
        {selectAoi.isPending ? <p className="caption">Setting area…</p> : null}
        {errorMessage ? (
          <p className="area-picker__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <AreaStats />
      </div>
    )
  }

  return (
    <div className={`area-picker area-picker--card panel ${className}`.trim()}>
      <span className="visually-hidden" id="area-picker-label">
        Choose area
      </span>
      <div className="area-picker__toolbar">
        {areaTabs}

        <div className="area-picker__controls" role="tabpanel">
          {tab === 'india' ? (
            <p className="caption area-picker__india-note">National totals for all of India.</p>
          ) : null}
          {tab === 'state' ? (
            <label className="area-picker__state-select">
              <span className="visually-hidden">Choose a state</span>
              <select
                disabled={regionsQuery.isLoading || selectAoi.isPending}
                value={stateSelectValue}
                onChange={(e) => applyState(e.target.value)}
              >
                <option value="" disabled>
                  {regionsQuery.isLoading ? 'Loading…' : 'Choose a state…'}
                </option>
                {sortedRegions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {tab === 'draw' ? (
            <DrawControls mapMode={explorerDataMode} />
          ) : null}

          {tab === 'point' ? (
            <PointControls
              pickedPoint={pickedPoint}
              pointRadiusKm={pointRadiusKm}
              onRadiusChange={setPointRadiusKm}
            />
          ) : null}
        </div>

        <AreaStats className="area-picker__stats-bar" />

        {needsConfirm ? (
          <Button
            variant="primary"
            className="area-picker__submit area-picker__submit--toolbar"
            disabled={!canSubmit}
            onClick={commitSelection}
          >
            {selectAoi.isPending ? 'Setting…' : 'Use this area'}
          </Button>
        ) : null}
      </div>

      {regionsQuery.isError && (tab === 'state' || tab === 'india') ? (
        <p className="area-picker__error" role="alert">
          {regionsQuery.error instanceof Error
            ? regionsQuery.error.message
            : 'Could not load state list.'}
        </p>
      ) : null}
      {selectAoi.isPending && (tab === 'state' || tab === 'india') ? (
        <p className="area-picker__pending caption">Updating area…</p>
      ) : null}
      {errorMessage ? (
        <p className="area-picker__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}

function DrawControls({ mapMode }: { mapMode: 'historical' | 'live' }) {
  const vertices = useAppStore((s) => s.drawDraftVertices)
  const drawnPolygon = useAppStore((s) => s.drawnPolygon)
  const undoDrawVertex = useAppStore((s) => s.undoDrawVertex)
  const clearDrawDraft = useAppStore((s) => s.clearDrawDraft)
  const finishDrawPolygon = useAppStore((s) => s.finishDrawPolygon)
  const setExplorerDataMode = useAppStore((s) => s.setExplorerDataMode)

  const pointCount = vertices.length
  const closed = Boolean(drawnPolygon)

  return (
    <div className="area-picker__inline-tools">
      <p className="caption area-picker__tool-hint">
        {closed ? (
          'Polygon ready.'
        ) : mapMode === 'live' ? (
          `${pointCount} corner${pointCount === 1 ? '' : 's'} — click the map.`
        ) : (
          <>
            Switch to{' '}
            <button type="button" className="area-picker__link" onClick={() => setExplorerDataMode('live')}>
              Live
            </button>{' '}
            to draw on the map.
          </>
        )}
      </p>
      <div className="area-picker__draw-actions">
        <Button type="button" variant="secondary" disabled={pointCount === 0} onClick={undoDrawVertex}>
          Undo
        </Button>
        <Button type="button" variant="secondary" disabled={pointCount === 0 && !closed} onClick={clearDrawDraft}>
          Clear
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pointCount < 3 || closed}
          onClick={finishDrawPolygon}
        >
          Finish
        </Button>
      </div>
    </div>
  )
}

type PointControlsProps = {
  pickedPoint: { lat: number; lon: number } | null
  pointRadiusKm: number
  onRadiusChange: (km: number) => void
}

function PointControls({ pickedPoint, pointRadiusKm, onRadiusChange }: PointControlsProps) {
  const explorerDataMode = useAppStore((s) => s.explorerDataMode)
  const setExplorerDataMode = useAppStore((s) => s.setExplorerDataMode)

  return (
    <div className="area-picker__inline-tools area-picker__inline-tools--point">
      <label className="area-picker__field area-picker__field--inline">
        <span className="caption">Radius (km)</span>
        <input
          type="number"
          min={1}
          max={500}
          step={1}
          value={pointRadiusKm}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (Number.isFinite(v)) onRadiusChange(Math.min(500, Math.max(1, v)))
          }}
        />
      </label>
      <p className="caption area-picker__tool-hint">
        {explorerDataMode === 'live'
          ? pickedPoint
            ? `${pickedPoint.lat.toFixed(3)}°N, ${pickedPoint.lon.toFixed(3)}°E`
            : 'Click the map for centre.'
          : (
            <>
              Switch to{' '}
              <button type="button" className="area-picker__link" onClick={() => setExplorerDataMode('live')}>
                Live
              </button>{' '}
              to pick on the map.
            </>
          )}
      </p>
    </div>
  )
}