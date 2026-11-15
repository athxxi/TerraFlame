import { useEffect, useRef } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import * as maplibregl from 'maplibre-gl'
import { useAppStore } from '../store'

const CLICK_DELAY_MS = 220

/** Click-to-draw / point pick handlers. Draw preview is rendered on deck.gl (see liveMapDeckLayers). */
export function useMapAoiTools(map: MapLibreMap | null) {
  const areaTab = useAppStore((s) => s.areaPickerTab)
  const appendDrawVertex = useAppStore((s) => s.appendDrawVertex)
  const finishDrawPolygon = useAppStore((s) => s.finishDrawPolygon)
  const setPickedPoint = useAppStore((s) => s.setPickedPoint)
  const setDrawHoverLngLat = useAppStore((s) => s.setDrawHoverLngLat)
  const pendingClickRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!map) return

    let clickHandler: ((ev: maplibregl.MapMouseEvent) => void) | null = null
    let dblClickHandler: ((ev: maplibregl.MapMouseEvent) => void) | null = null
    let moveHandler: ((ev: maplibregl.MapMouseEvent) => void) | null = null
    let leaveHandler: (() => void) | null = null

    const clearPendingClick = () => {
      if (pendingClickRef.current !== null) {
        clearTimeout(pendingClickRef.current)
        pendingClickRef.current = null
      }
    }

    const bindDraw = () => {
      map.doubleClickZoom.disable()
      map.getCanvas().style.cursor = 'crosshair'
      map.getCanvas().classList.add('live-map-canvas--drawing')

      moveHandler = (ev: maplibregl.MapMouseEvent) => {
        setDrawHoverLngLat([ev.lngLat.lng, ev.lngLat.lat])
      }
      leaveHandler = () => setDrawHoverLngLat(null)
      map.on('mousemove', moveHandler)
      map.getCanvas().addEventListener('mouseleave', leaveHandler)

      clickHandler = (ev: maplibregl.MapMouseEvent) => {
        const lng = ev.lngLat.lng
        const lat = ev.lngLat.lat
        clearPendingClick()
        pendingClickRef.current = setTimeout(() => {
          appendDrawVertex(lng, lat)
          pendingClickRef.current = null
        }, CLICK_DELAY_MS)
      }
      dblClickHandler = (ev: maplibregl.MapMouseEvent) => {
        ev.preventDefault()
        clearPendingClick()
        const count = useAppStore.getState().drawDraftVertices.length
        if (count >= 3) finishDrawPolygon()
      }
      map.on('click', clickHandler)
      map.on('dblclick', dblClickHandler)
    }

    const unbindDraw = () => {
      map.doubleClickZoom.enable()
      map.getCanvas().style.cursor = ''
      map.getCanvas().classList.remove('live-map-canvas--drawing')
      clearPendingClick()
      setDrawHoverLngLat(null)
      if (clickHandler) {
        map.off('click', clickHandler)
        clickHandler = null
      }
      if (dblClickHandler) {
        map.off('dblclick', dblClickHandler)
        dblClickHandler = null
      }
      if (moveHandler) {
        map.off('mousemove', moveHandler)
        moveHandler = null
      }
      if (leaveHandler) {
        map.getCanvas().removeEventListener('mouseleave', leaveHandler)
        leaveHandler = null
      }
    }

    const bindPoint = () => {
      const handler = (ev: maplibregl.MapMouseEvent) => {
        setPickedPoint({ lat: ev.lngLat.lat, lon: ev.lngLat.lng })
      }
      map.getCanvas().style.cursor = 'crosshair'
      map.getCanvas().classList.add('live-map-canvas--drawing')
      map.on('click', handler)
      return () => {
        map.off('click', handler)
        map.getCanvas().style.cursor = ''
        map.getCanvas().classList.remove('live-map-canvas--drawing')
      }
    }

    if (areaTab === 'draw') {
      bindDraw()
      return unbindDraw
    }

    if (areaTab === 'point') {
      return bindPoint()
    }

    return undefined
  }, [map, areaTab, appendDrawVertex, finishDrawPolygon, setPickedPoint, setDrawHoverLngLat])
}