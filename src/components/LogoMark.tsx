import Svg, { Path, Rect } from 'react-native-svg'

/** The Bank Mini logo (new logo/only logo.svg): navy tile, gold bank roof, pillars and open book. */
export function LogoMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Rect x="10" y="10" width="100" height="100" rx="24" fill="#1E3A8A" />
      <Path d="M60 26 L26 45 H94 L60 26 Z" fill="#F59E0B" />
      <Rect x="34" y="51" width="9" height="28" rx="3" fill="#F59E0B" />
      <Rect x="55.5" y="51" width="9" height="28" rx="3" fill="#F59E0B" />
      <Rect x="77" y="51" width="9" height="28" rx="3" fill="#F59E0B" />
      <Path
        d="M26 85 C38 80, 50 82, 60 87 C70 82, 82 80, 94 85 L94 92 C82 87, 70 89, 60 94 C50 89, 38 87, 26 92 Z"
        fill="#F59E0B"
      />
    </Svg>
  )
}
