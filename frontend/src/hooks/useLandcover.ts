import { useQuery } from '@tanstack/react-query'
import { getLandcover } from '../api'
import { useAppStore } from '../store'

export function landcoverQueryKey(aoiId: string | null) {
  return ['landcover', aoiId] as const
}

export function useLandcover() {
  const aoiId = useAppStore((s) => s.aoiId)

  return useQuery({
    queryKey: landcoverQueryKey(aoiId),
    queryFn: () => getLandcover(aoiId!),
    enabled: Boolean(aoiId),
    staleTime: 30 * 60_000,
  })
}