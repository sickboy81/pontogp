import { ImageResponse } from 'next/og'

export const alt = 'CerejaVIP - Acompanhantes Brasil'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = false

const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'}/logo-header.png`

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '56px',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #7f1d1d 100%)',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <img src={logoUrl} alt="CerejaVIP" style={{ width: 560, height: 220, objectFit: 'contain' }} />
      </div>
    ),
    size
  )
}
