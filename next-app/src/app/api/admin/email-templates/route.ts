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

async function findVersionsRecord(token: string) {
  const filter = encodeURIComponent('key = "email_template_versions"')
  const response = await fetch(`${PB_URL}/api/collections/settings/records?filter=${filter}&sort=created,id&perPage=1&fields=id,value`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!response.ok) return null
  const data = await response.json() as { items?: Array<{ id?: string; value?: unknown }> }
  return data.items?.[0] || null
}

function normalizeVersions(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')).slice(-100).reverse()
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  try { return Response.json({ templates: normalizeEmailTemplateOverrides((await findRecord(auth.token))?.value), versions: normalizeVersions((await findVersionsRecord(auth.token))?.value) }) } catch { return Response.json({ templates: normalizeEmailTemplateOverrides(null), versions: [] }) }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await request.json() as { templates?: unknown; templateId?: string }
    const payload = normalizeEmailTemplateOverrides(body.templates ?? body)
    const existing = await findRecord(auth.token)
    const payloadBody = JSON.stringify({ key: EMAIL_TEMPLATES_SETTINGS_KEY, value: payload })
    const response = await fetch(existing?.id ? `${PB_URL}/api/collections/settings/records/${existing.id}` : `${PB_URL}/api/collections/settings/records`, { method: existing?.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` }, body: payloadBody, cache: 'no-store' })
    if (!response.ok) throw new Error('Não foi possível salvar os templates.')
    const templateId = typeof body.templateId === 'string' ? body.templateId : ''
    const version = templateId && payload[templateId] ? { id: crypto.randomUUID(), templateId, ...payload[templateId], savedAt: new Date().toISOString(), savedBy: auth.userId } : null
    if (version) {
      const versionsRecord = await findVersionsRecord(auth.token)
      const versions = [...normalizeVersions(versionsRecord?.value).reverse(), version].slice(-100)
      const versionBody = JSON.stringify({ key: 'email_template_versions', value: versions })
      const versionResponse = await fetch(versionsRecord?.id ? `${PB_URL}/api/collections/settings/records/${versionsRecord.id}` : `${PB_URL}/api/collections/settings/records`, { method: versionsRecord?.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` }, body: versionBody, cache: 'no-store' })
      if (!versionResponse.ok) throw new Error('Template salvo, mas não foi possível registrar a versão.')
    }
    return Response.json({ templates: payload, versions: normalizeVersions((await findVersionsRecord(auth.token))?.value) })
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Não foi possível salvar os templates.' }, { status: 500 }) }
}
