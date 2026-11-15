import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { Map as MapLibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { ApiError } from '../../api'
import { useLivePoints } from '../../hooks/useLivePoints'
import { useLiveSummary } from '../../hooks/useLiveSummary'
import { useEnsureAoiOutline } from '../../hooks/useEnsureAoiOutline'
import { useMapAoiTools } from '../../hooks/useMapAoiTools'
import { boundsFromGeometry } from '../../lib/geometryBounds'
import { useAppStore } from '../../store'
import { buildLiveMapDeckLayers } from '../../lib/liveMapDeckLayers'
import { LIVE_MAP_STYLE, LIVE_MAP_STYLE_FALLBACK_URL } from '../../lib/liveMapBasemap'
import {
  boundsFromPoints,
  INDIA_CENTER,
  INDIA_DEFAULT_ZOOM,
  LIVE_MAP_SENSOR_LEGEND,
} from '../../lib/liveMapStyle'
import dayjs from 'dayjs'
import './LiveMap.css'

type Hours = 24 | 48 | 72

type Props = {
  hours: Hours
  onHoursChange: (hours: Hours) => void
}

export function LiveMap({ hours, onHoursChange }: Props) {
  const aoiId = useAppStore((s) => s.aoiId)
  const aoiOutline = useAppStore((s) => s.aoiOutline)
  const areaTab = useAppStore((s) => s.areaPickerTab)
  const pickedPoint = useAppStore((s) => s.pickedPoint)
  const pointRadiusKm = useAppStore((s) => s.pointRadiusKm)
  const drawDraftVertices = useAppStore((s) => s.drawDraftVertices)
  const drawnPolygon = useAppStore((s) => s.drawnPolygon)
  const drawHoverLngLat = useAppStore((s) => s.drawHoverLngLat)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const overlayRef = useRef<MapboxOverlay | null>(null)
  const fitKeyRef = useRef<string>('')
  const usedOsmFallback = useRef(false)
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null)

  const pointsQuery = useLivePoints(hours)
  const summaryQuery = useLiveSummary(hours)

  useMapAoiTools(mapInstance)
  useEnsureAoiOutline()

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = new maplibregl.Map({
      container: el,
      style: LIVE_MAP_STYLE,
      center: INDIA_CENTER,
      zoom: INDIA_DEFAULT_ZOOM,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    const removeMapAttribution = () => {
      map.getContainer().querySelectorAll('.maplibregl-ctrl-attrib').forEach((node) => node.remove())
    }
    map.on('load', removeMapAttribution)
    map.on('style.load', removeMapAttribution)

    map.on('error', (ev) => {
      const message = ev.error?.message ?? ''
      const source = 'sourceId' in ev ? String(ev.sourceId) : ''
      if (!usedOsmFallback.current && (source === 'osm' || message.includes('osm'))) {
        usedOsmFallback.current = true
        map.setStyle(LIVE_MAP_STYLE_FALLBACK_URL)
      }
    })

    const overlay = new MapboxOverlay({ interleaved: false, layers: [] })
    map.addControl(overlay as unknown as maplibregl.IControl)

    const onResize = () => map.resize()
    window.addEventListener('resize', onResize)
    map.on('load', () => {
      map.resize()
      setMapInstance(map)
    })

    mapRef.current = map
    overlayRef.current = overlay

    return () => {
      setMapInstance(null)
      window.removeEventListener('resize', onResize)
      overlay.setProps({ layers: [] })
      map.remove()
      mapRef.current = null
      overlayRef.current = null
    }
  }, [])

  useEffect(() => {
    fitKeyRef.current = ''
  }, [aoiId])

  const showHotspots = Boolean(aoiId) && areaTab !== 'draw' && areaTab !== 'point'

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    const mapToolsActive = areaTab === 'draw' || areaTab === 'point'
    const hotspots = showHotspots ? (pointsQuery.data?.points ?? []) : null
    const radiusPreview =
      areaTab === 'point' && pickedPoint
        ? { lat: pickedPoint.lat, lon: pickedPoint.lon, radiusKm: pointRadiusKm }
        : null
    const drawPreview =
      areaTab === 'draw'
        ? { vertices: drawDraftVertices, finished: drawnPolygon, hover: drawHoverLngLat }
        : null

    overlay.setProps({
      layers: buildLiveMapDeckLayers(
        hotspots,
        hours,
        showHotspots,
        radiusPreview,
        mapToolsActive ? null : aoiOutline,
        drawPreview,
      ),
    })
  }, [
    pointsQuery.data,
    hours,
    showHotspots,
    areaTab,
    pickedPoint,
    pointRadiusKm,
    aoiOutline,
    drawDraftVertices,
    drawnPolygon,
    drawHoverLngLat,
  ])

  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const deckCanvas = root.querySelector('.deck-canvas')
    if (!(deckCanvas instanceof HTMLElement)) return
    const drawing = areaTab === 'draw' || areaTab === 'point'
    deckCanvas.style.pointerEvents = showHotspots && !drawing ? 'auto' : 'none'
    const deckWidget = root.querySelector('.deck-widget')
    if (deckWidget instanceof HTMLElement) {
      deckWidget.style.pointerEvents = drawing ? 'none' : ''
    }
  }, [showHotspots, areaTab])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !aoiId || areaTab === 'draw' || areaTab === 'point') return

    const points = pointsQuery.data?.points ?? []
    const fitKey = `${aoiId}-${hours}-${points.length}-${aoiOutline ? 'outline' : 'no-outline'}`
    if (fitKeyRef.current === fitKey) return
    fitKeyRef.current = fitKey

    const pointBounds = boundsFromPoints(points)
    const outlineBounds = boundsFromGeometry(aoiOutline)
    const bounds = pointBounds ?? outlineBounds
    const applyFit = () => {
      if (bounds) {
        map.fitBounds(bounds, { padding: 48, maxZoom: 10, duration: 600 })
      } else {
        map.flyTo({ center: INDIA_CENTER, zoom: INDIA_DEFAULT_ZOOM, duration: 600 })
      }
    }
    if (map.isStyleLoaded()) applyFit()
    else map.once('load', applyFit)
  }, [pointsQuery.data, hours, aoiId, areaTab, aoiOutline])

  const updatedAt = summaryQuery.data?.last_fetch
  const count = pointsQuery.data?.points.length ?? 0

  return (
    <section className="live-map panel">
      <header className="live-map__header">
        <div>
          <p className="eyebrow">Live map</p>
          <p className="caption">
            Hotspot detections in the last {hours} hours
            {showHotspots && pointsQuery.data
              ? ` · showing ${count}${pointsQuery.data.too_many ? '+' : ''}`
              : ''}
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Live hours">
          {([24, 48, 72] as const).map((h) => (
            <button
              key={h}
              type="button"
              className={`segmented__btn${hours === h ? ' segmented__btn--active' : ''}`}
              onClick={() => onHoursChange(h)}
            >
              {h}h
            </button>
          ))}
        </div>
      </header>

      <div className="live-map__canvas-wrap">
        {!aoiId && areaTab !== 'draw' && areaTab !== 'point' ? (
          <p className="caption live-map__placeholder live-map__placeholder--overlay">
            Choose an area above to load live hotspot detections.
          </p>
        ) : null}
        <div
          ref={containerRef}
          className={`live-map__canvas${areaTab === 'point' || areaTab === 'draw' ? ' live-map__canvas--crosshair' : ''}`}
        />
      </div>

      {showHotspots && pointsQuery.isLoading ? (
        <p className="caption live-map__status">Loading live points…</p>
      ) : null}
      {showHotspots && pointsQuery.isError ? (
        <p className="live-map__error" role="alert">
          {pointsQuery.error instanceof ApiError
            ? pointsQuery.error.message
            : 'Could not load live points.'}
        </p>
      ) : null}
      {pointsQuery.data?.too_many && showHotspots ? (
        <p className="live-map__warn" role="status">
          Zoom in or pick a smaller area — only the first 20,000 points are shown.
        </p>
      ) : null}
      <p className="caption live-map__legend" role="note">
        {LIVE_MAP_SENSOR_LEGEND.map((item, i) => (
          <span key={item.key}>
            {i > 0 ? (
              <span className="live-map__legend-sep" aria-hidden>
                {' · '}
              </span>
            ) : null}
            <span className="live-map__legend-item">
              <span
                className="live-map__legend-swatch"
                style={{ background: `rgb(${item.rgb.join(', ')})` }}
                aria-hidden
              />
              {item.label}
            </span>
          </span>
        ))}
        <span className="live-map__legend-sep" aria-hidden>
          {' · '}
        </span>
        <span className="live-map__legend-size">Larger dots · stronger fire power (FRP)</span>
      </p>
      <p className="caption live-map__updated">
        Updated at{' '}
        {updatedAt
          ? dayjs(updatedAt).format('D MMM YYYY, HH:mm Z')
          : summaryQuery.isLoading
            ? '…'
            : 'live updates pending'}
        <span className="live-map__attrib" aria-hidden>
          {' · '}
        </span>
        <span className="live-map__attrib">
          Map ©{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            className="text-link text-link--small"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap
          </a>
        </span>
      </p>
    </section>
  )
}