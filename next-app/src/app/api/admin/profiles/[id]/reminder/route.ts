import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { buildProfileCompletionReminderEmail, getResendTransactionalConfig, sendResendEmail } from '@/lib/resend-email.mjs'
import { getResendCooldownState } from '@/lib/email-center.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

type ReminderProfile = { user?: string; name?: string; status?: string }

async function loadReminderData(id: string, token: string) {
  const profileRes = await fetch(`${PB_URL}/api/collections/profiles/records/${encodeURIComponent(id)}?fields=id,user,name,status`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!profileRes.ok) return { error: Response.json({ error: 'Perfil não encontrado.' }, { status: 404 }) }
  const profile = await profileRes.json() as ReminderProfile
  if (profile.status !== 'inactive') return { error: Response.json({ error: 'O lembrete só pode ser enviado para perfis em rascunho.' }, { status: 400 }) }
  if (!profile.user) return { error: Response.json({ error: 'Perfil sem anunciante associado.' }, { status: 400 }) }

  const userRes = await fetch(`${PB_URL}/api/collections/users/records/${encodeURIComponent(profile.user)}?fields=id,email,role`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!userRes.ok) return { error: Response.json({ error: 'Anunciante não encontrado.' }, { status: 404 }) }
  const user = await userRes.json() as { email?: string; role?: string }
  if (user.role !== 'advertiser') return { error: Response.json({ error: 'Este perfil não pertence a uma conta anunciante.' }, { status: 400 }) }
  if (!user.email) return { error: Response.json({ error: 'Anunciante sem email.' }, { status: 400 }) }
  return { profile, user }
}

async function getLastSuccessfulSend(profileId: string, token: string) {
  const collection = process.env.EMAIL_LOGS_COLLECTION || 'email_delivery_logs'
  const filter = encodeURIComponent(`profile = "${profileId}" && template = "profile-completion" && status = "sent"`)
  const response = await fetch(`${PB_URL}/api/collections/${collection}/records?filter=${filter}&sort=-created&perPage=1&fields=created,provider_id`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!response.ok) return null
  const data = await response.json() as { items?: Array<{ created?: string; provider_id?: string }> }
  return data.items?.[0] || null
}

async function createSendLog(payload: Record<string, unknown>, token: string) {
  const collection = process.env.EMAIL_LOGS_COLLECTION || 'email_delivery_logs'
  return fetch(`${PB_URL}/api/collections/${collection}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload), cache: 'no-store' })
}

/** GET: gera a prévia do lembrete sem enviar email. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const config = getResendTransactionalConfig()
  if (!config) return Response.json({ error: 'Email não configurado para envio.' }, { status: 503 })
  try {
    const { id } = await params
    const token = (await getAdminToken()) || auth.token
    const loaded = await loadReminderData(id, token)
    if ('error' in loaded) return loaded.error
    const email = buildProfileCompletionReminderEmail({ email: loaded.user.email, name: loaded.profile.name, appUrl: process.env.NEXT_PUBLIC_APP_URL, from: config.from })
    const lastSend = await getLastSuccessfulSend(id, token).catch(() => null)
    const cooldown = getResendCooldownState(lastSend?.created)
    return Response.json({ recipient: loaded.user.email, profileName: loaded.profile.name || '', subject: email.subject, html: email.html, text: email.text, lastSentAt: lastSend?.created || null, cooldown })
  } catch {
    return Response.json({ error: 'Não foi possível gerar a prévia do lembrete.' }, { status: 502 })
  }
}

/** POST: envia lembrete para anunciante com perfil ainda não publicado. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const token = (await getAdminToken()) || auth.token
  const config = getResendTransactionalConfig()
  if (!config) return Response.json({ error: 'Email não configurado para envio.' }, { status: 503 })

  try {
    const loaded = await loadReminderData(id, token)
    if ('error' in loaded) return loaded.error

    const lastSend = await getLastSuccessfulSend(id, token).catch(() => null)
    const cooldown = getResendCooldownState(lastSend?.created)
    if (!cooldown.allowed) return Response.json({ error: `Este template já foi enviado. Aguarde ${cooldown.remainingHours} horas para reenviar.`, lastSentAt: lastSend?.created || null }, { status: 429 })
    const email = buildProfileCompletionReminderEmail({ email: loaded.user.email, name: loaded.profile.name, appUrl: process.env.NEXT_PUBLIC_APP_URL, from: config.from })
    const providerResult = await sendResendEmail(email, config.apiKey) as { id?: string }
    const logRes = await createSendLog({ template: 'profile-completion', recipient_email: loaded.user.email, profile: id, recipient_user: loaded.profile.user, sender_admin: auth.userId, subject: email.subject, status: 'sent', provider_id: providerResult?.id || '' }, token).catch(() => null)
    return Response.json({ ok: true, message: logRes?.ok === false ? 'Email enviado, mas não foi possível registrar o histórico.' : 'Email enviado individualmente.' })
  } catch {
    return Response.json({ error: 'Não foi possível enviar o lembrete.' }, { status: 502 })
  }
}
