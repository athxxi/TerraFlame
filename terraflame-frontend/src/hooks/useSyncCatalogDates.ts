import { useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import { useHealth, healthQueryKey } from './useHealth'
import { useAppStore } from '../store'
/** Extend the explorer range when the API catalog gains newer daily totals. */
export function useSyncCatalogDates() {
  const queryClient = useQueryClient()
  const healthQuery = useHealth()
  const dateFrom = useAppStore((s) => s.dateFrom)
  const dateTo = useAppStore((s) => s.dateTo)
  const setDateRange = useAppStore((s) => s.setDateRange)
  const lastCatalogTo = useRef<string | null>(null)

  const catalogTo = healthQuery.data?.data_to

  useEffect(() => {
    if (!catalogTo) return

    const prev = lastCatalogTo.current
    const catalog = dayjs(catalogTo)
    const end = dayjs(dateTo)

    const followsCatalog =
      !prev ||
      end.isSame(dayjs(prev), 'day') ||
      end.isAfter(dayjs(prev)) ||
      end.isSame(dayjs(), 'day')

    if (followsCatalog && end.isBefore(catalog, 'day')) {
      const nextTo = catalog.format('YYYY-MM-DD')
      if (nextTo !== dateTo) {
        setDateRange(dateFrom, nextTo)
      }
    }

    if (prev && catalogTo !== prev) {
      queryClient.invalidateQueries({ queryKey: healthQueryKey })
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'series' })
      queryClient.invalidateQueries({ queryKey: ['live', 'daily14'] })
    }

    lastCatalogTo.current = catalogTo
  }, [catalogTo, dateFrom, dateTo, setDateRange, queryClient])
}