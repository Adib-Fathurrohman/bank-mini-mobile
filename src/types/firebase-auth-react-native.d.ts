// @firebase/auth's React Native build exports getReactNativePersistence, but the
// package's top-level "types" entry (the web typings) wins in TypeScript's
// resolution. Declare it here; firebase.native.ts is the only user.
import type { Persistence } from '@firebase/auth'

declare module '@firebase/auth' {
  interface ReactNativeAsyncStorage {
    getItem(key: string): Promise<string | null>
    setItem(key: string, value: string): Promise<void>
    removeItem(key: string): Promise<void>
  }
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence
}
