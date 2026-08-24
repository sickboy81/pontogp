import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'
import path from 'node:path'

export const alt = 'CerejaVIP - Acompanhantes Brasil'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = false

const logoData = readFileSync(
  path.join(process.cwd(), 'public', 'logo-header.png')
).toString('base64')
const logoUrl = `data:image/png;base64,${logoData}`

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
