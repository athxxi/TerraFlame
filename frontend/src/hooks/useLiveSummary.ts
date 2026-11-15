import { useQuery } from '@tanstack/react-query'
import { getLiveSummary } from '../api'
import { useAppStore } from '../store'

const REFRESH_MS = 5 * 60_000

export function liveSummaryQueryKey(aoiId: string | null, hours: 24 | 48 | 72) {
  return ['live', 'summary', aoiId, hours] as const
}

export function useLiveSummary(hours: 24 | 48 | 72 = 24) {
  const aoiId = useAppStore((s) => s.aoiId)

  return useQuery({
    queryKey: liveSummaryQueryKey(aoiId, hours),
    queryFn: () => getLiveSummary({ aoi_id: aoiId as string, hours }),
    enabled: Boolean(aoiId),
    refetchInterval: REFRESH_MS,
    staleTime: 60_000,
  })
}