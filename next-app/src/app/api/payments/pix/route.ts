import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { enforceUserRateLimit, RATE_LIMIT_POLICIES } from '@/lib/api-rate-limit.mjs'
import { isValidCpfOrCnpj, onlyDigits } from '@/lib/brazil-document'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const PIXGO_URL = 'https://pixgo.org/api/v1'
const PIXGO_API_KEY = process.env.PIXGO_API_KEY

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** POST: gera cobrança PIX via PixGo. */
export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })
  const limited = enforceUserRateLimit(request, 'pix-create', userId, RATE_LIMIT_POLICIES.pix)
  if (limited) return limited
  const idempotencyKey = (request.headers.get('idempotency-key') || '').trim()
  if (!/^[A-Za-z0-9._:-]{8,120}$/.test(idempotencyKey)) {
    return Response.json({ error: 'Identificador da cobrança inválido. Tente novamente.' }, { status: 400 })
  }

  if (!PIXGO_API_KEY || PIXGO_API_KEY.length < 32) {
    return Response.json(
      { error: 'Integração PIX não configurada. Configure PIXGO_API_KEY.' },
      { status: 503 }
    )
  }

  try {
    const body = (await request.json()) as {
      planId?: string
      billingPeriod?: 'weekly' | 'monthly'
      profileId?: string
      description?: string
      customerName?: string
      customerEmail?: string
      receiverCpf?: string
    }
    const billingPeriod = body.billingPeriod === 'monthly' || body.billingPeriod === 'weekly' ? body.billingPeriod : null
    if (!billingPeriod) return Response.json({ error: 'Período de cobrança inválido.' }, { status: 400 })
    if (!body.planId || !/^[a-z0-9]{15}$/i.test(body.planId)) {
      return Response.json({ error: 'Plano inválido.' }, { status: 400 })
    }
    if (!body.profileId || !/^[a-z0-9]{15}$/i.test(body.profileId)) {
      return Response.json({ error: 'Perfil de anunciante inválido.' }, { status: 400 })
    }

    const adminToken = await getAdminToken()
    if (!adminToken) return Response.json({ error: 'Serviço indisponível.' }, { status: 503 })
    const authHeader = { Authorization: `Bearer ${adminToken}` }
    const [planRes, profileRes] = await Promise.all([
      fetch(`${PB_URL}/api/collections/plans/records/${body.planId}`, { headers: authHeader, cache: 'no-store' }),
      fetch(`${PB_URL}/api/collections/profiles/records/${body.profileId}?fields=id,user,status`, { headers: authHeader, cache: 'no-store' }),
    ])
    if (!planRes.ok) return Response.json({ error: 'Plano não encontrado.' }, { status: 400 })
    if (!profileRes.ok) return Response.json({ error: 'Perfil não encontrado.' }, { status: 400 })
    const plan = (await planRes.json()) as { id: string; slug?: string; name?: string; enabled?: boolean; target_type?: string; price_weekly?: number; price_monthly?: number }
    const profile = (await profileRes.json()) as { id: string; user?: string; status?: string }
    if (profile.user !== userId) return Response.json({ error: 'Este perfil não pertence à sua conta.' }, { status: 403 })
    if (plan.enabled !== true || plan.target_type !== 'advertiser') return Response.json({ error: 'Este plano não está disponível para compra.' }, { status: 400 })
    const amount = Number(billingPeriod === 'weekly' ? plan.price_weekly : plan.price_monthly)
    if (!Number.isFinite(amount) || amount < 10) return Response.json({ error: 'Este plano não possui preço válido para o período selecionado.' }, { status: 400 })
    const receiverCpf = onlyDigits(body.receiverCpf || '')
    const baseDescription =
      (body.description || '').trim() ||
      `Plano CerejaVIP - ${plan.slug || plan.name || plan.id}`
    const metadata = ` | PROFILE:${body.profileId} | PERIOD:${billingPeriod}`
    const description = `${baseDescription.slice(0, Math.max(0, 200 - metadata.length))}${metadata}`

    if (!amount || amount < 10) {
      return Response.json({ error: 'Valor mínimo R$ 10,00' }, { status: 400 })
    }
    if (!isValidCpfOrCnpj(receiverCpf)) {
      return Response.json(
        { error: 'Informe um CPF ou CNPJ válido de quem fará o pagamento.' },
        { status: 400 }
      )
    }

    const existingRes = await fetch(
      `${PB_URL}/api/collections/payments/records?filter=${encodeURIComponent(`user="${userId}" && idempotency_key="${idempotencyKey.replace(/"/g, '\\"')}"`)}&perPage=1&fields=id,external_id,status`,
      { headers: authHeader, cache: 'no-store' },
    )
    if (existingRes.ok) {
      const existing = (await existingRes.json()) as { items?: { external_id?: string; status?: string }[] }
      const payment = existing.items?.[0]
      if (payment) {
        return Response.json({ error: 'Esta cobrança já foi criada. Não gere outro PIX.', payment_id: payment.external_id, status: payment.status }, { status: 409 })
      }
    }

    const externalId = `CV_${Date.now()}_${userId.slice(0, 8)}`
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const webhookUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/payments/pix/webhook` : undefined
    const receiverName = body.customerName?.trim()
    const receiverEmail = body.customerEmail?.trim()

    const res = await fetch(`${PIXGO_URL}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PIXGO_API_KEY,
      },
      body: JSON.stringify({
        amount,
        description,
        external_id: externalId,
        receiver_cpf: receiverCpf,
        receiver_name:
          receiverName && receiverName.length >= 2 && receiverName.length <= 100
            ? receiverName
            : undefined,
        receiver_email:
          receiverEmail && receiverEmail.length <= 255 ? receiverEmail : undefined,
        ...(webhookUrl && { webhook_url: webhookUrl }),
      }),
    })

    const json = (await res.json()) as {
      success?: boolean
      data?: {
        payment_id: string
        external_id: string
        qr_code: string
        qr_image_url: string
        status: string
      }
      error?: string
      message?: string
    }

    if (!res.ok || !json.success) {
      const msg = json.message || json.error || 'Erro ao gerar PIX'
      return Response.json({ error: msg }, { status: res.ok ? 400 : res.status })
    }

    const d = json.data
    if (!d) return Response.json({ error: 'Resposta inválida do PixGo' }, { status: 500 })

    const paymentRecord = {
      user: userId,
      profile: body.profileId,
      plan: plan.id,
      amount,
      status: 'pending',
      method: 'pix',
      external_id: d.payment_id,
      description,
      idempotency_key: idempotencyKey,
    }

    const paymentSaveRes = await fetch(`${PB_URL}/api/collections/payments/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentRecord),
    })
    if (!paymentSaveRes.ok) {
      const detail = await paymentSaveRes.text().catch(() => '')
      console.error('[pix-create] Falha ao registrar pagamento no PocketBase:', paymentSaveRes.status, detail)
      return Response.json(
        { error: 'Cobrança gerada, mas não foi possível registrar o pagamento. Tente novamente.' },
        { status: 502 }
      )
    }

    return Response.json({
      success: true,
      payment_id: d.payment_id,
      pix_copia_cola: d.qr_code,
      qr_code_base64: null,
      qr_image_url: d.qr_image_url,
      link_pagamento: d.qr_image_url,
      external_reference: d.external_id,
    })
  } catch (e) {
    return Response.json({ error: 'Erro ao gerar PIX' }, { status: 500 })
  }
}
