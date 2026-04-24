import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CerejaVIP - Acompanhantes Brasil'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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
          padding: '56px',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #7f1d1d 100%)',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            borderRadius: 9999,
            padding: '10px 18px',
            backgroundColor: 'rgba(220, 38, 38, 0.2)',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          CerejaVIP
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 72, lineHeight: 1.05, fontWeight: 800, maxWidth: 980 }}>
            Acompanhantes Brasil
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.35, color: 'rgba(255,255,255,0.9)', maxWidth: 1020 }}>
            Perfis verificados, filtros por cidade e busca com foco em seguranca e privacidade.
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
