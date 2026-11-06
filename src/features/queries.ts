import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useIsFocused } from 'expo-router'
import * as customerApi from '@/api/customer'
import type { TransactionType } from '@/api/types'
import { APPROVAL_POLL_MS } from '@/lib/config'
import { pushSupported } from '@/push/messaging'

export const keys = {
  balance: ['balance'] as const,
  recent: ['transactions', 'recent'] as const,
  history: (type: TransactionType | null) => ['transactions', 'history', type] as const,
  transaction: (id: number) => ['transactions', 'one', id] as const,
  card: ['card'] as const,
  approvals: ['approvals'] as const,
  approval: (id: string) => ['approvals', id] as const,
}

/** The teller changes the balance at the counter, so the home screen refreshes it now and then. */
const ACCOUNT_REFRESH_MS = 15_000

export function useBalance() {
  return useQuery({
    queryKey: keys.balance,
    queryFn: async () => (await customerApi.fetchBalance()).data,
    refetchInterval: ACCOUNT_REFRESH_MS,
  })
}

export function useRecentTransactions() {
  return useQuery({
    queryKey: keys.recent,
    queryFn: async () => (await customerApi.fetchTransactions({ per_page: 5 })).data,
    refetchInterval: ACCOUNT_REFRESH_MS,
  })
}

/** Newest first, 20 per page, loaded as the list scrolls. */
export function useHistory(type: TransactionType | null) {
  return useInfiniteQuery({
    queryKey: keys.history(type),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => customerApi.fetchTransactions({ type: type ?? undefined, page: pageParam, per_page: 20 }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  })
}

export function useTransaction(id: number) {
  return useQuery({ queryKey: keys.transaction(id), queryFn: async () => (await customerApi.fetchTransaction(id)).data })
}

export function useCard() {
  return useQuery({ queryKey: keys.card, queryFn: async () => (await customerApi.fetchCard()).data, staleTime: 5 * 60_000 })
}

async function fetchOpenApprovals() {
  const received = Date.now()
  const result = await customerApi.fetchAuthorizations()
  return { requests: result.data, received }
}

/**
 * Open withdrawal requests, for the banner and the home screen. Phones learn
 * about a new request from the push (which refreshes this) and check again on
 * start and when the app returns to the foreground; they do not poll here
 * (FRONTEND_HANDOFF.md §15.11). The web build has no push, so it polls.
 */
export function useOpenApprovals() {
  return useQuery({
    queryKey: keys.approvals,
    queryFn: fetchOpenApprovals,
    refetchInterval: pushSupported ? false : APPROVAL_POLL_MS,
    staleTime: 0,
  })
}

/** The approvals screen: polls every few seconds while it is open, the fallback for a missed push. */
export function useApprovalsScreen() {
  const focused = useIsFocused()
  return useQuery({
    queryKey: keys.approvals,
    queryFn: fetchOpenApprovals,
    refetchInterval: focused ? APPROVAL_POLL_MS : false,
    staleTime: 0,
  })
}

/** After money moved or a request changed: balance, statement and requests. */
export function useRefreshAccount() {
  const queryClient = useQueryClient()
  return useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.balance }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: keys.approvals }),
      ]),
    [queryClient],
  )
}
