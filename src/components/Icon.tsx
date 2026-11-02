import type { ColorValue } from 'react-native'
import Svg, { Path } from 'react-native-svg'

// A few line icons (24×24, 1.75 stroke) so the app needs no icon font.
const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  card: 'M3 5h18v14H3zM7 9h4v4H7zM14 10h4M14 14h4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  arrowIn: 'M12 4v14M6 12l6 6 6-6',
  arrowOut: 'M12 20V6M6 12l6-6 6 6',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  chevron: 'M9 6l6 6-6 6',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: ColorValue }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={PATHS[name]} stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
