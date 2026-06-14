import { NextRequest } from 'next/server'
import {
  INTERNAL_MESSAGES_SETTINGS_KEY,
  parseInternalMessagesSettings,
  selectDeterministicSettingsRecord,
} from '@/lib/internal-messages-settings.mjs'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'
const CACHE_CONTROL = 'public, max-age=10, s-maxage=15, stale-while-revalidate=30'
const CACHE_TTL_MS = 15_000
const DEFAULT_PUBLIC_SETTINGS = { enabled: true, notice: '' }
let cachedSettings: { enabled: boolean; notice: string } | null = null
let cachedSettingsAt = 0

/** GET: configuração pública das mensagens internas. */
export async function GET(_request: NextRequest) {
  const now = Date.now()
  if (cachedSettings && now - cachedSettingsAt < CACHE_TTL_MS) {
    return Response.json(cachedSettings, { headers: { 'Cache-Control': CACHE_CONTROL } })
  }

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent(`key = "${INTERNAL_MESSAGES_SETTINGS_KEY}"`)}&sort=${encodeURIComponent('created,id')}&perPage=50&fields=id,created,value`,
      { cache: 'no-store' },
    )
    if (!res.ok) {
      return Response.json(DEFAULT_PUBLIC_SETTINGS, {
        headers: { 'Cache-Control': CACHE_CONTROL },
      })
    }

    const data = await res.json()
    const record = selectDeterministicSettingsRecord(data.items)
    const payload = record
      ? parseInternalMessagesSettings(record.value)
      : DEFAULT_PUBLIC_SETTINGS
    cachedSettings = payload
    cachedSettingsAt = now
    return Response.json(payload, { headers: { 'Cache-Control': CACHE_CONTROL } })
  } catch {
    return Response.json(DEFAULT_PUBLIC_SETTINGS, {
      headers: { 'Cache-Control': CACHE_CONTROL },
    })
  }
}
