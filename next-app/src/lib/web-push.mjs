import webpush from 'web-push'

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.cerejavip.com'

export async function sendWebPushToUser({ userId, title, body, url = '/notificacoes', adminToken }) {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !adminToken || !userId) return 0
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contato@cerejavip.com', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
  const headers = { Authorization: `Bearer ${adminToken}` }
  const filter = encodeURIComponent(`user = "${userId.replace(/"/g, '\\"')}"`)
  const res = await fetch(`${PB_URL}/api/collections/push_subscriptions/records?filter=${filter}&perPage=100`, { headers, cache: 'no-store' })
  if (!res.ok) return 0
  const items = (await res.json()).items || []
  let sent = 0
  for (const item of items) {
    try {
      await webpush.sendNotification({ endpoint: item.endpoint, keys: { p256dh: item.p256dh, auth: item.auth } }, JSON.stringify({ title, body, url }))
      sent += 1
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 410) await fetch(`${PB_URL}/api/collections/push_subscriptions/records/${item.id}`, { method: 'DELETE', headers })
    }
  }
  return sent
}
