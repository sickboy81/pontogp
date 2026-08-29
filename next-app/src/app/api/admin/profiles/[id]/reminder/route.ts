import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { buildProfileCompletionReminderEmail, getResendTransactionalConfig, sendResendEmail } from '@/lib/resend-email.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

/** POST: envia lembrete para anunciante com perfil ainda não publicado. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const token = (await getAdminToken()) || auth.token
  const config = getResendTransactionalConfig()
  if (!config) return Response.json({ error: 'Email não configurado para envio.' }, { status: 503 })

  try {
    const profileRes = await fetch(`${PB_URL}/api/collections/profiles/records/${encodeURIComponent(id)}?fields=id,user,name,status`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (!profileRes.ok) return Response.json({ error: 'Perfil não encontrado.' }, { status: 404 })
    const profile = await profileRes.json() as { user?: string; name?: string; status?: string }
    if (profile.status !== 'inactive') return Response.json({ error: 'O lembrete só pode ser enviado para perfis em rascunho.' }, { status: 400 })
    if (!profile.user) return Response.json({ error: 'Perfil sem anunciante associado.' }, { status: 400 })

    const userRes = await fetch(`${PB_URL}/api/collections/users/records/${encodeURIComponent(profile.user)}?fields=id,email,role`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (!userRes.ok) return Response.json({ error: 'Anunciante não encontrado.' }, { status: 404 })
    const user = await userRes.json() as { email?: string; role?: string }
    if (user.role !== 'advertiser') return Response.json({ error: 'Este perfil não pertence a uma conta anunciante.' }, { status: 400 })
    if (!user.email) return Response.json({ error: 'Anunciante sem email.' }, { status: 400 })

    await sendResendEmail(buildProfileCompletionReminderEmail({ email: user.email, name: profile.name, appUrl: process.env.NEXT_PUBLIC_APP_URL, from: config.from }), config.apiKey)
    return Response.json({ ok: true, message: 'Lembrete enviado.' })
  } catch {
    return Response.json({ error: 'Não foi possível enviar o lembrete.' }, { status: 502 })
  }
}
