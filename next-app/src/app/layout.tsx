import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import AuthCookieSync from '@/components/AuthCookieSync'
import LegacySwCleanup from '@/components/LegacySwCleanup'
import MaintenanceGate from '@/components/MaintenanceGate'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cerejavip.com'

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CerejaVIP',
  url: APP_URL,
  inLanguage: 'pt-BR',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${APP_URL}/?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
  ],
}

export const metadata: Metadata = {
  title: { default: 'CerejaVIP - Acompanhantes Brasil', template: '%s | CerejaVIP' },
  description: 'Plataforma de classificados premium para profissionais de entretenimento. Encontre acompanhantes, massagistas e atendimento online com segurança e privacidade.',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: 'https://cerejavip.com',
    siteName: 'CerejaVIP',
    title: 'CerejaVIP - Acompanhantes Brasil',
    description: 'Plataforma de classificados premium para profissionais de entretenimento.',
    images: [{ url: `${APP_URL}/logo-cerejavip.png`, width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CerejaVIP - Acompanhantes Brasil',
    description: 'Plataforma de classificados premium para profissionais de entretenimento.',
    images: [`${APP_URL}/logo-cerejavip.png`],
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
          dangerouslySetInnerHTML={{
            __html: `(function(){var k='cerejavip_theme';try{var v=localStorage.getItem(k);if(v){var j=JSON.parse(v);var t=j&&j.state&&j.state.theme;}var theme=(typeof t==='string'&&(t==='light'||t==='dark'))?t:'dark';document.documentElement.classList.add(theme);}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <LegacySwCleanup />
          <AuthCookieSync />
          <MaintenanceGate>{children}</MaintenanceGate>
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
