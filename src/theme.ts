import { Platform } from 'react-native'

// Same palette as the staff web app (front-end/src/index.css): ink greys, the
// navy brand, green for money in, red for money out.
export const colors = {
  canvas: '#f6f7f9',
  white: '#ffffff',
  ink50: '#f9fafb',
  ink100: '#f2f4f7',
  ink200: '#e4e7ec',
  ink300: '#d0d5dd',
  ink400: '#98a2b3',
  ink500: '#667085',
  ink600: '#475467',
  ink700: '#344054',
  ink900: '#101828',
  brand50: '#f0f5fb',
  brand100: '#e1eaf6',
  brand600: '#2b62a8',
  brand700: '#1d4e89',
  brand800: '#163a68',
  brand900: '#102a4c',
  pos50: '#eef8f2',
  pos200: '#bfe3cf',
  pos700: '#0e7a4f',
  warn50: '#fef7eb',
  warn200: '#f2d6a6',
  warn800: '#7a4500',
  neg50: '#fef3f2',
  neg200: '#f5c6c1',
  neg600: '#d1362a',
  neg700: '#b42318',
}

export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, SFMono-Regular, Menlo, monospace' })

export const radius = { sm: 6, md: 10, lg: 14 }

/** Phones use the full width; on a wide browser window the app stays phone-sized. */
export const MAX_WIDTH = 480
