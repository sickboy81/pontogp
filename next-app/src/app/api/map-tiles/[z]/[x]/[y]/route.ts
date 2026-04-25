import { NextRequest } from 'next/server'

const OSM_TILE_BASE = 'https://tile.openstreetmap.org'
const MAX_ZOOM = 19

export const dynamic = 'force-dynamic'

function toInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z: zRaw, x: xRaw, y: yRaw } = await params
  const yClean = yRaw.endsWith('.png') ? yRaw.slice(0, -4) : yRaw

  const z = toInt(zRaw)
  const x = toInt(xRaw)
  const y = toInt(yClean)
  if (z == null || x == null || y == null || z < 0 || z > MAX_ZOOM) {
    return Response.json({ error: 'tile inválido' }, { status: 400 })
  }

  const maxIndex = 2 ** z - 1
  if (x < 0 || x > maxIndex || y < 0 || y > maxIndex) {
    return Response.json({ error: 'tile fora do limite' }, { status: 400 })
  }

  const upstream = await fetch(`${OSM_TILE_BASE}/${z}/${x}/${y}.png`, {
    headers: {
      // OSM recomenda identificar o aplicativo em acessos automatizados.
      'User-Agent': 'CerejaVIP/1.0 (+https://cerejavip.com)',
      Accept: 'image/png,image/*;q=0.8,*/*;q=0.1',
    },
    cache: 'force-cache',
  })

  if (!upstream.ok) {
    return Response.json({ error: 'falha ao carregar tile' }, { status: upstream.status })
  }

  const body = await upstream.arrayBuffer()
  return new Response(body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}

