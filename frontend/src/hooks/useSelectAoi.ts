import { useMutation } from '@tanstack/react-query'
import { WHOLE_INDIA_API } from '../components/area/AreaPicker'
import { ApiError, postAoi, type AoiResponse, type GeoJsonPolygon } from '../api'
import { resolveAoiOutline } from '../lib/resolveAoiOutline'
import { useAppStore } from '../store'

export type SelectAoiInput =
  | { kind: 'state'; label: string; state: string }
  | { kind: 'geojson'; label: string; geojson: GeoJsonPolygon }
  | { kind: 'point'; label: string; lat: number; lon: number; radius_km: number }

export function useSelectAoi() {
  const setAoiSelection = useAppStore((s) => s.setAoiSelection)
  const setAoiOutline = useAppStore((s) => s.setAoiOutline)
  const setAreaPickerTab = useAppStore((s) => s.setAreaPickerTab)

  return useMutation<AoiResponse, ApiError, SelectAoiInput>({
    onMutate: () => {
      setAoiOutline(null)
    },
    mutationFn: (input) => {
      if (input.kind === 'state') return postAoi({ state: input.state })
      if (input.kind === 'geojson') return postAoi({ geojson: input.geojson })
      return postAoi({
        lat: input.lat,
        lon: input.lon,
        radius_km: input.radius_km,
      })
    },
    onSuccess: (data, input) => {
      setAoiSelection(input.label, data)
      if (input.kind === 'state') {
        setAreaPickerTab(input.state === WHOLE_INDIA_API ? 'india' : 'state')
      } else if (input.kind === 'geojson') {
        setAreaPickerTab('draw')
      } else {
        setAreaPickerTab('point')
      }
      void resolveAoiOutline(input)
        .then((outline) => setAoiOutline(outline))
        .catch(() => setAoiOutline(null))
    },
  })
}