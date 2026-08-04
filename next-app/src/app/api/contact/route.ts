import { NextRequest } from 'next/server'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { enforceIpRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import { getClientIp } from '@/lib/rate-limit.mjs'
import {
  buildContactEmail,
  getResendEmailConfig,
  sendResendEmail,
} from '@/lib/resend-email.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || ''

export const dynamic = 'force-dynamic'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** POST: cria mensagem de contato. Body: { name, email, subject, message } */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceIpRateLimit(request, 'contact', RATE_LIMIT_POLICIES.contact)
    if (limited) return limited

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return Response.json({ error: 'Formato inválido.' }, { status: 415 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const subject = String(body.subject ?? '').trim()
    const message = String(body.message ?? '').trim()
    const turnstileToken = String(body.turnstileToken ?? '').trim()

    if (!name || !email || !subject || !message) {
      return Response.json(
        { error: 'Preencha todos os campos obrigatórios' },
        { status: 400 }
      )
    }

    const ip = getClientIp(request.headers)

    if (!EMAIL_REGEX.test(email) || name.length > 120 || subject.length > 180 || message.length > 4000) {
      return Response.json(
        { error: 'Dados inválidos. Revise os campos e tente novamente.' },
        { status: 400 }
      )
    }

    if (TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return Response.json(
          { error: 'Verificação de segurança obrigatória.' },
          { status: 400 }
        )
      }

      const verifyBody = new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      })
      if (ip !== 'unknown') {
        verifyBody.set('remoteip', ip)
      }

      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyBody.toString(),
      })
      const verifyJson = (await verifyRes.json().catch(() => ({}))) as { success?: boolean }
      if (!verifyRes.ok || !verifyJson.success) {
        return Response.json(
          { error: 'Falha na verificação de segurança. Tente novamente.' },
          { status: 400 }
        )
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.error('[contact] TURNSTILE_SECRET_KEY ausente em produção.')
      return Response.json(
        { error: 'Formulário temporariamente indisponível.' },
        { status: 503 }
      )
    } else {
      console.warn('[contact] TURNSTILE_SECRET_KEY ausente; validação server-side desativada.')
    }

    const data = {
      name,
      email,
      subject,
      message: message,
      read: false,
      ip_address: ip,
    }

    const res = await fetch(`${PB_URL}/api/collections/contacts/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao enviar mensagem' },
        { status: res.status }
      )
    }

    const adminToken = await getAdminToken()
    if (adminToken) {
      try {
        const usersRes = await fetch(
          `${PB_URL}/api/collections/users/records?filter=${encodeURIComponent('role = "admin"')}&perPage=1`,
          { headers: { Authorization: `Bearer ${adminToken}` }, cache: 'no-store' }
        )
        if (usersRes.ok) {
          const usersData = (await usersRes.json()) as { items?: { id: string }[] }
          const adminId = usersData.items?.[0]?.id
          if (adminId) {
            await fetch(`${PB_URL}/api/collections/notifications/records`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
              body: JSON.stringify({
                recipient: adminId,
                title: `Contato: ${subject}`,
                message: `${name} (${email}): ${message.slice(0, 300)}${message.length > 300 ? '...' : ''}`,
                type: 'contact',
                read: false,
              }),
            })
          }
        }
      } catch {
        // ignore
      }
    }

    const emailConfig = getResendEmailConfig()
    if (emailConfig) {
      try {
        await sendResendEmail(
          buildContactEmail({ name, email, subject, message }, emailConfig),
          emailConfig.apiKey
        )
      } catch (error) {
        console.error('[contact] Falha ao notificar contato pela Resend:', error)
      }
    } else {
      console.warn('[contact] Resend nao configurada; contato salvo apenas no painel.')
    }

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
