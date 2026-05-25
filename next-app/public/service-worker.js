/* Desativa service workers legados do antigo PWA/Vite.
   Mantido para navegadores que ainda verificam atualizacoes neste caminho. */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      } catch {
        // Cache API indisponivel ou bloqueada.
      }

      try {
        await self.registration.unregister()
      } catch {
        // Ignora falhas de unregister; o proximo reload tentara de novo.
      }

      try {
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        await Promise.all(
          clients.map((client) => {
            if ('navigate' in client) return client.navigate(client.url)
            return undefined
          })
        )
      } catch {
        // Evita quebrar a ativacao em navegadores com suporte parcial.
      }
    })()
  )
})
