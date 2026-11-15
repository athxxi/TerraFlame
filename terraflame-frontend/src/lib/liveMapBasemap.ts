import type { StyleSpecification } from 'maplibre-gl'

/**
 * Standard OpenStreetMap raster basemap — cities, roads, borders, and labels are on the tiles
 * (same idea as openstreetmap.org). Use is subject to the OSM tile usage policy; attribution required.
 *
 * @see https://wiki.openstreetmap.org/wiki/API_v0.6#Map_tiles
 */
export const LIVE_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'TerraFlame OSM',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
}

/** Carto Voyager — vector fallback if OSM tiles are blocked. */
export const LIVE_MAP_STYLE_FALLBACK_URL =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'