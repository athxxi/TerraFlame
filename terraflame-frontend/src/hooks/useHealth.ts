import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api'

export const healthQueryKey = ['health'] as const

export function useHealth() {
  return useQuery({
    queryKey: healthQueryKey,
    queryFn: getHealth,
    refetchInterval: 5 * 60_000,
    retry: 1,
  })
}