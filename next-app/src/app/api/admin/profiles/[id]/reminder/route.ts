import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { buildProfileCompletionReminderEmail, getResendTransactionalConfig, sendResendEmail } from '@/lib/resend-email.mjs'
import * as resendEmail from '@/lib/resend-email.mjs'
import { getEmailTemplate, getResendCooldownState } from '@/lib/email-center.mjs'
import { applyEmailTemplateOverride, normalizeEmailTemplateOverrides } from '@/lib/email-template-settings.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

type ReminderProfile = { user?: string; name?: string; status?: string; search_expires_at?: string; contact_expires_at?: string }

async function loadReminderData(id: string, token: string) {
  const profileRes = await fetch(`${PB_URL}/api/collections/profiles/records/${encodeURIComponent(id)}?fields=id,user,name,status,search_expires_at,contact_expires_at`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!profileRes.ok) return { error: Response.json({ error: 'Perfil não encontrado.' }, { status: 404 }) }
  const profile = await profileRes.json() as ReminderProfile
  if (!profile.user) return { error: Response.json({ error: 'Perfil sem anunciante associado.' }, { status: 400 }) }

  const userRes = await fetch(`${PB_URL}/api/collections/users/records/${encodeURIComponent(profile.user)}?fields=id,email,role`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!userRes.ok) return { error: Response.json({ error: 'Anunciante não encontrado.' }, { status: 404 }) }
  const user = await userRes.json() as { email?: string; role?: string }
  if (user.role !== 'advertiser') return { error: Response.json({ error: 'Este perfil não pertence a uma conta anunciante.' }, { status: 400 }) }
  if (!user.email) return { error: Response.json({ error: 'Anunciante sem email.' }, { status: 400 }) }
  return { profile, user }
}

async function getLastSuccessfulSend(profileId: string, template: string, token: string) {
  const collection = process.env.EMAIL_LOGS_COLLECTION || 'email_delivery_logs'
  const filter = encodeURIComponent(`profile = "${profileId}" && template = "${template}" && status = "sent"`)
  const response = await fetch(`${PB_URL}/api/collections/${collection}/records?filter=${filter}&sort=-created&perPage=1&fields=created,provider_id`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!response.ok) return null
  const data = await response.json() as { items?: Array<{ created?: string; provider_id?: string }> }
  return data.items?.[0] || null
}

type EmailPayload = { subject: string; html: string; text: string; from: string; to: string[] }

function buildTemplateEmail(template: string, profile: ReminderProfile, email: string, from: string): EmailPayload {
  if (template === 'profile-completion') return buildProfileCompletionReminderEmail({ email, name: profile.name, appUrl: process.env.NEXT_PUBLIC_APP_URL, from }) as unknown as EmailPayload
  const buildAdminProfileEmail = (resendEmail as unknown as { buildAdminProfileEmail: typeof buildProfileCompletionReminderEmail }).buildAdminProfileEmail
  return buildAdminProfileEmail({ email, name: profile.name, appUrl: process.env.NEXT_PUBLIC_APP_URL, from, template, expiresAt: profile.search_expires_at } as Parameters<typeof buildProfileCompletionReminderEmail>[0]) as unknown as EmailPayload
}

function validateTemplateEligibility(template: string, profile: ReminderProfile) {
  const expiry = profile.search_expires_at ? new Date(profile.search_expires_at).getTime() : NaN
  const days = Number.isNaN(expiry) ? null : Math.ceil((expiry - Date.now()) / 86400000)
  if (template === 'profile-completion' && profile.status !== 'inactive') return 'O template só pode ser enviado para perfis em rascunho.'
  if (template === 'plan-expiring' && (days == null || days < 0 || days > 7)) return 'Este template só pode ser enviado para planos que vencem nos próximos 7 dias.'
  if (template === 'plan-expired' && (days == null || days >= 0)) return 'Este template só pode ser enviado para planos vencidos.'
  if (template === 'profile-suspended' && profile.status !== 'suspended') return 'Este template só pode ser enviado para perfis suspensos.'
  return null
}

