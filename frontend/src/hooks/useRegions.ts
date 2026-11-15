import { useQuery } from '@tanstack/react-query'
import { getRegions } from '../api'

export const regionsQueryKey = ['regions'] as const

export function useRegions() {
  return useQuery({
    queryKey: regionsQueryKey,
    queryFn: getRegions,
    staleTime: 24 * 60 * 60_000,
  })
}