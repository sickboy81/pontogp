import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
const PIXGO_URL = 'https://pixgo.org/api/v1'
const PIXGO_API_KEY = process.env.PIXGO_API_KEY

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** POST: gera cobrança PIX via PixGo. Body: { planId, planSlug, amount, profileId, description } */
export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  if (!PIXGO_API_KEY || PIXGO_API_KEY.length < 32) {
    return Response.json(
      { error: 'Integração PIX não configurada. Configure PIXGO_API_KEY.' },
      { status: 503 }
    )
  }

  try {
    const body = (await request.json()) as {
      planId?: string
      planSlug?: string
      amount: number
      profileId?: string
      description?: string
      customerName?: string
      customerEmail?: string
      couponId?: string
    }
    const amount = Number(body.amount)
    let description =
      (body.description || '').trim() ||
      `Plano CerejaVIP${body.planSlug ? ` - ${body.planSlug}` : ''}`
    if (body.couponId && typeof body.couponId === 'string' && body.couponId.length <= 20) {
      description += ` | COUPON:${body.couponId}`
    }

    if (!amount || amount < 10) {
      return Response.json({ error: 'Valor mínimo R$ 10,00' }, { status: 400 })
    }

    const externalId = `CV_${Date.now()}_${userId.slice(0, 8)}`
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const webhookUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/payments/pix/webhook` : undefined

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
        customer_name: body.customerName || undefined,
        customer_email: body.customerEmail || undefined,
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
      profile: body.profileId || null,
      plan: body.planId || null,
      amount,
      status: 'pending',
      payment_method: 'pix',
      external_id: d.payment_id,
      description,
    }

    try {
      await fetch(`${PB_URL}/api/collections/payments/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentRecord),
      })
    } catch {
      // Continua mesmo se falhar ao salvar no PB
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
