// Customer-side API contract (bank-mini-laravel/docs/API.md "Customer portal",
// "Withdrawal authorizations"). Money is integer Rupiah; timestamps are UTC ISO.

export type AccountStatus = 'active' | 'suspended' | 'inactive'
export type TransactionType = 'deposit' | 'withdrawal' | 'deposit_correction' | 'withdrawal_correction'
export type AuthorizationStatus = 'pending' | 'approved' | 'consumed' | 'rejected' | 'cancelled' | 'expired'

export interface Customer {
  id: number
  account_number: string
  nis: string
  full_name: string
  email: string | null
  activation_status: 'pending' | 'activated'
  activated_at: string | null
  /** The PIN is created in the app after activation; nothing that needs it works before. */
  pin_set: boolean
  class: 'X' | 'XI' | 'XII'
  group: '1' | '2' | '3' | '4'
  major: { id: number; code: string; major_name: string }
  account_status: AccountStatus
  balance: number
}

/** `POST /customer/auth/login` and `POST /customer/activation` */
export interface CustomerSession {
  actor: 'customer'
  token: string
  token_type: 'Bearer'
  expires_at: string
  customer: Customer
}

export interface Balance {
  account_number: string
  full_name: string
  account_status: AccountStatus
  balance: number
  min_balance: number
  as_of: string
}

export interface StatementLine {
  id: number
  type: TransactionType
  direction: 'in' | 'out'
  description: string
  amount: number
  balance_after: number
  created_at: string
}

export interface Card {
  account_number: string
  nis: string
  full_name: string
  class: Customer['class']
  group: Customer['group']
  major: { code: string; major_name: string }
  account_status: AccountStatus
  qr_payload: string
}

export interface WithdrawalAuthorization {
  id: string
  status: AuthorizationStatus
  status_label: string
  amount: number
  amount_in_words: string
  account_number: string
  balance: number
  /** Preview while the request is open; null afterwards. */
  balance_after: number | null
  teller: { full_name: string }
  created_at: string
  expires_at: string
  approved_at: string | null
  approval_expires_at: string | null
  consumed_at: string | null
  server_time: string
}

export interface Single<T> {
  data: T
}

export interface List<T> {
  data: T[]
}

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export interface MessageResponse {
  message: string
}

/** Forgotten-PIN self-service request (backend v0.1.1, API.md "Forgotten PIN: self-service requests"). */
export type PinResetStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled' | 'expired'

export interface PinResetRequest {
  id: string
  status: PinResetStatus
  status_label: string
  requested_at: string
  /** The new PIN can be set from here, once approved. */
  available_at: string | null
  /** Approved and `available_at` has passed. */
  ready: boolean
  expires_at: string | null
  approved_at: string | null
  rejected_at: string | null
  cancelled_at: string | null
  completed_at: string | null
  decision_note: string | null
}
