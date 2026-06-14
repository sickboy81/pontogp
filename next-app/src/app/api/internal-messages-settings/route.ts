import { NextRequest } from 'next/server'
import { getAdminToken } from '@/lib/pocketbase-admin'
import {
  INTERNAL_MESSAGES_SETTINGS_KEY,
  parseInternalMessagesSettings,
} from '@/lib/internal-messages-settings.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: configuração pública das mensagens internas. */
export async function GET(_request: NextRequest) {
  const token = await getAdminToken()
  if (!token) {
    return Response.json(parseInternalMessagesSettings(null))
  }

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent(`key = "${INTERNAL_MESSAGES_SETTINGS_KEY}"`)}&perPage=1&fields=value`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
    )
    if (!res.ok) return Response.json(parseInternalMessagesSettings(null))

    const data = await res.json()
    return Response.json(parseInternalMessagesSettings(data.items?.[0]?.value))
  } catch {
    return Response.json(parseInternalMessagesSettings(null))
  }
}