async function getLoadedTemplate(request: NextRequest, id: string, token: string) {
  const template = request.nextUrl.searchParams.get('template') || 'profile-completion'
  if (!getEmailTemplate(template)) return { error: Response.json({ error: 'Template de email inválido.' }, { status: 400 }) }
  const loaded = await loadReminderData(id, token)
  if ('error' in loaded) return loaded
  const eligibilityError = validateTemplateEligibility(template, loaded.profile)
  if (eligibilityError) return { error: Response.json({ error: eligibilityError }, { status: 400 }) }
  return { template, ...loaded }
}

async function createSendLog(payload: Record<string, unknown>, token: string) {
  const collection = process.env.EMAIL_LOGS_COLLECTION || 'email_delivery_logs'
  return fetch(`${PB_URL}/api/collections/${collection}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload), cache: 'no-store' })
}

async function loadTemplateOverrides(token: string) {
  const filter = encodeURIComponent('key = "email_templates"')
  const response = await fetch(`${PB_URL}/api/collections/settings/records?filter=${filter}&sort=created,id&perPage=1&fields=value`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!response.ok) return normalizeEmailTemplateOverrides(null)
  const data = await response.json() as { items?: Array<{ value?: unknown }> }
  return normalizeEmailTemplateOverrides(data.items?.[0]?.value)
}

function applyConfiguredTemplate(email: EmailPayload, template: string, profile: ReminderProfile, overrides: Record<string, { subject: string; body: string }>): EmailPayload {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com').replace(/\/$/, '')
  const link = template === 'plan-expiring' || template === 'plan-expired' ? `${appUrl}/planos` : `${appUrl}/dashboard/perfil`
  const date = profile.search_expires_at ? new Date(profile.search_expires_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : ''
  return applyEmailTemplateOverride(email, overrides[template], { nome: profile.name || 'anunciante', link, data_vencimento: date })
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
    const loaded = await getLoadedTemplate(request, id, token)
    if ('error' in loaded) return loaded.error
    const template = (loaded as { template: string }).template
    const email = applyConfiguredTemplate(buildTemplateEmail(template, loaded.profile, loaded.user.email || '', config.from), template, loaded.profile, await loadTemplateOverrides(token))
    const lastSend = await getLastSuccessfulSend(id, template, token).catch(() => null)
    const cooldown = getResendCooldownState(lastSend?.created, new Date(), getEmailTemplate(template)?.cooldownDays ?? 7)
    return Response.json({ template, recipient: loaded.user.email || '', from: config.from, profileName: loaded.profile.name || '', subject: email.subject, html: email.html, text: email.text, lastSentAt: lastSend?.created || null, cooldown })
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
    const loaded = await getLoadedTemplate(request, id, token)
    if ('error' in loaded) return loaded.error
    const template = (loaded as { template: string }).template

    const lastSend = await getLastSuccessfulSend(id, template, token).catch(() => null)
    const cooldown = getResendCooldownState(lastSend?.created, new Date(), getEmailTemplate(template)?.cooldownDays ?? 7)
    if (!cooldown.allowed) return Response.json({ error: `Este template já foi enviado. Aguarde ${cooldown.remainingHours} horas para reenviar.`, lastSentAt: lastSend?.created || null }, { status: 429 })
    const email = applyConfiguredTemplate(buildTemplateEmail(template, loaded.profile, loaded.user.email || '', config.from), template, loaded.profile, await loadTemplateOverrides(token))
    let providerResult: { id?: string }
    try {
      providerResult = await sendResendEmail(email, config.apiKey) as { id?: string }
    } catch (error) {
      await createSendLog({ template, recipient_email: loaded.user.email, profile: id, recipient_user: loaded.profile.user, sender_admin: auth.userId, subject: email.subject, status: 'failed', error: error instanceof Error ? error.message.slice(0, 500) : 'Falha no provedor de email' }, token).catch(() => null)
      return Response.json({ error: 'O provedor recusou o envio do email. Consulte o histórico para mais detalhes.' }, { status: 502 })
    }
    const logRes = await createSendLog({ template, recipient_email: loaded.user.email, profile: id, recipient_user: loaded.profile.user, sender_admin: auth.userId, subject: email.subject, status: 'sent', provider_id: providerResult?.id || '' }, token).catch(() => null)
    return Response.json({ ok: true, message: logRes?.ok === false ? 'Email enviado, mas não foi possível registrar o histórico.' : 'Email enviado individualmente.' })
  } catch {
    return Response.json({ error: 'Não foi possível enviar o lembrete.' }, { status: 502 })
  }
}
