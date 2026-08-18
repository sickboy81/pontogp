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
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #7f1d1d 100%)',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <img src={logoUrl} alt="CerejaVIP" style={{ width: 300, height: 110, objectFit: 'contain', objectPosition: 'left center' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 58, lineHeight: 1.1, fontWeight: 800, maxWidth: 1080 }}>
            CerejaVIP | Acompanhantes de todo o brasil
          </div>
          <div style={{ fontSize: 38, lineHeight: 1.25, color: 'rgba(255,255,255,0.9)', maxWidth: 1020 }}>
            venha conhecer nossas cerejas
          </div>
        </div>

        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.85)' }}>
          cerejavip.com
        </div>
      </div>
    ),
    size
  )
}
