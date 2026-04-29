import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/admin',
          '/mensagens',
          '/api',
          '/login',
          '/register',
          '/esqueci-senha',
          '/redefinir-senha',
          '/verificar-email',
          '/verificar-email-pendente',
          '/notificacoes',
          '/favoritos',
          '/manutencao',
          '/diretrizes-fotos-videos',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
