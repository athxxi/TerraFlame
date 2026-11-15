import { create } from 'zustand'
import type { Geometry } from 'geojson'
import type { AoiResponse, GeoJsonPolygon, Granularity } from './api'

export type AreaPickerTab = 'draw' | 'point' | 'state' | 'india'
export type ExplorerDataMode = 'historical' | 'live'
import dayjs from 'dayjs'

const CELL_AREA_KM2 = 253

function todayIso(): string {
  return dayjs().format('YYYY-MM-DD')
}

export type AppStore = {
  aoiId: string | null
  areaLabel: string | null
  areaCells: number | null
  areaKm2: number | null
  aoiOutline: Geometry | null
  areaPickerTab: AreaPickerTab
  explorerDataMode: ExplorerDataMode
  drawnPolygon: GeoJsonPolygon | null
  drawDraftVertices: [number, number][]
  drawHoverLngLat: [number, number] | null
  pickedPoint: { lat: number; lon: number } | null
  pointRadiusKm: number
  granularity: Granularity
  dateFrom: string
  dateTo: string
  selectedDate: string | null
  setAoiSelection: (label: string, response: AoiResponse, outline?: Geometry | null) => void
  setAoiOutline: (outline: Geometry | null) => void
  clearAoi: () => void
  setAreaPickerTab: (tab: AreaPickerTab) => void
  setExplorerDataMode: (mode: ExplorerDataMode) => void
  setDrawnPolygon: (polygon: GeoJsonPolygon | null) => void
  appendDrawVertex: (lng: number, lat: number) => void
  undoDrawVertex: () => void
  clearDrawDraft: () => void
  finishDrawPolygon: () => void
  setDrawHoverLngLat: (lngLat: [number, number] | null) => void
  setPickedPoint: (point: { lat: number; lon: number } | null) => void
  setPointRadiusKm: (km: number) => void
  setGranularity: (granularity: Granularity) => void
  setDateRange: (from: string, to: string) => void
  setSelectedDate: (date: string | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  aoiId: null,
  areaLabel: null,
  areaCells: null,
  areaKm2: null,
  aoiOutline: null,
  areaPickerTab: 'state',
  explorerDataMode: 'historical',
  drawnPolygon: null,
  drawDraftVertices: [],
  pickedPoint: null,
  drawHoverLngLat: null,
  pointRadiusKm: 30,
  granularity: 'month',
  dateFrom: '2000-01-01',
  dateTo: todayIso(),
  selectedDate: null,
  setAoiSelection: (label, response, outline) =>
    set({
      aoiId: response.aoi_id,
      areaLabel: label,
      areaCells: response.cells,
      areaKm2: response.area_km2,
      ...(outline === undefined ? {} : { aoiOutline: outline }),
      selectedDate: null,
    }),
  setAoiOutline: (aoiOutline) => set({ aoiOutline }),
  clearAoi: () =>
    set({
      aoiId: null,
      areaLabel: null,
      areaCells: null,
      areaKm2: null,
      aoiOutline: null,
      selectedDate: null,
    }),
  setAreaPickerTab: (tab) =>
    set({
      areaPickerTab: tab,
      drawnPolygon: null,
      drawDraftVertices: [],
      pickedPoint: null,
    }),
  setExplorerDataMode: (explorerDataMode) => set({ explorerDataMode }),
  setDrawnPolygon: (drawnPolygon) => set({ drawnPolygon }),
  appendDrawVertex: (lng, lat) =>
    set((state) => ({
      drawDraftVertices: [...state.drawDraftVertices, [lng, lat]],
      drawnPolygon: null,
    })),
  undoDrawVertex: () =>
    set((state) => ({
      drawDraftVertices: state.drawDraftVertices.slice(0, -1),
      drawnPolygon: null,
    })),
  clearDrawDraft: () => set({ drawDraftVertices: [], drawnPolygon: null, drawHoverLngLat: null }),
  setDrawHoverLngLat: (drawHoverLngLat) => set({ drawHoverLngLat }),
  finishDrawPolygon: () =>
    set((state) => {
      const ring =
        state.drawDraftVertices.length >= 3
          ? [...state.drawDraftVertices, state.drawDraftVertices[0]]
          : null
      if (!ring) return state
      return {
        drawnPolygon: { type: 'Polygon', coordinates: [ring] },
      }
    }),
  setPickedPoint: (pickedPoint) => set({ pickedPoint }),
  setPointRadiusKm: (pointRadiusKm) => set({ pointRadiusKm }),
  setGranularity: (granularity) => set({ granularity }),
  setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}))

export { CELL_AREA_KM2 }