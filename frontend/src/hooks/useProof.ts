import { useQuery } from '@tanstack/react-query'
import { getProof } from '../api'

export const proofQueryKey = ['proof'] as const

export function useProof() {
  return useQuery({
    queryKey: proofQueryKey,
    queryFn: getProof,
    staleTime: 60 * 60_000,
    retry: 1,
  })
}