import { useQuery } from '@tanstack/react-query'
import { getAnomaly } from '../api'
import { useAppStore } from '../store'

export function anomalyQueryKey(
  aoiId: string | null,
  granularity: string,
  selectedDate: string | null,
) {
  return ['anomaly', aoiId, granularity, selectedDate] as const
}

export function useAnomaly() {
  const aoiId = useAppStore((s) => s.aoiId)
  const granularity = useAppStore((s) => s.granularity)
  const selectedDate = useAppStore((s) => s.selectedDate)

  return useQuery({
    queryKey: anomalyQueryKey(aoiId, granularity, selectedDate),
    queryFn: () =>
      getAnomaly({
        aoi_id: aoiId as string,
        granularity,
        ...(selectedDate ? { date: selectedDate } : {}),
      }),
    enabled: Boolean(aoiId),
    retry: (count, error) => {
      if (error && typeof error === 'object' && 'status' in error && error.status === 400) {
        return false
      }
      return count < 1
    },
  })
}