import { useMemo } from 'react'
import QRCode from 'qrcode'
import Svg, { Path, Rect } from 'react-native-svg'
import { colors } from '@/theme'

/** The card's `qr_payload` as a QR code the teller scans at the counter. */
export function QrCode({ value, size }: { value: string; size: number }) {
  const { path, count } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'M' })
    const n = qr.modules.size
    let d = ''
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (qr.modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`
      }
    }
    return { path: d, count: n }
  }, [value])

  const quiet = 2
  const box = count + quiet * 2
  return (
    <Svg width={size} height={size} viewBox={`${-quiet} ${-quiet} ${box} ${box}`} accessibilityLabel="Kode QR rekening">
      <Rect x={-quiet} y={-quiet} width={box} height={box} fill={colors.white} />
      <Path d={path} fill={colors.ink900} />
    </Svg>
  )
}
