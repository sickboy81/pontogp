import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { normalizeEmailTemplateOverrides, EMAIL_TEMPLATES_SETTINGS_KEY } from '@/lib/email-template-settings.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'
export const dynamic = 'force-dynamic'

async function findRecord(token: string) {
  const filter = encodeURIComponent(`key = "${EMAIL_TEMPLATES_SETTINGS_KEY}"`)
  const response = await fetch(`${PB_URL}/api/collections/settings/records?filter=${filter}&sort=created,id&perPage=50&fields=id,value`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!response.ok) throw new Error('Não foi possível ler os templates.')
  const data = await response.json() as { items?: Array<{ id?: string; value?: unknown }> }
  return data.items?.[0] || null
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  try { return Response.json(normalizeEmailTemplateOverrides((await findRecord(auth.token))?.value)) } catch { return Response.json(normalizeEmailTemplateOverrides(null)) }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const payload = normalizeEmailTemplateOverrides(await request.json())
    const existing = await findRecord(auth.token)
    const body = JSON.stringify({ key: EMAIL_TEMPLATES_SETTINGS_KEY, value: payload })
    const response = await fetch(existing?.id ? `${PB_URL}/api/collections/settings/records/${existing.id}` : `${PB_URL}/api/collections/settings/records`, { method: existing?.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` }, body, cache: 'no-store' })
    if (!response.ok) throw new Error('Não foi possível salvar os templates.')
    return Response.json(payload)
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Não foi possível salvar os templates.' }, { status: 500 }) }
}
