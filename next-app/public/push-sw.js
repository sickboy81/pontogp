self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data?.text() || '' } }
  event.waitUntil(self.registration.showNotification(data.title || 'CerejaVIP', { body: data.body || 'Você tem uma nova notificação.', icon: '/icon', badge: '/icon', data: { url: data.url || '/notificacoes' } }))
})
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/notificacoes'
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => { const client = list.find((item) => 'focus' in item); return client ? client.focus() : clients.openWindow(url) }))
})
