import { NextRequest } from 'next/server'
import { getAuthCookieFromHeader, getUserIdFromToken } from '@/lib/auth-cookie'
import { getAdminToken } from '@/lib/pocketbase-admin'
import { buildProfilePlanRenewalFromPlanRef } from '@/lib/plan-renewal-dates'
import type { Profile } from '@/lib/types'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest): string | null {
  return getAuthCookieFromHeader(request.headers.get('cookie'))
}

/** Campos permitidos para PATCH (evita enviar readonly ou que quebrem o schema). */
const ALLOWED_KEYS = new Set([
  'name', 'age', 'city', 'state', 'bio_title', 'bio', 'category', 'gender', 'ethnicity',
  'services', 'payment_methods', 'neighborhoods', 'location_approximate', 'location_lat', 'location_lng', 'schedule',
  'service_locations', 'service_to', 'special_services', 'onlyfans', 'privacy',
  'massage_types', 'online_services', 'other_services', 'for_sale', 'virtual_fantasies', 'certified', 'offers_happy_ending',
  'weight', 'height_exact', 'breast_type', 'pubis_type', 'piercings', 'tattoos', 'smoker',
  'whatsapp', 'telegram', 'phone', 'instagram', 'twitter',
  'price_30min', 'price_1h', 'price_2h', 'price_overnight', 'prices',
  'short_description', 'slug', 'is_online', 'online_until', 'status',
  'plan', 'visual_highlight', 'auto_bump',
  'hair_color', 'body_type', 'height', 'display_mode', 'bio_theme', 'bio_button_color', 'bio_links', 'bio_avatar_index', 'bio_show_full_profile',
])

function prepareUpdateBody(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(data)) {
    if (!ALLOWED_KEYS.has(key)) continue
    if (key === 'user_id') continue
    if (val === '' || val === undefined) {
      out[key] = null
      continue
    }
    out[key] = val
  }
  return out
}

/** PATCH: atualiza perfil. Só o dono pode atualizar. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getToken(request)
  if (!token) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = getUserIdFromToken(token)
  if (!userId) return Response.json({ error: 'Token inválido' }, { status: 401 })

  const { id } = await params
  if (!id) return Response.json({ error: 'id obrigatório' }, { status: 400 })

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/profiles/records/${id}?fields=id,user`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      if (res.status === 404) return Response.json({ error: 'Perfil não encontrado' }, { status: 404 })
      return Response.json({ error: 'Erro ao carregar perfil' }, { status: res.status })
    }
    const record = (await res.json()) as { user?: string }
    if (record.user !== userId) {
      return Response.json({ error: 'Sem permissão para editar este perfil' }, { status: 403 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const update = prepareUpdateBody(body)
    if (Object.keys(update).length === 0) {
      return Response.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    let authForPatch = token
    if (update.plan != null) {
      const planRef = String(update.plan)
      const adminToken = await getAdminToken()
      if (!adminToken) {
        return Response.json(
          { error: 'Não foi possível aplicar a vigência do plano. Tente de novo em instantes.' },
          { status: 503 }
        )
      }
      const renewal = await buildProfilePlanRenewalFromPlanRef(planRef, adminToken)
      if (!renewal) {
        return Response.json({ error: 'Plano inválido ou inexistente' }, { status: 400 })
      }
      update.plan = renewal.plan
      update.search_expires_at = renewal.search_expires_at
      update.contact_expires_at = renewal.contact_expires_at
      authForPatch = adminToken
    }

    const patchRes = await fetch(`${PB_URL}/api/collections/profiles/records/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authForPatch}`,
      },
      body: JSON.stringify(update),
    })
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}))
      return Response.json(
        { error: (err as { message?: string }).message || 'Erro ao atualizar' },
        { status: patchRes.status }
      )
    }
    const updated = (await patchRes.json()) as Record<string, unknown>
    return Response.json(updated)
  } catch (e) {
    return Response.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
