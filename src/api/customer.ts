import { api } from './client'
import type {
  Balance,
  Card,
  Customer,
  CustomerSession,
  List,
  MessageResponse,
  Paginated,
  Single,
  StatementLine,
  TransactionType,
  WithdrawalAuthorization,
} from './types'

// Customer endpoints (API.md "Customer login and activation", "Customer
// portal", "Withdrawal authorizations"). The account is always the token's own.

/** Exchange a Firebase ID token for a backend session. 403 account_not_linked → activate first. */
export function login(idToken: string) {
  return api.post<Single<CustomerSession>>('/customer/auth/login', { id_token: idToken })
}

/** First sign-in: bind the Firebase account to the customer with this NIS. */
export function activate(nis: string, idToken: string) {
  return api.post<Single<CustomerSession>>('/customer/activation', { nis, id_token: idToken })
}

export function setUpPin(idToken: string, pin: string, confirmation: string) {
  return api.post<MessageResponse>('/customer/pin/setup', { id_token: idToken, pin, pin_confirmation: confirmation })
}

export function unlock(pin: string) {
  return api.post<MessageResponse>('/customer/unlock', { pin })
}

export function changePin(currentPin: string, newPin: string, confirmation: string) {
  return api.post<MessageResponse>('/customer/pin', {
    current_pin: currentPin,
    new_pin: newPin,
    new_pin_confirmation: confirmation,
  })
}

export function fetchMe() {
  return api.get<Single<Customer>>('/customer/me')
}

export function fetchBalance() {
  return api.get<Single<Balance>>('/customer/balance')
}

export interface TransactionFilters {
  type?: TransactionType
  from?: string
  to?: string
  page?: number
  per_page?: number
}

export function fetchTransactions(filters: TransactionFilters) {
  return api.get<Paginated<StatementLine>>('/customer/transactions', { ...filters })
}

export function fetchTransaction(id: number) {
  return api.get<Single<StatementLine>>(`/customer/transactions/${id}`)
}

export function fetchCard() {
  return api.get<Single<Card>>('/customer/card')
}

/** Open requests only (pending or approved), not paginated. */
export function fetchAuthorizations() {
  return api.get<List<WithdrawalAuthorization>>('/customer/withdrawal-authorizations')
}

export function fetchAuthorization(id: string) {
  return api.get<Single<WithdrawalAuthorization>>(`/customer/withdrawal-authorizations/${id}`)
}

export function approveAuthorization(id: string, pin: string) {
  return api.post<Single<WithdrawalAuthorization>>(`/customer/withdrawal-authorizations/${id}/approve`, { pin })
}

export function rejectAuthorization(id: string) {
  return api.post<Single<WithdrawalAuthorization>>(`/customer/withdrawal-authorizations/${id}/reject`)
}

/**
 * The phone's FCM token, so the backend pushes new withdrawal requests
 * (FRONTEND_HANDOFF.md §15.11). 201 when new, 200 when already known.
 * Logout removes it on the server; no call is needed then.
 */
export function registerPushToken(token: string, platform: 'android' | 'ios') {
  return api.post<MessageResponse>('/customer/push-tokens', { token, platform })
}

/** The "Notifikasi" switch turned off: no more pushes to this phone. */
export function unregisterPushToken(token: string) {
  return api.delete<MessageResponse>('/customer/push-tokens', { token })
}

export function logout(allDevices: boolean) {
  return api.post<MessageResponse>(allDevices ? '/customer/logout-all' : '/customer/logout')
}
