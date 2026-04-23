'use client'

import { useEffect } from 'react'

/**
 * Remove service workers e caches do PWA Vite antigo.
 * Evita que o browser sirva index.html em cache com scripts em /assets/*.js (404 no deploy Next).
 */
export default function LegacySwCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const run = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.all(regs.map((r) => r.unregister()))
        }
        if ('caches' in window) {
          const keys = await caches.keys()
          const legacy = keys.filter(
            (k) =>
              /workbox|precache|vite|pwa|cereja/i.test(k) ||
              k.includes('static-js-assets') ||
              k.includes('static-css-assets')
          )
          await Promise.all(legacy.map((k) => caches.delete(k)))
        }
      } catch {
        // ignora
      }
    }

    void run()
  }, [])

  return null
}
