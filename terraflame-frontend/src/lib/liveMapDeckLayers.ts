import type { Layer } from '@deck.gl/core'
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers'
import type { Geometry } from 'geojson'
import type { LivePoint } from '../api'
import type { GeoJsonPolygon } from '../api'
import { polygonFromVertices } from './mapDrawPreview'
import { frpRadius, sensorColor } from './liveMapStyle'

export type DrawPreview = {
  vertices: [number, number][]
  finished: GeoJsonPolygon | null
  hover: [number, number] | null
}

type RadiusPreview = {
  lat: number
  lon: number
  radiusKm: number
}

function buildDrawPreviewLayers(draw: DrawPreview | null): Layer[] {
  if (!draw) return []
  const { vertices, finished, hover } = draw
  const layers: Layer[] = []

  const poly = finished ?? polygonFromVertices(vertices)
  if (poly) {
    layers.push(
      new GeoJsonLayer({
        id: 'draw-fill',
        data: {
          type: 'Feature',
          properties: {},
          geometry: poly,
        },
        filled: true,
        stroked: false,
        getFillColor: finished ? [255, 90, 0, 72] : [255, 90, 0, 45],
        pickable: false,
      }),
    )
  }

  if (!finished && vertices.length >= 1 && hover) {
    layers.push(
      new GeoJsonLayer({
        id: 'draw-rubber-band',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [vertices[vertices.length - 1], hover],
          },
        },
        filled: false,
        stroked: true,
        getLineColor: [255, 90, 0, 190],
        getLineWidth: 2,
        lineWidthUnits: 'pixels',
        lineDashArray: [4, 3],
        pickable: false,
      }),
    )
  }

  if (vertices.length >= 2) {
    layers.push(
      new GeoJsonLayer({
        id: 'draw-line',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: vertices,
          },
        },
        filled: false,
        stroked: true,
        getLineColor: [255, 90, 0, 255],
        getLineWidth: 2.5,
        lineWidthUnits: 'pixels',
        lineWidthMinPixels: 2,
        pickable: false,
      }),
    )
  }

  if (poly && (finished || vertices.length >= 3)) {
    layers.push(
      new GeoJsonLayer({
        id: 'draw-border',
        data: {
          type: 'Feature',
          properties: {},
          geometry: poly,
        },
        filled: false,
        stroked: true,
        getLineColor: [255, 90, 0, 255],
        getLineWidth: 2.5,
        lineWidthUnits: 'pixels',
        lineWidthMinPixels: 2,
        pickable: false,
      }),
    )
  }

  if (vertices.length > 0) {
    layers.push(
      new ScatterplotLayer<{ position: [number, number] }>({
        id: 'draw-verts',
        data: vertices.map((v) => ({ position: v })),
        getPosition: (d) => d.position,
        getRadius: 6,
        radiusUnits: 'pixels',
        radiusMinPixels: 5,
        getFillColor: [255, 255, 255, 255],
        getLineColor: [255, 90, 0, 255],
        stroked: true,
        lineWidthMinPixels: 2,
        pickable: false,
      }),
    )
  }

  return layers
}

export function buildLiveMapDeckLayers(
  hotspots: LivePoint[] | null,
  hours: number,
  showHotspots: boolean,
  radiusPreview: RadiusPreview | null,
  aoiOutline: Geometry | null,
  drawPreview: DrawPreview | null,
): Layer[] {
  const layers: Layer[] = [...buildDrawPreviewLayers(drawPreview)]

  if (aoiOutline) {
    layers.push(
      new GeoJsonLayer({
        id: 'aoi-outline',
        data: {
          type: 'Feature',
          properties: {},
          geometry: aoiOutline,
        },
        filled: true,
        stroked: true,
        getFillColor: [255, 90, 0, 70],
        getLineColor: [255, 90, 0, 235],
        getLineWidth: 2,
        lineWidthUnits: 'pixels',
        lineWidthMinPixels: 2,
        pickable: false,
      }),
    )
  }

  if (radiusPreview) {
    layers.push(
      new ScatterplotLayer({
        id: 'radius-preview',
        data: [{ position: [radiusPreview.lon, radiusPreview.lat] }],
        getPosition: (d: { position: [number, number] }) => d.position,
        getRadius: radiusPreview.radiusKm * 1000,
        radiusUnits: 'meters',
        getFillColor: [255, 90, 0, 50],
        getLineColor: [255, 90, 0, 220],
        stroked: true,
        filled: true,
        lineWidthMinPixels: 2,
        pickable: false,
      }),
    )
    layers.push(
      new ScatterplotLayer({
        id: 'radius-centre',
        data: [{ position: [radiusPreview.lon, radiusPreview.lat] }],
        getPosition: (d: { position: [number, number] }) => d.position,
        getRadius: 800,
        radiusUnits: 'meters',
        getFillColor: [255, 90, 0, 220],
        pickable: false,
      }),
    )
  }

  if (showHotspots && hotspots && hotspots.length > 0) {
    layers.push(
      new ScatterplotLayer<LivePoint>({
        id: 'live-hotspots',
        data: hotspots,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: (d) => frpRadius(d.frp),
        radiusUnits: 'meters',
        getFillColor: (d) => sensorColor(d.sensor),
        pickable: true,
        updateTriggers: { getRadius: [hours], getFillColor: [hours] },
      }),
    )
  }

  return layers
}