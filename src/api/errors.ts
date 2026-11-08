// Every non-2xx response (and every failed fetch) becomes one ApiError, as in
// the staff web app. Customer auth refusals carry a `code` (API.md "Customer
// login and activation"); wrong PINs carry `remaining_attempts`.

export type ApiErrorKind =
  | 'unauthorized' // 401: the session (or Firebase token) is no longer valid
  | 'forbidden' // 403
  | 'notFound' // 404
  | 'conflict' // 409
  | 'validation' // 422 with `errors`
  | 'pin' // 422 with remaining_attempts: wrong PIN or locked
  | 'business' // 422 without `errors`
  | 'rateLimited' // 429
  | 'unavailable' // 5xx
  | 'network' // no response
  | 'unexpected'

export interface PinFailure {
  remaining_attempts: number
  pin_locked_until: string | null
}

const GENERIC: Partial<Record<ApiErrorKind, string>> = {
  unavailable: 'Server sedang bermasalah. Coba lagi beberapa saat lagi.',
  network: 'Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.',
  rateLimited: 'Terlalu banyak percobaan. Tunggu sekitar satu menit lalu coba lagi.',
  unexpected: 'Permintaan tidak dapat diproses.',
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly code: string | null
  readonly fieldErrors: Record<string, string[]>
  readonly pinFailure: PinFailure | null
  /** Status of a withdrawal request that can no longer be processed (also pin_reset_not_usable). */
  readonly requestStatus: string | null
  /** pin_reset_not_ready: when the new PIN can be set. */
  readonly availableAt: string | null

  constructor(init: {
    kind: ApiErrorKind
    status: number | null
    message: string
    code?: string | null
    fieldErrors?: Record<string, string[]>
    pinFailure?: PinFailure | null
    requestStatus?: string | null
    availableAt?: string | null
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status
    this.code = init.code ?? null
    this.fieldErrors = init.fieldErrors ?? {}
    this.pinFailure = init.pinFailure ?? null
    this.requestStatus = init.requestStatus ?? null
    this.availableAt = init.availableAt ?? null
  }

  field(name: string): string | undefined {
    return this.fieldErrors[name]?.[0]
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function errorFromResponse(status: number, body: unknown): ApiError {
  const record = isRecord(body) ? body : {}
  const serverMessage = typeof record.message === 'string' ? record.message : ''
  const code = typeof record.code === 'string' ? record.code : null

  if (status === 503 && code) return new ApiError({ kind: 'unavailable', status, code, message: serverMessage || GENERIC.unavailable! })
  if (status >= 500) return new ApiError({ kind: 'unavailable', status, message: GENERIC.unavailable! })
  if (status === 429) return new ApiError({ kind: 'rateLimited', status, message: GENERIC.rateLimited! })

  const message = serverMessage || GENERIC.unexpected!
  if (status === 401) return new ApiError({ kind: 'unauthorized', status, code, message })
  if (status === 403) return new ApiError({ kind: 'forbidden', status, code, message })
  if (status === 404) return new ApiError({ kind: 'notFound', status, code, message: serverMessage || 'Data tidak ditemukan.' })
  if (status === 409) {
    return new ApiError({
      kind: 'conflict',
      status,
      code,
      message,
      requestStatus: typeof record.status === 'string' ? record.status : null,
      availableAt: typeof record.available_at === 'string' ? record.available_at : null,
    })
  }
  if (status === 422) {
    if (isRecord(record.errors)) {
      return new ApiError({ kind: 'validation', status, code, message, fieldErrors: record.errors as Record<string, string[]> })
    }
    if (typeof record.remaining_attempts === 'number') {
      return new ApiError({
        kind: 'pin',
        status,
        message,
        pinFailure: {
          remaining_attempts: record.remaining_attempts,
          pin_locked_until: typeof record.pin_locked_until === 'string' ? record.pin_locked_until : null,
        },
      })
    }
    return new ApiError({
      kind: 'business',
      status,
      code,
      message,
      requestStatus: typeof record.status === 'string' ? record.status : null,
    })
  }
  return new ApiError({ kind: 'unexpected', status, code, message })
}

export function networkError(): ApiError {
  return new ApiError({ kind: 'network', status: null, message: GENERIC.network! })
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}
