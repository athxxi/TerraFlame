import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { getSeries } from '../api'
import { useAppStore } from '../store'

const REFRESH_MS = 5 * 60_000

export function useLiveDailySeries() {
  const aoiId = useAppStore((s) => s.aoiId)
  const dateTo = dayjs().format('YYYY-MM-DD')
  const dateFrom = dayjs().subtract(13, 'day').format('YYYY-MM-DD')

  return useQuery({
    queryKey: ['live', 'daily14', aoiId, dateFrom, dateTo] as const,
    queryFn: () =>
      getSeries({
        aoi_id: aoiId as string,
        granularity: 'day',
        date_from: dateFrom,
        date_to: dateTo,
      }),
    enabled: Boolean(aoiId),
    refetchInterval: REFRESH_MS,
    staleTime: 60_000,
  })
}