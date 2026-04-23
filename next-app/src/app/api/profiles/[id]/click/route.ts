import { NextRequest } from 'next/server'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

/** Schema: coleção profile_clicks (profile, contact_type, viewer_ip). Ver pocketbase-schema.json */
export const dynamic = 'force-dynamic'

const VALID_TYPES = ['whatsapp', 'telegram', 'phone', 'message']

/** POST: registra clique em contato. Cria registro na coleção profile_clicks. Body: { contactType }. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: profileId } = await params
  if (!profileId) return Response.json({ error: 'id obrigatório' }, { status: 400 })

  let contactType = 'message'
  try {
    const body = (await request.json()) as { contactType?: string }
    if (body.contactType && VALID_TYPES.includes(body.contactType)) contactType = body.contactType
  } catch {
    // default message
  }

  const token = await getAdminToken()
  if (!token) return Response.json({ ok: true })

  try {
    await fetch(`${PB_URL}/api/collections/profile_clicks/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        profile: profileId,
        contact_type: contactType,
      }),
    })
  } catch {
    // ignore
  }
  return Response.json({ ok: true })
}
