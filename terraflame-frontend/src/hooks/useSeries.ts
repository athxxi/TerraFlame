import { useQuery } from '@tanstack/react-query'
import { getSeries } from '../api'
import { useAppStore } from '../store'

export function seriesQueryKey(
  aoiId: string | null,
  granularity: string,
  dateFrom: string,
  dateTo: string,
) {
  return ['series', aoiId, granularity, dateFrom, dateTo] as const
}

export function useSeries() {
  const aoiId = useAppStore((s) => s.aoiId)
  const granularity = useAppStore((s) => s.granularity)
  const dateFrom = useAppStore((s) => s.dateFrom)
  const dateTo = useAppStore((s) => s.dateTo)

  return useQuery({
    queryKey: seriesQueryKey(aoiId, granularity, dateFrom, dateTo),
    queryFn: () =>
      getSeries({
        aoi_id: aoiId as string,
        granularity,
        date_from: dateFrom,
        date_to: dateTo,
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