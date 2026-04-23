import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

const MAX_USERS = 2000

/** POST: envia notificação em massa (broadcast) para todos os usuários. Apenas admin. Body: { title?, message, link? } */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { title?: string; message?: string; link?: string }
  try {
    body = (await request.json()) as { title?: string; message?: string; link?: string }
  } catch {
    return Response.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return Response.json({ error: 'Campo "message" é obrigatório' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() || 'Mensagem da equipe' : 'Mensagem da equipe'
  const link = typeof body.link === 'string' ? body.link.trim() : ''

  const adminToken = await getAdminToken()
  if (!adminToken) {
    return Response.json({ error: 'Configuração do servidor indisponível' }, { status: 500 })
  }

  const authHeader = { Authorization: `Bearer ${adminToken}` }

  try {
    const listRes = await fetch(
      `${PB_URL}/api/collections/users/records?perPage=${MAX_USERS}&fields=id`,
      { headers: authHeader, cache: 'no-store' }
    )
    if (!listRes.ok) {
      return Response.json({ error: 'Não foi possível listar usuários' }, { status: 502 })
    }
    const listData = (await listRes.json()) as { items?: { id: string }[] }
    const users = listData.items ?? []
    const total = users.length

    let created = 0
    let failed = 0
    for (const user of users) {
      const res = await fetch(`${PB_URL}/api/collections/notifications/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          recipient: user.id,
          title,
          message,
          type: 'broadcast',
          read: false,
          ...(link && { link }),
        }),
      })
      if (res.ok) created++
      else failed++
    }

    return Response.json({
      success: true,
      totalUsers: total,
      notificationsCreated: created,
      failed,
    })
  } catch {
    return Response.json({ error: 'Erro ao enviar broadcast' }, { status: 500 })
  }
}
