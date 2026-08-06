import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { enforceIpRateLimit, enforceUserRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip')?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * POST: cria denúncia de perfil. Body: { profileId, reason?, description?, storyId? }.
 * Se storyId for enviado, a descrição guardada no PB inclui o id da story (moderadores).
 * Campos enviados ao PB devem bater com a coleção "reports" em pocketbase-schema.json (gerar com npm run schema).
 */
export async function POST(request: NextRequest) {
  const token = getAuthCookieFromHeader(request.headers.get('cookie'))
  const anonymousLimit = !token && enforceIpRateLimit(request, 'report-create', RATE_LIMIT_POLICIES.write)
  if (anonymousLimit) return anonymousLimit

  if (!token) {
    const limited = enforceIpRateLimit(request, 'report-create-anonymous', RATE_LIMIT_POLICIES.contact)
    if (limited) return limited
  }

  const userId = token ? getUserIdFromToken(token) : null
  if (token && !userId) return Response.json({ error: 'Token inválido' }, { status: 401 })
  const limited = userId
    ? enforceUserRateLimit(request, 'report-create', userId, RATE_LIMIT_POLICIES.write)
    : null
  if (limited) return limited

  try {
    const body = (await request.json()) as {
      profileId?: string
      reason?: string
      description?: string
      email?: string
      storyId?: string
    }
    const profileId = body.profileId
    if (!profileId) return Response.json({ error: 'profileId obrigatório' }, { status: 400 })

    const userDesc = (body.description || '').trim()
    const reason = (body.reason || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    if (!userId && !isValidEmail(email)) {
      return Response.json({ error: 'Informe um e-mail válido para enviar a denúncia.' }, { status: 400 })
    }
    if (!userDesc) {
      return Response.json({ error: 'Descreva o motivo da denúncia.' }, { status: 400 })
    }
    if (!reason) {
      return Response.json({ error: 'Selecione o motivo da denúncia.' }, { status: 400 })
    }
    const sid = (body.storyId || '').trim()
    const metadata = `[Contato: ${email || 'usuário autenticado'}]\n[IP: ${getClientIp(request)}]`
    const description = sid
      ? [`[Denúncia de Cereja Story - ID: ${sid}]`, metadata, userDesc].join('\n\n')
      : [metadata, userDesc].join('\n\n')

    const adminToken = userId ? null : await getAdminToken()
    if (!userId && !adminToken) return Response.json({ error: 'Serviço de denúncias indisponível' }, { status: 503 })
    const reportBody: Record<string, unknown> = {
      reported_profile: profileId,
      reason,
      description,
      status: 'pending',
    }
    if (userId) reportBody.reported_by = userId

    const res = await fetch(`${PB_URL}/api/collections/reports/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken || token}`,
      },
      body: JSON.stringify(reportBody),
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
