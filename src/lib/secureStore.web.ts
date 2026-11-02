// expo-secure-store has no web implementation. The browser keeps the session
// token in localStorage, the same as the staff web app; the PIN unlock still
// gates the screens.

export async function readItem(key: string): Promise<string | null> {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export async function writeItem(key: string, value: string): Promise<void> {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Private mode or blocked storage: the session lasts until the tab closes.
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing stored.
  }
}
