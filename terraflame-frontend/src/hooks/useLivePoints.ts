import { useQuery } from '@tanstack/react-query'
import { getLivePoints } from '../api'
import { useAppStore } from '../store'

const REFRESH_MS = 5 * 60_000

export function livePointsQueryKey(aoiId: string | null, hours: 24 | 48 | 72) {
  return ['live', 'points', aoiId, hours] as const
}

export function useLivePoints(hours: 24 | 48 | 72) {
  const aoiId = useAppStore((s) => s.aoiId)

  return useQuery({
    queryKey: livePointsQueryKey(aoiId, hours),
    queryFn: () => getLivePoints({ aoi_id: aoiId as string, hours }),
    enabled: Boolean(aoiId),
    refetchInterval: REFRESH_MS,
    staleTime: 60_000,
  })
}