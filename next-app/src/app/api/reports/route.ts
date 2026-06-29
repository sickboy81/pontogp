import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/**
 * POST: cria denúncia de perfil. Body: { profileId, reason?, description?, storyId? }.
 * Se storyId for enviado, a descrição guardada no PB inclui o id da story (moderadores).
 * Campos enviados ao PB devem bater com a coleção "reports" em pocketbase-schema.json (gerar com npm run schema).
 */
export async function POST(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  if (!token) return Response.json({ error: 'Faça login para denunciar' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  try {
    const body = (await request.json()) as {
      profileId?: string
      reason?: string
      description?: string
      storyId?: string
    }
    const profileId = body.profileId
    if (!profileId) return Response.json({ error: 'profileId obrigatório' }, { status: 400 })

    const userDesc = (body.description || '').trim()
    const sid = (body.storyId || '').trim()
    const description = sid
      ? [`[Denúncia de Cereja Story - ID: ${sid}]`, userDesc || undefined].filter(Boolean).join('\n\n')
      : userDesc

    const res = await fetch(`${PB_URL}/api/collections/reports/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reported_profile: profileId,
        reported_by: userId,
        reason: (body.reason || '').trim() || 'Outro',
        description,
        status: 'pending',
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao enviar denúncia' },
        { status: res.status }
      )
    }
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Erro ao enviar denúncia' }, { status: 500 })
  }
}
