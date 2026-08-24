import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import AuthCookieSync from '@/components/AuthCookieSync'
import LegacySwCleanup from '@/components/LegacySwCleanup'
import MaintenanceGate from '@/components/MaintenanceGate'
import PrivacyConsentModal from '@/components/PrivacyConsentModal'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CerejaVIP',
  url: APP_URL,
  inLanguage: 'pt-BR',
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CerejaVIP',
  url: APP_URL,
  logo: `${APP_URL}/logo-cerejavip.png`,
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
  ],
}

export const metadata: Metadata = {
  title: { default: 'CerejaVIP - Acompanhantes Brasil', template: '%s | CerejaVIP' },
  description: 'Encontre acompanhantes verificadas em todo o Brasil, com fotos reais, filtros por cidade e contato direto. Perfis femininos, masculinos, trans e massagistas.',
  applicationName: 'CerejaVIP',
  keywords: [
    'acompanhantes',
    'acompanhantes brasil',
    'acompanhantes brasilia',
    'acompanhantes df',
    'acompanhantes sp',
    'acompanhantes rj',
    'acompanhantes bh',
    'acompanhantes curitiba',
    'acompanhantes porto alegre',
    'acompanhantes femininas',
    'acompanhantes de luxo',
    'acompanhantes verificadas',
    'massagistas',
    'atendimento online',
    'classificados adultos',
    'garotas de programa',
    'acompanhantes trans',
  ],
  authors: [{ name: 'CerejaVIP' }],
  creator: 'CerejaVIP',
  publisher: 'CerejaVIP',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'CerejaVIP',
    title: 'CerejaVIP - Acompanhantes Verificadas em Todo Brasil',
    description: 'Encontre acompanhantes verificadas em todo o Brasil. Perfis com fotos reais, filtros por cidade, chat seguro e contato direto.',
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630, alt: 'CerejaVIP - Acompanhantes Brasil' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CerejaVIP - Acompanhantes Verificadas em Todo Brasil',
    description: 'Encontre acompanhantes verificadas em todo o Brasil. Perfis com fotos reais, filtros por cidade, chat seguro e contato direto.',
    images: [`${APP_URL}/twitter-image`],
  },
  icons: { icon: '/favicon.png' },
  metadataBase: new URL(APP_URL),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <link rel="preconnect" href="https://pocketbase.cerejavip.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://pocketbase.cerejavip.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var k='cerejavip_theme';try{var v=localStorage.getItem(k);if(v){var j=JSON.parse(v);var t=j&&j.state&&j.state.theme;}var theme=(typeof t==='string'&&(t==='light'||t==='dark'))?t:'light';document.documentElement.classList.add(theme);}catch(e){document.documentElement.classList.add('light');}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <LegacySwCleanup />
          <AuthCookieSync />
          <MaintenanceGate>{children}</MaintenanceGate>
          <PrivacyConsentModal />
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#334155',
                color: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.35)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
