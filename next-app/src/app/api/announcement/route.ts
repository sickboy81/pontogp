import { NextRequest } from 'next/server'
import { getAdminToken } from '@/lib/pocketbase-admin'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export const dynamic = 'force-dynamic'

/** GET: aviso do topo (announcement). Público. Retorna { enabled, message } de settings key "announcement". */
export async function GET(_request: NextRequest) {
  const token = await getAdminToken()
  if (!token) return Response.json({ enabled: false, message: '', target: 'all' })

  try {
    const res = await fetch(
      `${PB_URL}/api/collections/settings/records?filter=${encodeURIComponent('key = "announcement"')}&perPage=1&fields=id,value`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', next: { revalidate: 60 } }
    )
    if (!res.ok) return Response.json({ enabled: false, message: '', target: 'all' })
    const data = await res.json()
    const item = data.items?.[0]
    const value = item?.value as { enabled?: boolean; message?: string; target?: string } | undefined
    const target = value?.target === 'guests' || value?.target === 'logged_in' || value?.target === 'advertiser' ? value.target : 'all'
    return Response.json({
      enabled: !!value?.enabled,
      message: typeof value?.message === 'string' ? value.message : '',
      target,
    })
  } catch {
    return Response.json({ enabled: false, message: '', target: 'all' })
  }
}
