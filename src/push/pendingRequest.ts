// A withdrawal request a notification asked to open, waiting until the app
// itself is on screen (after sign-in and the PIN unlock). The app layout takes it.

let pending: string | null = null
const listeners = new Set<() => void>()

export function setPendingRequest(id: string) {
  pending = id
  listeners.forEach((listener) => listener())
}

export function takePendingRequest(): string | null {
  const id = pending
  pending = null
  return id
}

export function subscribePendingRequest(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
